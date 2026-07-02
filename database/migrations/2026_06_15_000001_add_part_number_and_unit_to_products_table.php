<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->string('part_number')->nullable()->index()->after('customer_id');
            $table->string('pi_number')->nullable()->index()->after('part_number');
            $table->string('unit_of_measure', 40)->default('Piece')->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->dropColumn(['part_number', 'pi_number', 'unit_of_measure']);
        });
    }
};
