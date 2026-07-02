<?php

namespace Tests\Feature\Api\V1;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_authorized_user_can_create_and_update_roles(): void
    {
        $this->seed([RbacSeeder::class, AdminUserSeeder::class]);
        $admin = User::where('username', 'admin')->firstOrFail();
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/roles', [
            'name' => 'IT',
            'slug' => 'it',
            'description' => 'IT support access',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'IT');

        $role = Role::where('slug', 'it')->firstOrFail();
        $this->putJson("/api/v1/roles/{$role->id}", [
            'name' => 'IT',
            'slug' => 'it',
            'description' => 'Updated IT access',
        ])
            ->assertOk()
            ->assertJsonPath('data.description', 'Updated IT access');
    }

    public function test_assigned_role_cannot_be_deleted(): void
    {
        $this->seed([RbacSeeder::class, AdminUserSeeder::class]);
        $admin = User::where('username', 'admin')->firstOrFail();
        Sanctum::actingAs($admin);

        $role = Role::create([
            'name' => 'Assigned Role',
            'slug' => 'assigned-role',
        ]);
        $user = User::factory()->create();
        $user->roles()->attach($role);

        $this->deleteJson("/api/v1/roles/{$role->id}")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'This role is assigned to users and cannot be deleted.');
    }

    public function test_user_without_role_permission_cannot_manage_roles(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/roles')->assertForbidden();
        $this->getJson('/api/v1/roles/permissions')->assertForbidden();
    }
}
