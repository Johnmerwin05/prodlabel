<?php

namespace App\Http\Requests\Products;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        $product = $this->route('product');

        return $product instanceof Product
            && ($this->user()?->can('update', $product) ?? false);
    }

    public function rules(): array
    {
        $product = $this->route('product');

        return [
            'product_id' => [
                'nullable',
                'string',
                'max:120',
                Rule::unique('products', 'product_id')->ignore($product?->id),
            ],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'area' => ['required', 'in:Assembly,Molding,Inspection,Injection'],
            'part_number' => ['required', 'string', 'max:120'],
            'pi_number' => ['required', 'string', 'max:120'],
            'sku' => ['nullable', 'string', 'max:120'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'unit_of_measure' => ['required', 'in:Piece,Box,Pack,Set,Kg,Gram,Liter,Milliliter,Meter'],
            'products_per_box' => ['nullable', 'integer', 'min:1'],
            'packing_quantity' => ['required', 'integer', 'min:1'],
            'batch_number' => ['nullable', 'string', 'max:120'],
            'lot_number' => ['nullable', 'string', 'max:120'],
            'manufacturing_date' => ['nullable', 'date'],
            'expiration_date' => ['nullable', 'date', 'after_or_equal:manufacturing_date'],
        ];
    }
}
