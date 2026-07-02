<?php

namespace Tests\Feature\Api\V1;

use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_user_lifecycle(): void
    {
        $this->seed(RbacSeeder::class);
        $this->seed(AdminUserSeeder::class);

        $admin = User::where('username', 'admin')->firstOrFail();
        Sanctum::actingAs($admin);

        $role = Role::where('slug', 'encoder')->firstOrFail();

        $createResponse = $this->postJson('/api/v1/users', [
            'employee_code' => 'EMP-100',
            'username' => 'encoder_100',
            'name' => 'Encoder User',
            'email' => 'encoder100@example.test',
            'password' => 'password123',
            'status' => 'active',
            'role_ids' => [$role->id],
        ])->assertCreated();

        $userId = $createResponse->json('data.id');

        $this->getJson('/api/v1/users?search=encoder_100')
            ->assertOk()
            ->assertJsonPath('data.0.username', 'encoder_100');

        $this->putJson("/api/v1/users/{$userId}", [
            'employee_code' => 'EMP-101',
            'username' => 'encoder_101',
            'name' => 'Updated Encoder',
            'email' => 'encoder101@example.test',
            'status' => 'inactive',
            'role_ids' => [$role->id],
        ])
            ->assertOk()
            ->assertJsonPath('data.username', 'encoder_101')
            ->assertJsonPath('data.status', 'inactive');

        $this->postJson("/api/v1/users/{$userId}/lock")
            ->assertOk()
            ->assertJsonPath('data.status', 'locked');

        $this->postJson("/api/v1/users/{$userId}/unlock")
            ->assertOk()
            ->assertJsonPath('data.status', 'active');

        $this->postJson("/api/v1/users/{$userId}/reset-password", [
            'password' => 'new-password',
        ])->assertOk();

        $this->assertTrue(Hash::check('new-password', User::findOrFail($userId)->password));

        $this->deleteJson("/api/v1/users/{$userId}")->assertNoContent();
        $this->assertSoftDeleted('users', ['id' => $userId]);

        $this->postJson("/api/v1/users/{$userId}/restore")
            ->assertOk()
            ->assertJsonPath('data.id', $userId);

        $this->assertNotSoftDeleted('users', ['id' => $userId]);
    }

    public function test_user_can_have_permissions_specific_to_their_account(): void
    {
        $this->seed([RbacSeeder::class, AdminUserSeeder::class]);
        $admin = User::where('username', 'admin')->firstOrFail();
        Sanctum::actingAs($admin);

        $role = Role::where('slug', 'encoder')->firstOrFail();
        $viewPermission = Permission::where('slug', 'product.view')->firstOrFail();

        $response = $this->postJson('/api/v1/users', [
            'username' => 'specific_access',
            'name' => 'Specific Access',
            'email' => 'specific@example.test',
            'password' => 'password123',
            'status' => 'active',
            'role_ids' => [$role->id],
            'permission_ids' => [$viewPermission->id],
        ])->assertCreated();

        $user = User::findOrFail($response->json('data.id'));

        $this->assertTrue($user->uses_custom_permissions);
        $this->assertTrue($user->hasPermission('product.view'));
        $this->assertFalse($user->hasPermission('product.create'));
        $this->assertFalse($user->hasPermission('template.view'));
    }
}
