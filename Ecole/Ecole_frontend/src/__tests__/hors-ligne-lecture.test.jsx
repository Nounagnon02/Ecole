/**
 * Hors connexion : les dernières données connues, datées, au lieu d'une page vide.
 *
 * Trois défauts empêchaient le cache des lectures de servir :
 * - react-query suspendait toute requête hors ligne (mode réseau « online ») :
 *   le client HTTP, et donc son cache, n'était jamais appelé ;
 * - une entrée expirait au bout de 5 minutes ;
 * - la clé ignorait les paramètres : la classe A pouvait s'afficher pour la B.
 * Et rien ne disait de quand dataient les données affichées.
 *
 * jsdom n'a pas d'IndexedDB : le module `db` est remplacé par une mémoire.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';

const memoire = vi.hoisted(() => new Map());

vi.mock('@/shared/lib/db', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    cacheSet: vi.fn(async (key, value) => {
      memoire.set(key, { value, updatedAt: memoire.get('__horloge') ?? new Date().toISOString() });
    }),
    cacheGetDerniere: vi.fn(async (key) => memoire.get(key) ?? null),
    queueMutation: vi.fn(async () => 1),
  };
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { api } from '@/shared/lib/api-client';
import useAuthStore from '@/shared/stores/auth-store';
import { estConservable } from '@/shared/lib/db';
import { queryClient } from '@/shared/lib/query-client';
import useHorsLigneStore from '@/shared/stores/hors-ligne-store';
import BandeauReseau from '@/shared/components/layout/BandeauReseau';
import { installHttpMock } from './helpers/http-mock';

let http;

function reseau(enLigne) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => enLigne });
}

beforeEach(() => {
  memoire.clear();
  http = installHttpMock();
  reseau(true);
  useHorsLigneStore.setState({ donneesDu: null });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  http.restore();
  reseau(true);
  vi.restoreAllMocks();
});

describe('lecture hors connexion', () => {
  it('rend la dernière réponse connue de la même adresse, paramètres compris', async () => {
    http.onGet('/notes').reply(200, { data: ['note de la 6e A'] });
    await api.get('/notes', { params: { classe_id: 1 } });

    reseau(false);
    const res = await api.get('/notes', { params: { classe_id: 1 } });

    expect(res.data).toEqual({ data: ['note de la 6e A'] });
  });

  it('ne rend pas les données d’une autre classe', async () => {
    http.onGet('/notes').reply(200, { data: ['note de la 6e A'] });
    await api.get('/notes', { params: { classe_id: 1 } });

    reseau(false);
    http.onGet('/notes').networkError();
    const err = await api.get('/notes', { params: { classe_id: 2 } }).catch((e) => e);

    expect(err.status).toBe(0);
  });

  it('retient la date des données servies, puis l’oublie au retour du réseau', async () => {
    memoire.set('__horloge', '2026-11-10T08:30:00.000Z');
    http.onGet('/eleves').reply(200, { data: [] });
    await api.get('/eleves');

    reseau(false);
    await api.get('/eleves');
    expect(useHorsLigneStore.getState().donneesDu).toBe('2026-11-10T08:30:00.000Z');

    reseau(true);
    act(() => { window.dispatchEvent(new Event('online')); });
    expect(useHorsLigneStore.getState().donneesDu).toBeNull();
  });

  it('garde la date la plus ancienne quand plusieurs réponses sont servies', () => {
    const { signaler } = useHorsLigneStore.getState();
    signaler('2026-11-11T10:00:00.000Z');
    signaler('2026-11-09T10:00:00.000Z');
    signaler('2026-11-12T10:00:00.000Z');

    expect(useHorsLigneStore.getState().donneesDu).toBe('2026-11-09T10:00:00.000Z');
  });
});

describe('réseau défaillant alors que le navigateur se croit en ligne', () => {
  it('sert la dernière réponse connue quand le service worker répond « hors ligne »', async () => {
    http.onGet('/classes').reply(200, { data: ['6e A'] });
    await api.get('/classes');

    http.onGet('/classes').reply(503, { error: 'Vous êtes hors ligne', offline: true });
    const res = await api.get('/classes');

    expect(res.data).toEqual({ data: ['6e A'] });
  });

  it('retient la date, puis l’oublie à la première vraie réponse du réseau', async () => {
    memoire.set('__horloge', '2026-11-10T08:30:00.000Z');
    http.onGet('/classes').reply(200, { data: ['6e A'] });
    await api.get('/classes');

    http.onGet('/classes').reply(503, { error: 'Vous êtes hors ligne', offline: true });
    await api.get('/classes');
    expect(useHorsLigneStore.getState().donneesDu).toBe('2026-11-10T08:30:00.000Z');

    http.onGet('/classes').reply(200, { data: ['6e A', '6e B'] });
    await api.get('/classes');
    expect(useHorsLigneStore.getState().donneesDu).toBeNull();
  });

  it.each([502, 504])('sert la dernière réponse connue quand la passerelle répond %i (API injoignable)', async (status) => {
    http.onGet('/classes').reply(200, { data: ['6e A'] });
    await api.get('/classes');

    http.onGet('/classes').reply(status, {});
    const res = await api.get('/classes');

    expect(res.data).toEqual({ data: ['6e A'] });
  });

  it('sert la dernière réponse connue sur une panne réseau, même si le navigateur se croit en ligne', async () => {
    http.onGet('/auth/me').reply(200, { user: { id: 7 } });
    await api.get('/auth/me');

    http.onGet('/auth/me').networkError();
    const res = await api.get('/auth/me');

    expect(res.data).toEqual({ user: { id: 7 } });
  });

  it('ne masque pas une vraie panne serveur (503 sans marque hors ligne)', async () => {
    http.onGet('/classes').reply(200, { data: ['6e A'] });
    await api.get('/classes');

    http.onGet('/classes').reply(503, { message: 'Maintenance' });
    const err = await api.get('/classes').catch((e) => e);

    expect(err.status).toBe(503);
  });
});

describe('cache du service worker', () => {
  const sw = readFileSync(resolve(__dirname, '../../public/sw.js'), 'utf8');

  it('ne garde plus les réponses de l’API (le cache d’IndexedDB, vidé à la déconnexion, suffit)', () => {
    expect(sw).not.toMatch(/networkFirst\(request,\s*API_CACHE_NAME\)/);
    expect(sw).toMatch(/const CACHE_NAME = 'ecole-cache-v3'/);
  });

  it('la déconnexion supprime les caches d’API laissés par une ancienne version', async () => {
    const supprimes = [];
    globalThis.caches = {
      keys: async () => ['ecole-cache-v3', 'ecole-api-v2'],
      delete: async (nom) => { supprimes.push(nom); return true; },
    };
    http.onPost('/auth/logout').reply(200, {});

    try {
      await useAuthStore.getState().logout();
    } finally {
      delete globalThis.caches;
    }

    expect(supprimes).toEqual(['ecole-api-v2']);
  });
});

describe('conservation', () => {
  const maintenant = Date.parse('2026-11-12T12:00:00.000Z');

  it('garde une réponse vieille d’une heure, bien au-delà des 5 minutes d’avant', () => {
    expect(estConservable({ updatedAt: '2026-11-12T11:00:00.000Z' }, maintenant)).toBe(true);
  });

  it('abandonne une réponse de plus de 30 jours', () => {
    expect(estConservable({ updatedAt: '2026-10-01T12:00:00.000Z' }, maintenant)).toBe(false);
  });

  it('abandonne une entrée sans date', () => {
    expect(estConservable({}, maintenant)).toBe(false);
  });
});

describe('react-query', () => {
  it('lance les lectures même hors ligne, pour que le cache réponde', () => {
    expect(queryClient.getDefaultOptions().queries.networkMode).toBe('offlineFirst');
  });
});

describe('bandeau réseau', () => {
  it('dit hors connexion et donne la date des données affichées', () => {
    useHorsLigneStore.setState({ donneesDu: '2026-11-10T08:30:00.000Z' });

    render(<BandeauReseau enLigne={false} />);

    const bandeau = screen.getByRole('status');
    expect(bandeau).toHaveTextContent(/Hors connexion/);
    expect(bandeau).toHaveTextContent(/10\/11\/2026/);
  });

  it('s’affiche aussi quand le navigateur se croit en ligne mais que les données viennent du cache', () => {
    useHorsLigneStore.setState({ donneesDu: '2026-11-10T08:30:00.000Z' });

    render(<BandeauReseau enLigne />);

    expect(screen.getByRole('status')).toHaveTextContent(/10\/11\/2026/);
  });

  it('ne s’affiche pas en ligne', () => {
    const { container } = render(<BandeauReseau enLigne />);
    expect(container).toBeEmptyDOMElement();
  });
});
