<?php

namespace App\Models\SaaS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasFactory, HasDatabase, HasDomains;

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
     * Columns that live in the table rather than in the `data` JSON blob.
     *
     * stancl/tenancy virtualises every attribute that is not listed here: it
     * writes it into `data` and leaves the real column NULL. The default
     * implementation returns only `id`, so `name`, `slug`, `domain`,
     * `plan_id`, `status` and `school_type` were all being stored as JSON even
     * though the migration creates real columns for them.
     *
     * The consequence was silent and serious: `Tenant::where('slug', ...)`
     * queried the empty real column and never matched, so the onboarding
     * slug and domain availability checks always reported "available" and
     * would happily create duplicates. Any filter on `status` or grouping on
     * `school_type` was equally blind.
     */
    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'slug',
            'domain',
            'plan_id',
            'status',
            'school_type',
        ];
    }

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
