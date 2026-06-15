<?php

namespace App\Repositories\Contracts;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;

interface ProductRepository
{
    public function create(array $payload): Product;

    public function findPrintableForCustomer(int $customerId, array $ids): Collection;
}
