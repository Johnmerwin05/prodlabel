<?php

namespace App\Http\Requests\Templates;

use Illuminate\Foundation\Http\FormRequest;

class StoreTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('template.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:draft,published,archived'],
            'paper_size' => ['required', 'in:A3,A4,A5,Letter,Legal,Custom'],
            'orientation' => ['required', 'in:portrait,landscape'],
            'width_mm' => ['nullable', 'numeric', 'min:1', 'max:2000'],
            'height_mm' => ['nullable', 'numeric', 'min:1', 'max:2000'],
            'settings' => ['required', 'array'],
            'elements' => ['array'],
            'elements.*.type' => ['required', 'string', 'max:60'],
            'elements.*.name' => ['nullable', 'string', 'max:255'],
            'elements.*.payload' => ['required', 'array'],
            'elements.*.z_index' => ['nullable', 'integer', 'min:0'],
            'customer_ids' => ['array'],
            'customer_ids.*' => ['integer', 'exists:customers,id'],
            'customer_assignments' => ['array'],
            'customer_assignments.*.customer_id' => ['required', 'integer', 'distinct', 'exists:customers,id'],
            'customer_assignments.*.area' => ['required', 'in:Assembly,Molding,Inspection,Injection'],
        ];
    }
}
