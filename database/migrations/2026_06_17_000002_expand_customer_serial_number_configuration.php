<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table): void {
            $table->string('serial_number_format')->nullable()->after('serial_number_prefix');
            $table->unsignedBigInteger('serial_number_next_sequence')->default(1)->after('serial_number_format');
        });

        Schema::table('product_print_items', function (Blueprint $table): void {
            $table->string('serial_number', 255)->nullable()->change();
            $table->json('serial_numbers')->nullable()->after('serial_number');
        });
    }

    public function down(): void
    {
        Schema::table('product_print_items', function (Blueprint $table): void {
            $table->dropColumn('serial_numbers');
            $table->string('serial_number', 10)->nullable()->change();
        });

        Schema::table('customers', function (Blueprint $table): void {
            $table->dropColumn(['serial_number_format', 'serial_number_next_sequence']);
        });
    }
};
