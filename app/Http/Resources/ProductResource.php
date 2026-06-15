<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'sku' => $this->sku,
            'name' => $this->name,
            'quantity' => $this->quantity,
            'batch_number' => $this->batch_number,
            'lot_number' => $this->lot_number,
            'manufacturing_date' => $this->manufacturing_date?->toDateString(),
            'expiration_date' => $this->expiration_date?->toDateString(),
            'status' => $this->status,
            'print_count' => $this->print_count,
            'last_printed_at' => $this->last_printed_at?->toISOString(),
        ];
    }
}
