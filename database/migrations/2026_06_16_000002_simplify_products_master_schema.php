<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->unsignedInteger('products_per_box')->nullable()->after('unit_of_measure');
        });

        if (Schema::hasColumn('products', 'status')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->dropIndex('products_customer_id_status_created_at_index');
                $table->dropColumn(['status', 'print_count', 'last_printed_at']);
                $table->index(['customer_id', 'created_at']);
            });
        }

        if (Schema::hasColumn('products', 'quantity')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->dropColumn('quantity');
            });
        }

        DB::table('products')
            ->whereIn('unit_of_measure', ['pcs', 'pc', 'piece', 'pieces'])
            ->update(['unit_of_measure' => 'Piece']);

        DB::table('products')
            ->whereIn('unit_of_measure', ['box', 'boxes'])
            ->update(['unit_of_measure' => 'Box']);
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->dropColumn('products_per_box');
        });

        if (! Schema::hasColumn('products', 'status')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->dropIndex('products_customer_id_created_at_index');
                $table->string('status')->default('draft')->index()->after('expiration_date');
                $table->unsignedInteger('print_count')->default(0)->after('status');
                $table->timestamp('last_printed_at')->nullable()->index()->after('print_count');
                $table->index(['customer_id', 'status', 'created_at']);
            });
        }

        if (! Schema::hasColumn('products', 'quantity')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->unsignedInteger('quantity')->default(1)->after('description');
            });
        }
    }
};
