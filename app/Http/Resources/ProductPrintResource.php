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
            'status' => $this->status,
            'total_products' => $this->total_products,
            'completed_products' => $this->completed_products,
            'failed_products' => $this->failed_products,
            'started_at' => $this->started_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
        ];
    }
}
