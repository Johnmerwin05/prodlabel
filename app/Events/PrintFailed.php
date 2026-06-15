<?php

namespace App\Events;

use App\Models\ProductPrint;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PrintFailed implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(public ProductPrint $print, public string $message)
    {
    }

    public function broadcastOn(): Channel
    {
        return new Channel("prints.{$this->print->job_uuid}");
    }
}
