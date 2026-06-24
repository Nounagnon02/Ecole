/**
 * useDashboardData — Hook centralisé pour les données des dashboards
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/shared/services/api';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

export function useDashboardData(endpoint, options = {}) {
  const {
    enabled = true,
    cacheKey,
    cacheDuration = CACHE_DURATION,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    const cacheKey_ = cacheKey || endpoint;
    const cached = cache.get(cacheKey_);
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(endpoint);
      const result = response.data?.data || response.data;
      cache.set(cacheKey_, { data: result, timestamp: Date.now() });
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Une erreur est survenue');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [endpoint, cacheKey, cacheDuration]);

  useEffect(() => {
    if (enabled) fetchData();
  }, [enabled, fetchData]);

  const refetch = useCallback(() => {
    const cacheKey_ = cacheKey || endpoint;
    cache.delete(cacheKey_);
    fetchData();
  }, [endpoint, cacheKey, fetchData]);

  return { data, loading, error, refetch };
}

/**
 * useDashboardStats — Agrége les stats d'un tableau de bord
 *
 * NOTE: l'instance axios a déjà baseURL = '/api'.
 * Les endpoints ci-dessous sont donc relatifs à ce préfixe :
 *   '/dashboard/comptable' → 'http://localhost:8000/api/dashboard/comptable'
 */
export function useDashboardStats(role) {
  const endpoints = {
    // Rôles existants (chemins corrigés)
    directeur: '/dashboard/directeur/data',
    enseignant: '/dashboard/enseignant',
    eleve: '/dashboard/eleve',
    parent: '/dashboard/parent',
    admin: '/dashboard/admin',
    universite: '/dashboard/universite',

    // Staff — 6 nouveaux rôles (R4)
    comptable: '/dashboard/comptable',
    surveillant: '/dashboard/surveillant',
    censeur: '/dashboard/censeur',
    infirmier: '/dashboard/infirmier',
    bibliothecaire: '/dashboard/bibliothecaire',
    secretaire: '/dashboard/secretaire',
  };

  const endpoint = endpoints[role] || null;
  return useDashboardData(endpoint, { enabled: !!endpoint, cacheKey: `dashboard_${role}` });
}
