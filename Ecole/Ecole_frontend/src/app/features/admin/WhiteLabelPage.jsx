/**
 * WhiteLabelPage — Personnalisation de la marque (Super Admin)
 *
 * Configuration du branding par tenant : logo, couleurs, nom.
 * Données dynamiques via API /api/v1/admin/ecoles (tenants) et /api/v1/admin/white-label/:id
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Palette, Image, Globe, Monitor, Save,
  Type, Eye, Smartphone, Loader2, AlertCircle,
} from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import { useApi } from '@/hooks/useApi';

const PRESET_COLORS = [
  { name: 'Indigo', primary: '#4F46E5', secondary: '#7C3AED' },
  { name: 'Emerald', primary: '#059669', secondary: '#0D9488' },
  { name: 'Rose', primary: '#E11D48', secondary: '#BE185D' },
  { name: 'Amber', primary: '#D97706', secondary: '#B45309' },
  { name: 'Sky', primary: '#0284C7', secondary: '#0369A1' },
  { name: 'Violet', primary: '#7C3AED', secondary: '#6D28D9' },
];

export default function WhiteLabelPage() {
  const { loading, error, get, put } = useApi();
  const [ecoles, setEcoles] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [secondaryColor, setSecondaryColor] = useState('#7C3AED');
  const [brandName, setBrandName] = useState('Mon École');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load ecoles (tenants)
  useEffect(() => {
    (async () => {
      try {
        const res = await get('/api/v1/admin/ecoles');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setEcoles(items.map((e) => ({
          id: e.id,
          nom: e.nom || e.name || `École ${e.id}`,
        })));
        if (items.length > 0 && !selectedTenant) {
          setSelectedTenant(String(items[0].id));
        }
      } catch (e) {
        console.error('Erreur chargement établissements:', e);
      }
    })();
  }, [get]);

  // Load white-label config for selected tenant
  const loadConfig = useCallback(async () => {
    if (!selectedTenant) return;
    try {
      const res = await get(`/api/v1/admin/white-label/${selectedTenant}`);
      const cfg = res?.data?.data || res?.data || res || {};
      setBrandName(cfg.nom_brand || cfg.brand_name || cfg.nom || '');
      setPrimaryColor(cfg.couleur_primaire || cfg.primary_color || '#4F46E5');
      setSecondaryColor(cfg.couleur_secondaire || cfg.secondary_color || '#7C3AED');
      setLogoUrl(cfg.logo_url || cfg.logo || '');
      setFaviconUrl(cfg.favicon_url || cfg.favicon || '');
    } catch (e) {
      console.error('Erreur chargement config white-label:', e);
    }
  }, [get, selectedTenant]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (!selectedTenant) return;
    setSaving(true);
    setSaved(false);
    try {
      await put(`/api/v1/admin/white-label/${selectedTenant}`, {
        nom_brand: brandName,
        couleur_primaire: primaryColor,
        couleur_secondaire: secondaryColor,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Erreur sauvegarde white-label:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
        <AlertCircle className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">White-Label</h1>
          <p className="text-sm text-neutral-500 mt-1">Personnalisation de la marque par établissement</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !selectedTenant}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? 'Enregistrement...' : saved ? 'Enregistré !' : 'Enregistrer'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tenant selector */}
          <Card>
            <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Établissement</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Sélectionnez l'établissement à personnaliser</p>
            </div>
            <div className="p-4">
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              >
                {ecoles.map((e) => (
                  <option key={e.id} value={String(e.id)}>{e.nom}</option>
                ))}
              </select>
            </div>
          </Card>

          {/* Brand name */}
          <Card>
            <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                <Type className="h-5 w-5 text-neutral-500" />
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Nom de la marque</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Affiché dans l'en-tête et les communications</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Nom de l'établissement"
              />
            </div>
          </Card>

          {/* Colors */}
          <Card>
            <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-neutral-500" />
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Couleurs</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Personnalisez les couleurs principales</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-3 mb-6">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setPrimaryColor(preset.primary);
                      setSecondaryColor(preset.secondary);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400"
                  >
                    <div className="flex -space-x-1">
                      <div className="h-4 w-4 rounded-full border-2 border-white dark:border-neutral-900" style={{ background: preset.primary }} />
                      <div className="h-4 w-4 rounded-full border-2 border-white dark:border-neutral-900" style={{ background: preset.secondary }} />
                    </div>
                    {preset.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">Couleur primaire</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-10 rounded-lg border border-neutral-200 cursor-pointer"
                    />
                    <span className="text-sm font-mono text-neutral-500">{primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">Couleur secondaire</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-10 w-10 rounded-lg border border-neutral-200 cursor-pointer"
                    />
                    <span className="text-sm font-mono text-neutral-500">{secondaryColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Logo upload */}
          <Card>
            <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-neutral-500" />
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Logo & Favicon</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Téléchargez le logo et l'icône de l'établissement</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-2">Logo (PNG, SVG, max 2 Mo)</label>
                  <div className="flex items-center justify-center h-32 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="max-h-24 max-w-full rounded" />
                    ) : (
                      <div className="text-center">
                        <Image className="h-8 w-8 text-neutral-300 mx-auto mb-1" />
                        <p className="text-xs text-neutral-400">Cliquez pour uploader</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/png,image/svg+xml" className="hidden" id="logo-upload" onChange={(e) => { const f = e.target.files[0]; if (f) setLogoUrl(URL.createObjectURL(f)); }} />
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => document.getElementById('logo-upload').click()}>
                    Choisir un fichier
                  </Button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-2">Favicon (PNG, ICO, max 1 Mo)</label>
                  <div className="flex items-center justify-center h-32 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
                    {faviconUrl ? (
                      <img src={faviconUrl} alt="Favicon" className="h-16 w-16 rounded" />
                    ) : (
                      <div className="text-center">
                        <Globe className="h-8 w-8 text-neutral-300 mx-auto mb-1" />
                        <p className="text-xs text-neutral-400">Cliquez pour uploader</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/png,image/x-icon" className="hidden" id="favicon-upload" onChange={(e) => { const f = e.target.files[0]; if (f) setFaviconUrl(URL.createObjectURL(f)); }} />
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => document.getElementById('favicon-upload').click()}>
                    Choisir un fichier
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column — preview */}
        <div className="space-y-6">
          <Card>
            <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-neutral-500" />
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Aperçu</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Rendu en direct</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              {/* Mock preview */}
              <div className="rounded-xl border border-neutral-200 overflow-hidden dark:border-neutral-700">
                <div className="h-2" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }} />
                <div className="p-4 bg-white dark:bg-neutral-900">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: primaryColor }}>
                      {brandName.charAt(0) || 'É'}
                    </div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">{brandName}</span>
                  </div>
                  <div className="h-2 w-3/4 rounded-full bg-neutral-100 mb-2 dark:bg-neutral-800" />
                  <div className="h-2 w-1/2 rounded-full bg-neutral-100 dark:bg-neutral-800" />
                  <div className="mt-3 flex gap-2">
                    <div className="h-6 w-16 rounded-md" style={{ background: primaryColor }} />
                    <div className="h-6 w-16 rounded-md border border-neutral-200 dark:border-neutral-700" />
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <Monitor className="h-4 w-4" />
                  <span>Web</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <Smartphone className="h-4 w-4" />
                  <span>Mobile</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}