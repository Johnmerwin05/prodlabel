<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use App\Models\SystemSetting;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SystemSettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_clients_can_read_application_branding(): void
    {
        $this->getJson('/api/v1/system-settings')
            ->assertOk()
            ->assertJsonPath('data.system_name', 'ProdLabel')
            ->assertJsonPath('data.color_palette', 'blue');
    }

    public function test_admin_can_update_system_settings(): void
    {
        $this->seed([RbacSeeder::class, AdminUserSeeder::class]);
        $admin = User::where('username', 'admin')->firstOrFail();
        Sanctum::actingAs($admin);

        $this->postJson('/api/v1/system-settings', [
            'system_name' => 'Factory Console',
            'system_tagline' => 'Production command center',
            'footer_content' => 'Example Manufacturing. All rights reserved.',
            'color_palette' => 'green',
        ])
            ->assertOk()
            ->assertJsonPath('data.system_name', 'Factory Console')
            ->assertJsonPath('data.color_palette', 'green');

        $this->assertDatabaseHas('system_settings', [
            'id' => 1,
            'system_name' => 'Factory Console',
            'color_palette' => 'green',
            'updated_by' => $admin->id,
        ]);
    }

    public function test_user_without_settings_permission_cannot_update_settings(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/system-settings', [
            'system_name' => 'Unauthorized change',
            'system_tagline' => 'Should not save',
            'footer_content' => 'Should not save',
            'color_palette' => 'amber',
        ])->assertForbidden();
    }

    public function test_admin_can_remove_the_browser_favicon(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('system/favicon.png', 'favicon');

        $settings = SystemSetting::current();
        $settings->update(['favicon_path' => 'system/favicon.png']);

        $this->seed([RbacSeeder::class, AdminUserSeeder::class]);
        $admin = User::where('username', 'admin')->firstOrFail();
        Sanctum::actingAs($admin);

        $this->postJson('/api/v1/system-settings', [
            'system_name' => $settings->system_name,
            'system_tagline' => $settings->system_tagline,
            'footer_content' => $settings->footer_content,
            'color_palette' => $settings->color_palette,
            'remove_favicon' => true,
        ])
            ->assertOk()
            ->assertJsonPath('data.favicon_url', null);

        $this->assertDatabaseHas('system_settings', [
            'id' => $settings->id,
            'favicon_path' => null,
        ]);
        Storage::disk('public')->assertMissing('system/favicon.png');
    }
}
