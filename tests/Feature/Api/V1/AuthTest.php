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

    public function test_idle_access_token_expires_after_one_hour(): void
    {
        $this->seed(RbacSeeder::class);
        $this->seed(AdminUserSeeder::class);

        $token = $this->postJson('/api/v1/auth/login', [
            'username' => 'admin',
            'password' => 'password',
        ])->json('token');

        $this->travel(61)->minutes();

        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Your session has expired.');
    }

    public function test_background_requests_do_not_extend_idle_session(): void
    {
        $this->seed(RbacSeeder::class);
        $this->seed(AdminUserSeeder::class);

        $lastActivityAt = now()->getTimestampMs();
        $token = $this->postJson('/api/v1/auth/login', [
            'username' => 'admin',
            'password' => 'password',
        ])->json('token');

        $this->travel(30)->minutes();

        $this->withToken($token)
            ->withHeader('X-Last-Activity-At', (string) $lastActivityAt)
            ->getJson('/api/v1/auth/me')
            ->assertOk();

        $this->travel(31)->minutes();

        $this->withToken($token)
            ->withHeader('X-Last-Activity-At', (string) $lastActivityAt)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Your session has expired.');
    }
}
