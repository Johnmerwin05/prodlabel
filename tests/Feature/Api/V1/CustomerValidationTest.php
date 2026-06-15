<?php

namespace Tests\Feature\Api\V1;

use App\Http\Requests\Customers\StoreCustomerRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class CustomerValidationTest extends TestCase
{
    public function test_customer_request_requires_name_code_and_status(): void
    {
        $request = new StoreCustomerRequest();
        $validator = Validator::make([], $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('name', $validator->errors()->messages());
        $this->assertArrayHasKey('code', $validator->errors()->messages());
        $this->assertArrayHasKey('status', $validator->errors()->messages());
    }
}
