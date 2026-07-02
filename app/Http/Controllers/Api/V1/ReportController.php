<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductPrint;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function printing(Request $request): array
    {
        abort_unless($request->user()?->hasPermission('report.view'), 403);

        $data = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $endDate = Carbon::parse($data['end_date'] ?? now()->toDateString())->endOfDay();
        $startDate = Carbon::parse($data['start_date'] ?? $endDate->copy()->subDays(29)->toDateString())->startOfDay();

        $prints = ProductPrint::query()
            ->with(['customer:id,name,code', 'template:id,name', 'items.product.customer:id,name,code'])
            ->whereNotNull('production_date')
            ->whereBetween('production_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->whereIn('status', ['completed', 'completed_with_errors'])
            ->orderBy('production_date')
            ->get();

        $printedRows = $prints
            ->flatMap(fn (ProductPrint $print) => $this->printedRows($print))
            ->values();

        $dailyPrinted = collect(CarbonPeriod::create($startDate, $endDate))
            ->map(function (Carbon $date) use ($printedRows): array {
                $day = $date->toDateString();

                return [
                    'date' => $day,
                    'printed' => $printedRows->where('production_date', $day)->count(),
                ];
            })
            ->values()
            ->all();

        return [
            'data' => [
                'can_export' => $request->user()?->hasPermission('report.export') ?? false,
                'range' => [
                    'start_date' => $startDate->toDateString(),
                    'end_date' => $endDate->toDateString(),
                ],
                'summary' => [
                    'total_products' => Product::count(),
                    'total_customers' => Customer::count(),
                    'printed_count' => $printedRows->count(),
                    'printed_requests' => $prints->count(),
                ],
                'daily_printed' => $dailyPrinted,
                'top_products' => $this->topGroups($printedRows, 'product_id', 'product_name'),
                'top_customers' => $this->topGroups($printedRows, 'customer_id', 'customer_name'),
                'printed_products' => $printedRows->all(),
            ],
        ];
    }

    private function printedRows(ProductPrint $print)
    {
        return $print->items
            ->filter(fn ($item) => $item->status === 'completed')
            ->flatMap(function ($item) use ($print) {
                $serialNumbers = collect($item->serial_numbers ?: array_filter([$item->serial_number]))->values();
                $labelQuantities = collect($this->labelQuantities($item->rendered_payload ?? []));

                return $serialNumbers->map(function (string $serialNumber, int $index) use ($print, $item, $labelQuantities): array {
                    $product = $item->product;
                    $customer = $product?->customer ?? $print->customer;

                    return [
                        'request_id' => $print->id,
                        'job_uuid' => $print->job_uuid,
                        'production_date' => $print->production_date?->toDateString(),
                        'customer_id' => $customer?->id,
                        'customer_name' => $customer?->name ?? 'No customer',
                        'customer_code' => $customer?->code,
                        'product_id' => $product?->id,
                        'product_code' => $product?->product_id,
                        'product_name' => $product?->name ?? 'No product',
                        'part_number' => $product?->part_number,
                        'pi_number' => $product?->pi_number,
                        'template_name' => $print->template?->name,
                        'serial_number' => $serialNumber,
                        'label_quantity' => $labelQuantities->get($index),
                    ];
                });
            });
    }

    private function labelQuantities(array $payload): array
    {
        $pages = $payload['pages'] ?? [$payload];

        return collect($pages)
            ->flatMap(fn (array $page): array => $page['label_quantities'] ?? [])
            ->values()
            ->all();
    }

    private function topGroups($rows, string $idKey, string $nameKey): array
    {
        return $rows
            ->groupBy(fn (array $row) => $row[$idKey] ?? $row[$nameKey])
            ->map(function ($group) use ($nameKey): array {
                $first = $group->first();

                return [
                    'name' => $first[$nameKey] ?? 'Unknown',
                    'printed' => $group->count(),
                ];
            })
            ->sortByDesc('printed')
            ->take(5)
            ->values()
            ->all();
    }
}
