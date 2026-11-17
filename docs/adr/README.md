# Architecture Decision Records

Ce dossier garde une trace courte des décisions d'architecture qui ne se
justifient pas d'elles-mêmes en lisant le code : pourquoi une alternative
plus évidente n'a pas été retenue, et à quelles conditions revoir le choix.

Un ADR n'est pas un audit ni un plan — voir `docs/archive/` pour l'historique
des audits et `docs/reference/` pour la documentation technique. Un ADR
existant n'est jamais réécrit après coup pour paraître avoir eu raison
d'avance : s'il est dépassé, on le marque `Remplacé par ADR-00XX` et on en
écrit un nouveau.

## Index

| # | Titre | Statut |
|---|---|---|
| [0001](0001-cloisonnement-ecole-id-plutot-que-stancl-tenancy.md) | Cloisonnement multi-écoles par `ecole_id`, `stancl/tenancy` cantonné aux sous-domaines | Acceptée |
| [0002](0002-client-api-genere-plutot-que-migration-typescript.md) | Client API TypeScript généré depuis OpenAPI, pas de migration TypeScript complète | Acceptée |
| [0003](0003-adoption-progressive-de-react-query.md) | Adoption progressive de react-query, pas un remplacement en un passage | Acceptée |
| [0004](0004-2fa-obligatoire-par-role-pas-par-compte.md) | 2FA obligatoire par rôle, pas par compte individuel | Acceptée |
| [0005](0005-sauvegardes-sur-disque-abstrait-plutot-que-lie-a-un-hebergeur.md) | Sauvegardes chiffrées sur disque abstrait (`Storage`), pas lié à un hébergeur | Acceptée |

## Gabarit

```markdown
# ADR-00XX : Titre à l'impératif ou au principe retenu

**Statut** : Proposée / Acceptée / Remplacée par ADR-00YY
**Date** : AAAA-MM-JJ

## Contexte
Quel problème, quelles contraintes, quelles options réellement envisagées.

## Décision
Ce qui a été choisi, en une ou deux phrases nettes.

## Conséquences
Ce que ce choix facilite, ce qu'il rend plus difficile, et à quel signal
concret le revoir.
```
