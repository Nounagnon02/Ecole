/**
 * useApi / useCrud / useForm — hooks au centre de tous les appels API
 *
 * Une bonne moitié des pages du produit lit `loading` et `error` de ce
 * hook. Si `error` reste null sur un 500, la page affiche « aucune
 * donnée » et l'utilisateur croit sa liste vide.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApi, useCrud, useForm } from '@/hooks/useApi';
import { installHttpMock } from './helpers/http-mock';

let http;

beforeEach(() => {
  http = installHttpMock();
  // logger.error écrit en console : on la neutralise sans masquer les échecs.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  http.restore();
  vi.restoreAllMocks();
});

describe('useApi — état initial', () => {
  it('démarre sans chargement ni erreur, et expose les 5 verbes', () => {
    const { result } = renderHook(() => useApi());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    for (const verb of ['get', 'post', 'put', 'patch', 'delete']) {
      expect(typeof result.current[verb], `${verb} manquant`).toBe('function');
    }
  });
});

describe('useApi — succès', () => {
  it('bascule loading pendant l’appel puis le remet à false', async () => {
    http.onGet('/classes').reply(200, { data: [{ id: 1 }] });
    const { result } = renderHook(() => useApi());

    let promise;
    act(() => {
      promise = result.current.get('/classes');
    });
    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => {
      await promise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('retourne la réponse axios complète', async () => {
    http.onGet('/classes').reply(200, { data: [{ id: 1, nom_classe: '6e A' }] });
    const { result } = renderHook(() => useApi());

    let res;
    await act(async () => {
      res = await result.current.get('/classes');
    });

    expect(res.status).toBe(200);
    expect(res.data.data[0].nom_classe).toBe('6e A');
  });

  it('expose patch — plusieurs endpoints SaaS n’acceptent que ce verbe', async () => {
    http.onPatch('/v1/admin/tenants/7/settings').reply(200, { ok: true });
    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.patch('/v1/admin/tenants/7/settings', { locale: 'fr' });
    });

    expect(http.callsTo('patch', '/v1/admin/tenants/7/settings')[0].body).toEqual({ locale: 'fr' });
  });
});

describe('useApi — chemins d’erreur', () => {
  it.each([
    [401, 'Session expirée.'],
    [403, 'Action non autorisée.'],
    [404, 'Ressource introuvable.'],
    [500, 'Erreur interne du serveur.'],
  ])('renseigne error sur %i avec le message du serveur', async (status, message) => {
    http.onGet('/eleves').reply(status, { message });
    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.get('/eleves').catch(() => {});
    });

    expect(result.current.error).toBe(message);
    expect(result.current.loading).toBe(false);
  });

  it('renseigne error sur erreur réseau', async () => {
    http.onGet('/eleves').networkError('Network Error');
    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.get('/eleves').catch(() => {});
    });

    expect(result.current.error).toBe('Network Error');
  });

  it('relance l’erreur pour que l’appelant puisse la traiter', async () => {
    http.onGet('/eleves').reply(500, { message: 'Boom' });
    const { result } = renderHook(() => useApi());

    let caught = null;
    await act(async () => {
      caught = await result.current.get('/eleves').then(() => null, (e) => e);
    });

    expect(caught).not.toBeNull();
    expect(caught.status).toBe(500);
  });

  it('remet error à null au début de l’appel suivant', async () => {
    http.onGet('/eleves').reply(500, { message: 'Boom' });
    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.get('/eleves').catch(() => {});
    });
    expect(result.current.error).toBe('Boom');

    http.onGet('/eleves').reply(200, []);
    await act(async () => {
      await result.current.get('/eleves');
    });

    expect(result.current.error).toBeNull();
  });

  it('clearError() efface le message', async () => {
    http.onGet('/eleves').reply(500, { message: 'Boom' });
    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.get('/eleves').catch(() => {});
    });
    act(() => result.current.clearError());

    expect(result.current.error).toBeNull();
  });

  it('n’expose jamais qu’une chaîne dans error, même sur l’enveloppe { error: { … } }', async () => {
    // La surface /api/v1 répond `{ error: { code, message } }`. Un objet
    // placé dans `error` fait lever à React « Objects are not valid as a
    // React child » : la page blanchit au lieu d'afficher l'échec.
    http.onGet('/v1/admin/plans').reply(500, {
      error: { code: 'INTERNAL', message: 'Panne interne' },
    });
    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.get('/v1/admin/plans').catch(() => {});
    });

    expect(typeof result.current.error).toBe('string');
    expect(result.current.error).toBe('Panne interne');
  });

  it('accepte encore `error` sous forme de chaîne nue', async () => {
    http.onGet('/notes').reply(400, { error: 'Requête malformée' });
    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.get('/notes').catch(() => {});
    });

    expect(result.current.error).toBe('Requête malformée');
  });

  it('ne laisse jamais error à null après un échec — sinon la page dit « vide »', async () => {
    for (const status of [400, 401, 403, 404, 409, 422, 500, 503]) {
      http.reset();
      http.onGet('/notes').reply(status, {});
      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.get('/notes').catch(() => {});
      });

      expect(result.current.error, `error null pour ${status}`).toBeTruthy();
    }
  });
});

describe('useCrud', () => {
  it('charge une liste et la met à disposition', async () => {
    http.onGet('/matieres').reply(200, [{ id: 1, nom: 'Maths' }]);
    const { result } = renderHook(() => useCrud('/matieres'));

    await act(async () => {
      await result.current.fetchAll();
    });

    expect(result.current.data).toEqual([{ id: 1, nom: 'Maths' }]);
    expect(result.current.error).toBeNull();
  });

  it('vide la liste et remonte l’erreur en cas d’échec', async () => {
    http.onGet('/matieres').reply(500, { message: 'Indisponible' });
    const { result } = renderHook(() => useCrud('/matieres'));

    await act(async () => {
      await result.current.fetchAll().catch(() => {});
    });

    expect(result.current.data).toEqual([]);
    // La distinction est capitale : liste vide *avec* erreur ≠ liste vide.
    expect(result.current.error).toBe('Indisponible');
  });

  it('charge un élément unique', async () => {
    http.onGet('/matieres/4').reply(200, { id: 4, nom: 'Physique' });
    const { result } = renderHook(() => useCrud('/matieres'));

    await act(async () => {
      await result.current.fetchOne(4);
    });

    expect(result.current.item).toEqual({ id: 4, nom: 'Physique' });
  });

  it('remet item à null sur 404', async () => {
    http.onGet('/matieres/999').reply(404, { message: 'Introuvable' });
    const { result } = renderHook(() => useCrud('/matieres'));

    await act(async () => {
      await result.current.fetchOne(999).catch(() => {});
    });

    expect(result.current.item).toBeNull();
    expect(result.current.error).toBe('Introuvable');
  });

  it('supprime l’élément de la liste locale après un DELETE réussi', async () => {
    http.onGet('/matieres').reply(200, [{ id: 1 }, { id: 2 }]);
    http.onDelete('/matieres/1').reply(204, null);
    const { result } = renderHook(() => useCrud('/matieres'));

    await act(async () => {
      await result.current.fetchAll();
    });
    await act(async () => {
      await result.current.remove(1);
    });

    expect(result.current.data).toEqual([{ id: 2 }]);
  });

  it('ne touche pas la liste locale quand le DELETE échoue', async () => {
    http.onGet('/matieres').reply(200, [{ id: 1 }, { id: 2 }]);
    http.onDelete('/matieres/1').reply(403, { message: 'Interdit' });
    const { result } = renderHook(() => useCrud('/matieres'));

    await act(async () => {
      await result.current.fetchAll();
    });
    await act(async () => {
      await result.current.remove(1).catch(() => {});
    });

    expect(result.current.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.current.error).toBe('Interdit');
  });
});

describe('useForm', () => {
  it('met à jour les champs et remonte les valeurs à la soumission', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useForm({ nom: '' }, onSubmit));

    act(() => {
      result.current.handleChange({ target: { name: 'nom', value: 'Kossi', type: 'text' } });
    });
    expect(result.current.formData.nom).toBe('Kossi');

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: () => {} });
    });

    expect(onSubmit).toHaveBeenCalledWith({ nom: 'Kossi' });
  });

  it('gère les cases à cocher via `checked`', () => {
    const { result } = renderHook(() => useForm({ actif: false }, vi.fn()));

    act(() => {
      result.current.handleChange({ target: { name: 'actif', checked: true, type: 'checkbox' } });
    });

    expect(result.current.formData.actif).toBe(true);
  });

  it('mappe les erreurs de validation du serveur sur les champs', async () => {
    // Ce chemin dépend de la présence de `err.errors` dans l'objet d'erreur
    // standardisé retourné par l'intercepteur API.
    http.onPost('/eleves').reply(422, {
      message: 'Invalide',
      errors: { nom: ['Le nom est obligatoire.'] },
    });
    const { api } = await import('@/shared/lib/api-client');
    const onSubmit = (data) => api.post('/eleves', data);
    const { result } = renderHook(() => useForm({ nom: '' }, onSubmit));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: () => {} }).catch(() => {});
    });

    expect(result.current.errors).toEqual({ nom: ['Le nom est obligatoire.'] });
    expect(result.current.isSubmitting).toBe(false);
  });

  it('reset() restaure les valeurs initiales et vide les erreurs', () => {
    const { result } = renderHook(() => useForm({ nom: 'initial' }, vi.fn()));

    act(() => {
      result.current.handleChange({ target: { name: 'nom', value: 'modifié', type: 'text' } });
      result.current.setErrors({ nom: 'oops' });
    });
    act(() => result.current.reset());

    expect(result.current.formData).toEqual({ nom: 'initial' });
    expect(result.current.errors).toEqual({});
  });
});
