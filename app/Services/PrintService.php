<?php

namespace App\Services;

use App\DTOs\PrintRequestData;
use App\Jobs\ProcessPrintJob;
use App\Models\ProductPrint;
use App\Repositories\Contracts\ProductRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PrintService
{
    public function __construct(private readonly ProductRepository $products)
    {
    }

    public function queue(PrintRequestData $data, Request $request): ProductPrint
    {
        return DB::transaction(function () use ($data, $request): ProductPrint {
            $products = $this->products->findPrintableForCustomer($data->customerId, $data->productIds);

            abort_if($products->count() !== count($data->productIds), 422, 'One or more products are invalid for this customer.');

            $print = ProductPrint::create([
                'job_uuid' => (string) Str::uuid(),
                'customer_id' => $data->customerId,
                'template_id' => $data->templateId,
                'requested_by' => $request->user()?->id,
                'status' => 'queued',
                'total_products' => $products->count(),
                'metadata' => ['reprint_reason' => $data->reprintReason],
            ]);

            $print->items()->createMany($products->map(fn ($product) => [
                'product_id' => $product->id,
                'status' => 'queued',
            ])->all());

            ProcessPrintJob::dispatch($print->id)->onQueue('printing');

            return $print->load('items.product');
        });
    }
}
