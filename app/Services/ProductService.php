<?php

namespace App\Services;

use App\DTOs\ProductData;
use App\Models\Product;
use App\Repositories\Contracts\ProductRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductService
{
    public function __construct(
        private readonly ProductRepository $products,
        private readonly AuditLogService $audit,
    ) {
    }

    public function create(ProductData $data, Request $request): Product
    {
        return DB::transaction(function () use ($data, $request): Product {
            $payload = $data->toModelPayload($request->user()?->id);
            $payload['created_by'] = $request->user()?->id;
            $product = $this->products->create($payload);
            $this->audit->audit('product.created', $product, [], $product->toArray(), $request);

            return $product->load('customer');
        });
    }
}
