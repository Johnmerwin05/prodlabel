<?php

namespace Tests\Feature\Api\V1;

use Database\Seeders\AdminUserSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeded_admin_can_login_with_sanctum_token(): void
    {
        $this->seed(RbacSeeder::class);
        $this->seed(AdminUserSeeder::class);

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'admin',
            'password' => 'password',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.username', 'admin')
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'username', 'email', 'permissions']]);
    }
}
