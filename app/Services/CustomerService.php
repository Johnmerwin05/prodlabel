<?php

namespace App\Services;

use App\DTOs\CustomerData;
use App\Models\Customer;
use App\Repositories\Contracts\CustomerRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerService
{
    public function __construct(
        private readonly CustomerRepository $customers,
        private readonly AuditLogService $audit,
        private readonly UserNotificationService $notifications,
    ) {
    }

    public function create(CustomerData $data, Request $request): Customer
    {
        return DB::transaction(function () use ($data, $request): Customer {
            $payload = $data->toModelPayload($request->user()?->id);
            $payload['created_by'] = $request->user()?->id;

            $customer = $this->customers->create($payload);
            if ($data->templateIds !== null) {
                $customer->templates()->sync($data->templateIds);
            }
            $this->audit->audit('customer.created', $customer, [], $customer->toArray(), $request);
            $this->notifications->entityCreated(
                'customer.view',
                'customer',
                $customer,
                $request->user(),
            );

            return $customer->load('templates');
        });
    }

    public function update(Customer $customer, CustomerData $data, Request $request): Customer
    {
        return DB::transaction(function () use ($customer, $data, $request): Customer {
            $old = $customer->toArray();
            $customer = $this->customers->update($customer, $data->toModelPayload($request->user()?->id));
            if ($data->templateIds !== null) {
                $customer->templates()->sync($data->templateIds);
            }
            $this->audit->audit('customer.updated', $customer, $old, $customer->toArray(), $request);

            return $customer->load('templates');
        });
    }
}
