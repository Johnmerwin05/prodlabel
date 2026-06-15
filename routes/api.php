<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\PrintController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\TemplateController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')
    ->middleware(['api', 'throttle:60,1'])
    ->group(function (): void {
        Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('auth/me', [AuthController::class, 'me']);
            Route::post('auth/logout', [AuthController::class, 'logout']);
            Route::get('dashboard', DashboardController::class);
            Route::apiResource('customers', CustomerController::class);
            Route::post('customers/{customer}/restore', [CustomerController::class, 'restore']);
            Route::get('users/roles/options', [UserController::class, 'roles']);
            Route::apiResource('users', UserController::class);
            Route::post('users/{user}/restore', [UserController::class, 'restore']);
            Route::post('users/{user}/lock', [UserController::class, 'lock']);
            Route::post('users/{user}/unlock', [UserController::class, 'unlock']);
            Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword']);
            Route::apiResource('products', ProductController::class)->only(['index', 'store', 'show']);
            Route::post('templates/{template}/duplicate', [TemplateController::class, 'duplicate']);
            Route::post('templates/{template}/restore', [TemplateController::class, 'restore']);
            Route::apiResource('templates', TemplateController::class);
            Route::post('prints', [PrintController::class, 'store']);
        });
    });
