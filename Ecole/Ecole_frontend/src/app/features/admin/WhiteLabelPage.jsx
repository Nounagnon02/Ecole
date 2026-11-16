/**
 * WhiteLabelPage — Personnalisation de la marque (Super Admin)
 *
 * Configuration du branding par tenant : logo, couleurs, nom.
 * Données dynamiques via /v1/admin/tenants et /v1/admin/tenants/:id/settings
 */

import { useState, useEffect, useMemo } from 'react';
import { api, useApiQuery } from '@/shared/lib/api-client';
import { useTranslation } from '@/shared/i18n';
import { unwrapList } from '@/shared/lib/unwrap';
import {
  Palette, Image, Globe, Monitor, Save,
  Type, Eye, Smartphone, Loader2, AlertCircle
} from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import logger from '@/shared/lib/logger';

const PRESET_COLORS = [
  { name: 'Indigo', primary: '#4F46E5', secondary: '#7C3AED' },
  { name: 'Emerald', primary: '#059669', secondary: '#0D9488' },
  { name: 'Rose', primary: '#E11D48', secondary: '#BE185D' },
  { name: 'Amber', primary: '#D97706', secondary: '#B45309' },
  { name: 'Sky', primary: '#0284C7', secondary: '#0369A1' },
  { name: 'Violet', primary: '#7C3AED', secondary: '#6D28D9' },
];

export default function WhiteLabelPage() {
  const { t } = useTranslation();
  const [selectedTenant, setSelectedTenant] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [secondaryColor, setSecondaryColor] = useState('#7C3AED');
  const [brandName, setBrandName] = useState('Mon École');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ─── État serveur ────────────────────────────────────────────
  //
  // Deux requêtes, la seconde dépendante de la première : `enabled` remplace
  // le `if (!selectedTenant) return` qui gardait l'ancien effet, et la clé
  // porte l'établissement, si bien que changer de sélection change de cache
  // au lieu d'écraser le précédent (cf. audit P4.1).
  const requeteEcoles = useApiQuery(['tenants'], '/v1/admin/tenants');

  const ecoles = useMemo(
    () => (unwrapList(requeteEcoles.data) ?? []).map((e) => ({
      id: e.id,
      nom: e.nom || e.name || `École ${e.id}`,
    })),
    [requeteEcoles.data],
  );

  // Route réelle : GET /api/v1/admin/tenants/{tenant}/settings.
  // `/admin/white-label/…` n'existe pas, et le préfixe /api était en double
  // (le client axios porte déjà baseURL '/api').
  const requeteConfig = useApiQuery(
    ['tenant-settings', selectedTenant],
    `/v1/admin/tenants/${selectedTenant}/settings`,
    { queryOptions: { enabled: !!selectedTenant } },
  );

  const loading = requeteEcoles.isPending;
  const error = requeteEcoles.isError
    ? (requeteEcoles.error?.message ?? t('common.load_error'))
    : null;

  // Premier établissement sélectionné d'office : la page n'a rien à montrer
  // sans cible.
  useEffect(() => {
    if (!selectedTenant && ecoles.length > 0) {
      setSelectedTenant(String(ecoles[0].id));
    }
  }, [ecoles, selectedTenant]);

  // ─── État de formulaire ──────────────────────────────────────
  //
  // react-query porte l'état serveur, pas celui d'un formulaire que
  // l'utilisateur modifie. Les champs sont donc semés depuis la réponse, puis
  // vivent leur vie jusqu'à l'enregistrement.
  useEffect(() => {
    const cfg = requeteConfig.data?.data ?? requeteConfig.data;
    if (!cfg) return;

    setBrandName(cfg.nom_brand || cfg.brand_name || cfg.nom || '');
    setPrimaryColor(cfg.couleur_primaire || cfg.primary_color || '#4F46E5');
    setSecondaryColor(cfg.couleur_secondaire || cfg.secondary_color || '#7C3AED');
    setLogoUrl(cfg.logo_url || cfg.logo || '');
    setFaviconUrl(cfg.favicon_url || cfg.favicon || '');
  }, [requeteConfig.data]);

  const handleSave = async () => {
    if (!selectedTenant) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.patch(`/v1/admin/tenants/${selectedTenant}/settings`, {
        brand_name: brandName,
        primary_color: primaryColor,
        secondary_color: secondaryColor
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      logger.error('Erreur sauvegarde white-label:', e);
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pages.admin.white_label.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('pages.admin.white_label.subtitle')}</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !selectedTenant}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? t('pages.admin.white_label.enregistrement') : saved ? t('pages.admin.white_label.enregistre') : t('common.save')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tenant selector */}
          <Card>
            <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t('common.school')}</h3>
              <p className="text-xs text-neutral-500 mt-0.5">{t('pages.admin.white_label.selectionnez_l_etablissement_a_personnaliser')}</p>
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
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t('pages.admin.white_label.nom_de_la_marque')}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{t('pages.admin.white_label.affiche_dans_l_en_tete_et_les_communications')}</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder={t('pages.admin.white_label.nom_de_l_etablissement')}
              />
            </div>
          </Card>

          {/* Colors */}
          <Card>
            <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-neutral-500" />
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t('pages.admin.white_label.couleurs')}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{t('pages.admin.white_label.personnalisez_les_couleurs_principales')}</p>
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
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">{t('pages.admin.white_label.couleur_primaire')}</label>
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
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">{t('pages.admin.white_label.couleur_secondaire')}</label>
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
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t('pages.admin.white_label.logo_favicon')}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{t('pages.admin.white_label.telechargez_le_logo_et_l_icone_de_l')}</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-2">{t('pages.admin.white_label.logo_png_svg_max_2_mo')}</label>
                  <div className="flex items-center justify-center h-32 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
                    {logoUrl ? (
                      <img src={logoUrl} alt={t('pages.admin.white_label.logo')} className="max-h-24 max-w-full rounded" />
                    ) : (
                      <div className="text-center">
                        <Image className="h-8 w-8 text-neutral-300 mx-auto mb-1" />
                        <p className="text-xs text-neutral-400">{t('pages.admin.white_label.cliquez_pour_uploader')}</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/png,image/svg+xml" className="hidden" id="logo-upload" onChange={(e) => { const f = e.target.files[0]; if (f) setLogoUrl(URL.createObjectURL(f)); }} />
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => document.getElementById('logo-upload').click()}>
                    {t('pages.admin.white_label.choisir_un_fichier')}
                  </Button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-2">{t('pages.admin.white_label.favicon_png_ico_max_1_mo')}</label>
                  <div className="flex items-center justify-center h-32 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
                    {faviconUrl ? (
                      <img src={faviconUrl} alt={t('pages.admin.white_label.favicon')} className="h-16 w-16 rounded" />
                    ) : (
                      <div className="text-center">
                        <Globe className="h-8 w-8 text-neutral-300 mx-auto mb-1" />
                        <p className="text-xs text-neutral-400">{t('pages.admin.white_label.cliquez_pour_uploader')}</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/png,image/x-icon" className="hidden" id="favicon-upload" onChange={(e) => { const f = e.target.files[0]; if (f) setFaviconUrl(URL.createObjectURL(f)); }} />
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => document.getElementById('favicon-upload').click()}>
                    {t('pages.admin.white_label.choisir_un_fichier')}
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
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t('pages.admin.white_label.apercu')}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{t('pages.admin.white_label.rendu_en_direct')}</p>
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
                  <span>{t('pages.admin.white_label.web')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <Smartphone className="h-4 w-4" />
                  <span>{t('pages.admin.white_label.mobile')}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}