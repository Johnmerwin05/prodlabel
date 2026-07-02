<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\PrintController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\SystemSettingController;
use App\Http\Controllers\Api\V1\TemplateController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')
    ->middleware(['api', 'throttle:60,1'])
    ->group(function (): void {
        Route::get('system-settings', [SystemSettingController::class, 'show']);
        Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('auth/me', [AuthController::class, 'me']);
            Route::post('auth/logout', [AuthController::class, 'logout']);
            Route::get('profile', [ProfileController::class, 'show']);
            Route::put('profile', [ProfileController::class, 'update']);
            Route::get('dashboard', DashboardController::class);
            Route::get('notifications', [NotificationController::class, 'index']);
            Route::post('notifications/read-all', [NotificationController::class, 'readAll']);
            Route::post('notifications/read-type', [NotificationController::class, 'readType']);
            Route::post('notifications/{notification}/read', [NotificationController::class, 'read']);
            Route::get('audit-logs', [AuditLogController::class, 'index']);
            Route::get('customers/options', [CustomerController::class, 'options']);
            Route::apiResource('customers', CustomerController::class);
            Route::post('customers/{customer}/restore', [CustomerController::class, 'restore']);
            Route::get('users/roles/options', [UserController::class, 'roles']);
            Route::get('users/permissions/options', [UserController::class, 'permissions']);
            Route::get('roles/permissions', [RoleController::class, 'permissions']);
            Route::apiResource('roles', RoleController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::apiResource('users', UserController::class);
            Route::post('users/{user}/restore', [UserController::class, 'restore']);
            Route::post('users/{user}/lock', [UserController::class, 'lock']);
            Route::post('users/{user}/unlock', [UserController::class, 'unlock']);
            Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword']);
            Route::apiResource('products', ProductController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
            Route::post('templates/{template}/duplicate', [TemplateController::class, 'duplicate']);
            Route::post('templates/{template}/restore', [TemplateController::class, 'restore']);
            Route::post('templates/images', [TemplateController::class, 'uploadImage']);
            Route::apiResource('templates', TemplateController::class);
            Route::get('prints', [PrintController::class, 'index']);
            Route::get('prints/customers/options', [PrintController::class, 'customers']);
            Route::get('prints/customers/{customer}/template', [PrintController::class, 'customerTemplate']);
            Route::post('prints/dispatch', [PrintController::class, 'dispatch']);
            Route::post('prints/preview', [PrintController::class, 'preview']);
            Route::post('prints/finalize', [PrintController::class, 'finalize']);
            Route::post('prints/{print}/reprint-preview', [PrintController::class, 'reprintPreview']);
            Route::post('prints/{print}/reprint-complete', [PrintController::class, 'completeReprint']);
            Route::put('prints/{print}', [PrintController::class, 'update']);
            Route::delete('prints/{print}', [PrintController::class, 'destroy']);
            Route::post('prints', [PrintController::class, 'store']);
            Route::get('reports/printing', [ReportController::class, 'printing']);
            Route::post('system-settings', [SystemSettingController::class, 'update']);
        });
    });
