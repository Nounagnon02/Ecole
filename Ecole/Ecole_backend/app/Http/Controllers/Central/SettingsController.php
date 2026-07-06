<?php

namespace App\Http\Controllers\Central;

use App\Models\SaaS\Tenant;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;

/**
 * SettingsController — White-label et configuration du tenant.
 *
 * Permet à chaque établissement de personnaliser :
 * - Logo, favicon
 * - Couleurs primaires/secondaires
 * - Nom de l'établissement, devise
 * - Configuration email/SMS
 * - Modules activés
 */
class SettingsController extends Controller
{
    /**
     * Get all settings for a tenant.
     */
    public function index(Tenant $tenant)
    {
        $settings = collect([
            'school_name' => $tenant->name,
            'school_type' => $tenant->school_type,
            'phone' => $tenant->getSetting('phone'),
            'email' => $tenant->getSetting('email'),
            'address' => $tenant->getSetting('address'),
            'city' => $tenant->getSetting('city'),
            'country' => $tenant->getSetting('country'),
            'website' => $tenant->getSetting('website'),

            // White-label
            'primary_color' => $tenant->getSetting('primary_color', '#4F46E5'),
            'secondary_color' => $tenant->getSetting('secondary_color', '#7C3AED'),
            'logo_url' => $tenant->getSetting('logo_url'),
            'favicon_url' => $tenant->getSetting('favicon_url'),
            'brand_name' => $tenant->getSetting('brand_name', $tenant->name),

            // Academic
            'academic_year' => $tenant->getSetting('academic_year'),
            'currency' => $tenant->getSetting('currency', 'XOF'),
            'timezone' => $tenant->getSetting('timezone', 'Africa/Porto-Novo'),
            'locale' => $tenant->getSetting('locale', 'fr'),

            // Features
            'notifications_enabled' => $tenant->getSetting('notifications_enabled', 'true') === 'true',
            'sms_enabled' => $tenant->getSetting('sms_enabled', 'false') === 'true',
            'maintenance_mode' => $tenant->getSetting('maintenance_mode', 'false') === 'true',
        ]);

        return response()->json($settings);
    }

    /**
     * Update settings for a tenant.
     */
    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'primary_color' => 'nullable|string|max:7',
            'secondary_color' => 'nullable|string|max:7',
            'brand_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'website' => 'nullable|url|max:255',
            'academic_year' => 'nullable|string|max:20',
            'currency' => 'nullable|string|max:3',
            'timezone' => 'nullable|string|max:50',
            'locale' => 'nullable|string|in:fr,en,ar',
            'notifications_enabled' => 'nullable|boolean',
            'sms_enabled' => 'nullable|boolean',
            'maintenance_mode' => 'nullable|boolean',
        ]);

        foreach ($validated as $key => $value) {
            // Convert booleans to string for storage
            if (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            }
            $tenant->setSetting($key, $value);
        }

        return response()->json([
            'message' => 'Paramètres mis à jour avec succès.',
            'settings' => $this->index($tenant),
        ]);
    }

    /**
     * Upload logo for a tenant.
     */
    public function uploadLogo(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'logo' => 'required|image|mimes:png,jpg,svg|max:2048',
        ]);

        $path = $request->file('logo')->storePublicly(
            "tenants/{$tenant->id}/branding",
            'public'
        );

        $url = Storage::url($path);
        $tenant->setSetting('logo_url', $url);

        return response()->json([
            'message' => 'Logo téléchargé avec succès.',
            'logo_url' => $url,
        ]);
    }

    /**
     * Upload favicon for a tenant.
     */
    public function uploadFavicon(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'favicon' => 'required|image|mimes:png,ico,svg|max:1024',
        ]);

        $path = $request->file('favicon')->storePublicly(
            "tenants/{$tenant->id}/branding",
            'public'
        );

        $url = Storage::url($path);
        $tenant->setSetting('favicon_url', $url);

        return response()->json([
            'message' => 'Favicon téléchargé avec succès.',
            'favicon_url' => $url,
        ]);
    }
}
