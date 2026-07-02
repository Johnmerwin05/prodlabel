<?php

namespace App\Services;

use App\Events\UserNotificationCreated;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class UserNotificationService
{
    public function entityCreated(
        string $permission,
        string $entityType,
        Model $entity,
        ?User $actor,
    ): void {
        $recipients = User::query()
            ->where('status', 'active')
            ->whereNull('locked_at')
            ->get()
            ->filter(fn (User $user) => $user->hasPermission($permission));

        foreach ($recipients as $recipient) {
            $notification = $recipient->notifications()->create([
                'id' => (string) Str::uuid(),
                'type' => 'entity.created',
                'data' => [
                    'entity_type' => $entityType,
                    'entity_id' => $entity->getKey(),
                    'title' => 'New '.str($entityType)->headline()->lower().' added',
                    'message' => $this->message($entityType, $entity, $actor),
                    'action_url' => $entityType === 'product' ? '/products' : '/customers',
                    'actor' => $actor ? [
                        'id' => $actor->id,
                        'name' => $actor->name,
                    ] : null,
                ],
                'read_at' => null,
            ]);

            DB::afterCommit(function () use ($recipient, $notification): void {
                try {
                    UserNotificationCreated::dispatch(
                        $recipient->id,
                        $this->serialize($notification),
                    );
                } catch (Throwable $exception) {
                    report($exception);
                }
            });
        }
    }

    public function serialize(DatabaseNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'type' => $notification->data['entity_type'] ?? 'system',
            'title' => $notification->data['title'] ?? 'Notification',
            'message' => $notification->data['message'] ?? '',
            'action_url' => $notification->data['action_url'] ?? null,
            'entity_id' => $notification->data['entity_id'] ?? null,
            'actor' => $notification->data['actor'] ?? null,
            'read_at' => $notification->read_at?->toISOString(),
            'created_at' => $notification->created_at?->toISOString(),
        ];
    }

    private function message(string $entityType, Model $entity, ?User $actor): string
    {
        $name = (string) ($entity->getAttribute('name')
            ?? $entity->getAttribute('part_number')
            ?? "#{$entity->getKey()}");

        return ($actor?->name ?? 'System').' created '.str($entityType)->lower()." {$name}.";
    }
}
