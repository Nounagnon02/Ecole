# ADR-0001 : Cloisonnement multi-écoles par `ecole_id`, `stancl/tenancy` cantonné aux sous-domaines

**Statut** : Acceptée
**Date** : 2026-09-20

## Contexte

Le dépôt porte deux mécanismes de multi-tenance en parallèle :

- une colonne `ecole_id` sur la majorité des tables, appliquée par le trait
  maison `BelongsToEcole` (scope global, *fail-closed* : sans école
  résolue, `whereRaw('1 = 0')` plutôt que tout exposer) ;
- `stancl/tenancy`, une base de données par établissement via sous-domaine,
  avec ses propres routes (`routes/tenant.php`) et son propre modèle
  `Tenant`.

Un audit a trouvé que `routes/tenant.php` réexposait des ressources
sensibles (élèves, notes, classes) avec pour seule garde `auth:sanctum`,
alors que la surface principale (`routes/api/`) les protège par des
`role:` explicites. Sur un sous-domaine tenant, n'importe quel compte
authentifié — un élève — pouvait donc écrire des notes ou modifier une
fiche élève. Aucun domaine tenant n'était provisionné en production au
moment de l'audit, ce qui rendait la faille inatteignable dans les faits,
mais les tables `tenants`/`domains` existaient : la bombe à retardement
n'était pas théorique.

Deux options ont été considérées : retirer `stancl/tenancy` et
`routes/tenant.php` entièrement, ou aligner leurs gardes sur celles de la
surface principale.

## Décision

`stancl/tenancy` est conservé, mais son usage réel se limite à une surface
legacy (`routes/tenant.php`) désormais alignée sur les mêmes `role:` que
`routes/api/*.php` — la garde la plus restrictive fait foi des deux côtés.
`ecole_id` + `BelongsToEcole` reste le mécanisme de cloisonnement qui
compte réellement : 71 modèles sur 82 le portent, contre un usage de
`stancl/tenancy` qui n'a jamais dépassé le stade de squelette configuré.

Le retrait pur et simple aurait été plus propre à long terme, mais
représentait un chantier de retrait de dépendance (migrations, config,
modèle `Tenant`, routes) sans bénéfice de sécurité immédiat une fois les
gardes alignées — le risque concret (A4) était fermé par le changement le
plus petit qui le fermait vraiment.

## Conséquences

Deux modèles mentaux de multi-tenance coexistent dans le code, ce qui
coûte en lisibilité à quiconque découvre le dépôt : il faut savoir que
`ecole_id` est le mécanisme qui compte, et que `stancl/tenancy` n'est pas
mort mais n'est pas non plus la voie principale.

À revoir si : un domaine tenant est un jour réellement provisionné en
production (le retrait devient alors une vraie décision produit, pas
seulement technique), ou si une seconde faille du même type apparaît sur
`routes/tenant.php` — signe que « aligner les gardes au coup par coup »
ne suffit plus et qu'il faut trancher pour de bon.
