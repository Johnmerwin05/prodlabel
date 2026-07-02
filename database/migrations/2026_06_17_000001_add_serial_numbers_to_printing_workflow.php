<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table): void {
            $table->string('serial_number_prefix', 2)->nullable()->after('remarks');
        });

        Schema::table('product_prints', function (Blueprint $table): void {
            $table->date('production_date')->nullable()->after('template_id');
        });

        Schema::table('product_print_items', function (Blueprint $table): void {
            $table->string('serial_number', 10)->nullable()->unique()->after('product_id');
        });
    }

    public function down(): void
    {
        Schema::table('product_print_items', function (Blueprint $table): void {
            $table->dropUnique(['serial_number']);
            $table->dropColumn('serial_number');
        });

        Schema::table('product_prints', function (Blueprint $table): void {
            $table->dropColumn('production_date');
        });

        Schema::table('customers', function (Blueprint $table): void {
            $table->dropColumn('serial_number_prefix');
        });
    }
};
