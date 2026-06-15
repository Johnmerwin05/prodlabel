<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\ProductData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Products\StoreProductRequest;
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
            ->when($request->integer('customer_id'), fn ($query, int $customerId) => $query->where('customer_id', $customerId))
            ->when($request->string('status')->toString(), fn ($query, string $status) => $query->where('status', $status))
            ->latest()
            ->paginate($request->integer('per_page', 25));

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
}
