<?php

namespace App\Services;

use App\DTOs\PrintRequestData;
use App\Models\ProductPrint;
use App\Repositories\Contracts\ProductRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PrintService
{
    public function __construct(
        private readonly ProductRepository $products,
        private readonly CustomerTemplateService $templates,
    ) {
    }

    public function queue(PrintRequestData $data, Request $request): Collection
    {
        return DB::transaction(function () use ($data, $request): Collection {
            $products = $this->products->findPrintableForCustomer($data->customerId, $data->productIds);
            abort_if($products->count() !== count($data->productIds), 422, 'One or more products are invalid for this customer.');
            $areas = $products->pluck('area')->filter()->unique()->values();
            abort_unless($areas->count() === 1, 422, 'Select products from one area per print request.');
            $template = $this->templates->publishedForCustomer($data->customerId, $areas->first());
            abort_unless($template, 422, 'No published template is assigned to this product customer and area.');

            return $products->map(function ($product) use ($data, $request, $template): ProductPrint {
                $print = ProductPrint::create([
                    'job_uuid' => (string) Str::uuid(),
                    'customer_id' => $data->customerId,
                    'template_id' => $template->id,
                    'production_date' => $data->productionDate,
                    'print_quantity' => $data->printQuantity,
                    'requested_by' => $request->user()?->id,
                    'status' => 'queued',
                    'total_products' => 1,
                    'metadata' => ['reprint_reason' => $data->reprintReason],
                ]);

                $print->items()->create([
                    'product_id' => $product->id,
                    'status' => 'queued',
                ]);

                return $print->load([
                    'customer:id,name,code',
                    'template:id,name',
                    'items.product',
                ]);
            })->values();
        });
    }
}
