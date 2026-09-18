# Migrations

Le schéma est capturé dans `database/schema/{mysql,sqlite}-schema.sql`
(générés par `php artisan schema:dump`), pas rejoué migration par migration.

Les 126 fichiers antérieurs au 18/09/2026 sont archivés sous
`database/migrations/archive/` — conservés pour l'historique, mais **jamais
exécutés** : Laravel ne scanne que `database/migrations/`, pas ses
sous-dossiers.

## Pourquoi

Un quart des 126 migrations d'origine réparait les précédentes (`ecole_id`
rétro-ajouté en trois passes, index de performance en trois passes,
soft-deletes en quatre vagues). Une installation neuve rejouait ce chemin
en entier pour arriver au même résultat qu'un chargement direct du schéma.

Vérifié avant l'archivage : `information_schema` (MySQL) et les `PRAGMA`
(SQLite) sont **structurellement identiques**, table par table — colonnes,
types, nullabilité, valeurs par défaut, index, clés étrangères — entre une
base migrée fichier par fichier et une base ayant chargé le dump. Les 467
tests passent à l'identique sur les deux moteurs.

## Ajouter une migration

Comme avant : un nouveau fichier dans `database/migrations/`, exécuté après
le chargement du dump. Une fois qu'elle est stable, refléter le nouvel état
dans le dump :

```bash
php artisan migrate
php artisan schema:dump          # sur la connexion mysql (config par defaut)
DB_CONNECTION=sqlite DB_DATABASE=/tmp/x.sqlite php artisan migrate:fresh && \
DB_CONNECTION=sqlite DB_DATABASE=/tmp/x.sqlite php artisan schema:dump
```

Les deux dumps doivent rester synchronisés : la suite de tests tourne sur
SQLite, la production sur MySQL — c'est justement l'écart que l'audit de
septembre 2026 a exploré en détail (P2.1).

## `migrate:status` ne liste plus rien après un `migrate:fresh`

Attendu : la commande compare les fichiers de `database/migrations/`
(désormais vide) à la table `migrations`. La table contient bien les 126
entrées historiques (chargées par le dump) ; `php artisan migrate` répond
correctement « Nothing to migrate ».
