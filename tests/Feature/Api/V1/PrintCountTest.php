<?php

namespace Tests\Feature\Api\V1;

use App\Models\Customer;
use App\Models\LabelTemplate;
use App\Models\Product;
use App\Models\ProductPrint;
use App\Models\TemplateElement;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PrintCountTest extends TestCase
{
    use RefreshDatabase;

    public function test_preview_splits_non_repeat_label_quantity_by_packing_quantity(): void
    {
        $this->seed([RbacSeeder::class, AdminUserSeeder::class]);
        $admin = User::where('username', 'admin')->firstOrFail();
        Sanctum::actingAs($admin);

        $customer = Customer::create([
            'name' => 'Test Customer',
            'code' => 'TEST',
            'status' => 'active',
        ]);
        $template = LabelTemplate::create([
            'name' => 'Packing Template',
            'status' => 'published',
            'paper_size' => 'A4',
            'orientation' => 'portrait',
            'settings' => [
                'repeatGrid' => ['enabled' => false],
                'printMode' => 'per_packing_quantity',
            ],
        ]);
        TemplateElement::create([
            'template_id' => $template->id,
            'type' => 'text',
            'name' => 'Label Quantity',
            'z_index' => 0,
            'payload' => [
                'id' => 'label-quantity',
                'text' => '{{label_quantity}}',
            ],
        ]);
        $product = Product::create([
            'product_id' => 'PRD-001',
            'customer_id' => $customer->id,
            'area' => 'Assembly',
            'part_number' => 'PN-001',
            'pi_number' => 'PI-001',
            'sku' => 'SKU-001',
            'name' => 'Packed Product',
            'unit_of_measure' => 'Piece',
            'packing_quantity' => 150,
        ]);
        $print = ProductPrint::create([
            'job_uuid' => (string) Str::uuid(),
            'customer_id' => $customer->id,
            'template_id' => $template->id,
            'production_date' => '2026-06-24',
            'print_quantity' => 200,
            'status' => 'queued',
            'total_products' => 1,
        ]);
        $print->items()->create([
            'product_id' => $product->id,
            'status' => 'queued',
        ]);

        $this->postJson('/api/v1/prints/preview', [
            'print_ids' => [$print->id],
        ])
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.label_quantities.0', 150)
            ->assertJsonPath('data.1.label_quantities.0', 50)
            ->assertJsonPath('data.0.elements.0.payload.text', '150')
            ->assertJsonPath('data.1.elements.0.payload.text', '50');
    }

    public function test_completing_a_reprint_increments_the_request_print_count(): void
    {
        $this->seed([RbacSeeder::class, AdminUserSeeder::class]);
        $admin = User::where('username', 'admin')->firstOrFail();
        Sanctum::actingAs($admin);

        $customer = Customer::create([
            'name' => 'Test Customer',
            'code' => 'TEST',
            'status' => 'active',
        ]);
        $template = LabelTemplate::create([
            'name' => 'Test Template',
            'status' => 'published',
            'paper_size' => 'A4',
            'orientation' => 'portrait',
            'settings' => [],
        ]);
        $print = ProductPrint::create([
            'job_uuid' => (string) Str::uuid(),
            'customer_id' => $customer->id,
            'template_id' => $template->id,
            'status' => 'completed',
            'print_count' => 1,
        ]);

        $this->postJson("/api/v1/prints/{$print->id}/reprint-complete")
            ->assertOk()
            ->assertJsonPath('data.print_count', 2);

        $this->assertDatabaseHas('product_prints', [
            'id' => $print->id,
            'print_count' => 2,
        ]);
    }
}
