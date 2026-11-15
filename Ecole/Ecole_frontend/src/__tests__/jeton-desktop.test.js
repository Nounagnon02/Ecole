/**
 * Session du desktop (Electron, décision du 15/11/2026) : l'interface est
 * servie par `ecole://app`, le cookie de session du web n'est pas transmis.
 * Le desktop envoie donc le jeton Bearer remis par l'API, gardé en mémoire
 * seulement. Constaté avant correction sur l'application lancée : connexion
 * acceptée, puis 401 sur /auth/me et retour à l'accueil.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';

let appels;
function adaptateur(reponses) {
  return (config) => {
    appels.push({ url: config.url, auth: config.headers?.Authorization ?? null, credentials: config.withCredentials });
    const data = reponses[config.url] ?? {};
    return Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
  };
}

async function charger() {
  vi.resetModules();
  const { default: apiClient } = await import('@/shared/lib/api-client');
  const { default: useAuthStore } = await import('@/shared/stores/auth-store');
  return { apiClient, useAuthStore };
}

describe('session du desktop par jeton en mémoire', () => {
  beforeEach(() => {
    appels = [];
    localStorage.clear();
  });
  afterEach(() => {
    delete window.electronAPI;
  });

  it('appelle l’API donnée par l’application et envoie le jeton, sans cookie ni CSRF', async () => {
    window.electronAPI = { isElectron: true, apiUrl: 'https://api.ecole.test' };
    const { apiClient, useAuthStore } = await charger();
    expect(apiClient.defaults.baseURL).toBe('https://api.ecole.test/api');
    const reponses = { '/auth/login': { token: 'jeton-123', user: { id: 1, role: 'secretaire' } }, '/eleves': { data: [] } };
    apiClient.defaults.adapter = adaptateur(reponses);
    axios.defaults.adapter = adaptateur(reponses);

    await useAuthStore.getState().login({ email: 'secretaire', password: 'x' });
    await apiClient.get('/eleves');

    expect(appels.some((a) => String(a.url).includes('csrf-cookie'))).toBe(false);
    expect(appels.at(-1)).toMatchObject({ url: '/eleves', auth: 'Bearer jeton-123', credentials: false });
    // Jamais écrit sur le disque.
    expect(localStorage.getItem('auth-store') ?? '').not.toContain('jeton-123');
  });

  it('garde le jeton remis après la vérification 2FA, et l’oublie à la déconnexion', async () => {
    window.electronAPI = { isElectron: true, apiUrl: 'https://api.ecole.test' };
    const { apiClient, useAuthStore } = await charger();
    apiClient.defaults.adapter = adaptateur({
      '/auth/login': { requires_2fa: true, token: 'provisoire' },
      '/auth/2fa/verify-login': { token: 'jeton-2fa', user: { id: 2, role: 'directeur' } },
    });

    await useAuthStore.getState().login({ email: 'directeur', password: 'x' });
    await useAuthStore.getState().verifyTwoFactorLogin('123456');
    await apiClient.get('/dashboard/directeur/data');
    expect(appels.at(-1).auth).toBe('Bearer jeton-2fa');

    await useAuthStore.getState().logout();
    await apiClient.get('/dashboard/directeur/data');
    expect(appels.at(-1).auth).toBeNull();
  });

  it('ne change rien au web : cookie de session, aucun jeton', async () => {
    const { apiClient, useAuthStore } = await charger();
    const reponses = { '/auth/login': { token: 'ne-pas-utiliser', user: { id: 3, role: 'parent' } }, '/eleves': {} };
    apiClient.defaults.adapter = adaptateur(reponses);
    axios.defaults.adapter = adaptateur(reponses);

    await useAuthStore.getState().login({ email: 'parent', password: 'x' });
    await apiClient.get('/eleves');

    expect(appels.some((a) => String(a.url).includes('csrf-cookie'))).toBe(true);
    expect(appels.at(-1)).toMatchObject({ auth: null, credentials: true });
  });
});
