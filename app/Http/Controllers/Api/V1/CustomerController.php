<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\CustomerData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customers\StoreCustomerRequest;
use App\Http\Requests\Customers\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Repositories\Contracts\CustomerRepository;
use App\Services\CustomerService;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request, CustomerRepository $customers)
    {
        $this->authorize('viewAny', Customer::class);

        return CustomerResource::collection($customers->paginate($request->only('search', 'status', 'per_page', 'with_trashed')));
    }

    public function store(StoreCustomerRequest $request, CustomerService $service): CustomerResource
    {
        return new CustomerResource($service->create(CustomerData::fromArray($request->validated()), $request));
    }

    public function show(Customer $customer): CustomerResource
    {
        $this->authorize('view', $customer);

        return new CustomerResource($customer->load('templates'));
    }

    public function update(UpdateCustomerRequest $request, Customer $customer, CustomerService $service): CustomerResource
    {
        return new CustomerResource($service->update($customer, CustomerData::fromArray($request->validated()), $request));
    }

    public function destroy(Request $request, Customer $customer)
    {
        $this->authorize('delete', $customer);
        $customer->forceFill(['deleted_by' => $request->user()?->id])->save();
        $customer->delete();

        return response()->noContent();
    }

    public function restore(Request $request, int $customer): CustomerResource
    {
        $model = Customer::withTrashed()->findOrFail($customer);
        $this->authorize('restore', $model);
        $model->restore();

        return new CustomerResource($model);
    }
}
