<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductPrintResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'job_uuid' => $this->job_uuid,
            'customer_id' => $this->customer_id,
            'template_id' => $this->template_id,
            'production_date' => $this->production_date?->toDateString(),
            'print_quantity' => $this->print_quantity,
            'print_count' => $this->print_count,
            'serial_numbers' => $this->whenLoaded('items', fn () => $this->items
                ->flatMap(fn ($item) => $item->serial_numbers ?: [$item->serial_number])
                ->filter()
                ->values()
                ->all()),
            'products' => $this->whenLoaded('items', fn () => $this->items
                ->map(fn ($item) => $item->product ? [
                    'id' => $item->product->id,
                    'name' => $item->product->name,
                    'part_number' => $item->product->part_number,
                    'pi_number' => $item->product->pi_number,
                ] : null)
                ->filter()
                ->values()
                ->all()),
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'template' => new TemplateResource($this->whenLoaded('template')),
            'status' => $this->status,
            'total_products' => $this->total_products,
            'completed_products' => $this->completed_products,
            'failed_products' => $this->failed_products,
            'created_at' => $this->created_at?->toISOString(),
            'started_at' => $this->started_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
        ];
    }
}
