/**
 * Configuration API — Érudit v4
 *
 * Source unique de vérité pour l'URL de base et le délai d'expiration :
 * `src/services/api.js` construit son instance Axios à partir d'ici.
 *
 * Les chemins d'endpoint ne sont volontairement pas listés : l'instance Axios
 * porte déjà `baseURL`, les appels se font donc en relatif (`/auth/login`).
 * Dupliquer des URL absolues ici ferait diverger les deux conventions.
 */

export const URL_BASE_API =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? 'http://localhost:8000/api' : 'https://api.erudit.bj/api');

/** Délai d'expiration des requêtes, en millisecondes. */
export const API_TIMEOUT = Number.parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '15000', 10);
