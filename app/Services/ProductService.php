<?php

namespace App\Services;

use App\DTOs\ProductData;
use App\Models\Product;
use App\Repositories\Contracts\ProductRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductService
{
    public function __construct(
        private readonly ProductRepository $products,
        private readonly AuditLogService $audit,
        private readonly UserNotificationService $notifications,
    ) {
    }

    public function create(ProductData $data, Request $request): Product
    {
        return DB::transaction(function () use ($data, $request): Product {
            $payload = $data->toModelPayload($request->user()?->id);
            $payload['product_id'] ??= $this->generateProductId($data->partNumber);
            $payload['sku'] ??= $data->partNumber;
            $payload['created_by'] = $request->user()?->id;
            $product = $this->products->create($payload);
            $this->audit->audit('product.created', $product, [], $product->toArray(), $request);
            $this->notifications->entityCreated(
                'product.view',
                'product',
                $product,
                $request->user(),
            );

            return $product->load('customer');
        });
    }

    public function update(Product $product, ProductData $data, Request $request): Product
    {
        return DB::transaction(function () use ($product, $data, $request): Product {
            $before = $product->toArray();
            $payload = $data->toModelPayload($request->user()?->id);
            $payload['product_id'] ??= $product->product_id;
            $payload['sku'] ??= $data->partNumber;

            $product->fill($payload);
            $product->save();

            $this->audit->audit('product.updated', $product, $before, $product->toArray(), $request);

            return $product->load('customer');
        });
    }

    public function delete(Product $product, Request $request): void
    {
        DB::transaction(function () use ($product, $request): void {
            $before = $product->toArray();

            $product->forceFill([
                'deleted_by' => $request->user()?->id,
            ])->save();
            $product->delete();

            $this->audit->audit('product.deleted', $product, $before, $product->fresh()?->toArray() ?? [], $request);
        });
    }

    private function generateProductId(string $partNumber): string
    {
        return Str::upper(Str::slug($partNumber, '-')).'-'.now()->format('YmdHis');
    }
}
