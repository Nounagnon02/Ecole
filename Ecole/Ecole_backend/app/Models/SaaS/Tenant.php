<?php

namespace App\Models\SaaS;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    protected $fillable = [
        'id',
        'data',
        'name',
        'slug',
        'domain',
        'plan_id',
        'status', // active, trial, suspended, expired
        'school_type', // maternelle, primaire, secondaire, universite, complexe
    ];

    protected $casts = [
        'data' => 'array',
    ];

    /**
     * Get the plan this tenant is subscribed to.
     */
    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Get the subscription record.
     */
    public function subscription()
    {
        return $this->hasOne(Subscription::class, 'tenant_id', 'id');
    }

    /**
     * Get the tenant settings.
     */
    public function settings()
    {
        return $this->hasMany(TenantSetting::class, 'tenant_id', 'id');
    }

    /**
     * Get the enabled modules for this tenant.
     */
    public function modules()
    {
        return $this->belongsToMany(Module::class, 'tenant_modules', 'tenant_id', 'module_id');
    }

    /**
     * Check if a module is enabled.
     */
    public function hasModule(string $slug): bool
    {
        return $this->modules()->where('slug', $slug)->exists();
    }

    /**
     * Get a setting value by key.
     */
    public function getSetting(string $key, $default = null): mixed
    {
        $setting = $this->settings()->where('key', $key)->first();

        return $setting ? $setting->value : $default;
    }

    /**
     * Set a setting value.
     */
    public function setSetting(string $key, $value): void
    {
        $this->settings()->updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }
}
