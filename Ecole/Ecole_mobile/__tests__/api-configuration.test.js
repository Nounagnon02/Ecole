/**
 * Adresse de l'API (anomalie R-12, recette du 14/11/2026).
 *
 * En production, l'adresse par défaut était https://api.erudit.bj/api : un
 * domaine de l'ancienne marque, que rien ne garantit appartenir à l'école,
 * qui aurait reçu les identifiants. Sans adresse configurée à la
 * construction, l'application ne vise aucun serveur et le dit.
 */
import { urlApi } from '../constants/api';
import { api } from '../src/services/api';

describe('adresse de l’API', () => {
  it('ne vise aucun domaine par défaut en production', () => {
    expect(urlApi(undefined, false)).toBe('');
    expect(urlApi('', false)).toBe('');
  });

  it('utilise l’adresse fournie à la construction, et localhost en développement', () => {
    expect(urlApi('https://api.ecole.example/api', false)).toBe('https://api.ecole.example/api');
    expect(urlApi(undefined, true)).toBe('http://localhost:8000/api');
  });

  it('refuse toute requête sans adresse, avec un message explicite', async () => {
    const avant = api.defaults.baseURL;
    api.defaults.baseURL = '';
    try {
      await expect(api.get('/parent/enfants')).rejects.toMatchObject({ code: 'API_NON_CONFIGUREE' });
    } finally {
      api.defaults.baseURL = avant;
    }
  });

  it('ne rejoue pas un envoi (POST) après une coupure réseau', async () => {
    // Erreur réseau telle qu'Axios la produit : sans réponse, avec la requête d'origine.
    const adaptateur = jest.fn((config) => Promise.reject(Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK', config, isAxiosError: true })));
    await expect(api.post('/messages', { contenu: 'x' }, { adapter: adaptateur })).rejects.toBeTruthy();
    expect(adaptateur).toHaveBeenCalledTimes(1);
  }, 15000);
});
