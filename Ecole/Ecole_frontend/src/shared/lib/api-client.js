/**
 * API client — Axios + TanStack Query integration
 *
 * Single Axios instance avec intercepteurs pour auth, refresh, et errors.
 * Exports des helpers React Query pour le data fetching standardisé.
 */

import axios from 'axios';
import useAuthStore from '@/shared/stores/auth-store';

/* ─── Axios instance ────────────────────────────────────────────────────── */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

/* ─── Response interceptor — gestion des erreurs ───────────────────────── */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

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
  const { useQuery: useReactQuery } = require('@tanstack/react-query');
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
  const { useMutation: useReactMutation, useQueryClient } = require('@tanstack/react-query');
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
