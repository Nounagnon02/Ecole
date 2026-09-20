/**
 * Preuve à la compilation, pas à l'exécution : `tsc --noEmit` (script
 * `typecheck`) est le seul « lanceur » de ce fichier. `@ts-expect-error`
 * exige que la ligne suivante échoue à compiler ; si elle compile quand même
 * (le champ existe, ou le type s'est élargi en `any`), `tsc` échoue ici —
 * c'est le test.
 *
 * Le champ choisi n'est pas arbitraire : `class_id` au lieu de `classe_id`
 * (la vraie colonne, voir `Eleve` dans api-types.generated.ts) est
 * exactement le bug trouvé à la main dans ce dépôt pendant l'audit
 * (`QueuedJobSchoolContextTest.php`, `ExportReportJob`) — un filtre
 * silencieusement inopérant en attendant une `QueryException`. Un appel
 * passant par `EleveIndexResponse` rend cette classe de faute une erreur de
 * compilation plutôt qu'un bug découvert en production.
 */
import type { EleveIndexResponse } from './api-typed';

declare const reponse: EleveIndexResponse;

// Usage valide : le paginator Laravel réel, une classe (classe_id) parmi ses champs.
const premierEleve = reponse.data[0];
const classeId: number = premierEleve.classe_id;
void classeId;

// @ts-expect-error -- `class_id` n'existe pas sur Eleve (c'est `classe_id`) ; doit rester une erreur de compilation.
const mauvaisChamp = premierEleve.class_id;
void mauvaisChamp;

// @ts-expect-error -- `paths` ne connaît que les endpoints réels : un chemin inventé ne doit pas type-checker.
type Inexistant = import('./api-typed').JsonResponse<'/route-qui-nexiste-pas', 'get'>;
