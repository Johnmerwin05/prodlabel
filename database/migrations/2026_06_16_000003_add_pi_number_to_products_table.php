<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('products', 'pi_number')) {
            return;
        }

        Schema::table('products', function (Blueprint $table): void {
            $table->string('pi_number')->nullable()->index()->after('part_number');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('products', 'pi_number')) {
            return;
        }

        Schema::table('products', function (Blueprint $table): void {
            $table->dropColumn('pi_number');
        });
    }
};
