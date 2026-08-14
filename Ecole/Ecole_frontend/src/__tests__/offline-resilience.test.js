/**
 * Résilience au stockage indisponible
 *
 * IndexedDB peut manquer ou être refusé : navigation privée Safari,
 * webview restreinte, stockage bloqué par l'utilisateur. Le cache et la
 * file hors-ligne sont des conforts — leur échec ne doit ni casser les
 * appels API, ni produire de rejet non capturé au démarrage.
 *
 * Ce fichier s'exécute dans un jsdom sans IndexedDB, ce qui est
 * exactement le cas dégradé à couvrir.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api } from '@/shared/lib/api-client';
import { cacheGet, cacheSet, cacheClear, queueMutation } from '@/shared/lib/db';
import { processQueue, startOfflineSync } from '@/shared/lib/offline-queue';
import { installHttpMock } from './helpers/http-mock';

let http;

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  http.restore();
  vi.restoreAllMocks();
});

describe('db — absence d’IndexedDB', () => {
  it('n’existe effectivement pas dans cet environnement', () => {
    expect(typeof indexedDB).toBe('undefined');
  });

  it('rejette avec une Error explicite, pas une ReferenceError', async () => {
    const err = await cacheSet('k', { a: 1 }).catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(ReferenceError);
    expect(err.message).toMatch(/IndexedDB/i);
  });

  it('rejette de la même façon en lecture et en purge', async () => {
    await expect(cacheGet('k')).rejects.toThrow(/IndexedDB/i);
    await expect(cacheClear()).rejects.toThrow(/IndexedDB/i);
    await expect(queueMutation('POST', '/notes', {})).rejects.toThrow(/IndexedDB/i);
  });
});

describe('api-client — le cache ne doit pas casser les appels', () => {
  it('un GET réussit malgré l’impossibilité de mettre en cache', async () => {
    // L'intercepteur de réponse écrit dans le cache : si cette écriture
    // remontait, chaque GET échouerait dans un navigateur sans IDB.
    http.onGet('/classes').reply(200, [{ id: 1, nom_classe: '6e A' }]);

    const res = await api.get('/classes');

    expect(res.status).toBe(200);
    expect(res.data).toHaveLength(1);
  });

  it('une erreur reste normalisée malgré l’absence de cache', async () => {
    http.onGet('/classes').reply(500, { message: 'Boom' });

    const err = await api.get('/classes').catch((e) => e);

    expect(err.status).toBe(500);
    expect(err.message).toBe('Boom');
  });
});

describe('offline-queue — appelé sans await', () => {
  it('processQueue() se résout au lieu de rejeter', async () => {
    // `startOfflineSync` et l'écouteur `online` l'appellent sans await :
    // un rejet ici devient une unhandled rejection à chaque démarrage.
    await expect(processQueue()).resolves.toBeUndefined();
  });

  it('processQueue() reste appelable plusieurs fois d’affilée', async () => {
    await expect(processQueue()).resolves.toBeUndefined();
    await expect(processQueue()).resolves.toBeUndefined();
  });

  it('startOfflineSync() s’installe, ne jette pas et rend un nettoyage', async () => {
    let cleanup;
    expect(() => {
      cleanup = startOfflineSync();
    }).not.toThrow();
    expect(typeof cleanup).toBe('function');

    // Un passage en ligne déclenche un traitement de file : il doit rester muet.
    window.dispatchEvent(new Event('online'));
    await Promise.resolve();

    expect(() => cleanup()).not.toThrow();
  });
});
