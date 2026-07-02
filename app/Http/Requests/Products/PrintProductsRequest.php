<?php

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;

class PrintProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('printing.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'production_date' => ['required', 'date'],
            'print_quantity' => ['required', 'integer', 'min:1'],
            'product_ids' => ['required', 'array', 'min:1', 'max:1000'],
            'product_ids.*' => ['integer', 'distinct', 'exists:products,id'],
            'reprint_reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
