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

import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';

/* ─── Ressources ─────────────────────────────────────────────────── */
const RESOURCES = { fr, en, ar };

export const DEFAULT_LOCALE = 'fr';
const STORAGE_KEY = 'ecole-locale';

/** Langues proposées à l'utilisateur, nommées dans leur propre langue. */
export const LOCALES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
];

function lookup(locale, key) {
  let value = RESOURCES[locale];
  for (const k of key.split('.')) {
    value = value?.[k];
  }
  return value;
}

/**
 * Résolution d'une clé pointée dans les ressources d'une locale.
 *
 * Une clé absente d'une locale retombe sur le français plutôt que sur la clé
 * brute : une traduction en retard doit s'afficher en français, pas comme
 * `pages.notes.title`. Seule une clé absente partout est renvoyée telle quelle.
 */
function resolve(key, locale, params = {}) {
  let value = lookup(locale, key);
  if (typeof value === 'undefined') value = lookup(DEFAULT_LOCALE, key);
  if (typeof value === 'undefined') return key;
  if (typeof value === 'string') {
    return value.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
  }
  return value;
}

/** Locale mémorisée, ou `fallback` si elle est absente, inconnue ou illisible. */
function readStoredLocale(fallback) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && RESOURCES[stored] ? stored : fallback;
  } catch {
    return fallback;
  }
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
export function I18nProvider({ children, initialLocale = DEFAULT_LOCALE }) {
  const [locale, setLocale] = React.useState(() => readStoredLocale(initialLocale));

  const changeLocale = useCallback((newLocale) => {
    if (!RESOURCES[newLocale]) return;
    setLocale(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      /* stockage indisponible : le choix vaut pour la session seulement */
    }
  }, []);

  const t = useCallback((key, params = {}) => resolve(key, locale, params), [locale]);

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  // `lang` et `dir` suivent la locale à chaque changement ET au montage : une
  // locale restaurée depuis le stockage (arabe après un rechargement) doit
  // inverser la mise en page sans attendre que l'utilisateur rechoisisse.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

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
