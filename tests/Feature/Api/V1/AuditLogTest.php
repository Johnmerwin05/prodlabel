<?php

namespace Tests\Feature\Api\V1;

use App\Models\ActivityLog;
use App\Models\AuditLog;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_authorized_user_can_view_change_and_activity_logs(): void
    {
        $this->seed([RbacSeeder::class, AdminUserSeeder::class]);
        $admin = User::where('username', 'admin')->firstOrFail();
        Sanctum::actingAs($admin);

        AuditLog::create([
            'event' => 'user.updated',
            'auditable_type' => User::class,
            'auditable_id' => $admin->id,
            'user_id' => $admin->id,
            'old_values' => ['name' => 'Old Name'],
            'new_values' => ['name' => 'New Name'],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
        ]);
        ActivityLog::create([
            'user_id' => $admin->id,
            'activity' => 'printing.dispatched',
            'module' => 'printing',
            'properties' => ['status_code' => 200, 'request' => ['print_ids' => [1]]],
            'ip_address' => '127.0.0.1',
            'device' => 'PHPUnit',
        ]);

        $this->getJson('/api/v1/audit-logs?per_page=10')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['action' => 'printing.dispatched'])
            ->assertJsonFragment(['old_values' => ['name' => 'Old Name']])
            ->assertJsonFragment(['new_values' => ['name' => 'New Name']])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_user_without_audit_permission_cannot_view_logs(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/audit-logs')->assertForbidden();
    }
}
