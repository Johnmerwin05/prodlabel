<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_and_update_personal_profile_without_user_management_access(): void
    {
        $user = User::factory()->create([
            'username' => 'profile_user',
            'name' => 'Profile User',
            'email' => 'profile@example.test',
            'password' => 'password123',
            'status' => 'active',
        ]);
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/profile')
            ->assertOk()
            ->assertJsonPath('data.username', 'profile_user')
            ->assertJsonPath('data.status', 'active');

        $this->putJson('/api/v1/profile', [
            'employee_code' => 'EMP-PROFILE',
            'username' => 'updated_profile',
            'name' => 'Updated Profile',
            'email' => 'updated-profile@example.test',
            'status' => 'locked',
            'role_ids' => [999],
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Profile')
            ->assertJsonPath('data.status', 'active');

        $user->refresh();
        $this->assertSame('EMP-PROFILE', $user->employee_code);
        $this->assertSame('active', $user->status);
        $this->assertCount(0, $user->roles);
    }

    public function test_password_change_requires_the_correct_current_password(): void
    {
        $user = User::factory()->create([
            'username' => 'password_user',
            'password' => 'password123',
            'status' => 'active',
        ]);
        Sanctum::actingAs($user);

        $payload = [
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'current_password' => 'wrong-password',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ];

        $this->putJson('/api/v1/profile', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('current_password');

        $payload['current_password'] = 'password123';
        $this->putJson('/api/v1/profile', $payload)->assertOk();

        $this->assertTrue(Hash::check('new-password123', $user->fresh()->password));
    }
}
