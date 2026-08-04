/**
 * api-client — Intercepteurs : normalisation des erreurs et purge de session
 *
 * Tout appel API du produit traverse ces intercepteurs. Si la forme de
 * l'erreur rejetée change, chaque page qui lit `err.message` affiche
 * « Une erreur est survenue » à la place du message serveur.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import apiClient, { api } from '@/shared/lib/api-client';
import useAuthStore from '@/shared/stores/auth-store';
import { installHttpMock } from './helpers/http-mock';

let http;

beforeEach(() => {
  http = installHttpMock();
  useAuthStore.setState({
    user: { id: 1, name: 'Test', role: 'directeur' },
    isAuthenticated: true,
    isLoading: false,
    sessionLastVerified: Date.now(),
  });
});

afterEach(() => {
  http.restore();
});

describe('configuration de l’instance', () => {
  it('cible /api et envoie les cookies de session', () => {
    // Le backend authentifie le web par cookie httpOnly : sans
    // withCredentials, la session Sanctum n'est jamais transmise.
    expect(apiClient.defaults.baseURL).toBe('/api');
    expect(apiClient.defaults.withCredentials).toBe(true);
  });
});

describe('normalisation des erreurs', () => {
  it('expose le message serveur sur un 422 de validation', async () => {
    http.onPost('/eleves').reply(422, {
      message: 'Les données fournies sont invalides.',
      errors: { email: ['Cet email est déjà utilisé.'] },
    });

    const err = await api.post('/eleves', { email: 'a@b.c' }).catch((e) => e);

    expect(err.status).toBe(422);
    expect(err.message).toBe('Les données fournies sont invalides.');
  });

  it('conserve les erreurs de validation par champ', async () => {
    // Toute la couche formulaire lit `err.response.data.errors` pour
    // marquer les champs fautifs. Sans cette conservation, la branche
    // ne s'exécute jamais et l'utilisateur ne sait pas quel champ corriger.
    http.onPost('/auth/login').reply(422, {
      message: 'Les données fournies sont invalides.',
      errors: { email: ['Le champ email est obligatoire.'] },
    });

    const err = await api.post('/auth/login', {}).catch((e) => e);

    expect(err.errors).toEqual({ email: ['Le champ email est obligatoire.'] });
    expect(err.response?.data?.errors).toEqual({ email: ['Le champ email est obligatoire.'] });
    expect(err.response?.status).toBe(422);
  });

  it('laisse `errors` à null quand le serveur n’envoie pas de validation', async () => {
    http.onGet('/eleves').reply(500, { message: 'Server Error' });

    const err = await api.get('/eleves').catch((e) => e);

    expect(err.errors).toBeNull();
  });

  it('remonte un 403 avec son statut et son message', async () => {
    http.onGet('/comptable/paiements').reply(403, { message: 'Action non autorisée.' });

    const err = await api.get('/comptable/paiements').catch((e) => e);

    expect(err.status).toBe(403);
    expect(err.message).toBe('Action non autorisée.');
  });

  it('remonte un 404 distinctement d’une liste vide', async () => {
    http.onGet('/eleves/999').reply(404, { message: 'Élève introuvable.' });

    const err = await api.get('/eleves/999').catch((e) => e);

    expect(err.status).toBe(404);
    expect(err.message).toBe('Élève introuvable.');
  });

  it('remonte un 500 sans masquer le message', async () => {
    http.onGet('/dashboard/directeur/data').reply(500, { message: 'Server Error' });

    const err = await api.get('/dashboard/directeur/data').catch((e) => e);

    expect(err.status).toBe(500);
    expect(err.message).toBe('Server Error');
  });

  it('donne status 0 sur erreur réseau — pas un faux 200', async () => {
    http.onGet('/notes').networkError('Network Error');

    const err = await api.get('/notes').catch((e) => e);

    expect(err.status).toBe(0);
    expect(err.code).toBe('UNKNOWN_ERROR');
    expect(err.message).toBe('Network Error');
    expect(err.response).toBeUndefined();
  });

  it('préfère l’enveloppe error.{code,message,details} quand elle existe', async () => {
    http.onGet('/paiements').reply(400, {
      error: {
        code: 'PAYMENT_DECLINED',
        message: 'Paiement refusé par l’opérateur.',
        details: [{ field: 'montant', reason: 'insuffisant' }],
      },
    });

    const err = await api.get('/paiements').catch((e) => e);

    expect(err.code).toBe('PAYMENT_DECLINED');
    expect(err.message).toBe('Paiement refusé par l’opérateur.');
    expect(err.details).toHaveLength(1);
  });

  it('fournit un message par défaut quand le serveur n’en donne aucun', async () => {
    http.onGet('/matieres').reply(500, {});

    const err = await api.get('/matieres').catch((e) => e);

    // Axios fabrique « Request failed with status code 500 » : le
    // contrat est qu'un message non vide est toujours présent.
    expect(err.message).toBeTruthy();
    expect(typeof err.message).toBe('string');
  });

  it('ne rejette jamais un objet Error brut sans statut', async () => {
    http.onGet('/classes').reply(500, { message: 'nope' });

    const err = await api.get('/classes').catch((e) => e);

    expect(err).toHaveProperty('status');
    expect(err).toHaveProperty('code');
    expect(err).toHaveProperty('message');
    expect(err).toHaveProperty('details');
  });
});

describe('401 — session expirée', () => {
  it('purge la session locale', async () => {
    http.onGet('/eleves').reply(401, { message: 'Unauthenticated.' });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    const err = await api.get('/eleves').catch((e) => e);

    expect(err.status).toBe(401);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('ne purge pas la session sur un 403 (droits insuffisants ≠ session morte)', async () => {
    http.onGet('/admin/ecoles').reply(403, { message: 'Interdit.' });

    await api.get('/admin/ecoles').catch(() => {});

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});

describe('succès', () => {
  it('retourne le corps de la réponse tel quel', async () => {
    http.onGet('/classes').reply(200, { success: true, data: [{ id: 1, nom_classe: '6e A' }] });

    const res = await api.get('/classes');

    expect(res.status).toBe(200);
    expect(res.data.data).toHaveLength(1);
  });

  it('transmet le corps envoyé en POST', async () => {
    http.onPost('/notes').reply(201, { id: 7 });

    await api.post('/notes', { eleve_id: 3, valeur: 15 });

    expect(http.callsTo('post', '/notes')[0].body).toEqual({ eleve_id: 3, valeur: 15 });
  });
});
