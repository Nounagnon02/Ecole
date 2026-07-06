<?php

namespace App\Models\SaaS;

use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'description',
        'is_core',
        'is_active',
        'required_roles',
    ];

    protected $casts = [
        'is_core' => 'boolean',
        'is_active' => 'boolean',
        'required_roles' => 'array',
    ];

    public function tenants()
    {
        return $this->belongsToMany(Tenant::class, 'tenant_modules', 'module_id', 'tenant_id');
    }
}
