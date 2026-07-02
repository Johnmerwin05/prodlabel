<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\PrintRequestData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Products\PrintProductsRequest;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\ProductPrintResource;
use App\Jobs\ProcessPrintJob;
use App\Models\Customer;
use App\Models\ProductPrint;
use App\Services\CustomerTemplateService;
use App\Services\PrintService;
use App\Services\SerialNumberService;
use App\Services\TemplateRenderingService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class PrintController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()?->hasPermission('printing.view'), 403);

        $prints = ProductPrint::query()
            ->with([
                'customer:id,name,code',
                'template:id,name',
                'items:id,product_print_id,product_id,serial_number,serial_numbers',
                'items.product:id,name,part_number,pi_number',
            ])
            ->when($request->input('search'), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('job_uuid', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn ($query) => $query->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('template', fn ($query) => $query->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('items.product', function ($query) use ($search): void {
                            $query
                                ->where('part_number', 'like', "%{$search}%")
                                ->orWhere('pi_number', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->input('customer_id'), function ($query, int|string $customerId): void {
                $query->where('customer_id', $customerId);
            })
            ->when($request->input('status'), function ($query, string|array $status): void {
                is_array($status)
                    ? $query->whereIn('status', $status)
                    : $query->where('status', $status);
            })
            ->latest()
            ->paginate($request->integer('per_page', 10));

        return ProductPrintResource::collection($prints);
    }

    public function customers(Request $request): AnonymousResourceCollection
    {
        abort_unless($request->user()?->hasPermission('printing.view'), 403);

        $customers = Customer::query()
            ->select(['id', 'name', 'code'])
            ->whereIn('id', ProductPrint::query()->select('customer_id'))
            ->orderBy('name')
            ->get();

        return CustomerResource::collection($customers);
    }

    public function store(PrintProductsRequest $request, PrintService $service): AnonymousResourceCollection
    {
        return ProductPrintResource::collection(
            $service->queue(PrintRequestData::fromArray($request->validated()), $request),
        );
    }

    public function customerTemplate(Request $request, int $customer, CustomerTemplateService $templates)
    {
        abort_unless($request->user()?->hasPermission('printing.view'), 403);

        $area = $request->validate([
            'area' => ['required', 'in:Assembly,Molding,Inspection,Injection'],
        ])['area'];
        $template = $templates->publishedForCustomer($customer, $area);

        return response()->json([
            'data' => $template ? [
                'id' => $template->id,
                'name' => $template->name,
            ] : null,
        ]);
    }

    public function dispatch(Request $request)
    {
        abort_unless($request->user()?->hasPermission('printing.update'), 403);

        $data = $request->validate([
            'print_ids' => ['required', 'array', 'min:1', 'max:100'],
            'print_ids.*' => ['integer', 'exists:product_prints,id'],
        ]);

        $selectedPrints = ProductPrint::query()
            ->whereIn('id', $data['print_ids'])
            ->get();
        $prints = $selectedPrints
            ->filter(fn (ProductPrint $print) => in_array($print->status, ['queued', 'failed'], true))
            ->values();

        abort_if(
            $prints->isEmpty(),
            422,
            'No selected print requests can be printed. Selected statuses: '.
                $selectedPrints->pluck('status')->unique()->implode(', '),
        );

        foreach ($prints as $print) {
            $print->forceFill([
                'status' => 'queued',
                'completed_products' => 0,
                'failed_products' => 0,
                'started_at' => null,
                'completed_at' => null,
            ])->save();

            $print->items()->update([
                'status' => 'queued',
                'failure_reason' => null,
            ]);

            ProcessPrintJob::dispatch($print->id)->onQueue('printing');
        }

        return ProductPrintResource::collection(
            $prints->fresh(['customer:id,name,code', 'template:id,name']),
        );
    }

    public function preview(Request $request, TemplateRenderingService $renderer, SerialNumberService $serialNumbers)
    {
        abort_unless($request->user()?->hasPermission('printing.update'), 403);

        $data = $request->validate([
            'print_ids' => ['required', 'array', 'min:1', 'max:100'],
            'print_ids.*' => ['integer', 'exists:product_prints,id'],
        ]);
        $printOrder = array_flip(array_map('intval', $data['print_ids']));

        $prints = ProductPrint::query()
            ->with(['customer', 'template.elements', 'items.product.customer'])
            ->whereIn('id', $data['print_ids'])
            ->get()
            ->sortBy(fn (ProductPrint $print): int => $printOrder[$print->id] ?? PHP_INT_MAX)
            ->values();

        abort_if($prints->isEmpty(), 422, 'No selected print requests can be previewed.');
        abort_if($prints->count() !== count(array_unique($data['print_ids'])), 422, 'One or more selected print requests could not be loaded.');

        $sequenceOffsets = [];
        $reservedSerialNumbers = [];

        return response()->json([
            'data' => $prints->flatMap(function (ProductPrint $print) use ($renderer, $serialNumbers, &$sequenceOffsets, &$reservedSerialNumbers) {
                abort_unless($print->production_date && $print->print_quantity, 422, 'Selected print requests must have a production date and quantity.');

                return $print->items->flatMap(function ($item) use ($print, $renderer, $serialNumbers, &$sequenceOffsets, &$reservedSerialNumbers) {
                    return DB::transaction(function () use ($print, $item, $renderer, $serialNumbers, &$sequenceOffsets, &$reservedSerialNumbers): array {
                            $slotsPerPage = $this->slotsPerPage($print->template);
                            $productionDate = $print->production_date->toDateString();
                            $generatedCount = $this->generatedTemplateCount($print, $item->product, (int) $print->print_quantity);
                            $sequenceKey = $print->customer_id.':'.$print->template_id;
                            $sequenceOffset = $sequenceOffsets[$sequenceKey] ?? 0;
                            $generatedSerials = $serialNumbers->generateMany(
                                $print->customer,
                                $productionDate,
                                $generatedCount,
                                false,
                                $sequenceOffset,
                                $print->template,
                                $reservedSerialNumbers,
                            );
                            $reservedSerialNumbers = [
                                ...$reservedSerialNumbers,
                                ...$generatedSerials,
                            ];
                            $sequenceOffsets[$sequenceKey] = $sequenceOffset + $generatedCount;
                            $physicalInstances = $this->instancesWithCopies(
                                $generatedSerials,
                                $this->generatedLabelQuantities($print, $item->product, (int) $print->print_quantity, $generatedCount),
                                $print->template,
                            );

                            return collect(array_chunk($physicalInstances, $slotsPerPage))
                                ->map(function (array $pageInstances, int $pageIndex) use ($print, $item, $renderer, $productionDate): array {
                                    $payload = $this->renderSerialPage($renderer, $print, $item, $pageInstances, $productionDate);
                                    $pageSerials = array_column($pageInstances, 'serial_number');
                                    $pageQuantities = array_column($pageInstances, 'label_quantity');

                                    return [
                                        'print_id' => $print->id,
                                        'item_id' => $item->id,
                                        'page_index' => $pageIndex,
                                        'serial_number' => $pageSerials[0] ?? null,
                                        'serial_numbers' => $pageSerials,
                                        'label_quantities' => $pageQuantities,
                                        'production_date' => $productionDate,
                                        'print_quantity' => (int) $print->print_quantity,
                                        'job_uuid' => $print->job_uuid,
                                        'template_name' => $print->template?->name,
                                        'customer_name' => $print->customer?->name,
                                        'product_name' => $item->product?->name,
                                        'settings' => $payload['template']['settings'] ?? [],
                                        'elements' => $payload['elements'] ?? [],
                                        'repeat_instances' => $payload['repeat_instances'] ?? null,
                                    ];
                                })
                                ->all();
                        });
                });
            })->values(),
        ]);
    }

    public function finalize(Request $request, TemplateRenderingService $renderer, SerialNumberService $serialNumbers)
    {
        abort_unless($request->user()?->hasPermission('printing.update'), 403);

        $data = $request->validate([
            'production_date' => ['required', 'date'],
            'print_quantity' => ['required', 'integer', 'min:1'],
            'labels' => ['required', 'array', 'min:1', 'max:1000'],
            'labels.*.print_id' => ['required', 'integer', 'exists:product_prints,id'],
            'labels.*.item_id' => ['required', 'integer', 'exists:product_print_items,id'],
            'labels.*.page_index' => ['nullable', 'integer', 'min:0'],
            'labels.*.serial_numbers' => ['required', 'array', 'min:1'],
            'labels.*.serial_numbers.*' => ['required', 'string', 'max:255'],
            'labels.*.label_quantities' => ['required', 'array', 'min:1'],
            'labels.*.label_quantities.*' => ['required', 'integer', 'min:0'],
        ]);

        $printIds = collect($data['labels'])->pluck('print_id')->unique()->values();
        $prints = ProductPrint::query()
            ->with(['customer', 'template.elements', 'items.product.customer'])
            ->whereIn('id', $printIds)
            ->get()
            ->keyBy('id');

        abort_if($prints->count() !== $printIds->count(), 422, 'One or more print requests could not be found.');

        return DB::transaction(function () use ($data, $prints, $renderer, $serialNumbers) {
            $usedSerialNumbers = [];
            $sequenceCounts = [];

            $labelsByItem = collect($data['labels'])
                ->sortBy(fn (array $label) => sprintf('%012d:%012d:%012d', $label['print_id'], $label['item_id'], $label['page_index'] ?? 0))
                ->groupBy(fn (array $label) => $label['print_id'].':'.$label['item_id']);

            foreach ($labelsByItem as $itemLabels) {
                $firstLabel = $itemLabels->first();
                $labelSerialPages = $itemLabels
                    ->map(fn (array $label): array => array_values($label['serial_numbers']))
                    ->values()
                    ->all();
                $labelQuantityPages = $itemLabels
                    ->map(fn (array $label): array => array_values($label['label_quantities']))
                    ->values()
                    ->all();
                $serialNumberList = collect($labelSerialPages)->flatten()->values()->all();
                $uniqueSerialNumberList = array_values(array_unique($serialNumberList));
                $label = $firstLabel;
                $print = $prints->get($label['print_id']);
                $item = $print?->items->firstWhere('id', $label['item_id']);

                abort_unless($print && $item, 422, 'One or more print items do not belong to the selected requests.');

                foreach ($uniqueSerialNumberList as $serialNumber) {
                    abort_if(
                        isset($usedSerialNumbers[$serialNumber]) && $usedSerialNumbers[$serialNumber] !== $item->id,
                        422,
                        'Duplicate serial numbers were found across different products in this print batch.',
                    );
                    $usedSerialNumbers[$serialNumber] = $item->id;

                    abort_if(
                        \App\Models\ProductPrintItem::query()
                            ->whereKeyNot($item->id)
                            ->where(function ($query) use ($serialNumber): void {
                                $query
                                    ->where('serial_number', $serialNumber)
                                    ->orWhereJsonContains('serial_numbers', $serialNumber);
                            })
                            ->exists(),
                        422,
                        "Serial number {$serialNumber} already exists.",
                    );
                }

                $pages = [];
                foreach ($labelSerialPages as $pageIndex => $pageSerials) {
                    $pageQuantities = $labelQuantityPages[$pageIndex] ?? [];
                    abort_if(count($pageSerials) !== count($pageQuantities), 422, 'Each printed label must include a matching label quantity.');

                    $pages[] = $this->renderSerialPage(
                        $renderer,
                        $print,
                        $item,
                        $this->buildInstances($pageSerials, $pageQuantities),
                        $data['production_date'],
                    );
                }
                $payload = $pages[0];
                $payload['pages'] = $pages;

                $item->update([
                    'serial_number' => $serialNumberList[0] ?? null,
                    'serial_numbers' => $serialNumberList,
                    'status' => 'completed',
                    'rendered_payload' => $payload,
                    'failure_reason' => null,
                ]);

                $sequenceKey = $print->customer_id.':'.$print->template_id;
                $sequenceCounts[$sequenceKey] = ($sequenceCounts[$sequenceKey] ?? 0) + count($uniqueSerialNumberList);
            }

            foreach ($prints as $print) {
                $completedProducts = $print->items()->where('status', 'completed')->count();
                $failedProducts = $print->items()->where('status', 'failed')->count();

                $print->update([
                    'production_date' => $data['production_date'],
                    'print_quantity' => $data['print_quantity'],
                    'print_count' => max(1, $print->print_count),
                    'status' => $failedProducts > 0 ? 'completed_with_errors' : 'completed',
                    'completed_products' => $completedProducts,
                    'failed_products' => $failedProducts,
                    'started_at' => $print->started_at ?? now(),
                    'completed_at' => now(),
                ]);
            }

            foreach ($prints->unique(fn ($print) => $print->customer_id.':'.$print->template_id) as $print) {
                $sequenceKey = $print->customer_id.':'.$print->template_id;
                $serialNumbers->advanceSequence(
                    $print->customer,
                    $sequenceCounts[$sequenceKey] ?? 0,
                    $data['production_date'],
                    $print->template,
                );
            }

            return ProductPrintResource::collection(
                $prints->values()->map->fresh([
                    'customer:id,name,code',
                    'template:id,name',
                    'items.product',
                ]),
            );
        });
    }

    public function reprintPreview(Request $request, ProductPrint $print)
    {
        abort_unless($request->user()?->hasPermission('printing.view'), 403);

        $print->load(['customer', 'template.elements', 'items.product.customer']);

        abort_if(
            $print->items->contains(fn ($item) => ! $item->rendered_payload),
            422,
            'This print request has no saved label output to reprint.',
        );

        return response()->json([
            'data' => $print->items->flatMap(function ($item) use ($print) {
                $payload = $item->rendered_payload ?? [];
                $pages = $payload['pages'] ?? [$payload];
                $serialPages = array_chunk(
                    $item->serial_numbers ?? array_filter([$item->serial_number]),
                    $this->slotsPerPage($print->template),
                );
                return collect($pages)
                    ->map(function (array $page, int $pageIndex) use ($print, $item, $serialPages) {
                        $serialNumbers = $serialPages[$pageIndex] ?? [];
                        $labelQuantities = $page['label_quantities'] ?? [];

                        return [
                            'print_id' => $print->id,
                            'item_id' => $item->id,
                            'page_index' => $pageIndex,
                            'serial_number' => $serialNumbers[0] ?? $item->serial_number,
                            'serial_numbers' => $serialNumbers,
                            'label_quantities' => $labelQuantities,
                            'production_date' => $print->production_date?->toDateString(),
                            'print_quantity' => $print->print_quantity,
                            'job_uuid' => $print->job_uuid,
                            'template_name' => $print->template?->name,
                            'customer_name' => $print->customer?->name,
                            'product_name' => $item->product?->name,
                            'settings' => $page['template']['settings'] ?? [],
                            'elements' => $page['elements'] ?? [],
                            'repeat_instances' => $page['repeat_instances'] ?? null,
                            'is_reprint' => true,
                        ];
                    });
            })->values(),
        ]);
    }

    public function completeReprint(Request $request, ProductPrint $print): ProductPrintResource
    {
        abort_unless($request->user()?->hasPermission('printing.update'), 403);

        abort_unless(
            in_array($print->status, ['completed', 'completed_with_errors'], true),
            422,
            'Only completed print requests can be reprinted.',
        );

        $print->increment('print_count');

        return new ProductPrintResource(
            $print->fresh([
                'customer:id,name,code',
                'template:id,name',
                'items:id,product_print_id,product_id,serial_number,serial_numbers',
                'items.product:id,name,part_number,pi_number',
            ]),
        );
    }

    public function update(Request $request, ProductPrint $print): ProductPrintResource
    {
        abort_unless($request->user()?->hasPermission('printing.update'), 403);

        abort_unless(
            in_array($print->status, ['queued', 'failed'], true),
            422,
            'Only queued or failed print requests can be edited.',
        );

        abort_if(
            $print->items()->whereNotNull('serial_number')->exists(),
            422,
            'This print request already has serial numbers and cannot be edited.',
        );

        $data = $request->validate([
            'production_date' => ['required', 'date'],
            'print_quantity' => ['required', 'integer', 'min:1'],
        ]);

        $print->update($data);

        return new ProductPrintResource(
            $print->fresh(['customer:id,name,code', 'template:id,name', 'items:id,product_print_id,serial_number,serial_numbers']),
        );
    }

    public function destroy(Request $request, ProductPrint $print)
    {
        abort_unless($request->user()?->hasPermission('printing.update'), 403);

        $print->delete();

        return response()->noContent();
    }

    private function slotsPerPage($template): int
    {
        $repeatGrid = $template?->settings['repeatGrid'] ?? [];

        if (! ($repeatGrid['enabled'] ?? false)) {
            return 1;
        }

        return max(1, (int) ($repeatGrid['columns'] ?? 1)) * max(1, (int) ($repeatGrid['rows'] ?? 1));
    }

    private function generatedTemplateCount(ProductPrint $print, $product, int $printQuantity): int
    {
        if ($this->usesPackingQuantityLabels($print)) {
            return max(1, (int) ceil($printQuantity / max(1, (int) ($product->packing_quantity ?? 1))));
        }

        return $this->slotsPerPage($print->template);
    }

    private function generatedLabelQuantities(ProductPrint $print, $product, int $printQuantity, int $generatedCount): array
    {
        if (! $this->usesPackingQuantityLabels($print)) {
            return array_fill(0, $generatedCount, $printQuantity);
        }

        $packingQuantity = max(1, (int) ($product->packing_quantity ?? 1));
        $remainingQuantity = $printQuantity;
        $quantities = [];

        for ($index = 0; $index < $generatedCount; $index++) {
            $labelQuantity = min($packingQuantity, max(0, $remainingQuantity));
            $quantities[] = $labelQuantity;
            $remainingQuantity -= $labelQuantity;
        }

        return $quantities;
    }

    private function usesPackingQuantityLabels(ProductPrint $print): bool
    {
        $settings = $print->template?->settings ?? [];
        $printMode = $settings['printMode'] ?? $settings['print_mode'] ?? 'per_print';

        return $printMode === 'per_packing_quantity' || $this->templateUsesLabelQuantity($print);
    }

    private function templateUsesLabelQuantity(ProductPrint $print): bool
    {
        return (bool) $print->template?->elements->contains(function ($element): bool {
            $payload = json_encode($element->payload);

            return is_string($payload)
                && (str_contains($payload, '{{label_quantity}}')
                    || str_contains($payload, '{{ label_quantity }}'));
        });
    }

    private function instancesWithCopies(array $serialNumbers, array $labelQuantities, $template): array
    {
        $copiesPerPrint = max(1, (int) ($template?->settings['copiesPerPrint'] ?? 1));
        $instances = [];

        foreach ($serialNumbers as $index => $serialNumber) {
            for ($copy = 0; $copy < $copiesPerPrint; $copy++) {
                $instances[] = [
                    'serial_number' => $serialNumber,
                    'label_quantity' => $labelQuantities[$index] ?? 0,
                ];
            }
        }

        return $instances;
    }

    private function buildInstances(array $serialNumbers, array $labelQuantities): array
    {
        return array_map(
            fn (string $serialNumber, int $labelQuantity): array => [
                'serial_number' => $serialNumber,
                'label_quantity' => $labelQuantity,
            ],
            $serialNumbers,
            $labelQuantities,
        );
    }

    private function renderSerialPage(TemplateRenderingService $renderer, ProductPrint $print, $item, array $instances, string $productionDate): array
    {
        $payloads = array_map(
            fn (array $instance): array => $renderer->render($print->template, $item->product, [
                'production_date' => $productionDate,
                'serial_number' => $instance['serial_number'],
                'label_quantity' => $instance['label_quantity'],
            ]),
            $instances,
        );
        $payload = $payloads[0];
        $payload['repeat_instances'] = array_map(
            fn (array $rendered): array => $rendered['elements'] ?? [],
            $payloads,
        );
        $payload['label_quantities'] = array_map(
            fn (array $instance): int => (int) $instance['label_quantity'],
            $instances,
        );

        return $payload;
    }

}
