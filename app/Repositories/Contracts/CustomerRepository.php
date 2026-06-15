<?php

namespace App\Repositories\Contracts;

use App\Models\Customer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CustomerRepository
{
    public function paginate(array $filters = []): LengthAwarePaginator;

    public function create(array $payload): Customer;

    public function update(Customer $customer, array $payload): Customer;
}
