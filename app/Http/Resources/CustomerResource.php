<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'customer_code' => $this->code,
            'address' => $this->address,
            'contact_person' => $this->contact_person,
            'contact_number' => $this->contact_number,
            'email' => $this->email,
            'status' => $this->status,
            'remarks' => $this->remarks,
            'serial_number_prefix' => $this->serial_number_prefix,
            'serial_number_format' => $this->serial_number_format,
            'serial_number_next_sequence' => $this->serial_number_next_sequence,
            'serial_number_resets_yearly' => $this->serial_number_resets_yearly,
            'serial_number_sequence_year' => $this->serial_number_sequence_year,
            'products_count' => $this->whenCounted('products'),
            'templates' => TemplateResource::collection($this->whenLoaded('templates')),
            'deleted_at' => $this->deleted_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
