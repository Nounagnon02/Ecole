# ADR-0002 : Client API TypeScript généré depuis OpenAPI, pas de migration TypeScript complète

**Statut** : Acceptée
**Date** : 2026-09-20

## Contexte

Plusieurs bugs trouvés pendant cet engagement venaient du frontend
supposant une forme de réponse fausse (`res.data.data` fouillé à la main,
un champ renommé côté backend sans que le front le sache). Le frontend est
entièrement en `.jsx` — zéro `.ts`, zéro `tsconfig.json` avant ce chantier
— et compte ~50 pages. Une migration TypeScript complète aurait éliminé
cette classe de bug à la racine, mais représente un chantier de plusieurs
semaines sur un code qui fonctionne.

La documentation OpenAPI du backend (Scramble) existait déjà et couvrait
315 endpoints une fois un bug de configuration corrigé (`api_path` mal
réglé, 0 route documentée malgré une génération sans erreur).

## Décision

Générer un client TypeScript typé (`openapi-typescript`) depuis le
schéma OpenAPI existant, et l'utiliser uniquement pour les nouveaux appels
et les points chauds identifiés — pas une conversion des ~50 pages
`.jsx` existantes. Le `tsconfig.json` reste volontairement étroit (les
fichiers du client généré et sa fine enveloppe typée, pas l'arborescence
`src/app/**`).

Ce choix élimine la classe de bug precise trouvée (forme de réponse
supposée à tort) au moment où le contrat change, sans payer le coût d'une
migration complète dont la valeur marginale sur du code déjà stable et
testé est plus faible.

## Conséquences

Le typage protège les nouveaux appels API mais pas le reste du frontend :
un bug de forme de données dans une page `.jsx` existante qui n'a pas
encore été touchée reste possible. La preuve de valeur du client généré
est un test de compilation dédié (`api-typed.test-d.ts`) qui vérifie qu'un
champ renommé côté backend (`classe_id` vs `class_id`, le bug réel qui a
motivé ce chantier) casse la compilation plutôt que de rester silencieux.

À revoir si : la proportion de code neuf en `.ts`/`.tsx` dépasse un seuil
qui justifierait d'étendre `tsconfig.json` à d'autres dossiers, page par
page plutôt qu'en un seul passage.
