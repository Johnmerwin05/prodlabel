<?php

namespace App\Http\Requests\Customers;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->filled('customer_code') && ! $this->filled('code')) {
            $this->merge(['code' => $this->input('customer_code')]);
        }
    }

    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\Customer::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:60', 'unique:customers,code'],
            'address' => ['nullable', 'string'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:60'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['required', 'in:active,inactive'],
            'remarks' => ['nullable', 'string'],
            'template_ids' => ['array'],
            'template_ids.*' => ['integer', 'exists:templates,id'],
        ];
    }
}
