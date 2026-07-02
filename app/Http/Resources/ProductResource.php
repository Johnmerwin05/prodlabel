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
            'part_number' => $this->part_number,
            'pi_number' => $this->pi_number,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'area' => $this->area,
            'sku' => $this->sku,
            'name' => $this->name,
            'description' => $this->description,
            'unit_of_measure' => $this->unit_of_measure,
            'products_per_box' => $this->products_per_box,
            'packing_quantity' => $this->packing_quantity,
            'batch_number' => $this->batch_number,
            'lot_number' => $this->lot_number,
            'manufacturing_date' => $this->manufacturing_date?->toDateString(),
            'expiration_date' => $this->expiration_date?->toDateString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
