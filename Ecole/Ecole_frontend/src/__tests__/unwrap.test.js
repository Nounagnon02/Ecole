/**
 * unwrap — Normalisation des formes de réponse de l'API
 *
 * Le backend renvoie les listes sous quatre formes différentes selon
 * l'endpoint. Une régression ici transforme un `.filter()` en
 * « … is not a function » et vide un écran entier.
 */

import { describe, it, expect } from 'vitest';
import unwrapDefault, { unwrapList, unwrapPagination } from '@/shared/lib/unwrap';

describe('unwrapList()', () => {
  it('accepte un tableau nu', () => {
    expect(unwrapList([{ id: 1 }, { id: 2 }])).toHaveLength(2);
  });

  it('descend dans une enveloppe { success, data: [...] }', () => {
    expect(unwrapList({ success: true, data: [{ id: 1 }] })).toEqual([{ id: 1 }]);
  });

  it('descend dans un paginateur Laravel { data: [...], current_page }', () => {
    const payload = { current_page: 2, last_page: 5, per_page: 15, total: 70, data: [{ id: 9 }] };
    expect(unwrapList(payload)).toEqual([{ id: 9 }]);
  });

  it('descend de deux niveaux : enveloppe contenant un paginateur', () => {
    const payload = { success: true, data: { current_page: 1, total: 1, data: [{ id: 42 }] } };
    expect(unwrapList(payload)).toEqual([{ id: 42 }]);
  });

  it('rend toujours un tableau — jamais l’objet paginateur', () => {
    const payload = { data: { current_page: 1, data: [] } };
    const result = unwrapList(payload);
    expect(Array.isArray(result)).toBe(true);
    // Le piège historique : `res.data.data` renvoyait ici le paginateur.
    expect(result).not.toHaveProperty('current_page');
  });

  it('rend un tableau vide pour null, undefined, une chaîne ou un nombre', () => {
    for (const bad of [null, undefined, '', 'oops', 0, 12, true]) {
      expect(unwrapList(bad)).toEqual([]);
    }
  });

  it('rend un tableau vide quand data n’est pas une liste', () => {
    expect(unwrapList({ data: { id: 1 } })).toEqual([]);
    expect(unwrapList({ message: 'Erreur' })).toEqual([]);
  });

  it('est aussi l’export par défaut', () => {
    expect(unwrapDefault).toBe(unwrapList);
  });
});

describe('unwrapPagination()', () => {
  it('lit un paginateur au premier niveau', () => {
    const payload = { current_page: 3, last_page: 7, per_page: 20, total: 132, data: [] };
    expect(unwrapPagination(payload)).toEqual({
      currentPage: 3,
      lastPage: 7,
      perPage: 20,
      total: 132,
    });
  });

  it('lit un paginateur enveloppé', () => {
    const payload = { success: true, data: { current_page: 1, last_page: 2, per_page: 10, total: 15, data: [] } };
    expect(unwrapPagination(payload)).toMatchObject({ currentPage: 1, lastPage: 2, total: 15 });
  });

  it('rend null quand l’endpoint n’est pas paginé', () => {
    expect(unwrapPagination([{ id: 1 }])).toBeNull();
    expect(unwrapPagination({ success: true, data: [{ id: 1 }] })).toBeNull();
    expect(unwrapPagination(null)).toBeNull();
    expect(unwrapPagination(undefined)).toBeNull();
  });

  it('applique des valeurs de repli sur les champs absents', () => {
    const result = unwrapPagination({ current_page: 1, data: [{ id: 1 }, { id: 2 }] });
    expect(result).toEqual({ currentPage: 1, lastPage: 1, perPage: 2, total: 0 });
  });
});
