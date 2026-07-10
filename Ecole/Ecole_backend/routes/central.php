<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Central (Super-Admin) Routes
|--------------------------------------------------------------------------
|
| These routes handle the SaaS platform management layer:
| - Tenant CRUD
| - Plan management
| - Subscription management
| - Module management
| - Billing & payments
| - Global analytics
|
| All routes are prefixed with /api/v1/admin/ and require super-admin role.
|
*/

Route::prefix('api/v1/admin')->middleware(['auth:sanctum', 'role:super-admin'])->group(function () {

    // ─── Tenant management ────────────────────────────────────────────────
    Route::apiResource('tenants', 'App\Http\Controllers\Central\TenantController');
    Route::post('tenants/{tenant}/suspend', 'App\Http\Controllers\Central\TenantController@suspend');
    Route::post('tenants/{tenant}/activate', 'App\Http\Controllers\Central\TenantController@activate');

    // ─── Plan management ──────────────────────────────────────────────────
    Route::apiResource('plans', 'App\Http\Controllers\Central\PlanController');
    Route::get('plans/all/list', 'App\Http\Controllers\Central\PlanController@all');

    // ─── Subscription management ──────────────────────────────────────────
    Route::apiResource('subscriptions', 'App\Http\Controllers\Central\SubscriptionController');

    // ─── Module management ────────────────────────────────────────────────
    Route::apiResource('modules', 'App\Http\Controllers\Central\ModuleController');
    Route::post('modules/{module}/toggle', 'App\Http\Controllers\Central\ModuleController@toggleForTenant');

    // ─── Billing ──────────────────────────────────────────────────────────
    Route::post('billing/subscribe', 'App\Http\Controllers\Central\BillingController@subscribe');
    Route::get('billing/invoices', 'App\Http\Controllers\Central\BillingController@invoices');
    Route::get('billing/invoices/{invoice}', 'App\Http\Controllers\Central\BillingController@showInvoice');
    Route::post('billing/verify/{invoice}', 'App\Http\Controllers\Central\BillingController@verify');
    Route::post('billing/cancel', 'App\Http\Controllers\Central\BillingController@cancel');

    // ─── White-label Settings ─────────────────────────────────────────────
    Route::get('tenants/{tenant}/settings', 'App\Http\Controllers\Central\SettingsController@index');
    Route::patch('tenants/{tenant}/settings', 'App\Http\Controllers\Central\SettingsController@update');
    Route::post('tenants/{tenant}/settings/logo', 'App\Http\Controllers\Central\SettingsController@uploadLogo');
    Route::post('tenants/{tenant}/settings/favicon', 'App\Http\Controllers\Central\SettingsController@uploadFavicon');

    // ─── Global analytics ─────────────────────────────────────────────────
    Route::get('analytics/overview', 'App\Http\Controllers\Central\AnalyticsController@overview');
    Route::get('analytics/revenue', 'App\Http\Controllers\Central\AnalyticsController@revenue');
    Route::get('analytics/schools', 'App\Http\Controllers\Central\AnalyticsController@schools');
    Route::get('analytics/audit-logs', 'App\Http\Controllers\Central\AnalyticsController@auditLogs');
});

/*
|--------------------------------------------------------------------------
| Public Onboarding Routes (no auth — registration flow)
|--------------------------------------------------------------------------
|
*/
Route::prefix('api/v1/onboarding')->middleware('throttle:10,1')->group(function () {
    Route::get('init', 'App\Http\Controllers\Central\OnboardingController@init');
    Route::post('step/school', 'App\Http\Controllers\Central\OnboardingController@stepSchool');
    Route::post('step/plan', 'App\Http\Controllers\Central\OnboardingController@stepPlan');
    Route::post('step/admin', 'App\Http\Controllers\Central\OnboardingController@stepAdmin');
    Route::post('step/modules', 'App\Http\Controllers\Central\OnboardingController@stepModules');
    Route::get('status/{tenant}', 'App\Http\Controllers\Central\OnboardingController@status');
    Route::get('check-slug', 'App\Http\Controllers\Central\OnboardingController@checkSlug');
    Route::get('check-domain', 'App\Http\Controllers\Central\OnboardingController@checkDomain');
});

/*
|--------------------------------------------------------------------------
| Webhook Routes (no auth — signature-based)
|--------------------------------------------------------------------------
|
*/
Route::prefix('api/v1/billing/webhook')->middleware('throttle:webhooks')->group(function () {
    Route::post('cinetpay', 'App\Http\Controllers\Central\WebhookController@cinetpay');
    Route::post('fedapay', 'App\Http\Controllers\Central\WebhookController@fedapay');
    Route::post('stripe', 'App\Http\Controllers\Central\WebhookController@stripe');
});
