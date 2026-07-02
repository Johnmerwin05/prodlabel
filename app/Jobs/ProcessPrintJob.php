<?php

namespace App\Jobs;

use App\Events\PrintCompleted;
use App\Events\PrintFailed;
use App\Events\PrintProgress;
use App\Events\PrintStarted;
use App\Models\LabelTemplate;
use App\Models\ProductPrint;
use App\Services\SerialNumberService;
use App\Services\TemplateRenderingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Throwable;

class ProcessPrintJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 300;

    public function __construct(private readonly int $printId)
    {
    }

    public function handle(TemplateRenderingService $renderer, SerialNumberService $serialNumbers): void
    {
        $print = ProductPrint::with(['customer', 'items.product.customer'])->findOrFail($this->printId);
        $template = LabelTemplate::with('elements')->findOrFail($print->template_id);

        $print->update(['status' => 'processing', 'started_at' => now()]);
        event(new PrintStarted($print->refresh()));

        foreach ($print->items as $item) {
            try {
                DB::transaction(function () use ($renderer, $serialNumbers, $template, $item, $print): void {
                    $generatedCount = $this->generatedTemplateCount($template, $item->product, (int) ($print->print_quantity ?? 1));
                    $slotsPerPage = $this->slotsPerPage($template);
                    $copiesPerPrint = $this->copiesPerPrint($template);
                    $expectedPhysicalCount = $generatedCount * $copiesPerPrint;
                    $instances = count($item->serial_numbers ?? []) === $expectedPhysicalCount
                        ? $this->buildInstances(
                            $item->serial_numbers,
                            $this->generatedLabelQuantities($template, $item->product, (int) ($print->print_quantity ?? 1), $generatedCount, $copiesPerPrint),
                        )
                        : $this->instancesWithCopies(
                            $serialNumbers->generateMany(
                                $print->customer,
                                $print->production_date,
                                $generatedCount,
                                true,
                                0,
                                $template,
                            ),
                            $this->generatedLabelQuantities($template, $item->product, (int) ($print->print_quantity ?? 1), $generatedCount, 1),
                            $copiesPerPrint,
                        );
                    $pages = array_map(
                        fn (array $pageInstances): array => $this->renderSerialPage($renderer, $template, $item, $print, $pageInstances),
                        array_chunk($instances, $slotsPerPage),
                    );
                    $payload = $pages[0];
                    $payload['pages'] = $pages;
                    $serialNumberList = array_column($instances, 'serial_number');

                    $item->update([
                        'serial_number' => $serialNumberList[0] ?? null,
                        'serial_numbers' => $serialNumberList,
                        'status' => 'completed',
                        'rendered_payload' => $payload,
                    ]);
                    $print->increment('completed_products');
                });
            } catch (Throwable $exception) {
                $item->update(['status' => 'failed', 'failure_reason' => $exception->getMessage()]);
                $print->increment('failed_products');
            }

            event(new PrintProgress($print->refresh(), $item->product->product_id));
        }

        $status = $print->failed_products > 0 ? 'completed_with_errors' : 'completed';
        $print->update(['status' => $status, 'completed_at' => now()]);
        event(new PrintCompleted($print->refresh()));
    }

    public function failed(Throwable $exception): void
    {
        $print = ProductPrint::find($this->printId);

        if ($print) {
            $print->update(['status' => 'failed']);
            event(new PrintFailed($print, $exception->getMessage()));
        }
    }

    private function slotsPerPage(LabelTemplate $template): int
    {
        $repeatGrid = $template->settings['repeatGrid'] ?? [];

        if (! ($repeatGrid['enabled'] ?? false)) {
            return 1;
        }

        return max(1, (int) ($repeatGrid['columns'] ?? 1)) * max(1, (int) ($repeatGrid['rows'] ?? 1));
    }

    private function generatedTemplateCount(LabelTemplate $template, $product, int $printQuantity): int
    {
        if ($this->usesPackingQuantityLabels($template)) {
            return max(1, (int) ceil($printQuantity / max(1, (int) ($product->packing_quantity ?? 1))));
        }

        return $this->slotsPerPage($template);
    }

    private function copiesPerPrint(LabelTemplate $template): int
    {
        return max(1, (int) ($template->settings['copiesPerPrint'] ?? 1));
    }

    private function generatedLabelQuantities(LabelTemplate $template, $product, int $printQuantity, int $generatedCount, int $copiesPerPrint): array
    {
        if (! $this->usesPackingQuantityLabels($template)) {
            $quantities = array_fill(0, $generatedCount, $printQuantity);
        } else {
            $packingQuantity = max(1, (int) ($product->packing_quantity ?? 1));
            $remainingQuantity = $printQuantity;
            $quantities = [];

            for ($index = 0; $index < $generatedCount; $index++) {
                $labelQuantity = min($packingQuantity, max(0, $remainingQuantity));
                $quantities[] = $labelQuantity;
                $remainingQuantity -= $labelQuantity;
            }
        }

        return collect($quantities)
            ->flatMap(fn (int $quantity): array => array_fill(0, $copiesPerPrint, $quantity))
            ->values()
            ->all();
    }

    private function usesPackingQuantityLabels(LabelTemplate $template): bool
    {
        $printMode = $template->settings['printMode'] ?? $template->settings['print_mode'] ?? 'per_print';

        return $printMode === 'per_packing_quantity' || $this->templateUsesLabelQuantity($template);
    }

    private function templateUsesLabelQuantity(LabelTemplate $template): bool
    {
        return (bool) $template->elements->contains(function ($element): bool {
            $payload = json_encode($element->payload);

            return is_string($payload)
                && (str_contains($payload, '{{label_quantity}}')
                    || str_contains($payload, '{{ label_quantity }}'));
        });
    }

    private function instancesWithCopies(array $serialNumbers, array $labelQuantities, int $copiesPerPrint): array
    {
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

    private function renderSerialPage(TemplateRenderingService $renderer, LabelTemplate $template, $item, ProductPrint $print, array $instances): array
    {
        $payloads = array_map(
            fn (array $instance): array => $renderer->render($template, $item->product, [
                'production_date' => $print->production_date?->toDateString(),
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
