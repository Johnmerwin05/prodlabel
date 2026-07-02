<?php

namespace Tests\Unit\Services;

use App\Models\Customer;
use App\Models\LabelTemplate;
use App\Models\Product;
use App\Models\TemplateElement;
use App\Services\TemplateRenderingService;
use Illuminate\Database\Eloquent\Collection;
use PHPUnit\Framework\TestCase;

class TemplateRenderingServiceTest extends TestCase
{
    public function test_it_replaces_product_variables_inside_nested_payloads(): void
    {
        $customer = new Customer(['name' => 'Customer A', 'code' => 'CUST-A']);
        $product = new Product([
            'product_id' => '1001',
            'sku' => 'MILK-1L',
            'name' => 'Milk',
            'unit_of_measure' => 'Box',
            'products_per_box' => 12,
            'batch_number' => 'B-01',
            'lot_number' => 'L-99',
        ]);
        $product->setRelation('customer', $customer);

        $template = new LabelTemplate(['settings' => ['columns' => 3], 'current_version' => 1]);
        $template->id = 10;
        $element = new TemplateElement([
            'type' => 'barcode',
            'name' => 'Primary barcode',
            'z_index' => 1,
            'payload' => ['value' => 'CUSTOM-{{product_id}}-{{product_name}}-{{unit_of_measure}}-{{products_per_box}}-{{production_date}}-{{serial_number}}-END'],
        ]);
        $element->id = 20;
        $template->setRelation('elements', new Collection([$element]));

        $rendered = (new TemplateRenderingService())->render($template, $product, [
            'production_date' => '2026-06-17',
            'serial_number' => '26ABC12345',
        ]);

        $this->assertSame('CUSTOM-1001-Milk-Box-12-2026-06-17-26ABC12345-END', $rendered['elements'][0]['payload']['value']);
    }

    public function test_it_only_renders_elements_whose_visibility_condition_matches(): void
    {
        $product = new Product(['name' => 'Circle', 'product_id' => 'REF-1']);
        $product->setRelation('customer', null);
        $template = new LabelTemplate(['settings' => [], 'current_version' => 1]);
        $template->id = 10;

        $circle = new TemplateElement([
            'type' => 'circle',
            'name' => 'Circle',
            'z_index' => 0,
            'payload' => [
                'label' => 'Circle',
                'visibilityCondition' => [
                    'variable' => 'product_name',
                    'operator' => 'equals',
                    'value' => 'Circle',
                ],
            ],
        ]);
        $circle->id = 20;
        $rectangle = new TemplateElement([
            'type' => 'rectangle',
            'name' => 'Rectangle',
            'z_index' => 1,
            'payload' => [
                'label' => 'Rectangle',
                'visibilityCondition' => [
                    'variable' => 'product_name',
                    'operator' => 'equals',
                    'value' => 'Rectangle',
                ],
            ],
        ]);
        $rectangle->id = 21;
        $template->setRelation('elements', new Collection([$circle, $rectangle]));

        $rendered = (new TemplateRenderingService())->render($template, $product);

        $this->assertCount(1, $rendered['elements']);
        $this->assertSame('Circle', $rendered['elements'][0]['payload']['label']);
        $this->assertArrayNotHasKey('visibilityCondition', $rendered['elements'][0]['payload']);
    }

    public function test_it_supports_not_empty_visibility_conditions(): void
    {
        $product = new Product(['name' => 'Widget', 'product_id' => 'REF-1']);
        $product->setRelation('customer', null);
        $template = new LabelTemplate(['settings' => [], 'current_version' => 1]);
        $template->id = 10;
        $element = new TemplateElement([
            'type' => 'rectangle',
            'z_index' => 0,
            'payload' => [
                'visibilityCondition' => [
                    'variable' => 'reference_number',
                    'operator' => 'is_not_empty',
                ],
            ],
        ]);
        $element->id = 20;
        $template->setRelation('elements', new Collection([$element]));

        $rendered = (new TemplateRenderingService())->render($template, $product);

        $this->assertCount(1, $rendered['elements']);
    }
}
