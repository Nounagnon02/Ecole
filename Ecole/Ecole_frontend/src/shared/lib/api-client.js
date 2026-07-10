/**
 * API client — Axios + TanStack Query integration
 *
 * Single Axios instance avec intercepteurs pour auth, refresh, et errors.
 * Exports des helpers React Query pour le data fetching standardisé.
 */

import axios from 'axios';
import { useQuery as useReactQuery, useMutation as useReactMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '@/shared/stores/auth-store';
import { queueMutation, cacheGet, cacheSet, isOnline } from './db';

/* ─── Axios instance ────────────────────────────────────────────────────── */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
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
    const cached = await cacheGet(config.url);
    if (cached !== null) {
      // Return cached data as a pseudo-response
      config._fromCache = true;
      return {
        ...config,
        data: cached,
        status: 200,
        statusText: 'OK (cached)',
        headers: { 'x-cached': 'true' },
        adapter: () =>
          Promise.resolve({
            data: cached,
            status: 200,
            statusText: 'OK (cached)',
            headers: { 'x-cached': 'true' },
            config,
          }),
      };
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
          config,
        }),
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
        await cacheSet(response.config.url, response.data, ttl).catch(() => {});
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
    }

    // 429 — Rate limit
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 2;
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return apiClient(originalRequest);
    }

    // Network error + GET → try cache fallback
    if (!error.response && originalRequest.method === 'get' && navigator.onLine === false) {
      const cached = await cacheGet(originalRequest.url).catch(() => null);
      if (cached !== null) {
        return Promise.resolve({
          data: cached,
          status: 200,
          statusText: 'OK (cached fallback)',
          headers: { 'x-cached': 'true' },
          config: originalRequest,
        });
      }
    }

    // Mapping d'erreurs API vers un format standard
    const apiError = {
      status: error.response?.status || 0,
      code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
      message:
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Une erreur est survenue',
      details: error.response?.data?.error?.details || [],
    };

    return Promise.reject(apiError);
  }
);

export default apiClient;

/* ─── React Query helpers ────────────────────────────────────────────────── */

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
    retry: 2,
    refetchOnWindowFocus: false,
    ...options.queryOptions,
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
        ...(options.config || {}),
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
    ...options.mutationOptions,
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
  delete: (url, config) => apiClient.delete(url, config),
};
