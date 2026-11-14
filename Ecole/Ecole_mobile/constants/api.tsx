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

/**
 * Adresse de l'API : celle fournie à la construction (EXPO_PUBLIC_API_URL,
 * inlinée par Expo), sinon localhost en développement, sinon AUCUNE. L'ancien
 * repli de production (https://api.erudit.bj/api) visait un domaine que rien
 * ne garantissait appartenir à l'école (recette du 14/11/2026, R-12).
 */
export function urlApi(valeur: string | undefined, dev: boolean): string {
  return valeur || (dev ? 'http://localhost:8000/api' : '');
}

export const URL_BASE_API = urlApi(process.env.EXPO_PUBLIC_API_URL, __DEV__);

/** Délai d'expiration des requêtes, en millisecondes. */
export const API_TIMEOUT = Number.parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '15000', 10);
