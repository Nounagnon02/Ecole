/**
 * Le client react-query de l'application, et sa purge.
 *
 * Ce module tenait auparavant un cache maison : une `Map` indexée par rôle
 * (`dashboard_directeur`, …) et non par utilisateur, qui rendait donc à
 * l'utilisateur suivant d'un poste partagé les effectifs, finances et notes
 * du précédent — éventuellement d'un autre établissement — pendant toute la
 * durée du TTL. La purge à la déconnexion était la seule protection.
 *
 * Le cache est désormais celui de react-query, déjà présent dans
 * l'application. Le client vit ici, dans un module sans dépendance, pour deux
 * raisons : le store d'authentification doit pouvoir le vider alors qu'il
 * n'est pas un composant React, et le faire depuis `api-client` créerait un
 * cycle d'import (auth-store → api-client → auth-store).
 *
 * `clearDashboardCache()` garde son nom : les appelants — déconnexion, perte
 * de session, tests — n'ont pas eu à changer.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Vide tout le cache serveur. À appeler à la déconnexion et sur perte de
 * session : sans cela, les réponses restent lisibles par la session suivante.
 */
export function clearDashboardCache() {
  queryClient.clear();
}

export default queryClient;
