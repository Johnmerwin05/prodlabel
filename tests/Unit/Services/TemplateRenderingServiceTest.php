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
            'quantity' => 50,
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
            'payload' => ['value' => 'CUSTOM-{{product_id}}-{{product_name}}-{{quantity}}-END'],
        ]);
        $element->id = 20;
        $template->setRelation('elements', new Collection([$element]));

        $rendered = (new TemplateRenderingService())->render($template, $product);

        $this->assertSame('CUSTOM-1001-Milk-50-END', $rendered['elements'][0]['payload']['value']);
    }
}
