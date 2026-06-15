<?php

namespace App\Events;

use App\Models\ProductPrint;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PrintProgress implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(public ProductPrint $print, public ?string $currentProduct = null)
    {
    }

    public function broadcastOn(): Channel
    {
        return new Channel("prints.{$this->print->job_uuid}");
    }

    public function broadcastWith(): array
    {
        return [
            'job_uuid' => $this->print->job_uuid,
            'current_product' => $this->currentProduct,
            'total_products' => $this->print->total_products,
            'completed_products' => $this->print->completed_products,
            'failed_products' => $this->print->failed_products,
            'status' => $this->print->status,
        ];
    }
}
