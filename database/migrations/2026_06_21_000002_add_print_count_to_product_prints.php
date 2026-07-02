<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_prints', function (Blueprint $table): void {
            $table->unsignedInteger('print_count')->default(0)->after('print_quantity');
        });

        DB::table('product_prints')
            ->whereIn('status', ['completed', 'completed_with_errors'])
            ->update(['print_count' => 1]);
    }

    public function down(): void
    {
        Schema::table('product_prints', function (Blueprint $table): void {
            $table->dropColumn('print_count');
        });
    }
};
