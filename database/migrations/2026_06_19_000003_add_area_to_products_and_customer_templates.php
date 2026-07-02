<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->string('area')->nullable()->index()->after('customer_id');
        });

        Schema::table('customer_templates', function (Blueprint $table): void {
            $table->string('area')->nullable()->index()->after('template_id');
        });
    }

    public function down(): void
    {
        Schema::table('customer_templates', function (Blueprint $table): void {
            $table->dropColumn('area');
        });

        Schema::table('products', function (Blueprint $table): void {
            $table->dropColumn('area');
        });
    }
};
