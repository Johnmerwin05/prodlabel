<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'status' => $this->status,
            'paper_size' => $this->paper_size,
            'orientation' => $this->orientation,
            'width_mm' => $this->width_mm !== null ? (float) $this->width_mm : null,
            'height_mm' => $this->height_mm !== null ? (float) $this->height_mm : null,
            'settings' => $this->settings,
            'current_version' => $this->current_version,
            'customers_count' => $this->whenCounted('customers'),
            'customers' => CustomerResource::collection($this->whenLoaded('customers')),
            'customer_assignments' => $this->whenLoaded('customers', fn () => $this->customers->map(fn ($customer) => [
                'customer_id' => $customer->id,
                'area' => $customer->pivot?->area,
            ])->values()),
            'elements' => TemplateElementResource::collection($this->whenLoaded('elements')),
            'created_by' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator?->id,
                'name' => $this->creator?->name,
            ]),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),
        ];
    }
}
