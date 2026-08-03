<?php

namespace Database\Factories\SaaS;

use App\Models\SaaS\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class TenantSettingFactory extends Factory
{
    protected $model = \App\Models\SaaS\TenantSetting::class;

    public function definition()
    {
        return [
            'tenant_id' => Tenant::factory(),
            'key'       => fake()->randomElement([
                'primary_color', 'secondary_color', 'brand_name',
                'currency', 'timezone', 'locale',
            ]) . '_' . fake()->unique()->numerify('###'),
            'value'     => fake()->word(),
        ];
    }
}
