<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\CinetPayService;

class CinetPayServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(CinetPayService::class, fn () => new CinetPayService());
    }

    public function boot()
    {
        //
    }
}