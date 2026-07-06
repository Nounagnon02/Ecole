<?php

namespace App\Models\SaaS;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'price_monthly',
        'price_yearly',
        'max_students',
        'max_schools',
        'features',
        'modules',
        'is_popular',
        'is_active',
    ];

    protected $casts = [
        'price_monthly' => 'decimal:2',
        'price_yearly' => 'decimal:2',
        'max_students' => 'integer',
        'max_schools' => 'integer',
        'features' => 'array',
        'modules' => 'array',
        'is_popular' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function tenants()
    {
        return $this->hasMany(Tenant::class);
    }
}
