<?php

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;

class PrintProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('product.print') ?? false;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'template_id' => ['required', 'integer', 'exists:templates,id'],
            'product_ids' => ['required', 'array', 'min:1', 'max:1000'],
            'product_ids.*' => ['integer', 'exists:products,id'],
            'reprint_reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
