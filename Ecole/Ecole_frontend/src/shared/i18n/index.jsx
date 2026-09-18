/**
 * i18n — Système d'internationalisation léger
 *
 * Prêt pour migration vers react-i18next quand le package sera installé.
 * Pour l'instant, utilise un contexte React simple.
 *
 * Usage :
 * import { useTranslation } from '@/shared/i18n';
 * const { t } = useTranslation();
 * <h1>{t('dashboard.title')}</h1>
 */

import React, { createContext, useCallback, useContext, useMemo } from 'react';
import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';

/* ─── Ressources ─────────────────────────────────────────────────── */
const RESOURCES = { fr, en, ar };

/** Résolution d'une clé pointée dans les ressources d'une locale. */
function resolve(key, locale, params = {}) {
  const keys = key.split('.');
  let value = RESOURCES[locale];
  for (const k of keys) {
    value = value?.[k];
  }
  if (typeof value === 'undefined') return key;
  if (typeof value === 'string') {
    return value.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
  }
  return value;
}

/* ─── Contexte ───────────────────────────────────────────────────── */
// Le `t` par défaut résout vraiment le français plutôt que de renvoyer la
// clé brute : aucun test de ce projet ne monte `I18nProvider`, et le
// français est la locale par défaut de l'application (`initialLocale`
// ci-dessous). Un composant rendu sans provider — dans un test comme dans
// un usage isolé — doit donc afficher le même texte qu'avec le provider
// monté en 'fr', pas la clé i18n brute.
const I18nContext = createContext({
  locale: 'fr',
  setLocale: () => {},
  t: (key, params) => resolve(key, 'fr', params),
  dir: 'ltr',
});

/* ─── Provider ───────────────────────────────────────────────────── */
export function I18nProvider({ children, initialLocale = 'fr' }) {
  const [locale, setLocale] = React.useState(() => {
    // Restaurer la locale depuis localStorage
    return localStorage.getItem('ecole-locale') || initialLocale;
  });

  const changeLocale = useCallback((newLocale) => {
    if (RESOURCES[newLocale]) {
      setLocale(newLocale);
      localStorage.setItem('ecole-locale', newLocale);
      document.documentElement.lang = newLocale;
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  const t = useCallback((key, params = {}) => resolve(key, locale, params), [locale]);

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const contextValue = useMemo(
    () => ({ locale, setLocale: changeLocale, t, dir }),
    [locale, changeLocale, t, dir]
  );

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

/* ─── Hook ────────────────────────────────────────────────────────── */
export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}

/* ─── Helper pour les cas non-React ─────────────────────────────── */
export function translate(key, locale = 'fr', params = {}) {
  return resolve(key, locale, params);
}
