/**
 * API client — Axios + TanStack Query integration
 *
 * Single Axios instance avec intercepteurs pour auth, refresh, et errors.
 * Exports des helpers React Query pour le data fetching standardisé.
 */

import axios from 'axios';
import { useQuery as useReactQuery, useMutation as useReactMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '@/shared/stores/auth-store';
import { queueMutation, cacheGetDerniere, cacheSet } from './db';
import useHorsLigneStore from '@/shared/stores/hors-ligne-store';

/**
 * Clé de cache d'une lecture : l'adresse ET ses paramètres. Sans eux, les
 * notes de la 6e A, gardées sous `/notes`, étaient rendues hors connexion
 * pour la 6e B.
 */
function cleCache(config) {
  const params = Object.entries(config.params ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(typeof v === 'object' ? JSON.stringify(v) : v)}`)
    .join('&');
  return params ? `${config.url}?${params}` : config.url;
}

/**
 * Dernière réponse connue d'une lecture, même ancienne ; sa date est signalée
 * au bandeau réseau. Null si rien n'est gardé ou si le stockage manque.
 */
async function lectureHorsLigne(config) {
  const entree = await cacheGetDerniere(cleCache(config)).catch(() => null);
  if (!entree) return null;
  useHorsLigneStore.getState().signaler(entree.updatedAt);
  return {
    data: entree.value,
    status: 200,
    statusText: 'OK (cached)',
    headers: { 'x-cached': 'true', 'x-cached-at': entree.updatedAt },
    config,
  };
}

/* ─── Axios instance ────────────────────────────────────────────────────── */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

/* ─── Request interceptor — offline queue + cache + auth timeout ──────── */
apiClient.interceptors.request.use(async (config) => {
  // Skip offline handling for queue replay itself
  if (config.headers?.['X-Offline-Queue']) return config;

  // Auth routes: timeout plus court (8s au lieu de 15s)
  if (config.url?.includes('/auth/')) {
    config.timeout = 8000;
  }

  // GET requests: serve from cache when offline
  if (config.method === 'get' && !navigator.onLine) {
    const reponse = await lectureHorsLigne(config);
    if (reponse) {
      // Pseudo-réponse : l'adaptateur rend la dernière réponse connue.
      config._fromCache = true;
      return { ...config, adapter: () => Promise.resolve({ ...reponse, config }) };
    }
  }

  // Mutations: queue when offline instead of failing
  // Skip auth routes — l'authentification hors-ligne n'a pas de sens
  if (
    !navigator.onLine &&
    !config.url?.includes('/auth/') &&
    ['post', 'put', 'patch', 'delete'].includes(config.method)
  ) {
    await queueMutation(
      config.method.toUpperCase(),
      config.url,
      config.data
    );

    // Return a mock success response so the caller doesn't break
    config._queuedOffline = true;
    return {
      ...config,
      data: { queued: true, message: 'Modification mise en file d\'attente hors-ligne' },
      status: 202,
      statusText: 'Accepted (offline)',
      headers: { 'x-offline-queue': 'true' },
      adapter: () =>
        Promise.resolve({
          data: { queued: true, message: 'Modification mise en file d\'attente hors-ligne' },
          status: 202,
          statusText: 'Accepted (offline)',
          headers: { 'x-offline-queue': 'true' },
          config
        })
    };
  }

  return config;
});

/* ─── Response interceptor — cache + erreurs ────────────────────────────── */
apiClient.interceptors.response.use(
  async (response) => {
    // Cache GET responses for offline use
    if (response.config?.method === 'get' && response.status === 200) {
      // Don't cache queued responses or cached responses
      if (!response.config._queuedOffline && !response.config._fromCache) {
        const ttl = response.headers['x-cache-ttl']
          ? parseInt(response.headers['x-cache-ttl']) * 1000
          : 5 * 60 * 1000;
        await cacheSet(cleCache(response.config), response.data, ttl).catch(() => {});
        // Le serveur répond de nouveau : les données affichées sont fraîches.
        if (useHorsLigneStore.getState().donneesDu) useHorsLigneStore.getState().effacer();
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // 401 — Session expirée → déconnexion locale
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      useAuthStore.getState().clearSession();
      const apiError = {
        status: 401,
        code: 'UNAUTHORIZED',
        message: error.response?.data?.message || 'Session expirée',
        details: [],
        errors: null,
        isApiError: true
      };
      return Promise.reject(apiError);
    }

    // 403 « 2FA obligatoire mais pas encore activée » : ce n'est pas un refus
    // définitif, c'est une étape manquante. On le signale au store, et
    // ProtectedRoute envoie la personne sur l'écran d'activation au lieu de
    // la laisser devant un tableau de bord vide. L'erreur suit son cours.
    if (error.response?.status === 403 && error.response?.data?.requires_2fa_setup) {
      useAuthStore.getState().requireTwoFactorSetup?.();
    }

    // Même logique pour un mot de passe provisoire pas encore remplacé.
    if (error.response?.status === 403 && error.response?.data?.requires_password_change) {
      useAuthStore.getState().requirePasswordChange?.();
    }

    // 429 — Rate limit (max 3 retries to avoid infinite loops)
    if (error.response?.status === 429) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      if (originalRequest._retryCount <= 3) {
        const retryAfter = error.response.headers['retry-after'] || 2;
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return apiClient(originalRequest);
      }
    }

    // Lecture sans réseau → dernière réponse connue, datée par le bandeau.
    // « Sans réseau » : aucune réponse (le navigateur peut se croire en ligne
    // sur un réseau faible), une passerelle qui n'atteint pas l'API (502,
    // 504), ou le 503 marqué `offline` du service worker. Un 503 ordinaire
    // (maintenance) reste une erreur affichée.
    const statut = error.response?.status;
    const sansReseau = !error.response
      || statut === 502 || statut === 504
      || error.response?.data?.offline === true;
    if (sansReseau && originalRequest.method === 'get') {
      const reponse = await lectureHorsLigne(originalRequest);
      if (reponse) return reponse;
    }

    // Mapping d'erreurs API vers un format standard.
    //
    // `errors` est conservé volontairement : toute la couche formulaire
    // (LoginForm, ForgotPassword, ResetPassword, EcolesPage, useApi/useForm…)
    // mappe les erreurs de validation via `err.errors`. Le champ `response`
    // brut d'Axios n'est pas propagé pour éviter de fuiter les internals.
    //
    // Le champ `error` peut être un objet `{ code, message, details }` ou
    // une chaîne nue `{ error: 'message' }` — on gère les deux cas.
    const rawError = error.response?.data?.error;
    // Sans réponse du tout, axios ne donne qu'un texte technique anglais
    // (« Network Error », « timeout of 15000ms exceeded ») : on dit plutôt
    // ce qui se passe et quoi faire.
    const sansReponse = !error.response;
    const messageSansReponse = ['ECONNABORTED', 'ETIMEDOUT'].includes(error.code)
      ? 'Le serveur met trop de temps à répondre. Réessayez dans un instant.'
      : originalRequest.method === 'get'
        ? 'Pas de connexion au serveur. Cette page n’a pas encore été ouverte sur cet appareil : elle s’affichera au retour du réseau.'
        : 'Pas de connexion au serveur. Vérifiez le réseau, puis réessayez.';
    const apiError = {
      status: error.response?.status || 0,
      code: (typeof rawError === 'object' ? rawError?.code : null) || (sansReponse ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR'),
      message:
        (typeof rawError === 'object' ? rawError?.message : null) ||
        (typeof rawError === 'string' ? rawError : null) ||
        error.response?.data?.message ||
        (sansReponse ? messageSansReponse : null) ||
        error.message ||
        'Une erreur est survenue',
      details: (typeof rawError === 'object' ? rawError?.details : null) || [],
      errors: error.response?.data?.errors || null,
      isApiError: true
    };

    return Promise.reject(apiError);
  }
);

export default apiClient;

/* ─── React Query helpers ────────────────────────────────────────────────── */

/**
 * Politique de réessai.
 *
 * Un 4xx est un verdict, pas un aléa : réessayer un 403 ou un 404 ne
 * peut pas réussir. `retry: 2` inconditionnel envoyait trois requêtes
 * identiques et retardait l'affichage de l'erreur de plusieurs secondes
 * (l'utilisateur restait devant des squelettes) ; sur 401 il déclenchait
 * en plus trois purges de session. On n'insiste donc que sur les erreurs
 * serveur et réseau, où un nouvel essai a un sens.
 *
 * @param {number} failureCount
 * @param {{status?: number}} error  Erreur normalisée par l'intercepteur.
 */
function shouldRetry(failureCount, error) {
  const status = error?.status ?? 0;
  if (status >= 400 && status < 500) return false;
  return failureCount < 2;
}

/**
 * Hook pour les queries GET standardisées.
 * Usage: const { data, isLoading, error } = useApiQuery('/users', { params: { page: 1 } })
 */
export function useApiQuery(key, url, options = {}) {
  return useReactQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const { data } = await apiClient.get(url, options.config || {});
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
    refetchOnWindowFocus: false,
    ...options.queryOptions
  });
}

/**
 * Hook pour les mutations POST/PUT/PATCH/DELETE.
 * Usage: const mutation = useApiMutation('/users', { method: 'POST' })
 */
export function useApiMutation(url, options = {}) {
  const queryClient = useQueryClient();

  return useReactMutation({
    mutationFn: async (variables) => {
      const method = options.method || 'POST';
      const { data } = await apiClient({
        method,
        url,
        data: variables,
        ...(options.config || {})
      });
      return data;
    },
    onSuccess: () => {
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach((key) =>
          queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] })
        );
      }
    },
    retry: options.retry ?? 1,
    ...options.mutationOptions
  });
}

/**
 * Factory types de mutation dédiés
 */
export const api = {
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config)
};
