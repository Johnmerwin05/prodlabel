<?php

namespace Tests\Feature\Api\V1;

use App\Events\UserNotificationCreated;
use App\Models\Customer;
use App\Models\Role;
use App\Models\User;
use App\Services\UserNotificationService;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_created_entity_notification_is_persisted_per_eligible_account_and_broadcast(): void
    {
        Event::fake([UserNotificationCreated::class]);
        $this->seed([RbacSeeder::class, AdminUserSeeder::class]);
        $admin = User::where('username', 'admin')->firstOrFail();
        $viewer = User::factory()->create(['status' => 'active']);
        $viewer->roles()->attach(Role::where('slug', 'viewer')->firstOrFail());
        $customer = Customer::create([
            'name' => 'Realtime Customer',
            'code' => 'RTC-001',
            'status' => 'active',
        ]);

        app(UserNotificationService::class)->entityCreated(
            'customer.view',
            'customer',
            $customer,
            $admin,
        );

        $this->assertCount(1, $admin->notifications);
        $this->assertCount(1, $viewer->notifications);
        Event::assertDispatched(UserNotificationCreated::class, 2);
    }

    public function test_user_can_read_grouped_notifications_and_read_all(): void
    {
        $this->seed([RbacSeeder::class, AdminUserSeeder::class]);
        $admin = User::where('username', 'admin')->firstOrFail();
        Sanctum::actingAs($admin);

        foreach (['product', 'product', 'customer'] as $index => $type) {
            $admin->notifications()->create([
                'id' => fake()->uuid(),
                'type' => 'entity.created',
                'data' => [
                    'entity_type' => $type,
                    'entity_id' => $index + 1,
                    'title' => "New {$type} added",
                    'message' => "A {$type} was created.",
                    'action_url' => "/{$type}s",
                ],
            ]);
        }

        $this->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.unread_count', 3);

        $this->postJson('/api/v1/notifications/read-type', ['type' => 'product'])
            ->assertOk();
        $this->assertSame(1, $admin->unreadNotifications()->count());

        $this->postJson('/api/v1/notifications/read-all')->assertOk();
        $this->assertSame(0, $admin->unreadNotifications()->count());
    }

    public function test_users_only_receive_their_own_notification_feed(): void
    {
        $first = User::factory()->create();
        $second = User::factory()->create();
        $first->notifications()->create([
            'id' => fake()->uuid(),
            'type' => 'entity.created',
            'data' => ['entity_type' => 'product', 'title' => 'Private'],
        ]);
        Sanctum::actingAs($second);

        $this->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('meta.unread_count', 0);
    }
}
