<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->unsignedInteger('packing_quantity')->default(1)->after('products_per_box');
        });

        Schema::table('product_prints', function (Blueprint $table): void {
            $table->unsignedInteger('print_quantity')->nullable()->after('production_date');
        });
    }

    public function down(): void
    {
        Schema::table('product_prints', function (Blueprint $table): void {
            $table->dropColumn('print_quantity');
        });

        Schema::table('products', function (Blueprint $table): void {
            $table->dropColumn('packing_quantity');
        });
    }
};
