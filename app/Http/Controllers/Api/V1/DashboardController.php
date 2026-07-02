<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\LabelTemplate;
use App\Models\Product;
use App\Models\ProductPrintItem;
use App\Models\ProductReprint;

class DashboardController extends Controller
{
    public function __invoke(): array
    {
        return [
            'total_customers' => Customer::count(),
            'total_products' => Product::count(),
            'total_templates' => LabelTemplate::count(),
            'products_printed_today' => ProductPrintItem::where('status', 'completed')
                ->whereDate('updated_at', today())
                ->count(),
            'products_reprinted_today' => ProductReprint::whereDate('created_at', today())->count(),
        ];
    }
}
