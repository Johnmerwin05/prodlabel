<?php

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\Product::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'string', 'max:120', 'unique:products,product_id'],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'sku' => ['required', 'string', 'max:120'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'quantity' => ['required', 'integer', 'min:1'],
            'batch_number' => ['nullable', 'string', 'max:120'],
            'lot_number' => ['nullable', 'string', 'max:120'],
            'manufacturing_date' => ['nullable', 'date'],
            'expiration_date' => ['nullable', 'date', 'after_or_equal:manufacturing_date'],
            'status' => ['nullable', 'in:draft,ready,printed,void'],
        ];
    }
}
