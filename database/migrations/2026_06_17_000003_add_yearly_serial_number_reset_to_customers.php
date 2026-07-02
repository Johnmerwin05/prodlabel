<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table): void {
            $table->boolean('serial_number_resets_yearly')->default(false)->after('serial_number_next_sequence');
            $table->unsignedSmallInteger('serial_number_sequence_year')->nullable()->after('serial_number_resets_yearly');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table): void {
            $table->dropColumn(['serial_number_resets_yearly', 'serial_number_sequence_year']);
        });
    }
};
