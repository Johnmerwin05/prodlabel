<?php

namespace App\Repositories\Eloquent;

use App\Models\Customer;
use App\Repositories\Contracts\CustomerRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentCustomerRepository implements CustomerRepository
{
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return Customer::query()
            ->withCount('products')
            ->when($filters['with_trashed'] ?? false, fn ($query) => $query->withTrashed())
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, function ($query, string|array $status): void {
                is_array($status)
                    ? $query->whereIn('status', $status)
                    : $query->where('status', $status);
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 25);
    }

    public function create(array $payload): Customer
    {
        return Customer::create($payload);
    }

    public function update(Customer $customer, array $payload): Customer
    {
        $customer->update($payload);

        return $customer->refresh();
    }
}
