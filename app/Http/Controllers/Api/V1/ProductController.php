<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\ProductData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Products\StoreProductRequest;
use App\Http\Requests\Products\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Product::class);

        $products = Product::query()
            ->with('customer:id,name,code')
            ->when($request->input('search'), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('product_id', 'like', "%{$search}%")
                        ->orWhere('part_number', 'like', "%{$search}%")
                        ->orWhere('pi_number', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('batch_number', 'like', "%{$search}%")
                        ->orWhere('lot_number', 'like', "%{$search}%");
                });
            })
            ->when($request->integer('customer_id'), fn ($query, int $customerId) => $query->where('customer_id', $customerId))
            ->when($request->input('part_number'), fn ($query, string $partNumber) => $query->where('part_number', $partNumber))
            ->when($request->input('pi_number'), fn ($query, string $piNumber) => $query->where('pi_number', $piNumber))
            ->latest()
            ->paginate($request->integer('per_page', 10));

        return ProductResource::collection($products);
    }

    public function store(StoreProductRequest $request, ProductService $service): ProductResource
    {
        return new ProductResource($service->create(ProductData::fromArray($request->validated()), $request));
    }

    public function show(Product $product): ProductResource
    {
        $this->authorize('view', $product);

        return new ProductResource($product->load('customer'));
    }

    public function update(UpdateProductRequest $request, Product $product, ProductService $service): ProductResource
    {
        return new ProductResource($service->update($product, ProductData::fromArray($request->validated()), $request));
    }

    public function destroy(Request $request, Product $product, ProductService $service)
    {
        $this->authorize('delete', $product);

        $service->delete($product, $request);

        return response()->noContent();
    }
}
