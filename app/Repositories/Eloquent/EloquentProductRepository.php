<?php

namespace App\Repositories\Eloquent;

use App\Models\Product;
use App\Repositories\Contracts\ProductRepository;
use Illuminate\Database\Eloquent\Collection;

class EloquentProductRepository implements ProductRepository
{
    public function create(array $payload): Product
    {
        return Product::create($payload);
    }

    public function findPrintableForCustomer(int $customerId, array $ids): Collection
    {
        return Product::query()
            ->where('customer_id', $customerId)
            ->whereIn('id', $ids)
            ->with('customer:id,name,code')
            ->get();
    }
}
