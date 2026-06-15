<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\PrintRequestData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Products\PrintProductsRequest;
use App\Http\Resources\ProductPrintResource;
use App\Services\PrintService;

class PrintController extends Controller
{
    public function store(PrintProductsRequest $request, PrintService $service): ProductPrintResource
    {
        return new ProductPrintResource($service->queue(PrintRequestData::fromArray($request->validated()), $request));
    }
}
