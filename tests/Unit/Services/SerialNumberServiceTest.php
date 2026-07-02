<?php

namespace Tests\Unit\Services;

use App\Models\Customer;
use App\Models\LabelTemplate;
use App\Services\SerialNumberService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SerialNumberServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_template_serial_variable_controls_format_and_starting_sequence(): void
    {
        $customer = Customer::create([
            'name' => 'Serial Customer',
            'code' => 'SERIAL-CUSTOMER',
            'status' => 'active',
            'serial_number_next_sequence' => 900,
        ]);
        $template = LabelTemplate::create([
            'name' => 'Assembly Serial Label',
            'status' => 'published',
            'paper_size' => 'A4',
            'orientation' => 'portrait',
            'settings' => [],
        ]);
        $template->elements()->create([
            'type' => 'variable',
            'name' => 'Serial Number',
            'z_index' => 0,
            'payload' => [
                'id' => 'serial-variable',
                'value' => '{{serial_number}}',
                'serialNumberFormat' => 'SN-{yy}-{seq:3}',
                'serialNumberStart' => 7,
                'serialNumberResetsYearly' => true,
            ],
        ]);

        $serials = app(SerialNumberService::class)->generateMany(
            $customer,
            '2026-06-19',
            2,
            false,
            0,
            $template->load('elements'),
        );

        $this->assertSame(['SN-26-007', 'SN-26-008'], $serials);

        $secondTemplate = LabelTemplate::create([
            'name' => 'Inspection Serial Label',
            'status' => 'published',
            'paper_size' => 'A4',
            'orientation' => 'portrait',
            'settings' => [],
        ]);
        $secondTemplate->elements()->create([
            'type' => 'variable',
            'name' => 'Serial Number',
            'z_index' => 0,
            'payload' => $template->elements->first()->payload,
        ]);

        $nextSerials = app(SerialNumberService::class)->generateMany(
            $customer,
            '2026-06-19',
            2,
            false,
            0,
            $secondTemplate->load('elements'),
            $serials,
        );

        $this->assertSame(['SN-26-009', 'SN-26-010'], $nextSerials);
    }
}
