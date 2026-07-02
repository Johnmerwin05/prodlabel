<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ApplicationDataChanged implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $entity,
        public readonly string $action,
        public readonly int|string $id,
    ) {
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('application.data');
    }

    public function broadcastAs(): string
    {
        return 'application.data.changed';
    }

    public function broadcastWith(): array
    {
        return ['entity' => $this->entity, 'action' => $this->action, 'id' => $this->id];
    }
}
