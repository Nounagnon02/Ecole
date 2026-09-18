/**
 * useDashboardData — données d'un tableau de bord, via react-query.
 *
 * L'implémentation précédente tenait son propre cache : une `Map` de module,
 * un TTL maison, un `useEffect` de chargement et un `refetch` qui vidait
 * l'entrée à la main. Elle vivait à côté de react-query, déjà configuré dans
 * l'application et utilisé par trois pages — deux mécanismes d'état serveur
 * pour le même besoin (cf. audit P4.1).
 *
 * Passer par react-query apporte ce que le cache maison n'avait pas : la
 * déduplication des requêtes concurrentes, l'invalidation ciblée, le partage
 * entre composants montés simultanément, et une isolation par clé plutôt
 * qu'un espace de noms global indexé sur le rôle — que le module documentait
 * lui-même comme un risque sur poste partagé.
 *
 * La signature de retour est inchangée (`{ data, loading, error, refetch }`) :
 * les douze tableaux de bord n'ont rien eu à modifier.
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/shared/lib/api-client';

const DUREE_FRAICHEUR = 5 * 60 * 1000;

export function useDashboardData(endpoint, options = {}) {
  const {
    enabled = true,
    cacheKey,
    cacheDuration = DUREE_FRAICHEUR,
  } = options;

  const cle = ['dashboard', cacheKey || endpoint];
  const queryClient = useQueryClient();

  const requete = useApiQuery(cle, endpoint || '', {
    queryOptions: {
      enabled: enabled && !!endpoint,
      staleTime: cacheDuration,
      gcTime: cacheDuration * 2,
    },
  });

  // Les réponses de l'API sont enveloppées dans `{ success, data }` par la
  // plupart des contrôleurs, mais pas par tous : le déballage reste tolérant.
  const donnees = requete.data?.data ?? requete.data ?? null;

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: cle });
  }, [queryClient, cle.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data: requete.isError ? null : donnees,
    loading: requete.isPending && enabled && !!endpoint,
    error: requete.isError ? (requete.error?.message ?? 'Une erreur est survenue') : null,
    refetch,
  };
}

/**
 * useDashboardStats — point d'entrée par rôle.
 *
 * NOTE : l'instance axios porte déjà `baseURL = '/api'`. Les chemins
 * ci-dessous sont donc relatifs à ce préfixe.
 */
export function useDashboardStats(role) {
  const endpoints = {
    directeur:      '/dashboard/directeur/data',
    enseignant:     '/dashboard/enseignant',
    eleve:          '/dashboard/eleve',
    parent:         '/dashboard/parent',
    admin:          '/dashboard/admin',
    universite:     '/dashboard/universite',
    comptable:      '/dashboard/comptable',
    surveillant:    '/dashboard/surveillant',
    censeur:        '/dashboard/censeur',
    infirmier:      '/dashboard/infirmier',
    bibliothecaire: '/dashboard/bibliothecaire',
    secretaire:     '/dashboard/secretaire',
  };

  const endpoint = endpoints[role] || null;

  return useDashboardData(endpoint, { enabled: !!endpoint, cacheKey: `dashboard_${role}` });
}
