<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('employee_code')->nullable()->unique()->after('id');
            $table->string('status')->default('active')->index()->after('password');
            $table->timestamp('locked_at')->nullable()->index()->after('status');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete()->after('remember_token');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete()->after('created_by');
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete()->after('updated_by');
            $table->softDeletes()->after('deleted_by');
        });

        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->string('module')->index();
            $table->timestamps();
        });

        Schema::create('permission_role', function (Blueprint $table): void {
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->primary(['role_id', 'permission_id']);
        });

        Schema::create('role_user', function (Blueprint $table): void {
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['role_id', 'user_id']);
        });

        Schema::create('customers', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->index();
            $table->string('code')->unique();
            $table->text('address')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('email')->nullable()->index();
            $table->string('status')->default('active')->index();
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('templates', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->index();
            $table->string('status')->default('draft')->index();
            $table->string('paper_size')->default('A4');
            $table->string('orientation')->default('portrait');
            $table->decimal('width_mm', 8, 2)->nullable();
            $table->decimal('height_mm', 8, 2)->nullable();
            $table->json('settings');
            $table->unsignedInteger('current_version')->default(1);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('archived_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('archived_at')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('template_versions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('template_id')->constrained('templates')->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->json('settings');
            $table->json('elements');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['template_id', 'version']);
        });

        Schema::create('template_elements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('template_id')->constrained('templates')->cascadeOnDelete();
            $table->string('type')->index();
            $table->string('name')->nullable();
            $table->json('payload');
            $table->unsignedInteger('z_index')->default(0);
            $table->timestamps();
            $table->index(['template_id', 'type']);
        });

        Schema::create('customer_templates', function (Blueprint $table): void {
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('template_id')->constrained('templates')->cascadeOnDelete();
            $table->boolean('is_default')->default(false)->index();
            $table->timestamps();
            $table->primary(['customer_id', 'template_id']);
        });

        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->string('product_id')->unique();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->string('sku')->index();
            $table->string('name')->index();
            $table->text('description')->nullable();
            $table->string('batch_number')->nullable()->index();
            $table->string('lot_number')->nullable()->index();
            $table->date('manufacturing_date')->nullable();
            $table->date('expiration_date')->nullable()->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['customer_id', 'created_at']);
            $table->index(['customer_id', 'sku']);
        });

        Schema::create('product_uploads', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('template_id')->nullable()->constrained('templates')->nullOnDelete();
            $table->string('original_filename');
            $table->string('stored_path');
            $table->string('checksum')->index();
            $table->string('status')->default('preview')->index();
            $table->unsignedInteger('total_rows')->default(0);
            $table->unsignedInteger('valid_rows')->default(0);
            $table->unsignedInteger('invalid_rows')->default(0);
            $table->json('errors')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('product_prints', function (Blueprint $table): void {
            $table->id();
            $table->uuid('job_uuid')->unique();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('template_id')->constrained('templates')->restrictOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('queued')->index();
            $table->unsignedInteger('total_products')->default(0);
            $table->unsignedInteger('completed_products')->default(0);
            $table->unsignedInteger('failed_products')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['customer_id', 'status', 'created_at']);
        });

        Schema::create('product_print_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_print_id')->constrained('product_prints')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->string('status')->default('queued')->index();
            $table->json('rendered_payload')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamps();
            $table->unique(['product_print_id', 'product_id']);
        });

        Schema::create('product_reprints', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('product_print_id')->nullable()->constrained('product_prints')->nullOnDelete();
            $table->text('reason');
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('reprint_count')->default(1);
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->index(['product_id', 'created_at']);
        });

        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->string('event')->index();
            $table->string('auditable_type')->index();
            $table->unsignedBigInteger('auditable_id')->index();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();
            $table->index(['auditable_type', 'auditable_id', 'created_at']);
        });

        Schema::create('activity_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('activity')->index();
            $table->string('module')->index();
            $table->json('properties')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->string('device')->nullable();
            $table->timestamps();
            $table->index(['module', 'created_at']);
        });

        Schema::create('notifications', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('product_reprints');
        Schema::dropIfExists('product_print_items');
        Schema::dropIfExists('product_prints');
        Schema::dropIfExists('product_uploads');
        Schema::dropIfExists('products');
        Schema::dropIfExists('customer_templates');
        Schema::dropIfExists('template_elements');
        Schema::dropIfExists('template_versions');
        Schema::dropIfExists('templates');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('role_user');
        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');

        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('created_by');
            $table->dropConstrainedForeignId('updated_by');
            $table->dropConstrainedForeignId('deleted_by');
            $table->dropColumn(['employee_code', 'status', 'locked_at', 'deleted_at']);
        });
    }
};
