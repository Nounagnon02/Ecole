/**
 * unwrap — Normalise les formes de réponse de l'API
 *
 * Le backend renvoie les listes sous plusieurs formes selon l'endpoint :
 *
 *   [...]                                  // tableau nu
 *   { success, data: [...] }               // enveloppe
 *   { data: [...], current_page, total }   // paginateur Laravel
 *   { success, data: { data: [...], … } }  // enveloppe + paginateur
 *
 * Lire `res.data.data` marche pour l'enveloppe mais renvoie l'objet
 * paginateur quand l'endpoint est paginé — et le `.filter()` suivant lève
 * « … is not a function ». Ces helpers rendent le site d'appel indifférent
 * à la forme.
 */

/**
 * Extrait le tableau d'éléments d'une réponse, quelle que soit sa forme.
 *
 * @param {unknown} payload  Le corps de la réponse (`res.data`).
 * @returns {Array} Toujours un tableau — vide si rien d'exploitable.
 */
export function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  // Enveloppe ou paginateur : on descend d'un niveau…
  if (Array.isArray(payload.data)) return payload.data;

  // …ou de deux (enveloppe contenant un paginateur).
  if (payload.data && typeof payload.data === 'object' && Array.isArray(payload.data.data)) {
    return payload.data.data;
  }

  return [];
}

/**
 * Extrait les métadonnées de pagination si l'endpoint en fournit.
 *
 * @param {unknown} payload  Le corps de la réponse (`res.data`).
 * @returns {{currentPage: number, lastPage: number, perPage: number, total: number}|null}
 */
export function unwrapPagination(payload) {
  const p = payload?.data?.current_page !== undefined ? payload.data : payload;

  if (!p || p.current_page === undefined) return null;

  return {
    currentPage: p.current_page,
    lastPage: p.last_page ?? 1,
    perPage: p.per_page ?? p.data?.length ?? 0,
    total: p.total ?? 0,
  };
}

export default unwrapList;
