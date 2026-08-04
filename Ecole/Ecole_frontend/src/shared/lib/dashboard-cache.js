/**
 * dashboard-cache — Cache mémoire des réponses de tableau de bord
 *
 * Vit dans un module sans dépendance pour pouvoir être vidé depuis le
 * store d'authentification sans créer de cycle d'import
 * (auth-store → api-client → auth-store).
 *
 * Le cache est indexé par rôle (`dashboard_directeur`, …) et non par
 * utilisateur : sur un poste partagé, il rendait donc à l'utilisateur
 * suivant les effectifs, finances et notes du précédent — y compris
 * d'un autre établissement — pendant toute la durée du TTL.
 * Il doit être purgé à chaque fin de session (cf. audit S17 pour le
 * pendant IndexedDB).
 */

/** @type {Map<string, {data: unknown, timestamp: number}>} */
export const dashboardCache = new Map();

/** Vide le cache. À appeler à la déconnexion et sur perte de session. */
export function clearDashboardCache() {
  dashboardCache.clear();
}

export default dashboardCache;
