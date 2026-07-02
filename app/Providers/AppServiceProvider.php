<?php

namespace App\Providers;

use App\Models\Customer;
use App\Models\LabelTemplate;
use App\Models\Permission;
use App\Models\Product;
use App\Models\ProductPrint;
use App\Models\Role;
use App\Models\User;
use App\Observers\BroadcastApplicationDataChanges;
use App\Repositories\Contracts\CustomerRepository;
use App\Repositories\Contracts\ProductRepository;
use App\Repositories\Eloquent\EloquentCustomerRepository;
use App\Repositories\Eloquent\EloquentProductRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(CustomerRepository::class, EloquentCustomerRepository::class);
        $this->app->bind(ProductRepository::class, EloquentProductRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        foreach ([Customer::class, Product::class, LabelTemplate::class, ProductPrint::class, User::class, Role::class, Permission::class] as $model) {
            $model::observe(BroadcastApplicationDataChanges::class);
        }
    }
}
