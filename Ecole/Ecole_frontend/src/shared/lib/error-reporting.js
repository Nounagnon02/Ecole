/**
 * error-reporting — Sentry, initialisation et capture
 *
 * Sans `VITE_SENTRY_DSN`, `Sentry.init()` n'est jamais appelé : aucun script
 * tiers ne se charge, aucun réseau ne part. Sûr par défaut en local/CI.
 *
 * `logger.error()` ne faisait rien en production (voir son propre
 * commentaire, resté en attente) : `captureException` est le point
 * d'accroche prévu.
 */

import * as Sentry from '@sentry/react';

let initialized = false;

export function initErrorReporting() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_APP_ENV || import.meta.env.MODE,
    // Pas de PII par défaut : cohérent avec le reste du produit (aucun jeton
    // en localStorage, purge du cache à la déconnexion — cf. api-client.js).
    sendDefaultPii: false,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0),
  });
  initialized = true;
}

/** Capture manuelle — no-op tant que `initErrorReporting()` n'a rien activé. */
export function captureException(error, context) {
  if (!initialized) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
