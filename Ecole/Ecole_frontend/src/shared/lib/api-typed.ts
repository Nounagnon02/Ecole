/**
 * Enveloppe typée sur `api-client.js` — pas un nouveau client HTTP.
 *
 * `api-client.js` reste la seule chose qui parle vraiment au réseau
 * (intercepteurs, cache IndexedDB avec TTL, file hors-ligne, retry sur 429,
 * normalisation d'erreurs — voir son en-tête). Ce fichier ajoute uniquement
 * un typage compile-time par-dessus, dérivé du schéma OpenAPI que Scramble
 * génère depuis les contrôleurs réels (`openapi/schema.json`, régénéré par
 * `npm run generate:api-client`).
 *
 * Ce que ça remplace, précisément : `unwrap.js` (`unwrapList`,
 * `unwrapPagination`) devine la forme d'une réponse à l'exécution parce que
 * rien ne garantissait avant quelle forme un endpoint donné renvoie
 * réellement. Un appel passant par ce fichier connaît cette forme à la
 * compilation — plus besoin de deviner pour les endpoints couverts ici.
 * `unwrap.js` reste nécessaire pour tout le reste du code non migré.
 */
import { api } from './api-client';
import type { paths } from './api-types.generated';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * Corps JSON d'une réponse réussie (200 par défaut) pour `Path`/`Method`,
 * tel qu'inféré par Scramble depuis le type de retour réel du contrôleur.
 */
export type JsonResponse<
  Path extends keyof paths,
  Method extends HttpMethod,
  Status extends number = 200,
> = Method extends keyof paths[Path]
  ? paths[Path][Method] extends { responses: Record<Status, { content: { 'application/json': infer Body } }> }
    ? Body
    : never
  : never;

/**
 * GET /eleves (liste paginée, rôle Admin).
 *
 * Démonstration concrète : `EleveIndexResponse` est le paginator Laravel réel
 * (`current_page`, `data: Eleve[]`, `total`, ...) — pas une supposition.
 * Un renommage de champ côté contrôleur, ou un changement de forme de
 * réponse, se voit ici à la prochaine régénération sans attendre un bug en
 * production.
 */
export type EleveIndexResponse = JsonResponse<'/eleves', 'get'>;

export async function getEleves(): Promise<EleveIndexResponse> {
  const { data } = await api.get('/eleves');
  return data as EleveIndexResponse;
}
