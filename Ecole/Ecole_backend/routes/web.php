<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

/*Route::get('/', function () {
    return view('register');
});*/


Route::get('/test-cinetpay', function () {
    $res = app(\App\Services\CinetPayService::class)->initiate([
        'amount' => 1000,
        'description' => 'Test 1000 XOF',
        'customer_name'  => 'Test User',
        'customer_email' => 'test@example.com',
        'customer_phone' => '2250707070707',
    ]);
    return $res['payment_url'] ?? 'Erreur';
});