# Sauvegardes

`backup:run` (planifiée quotidiennement à 2h, voir `bootstrap/app.php`) :
dump de la base (`mysqldump` en production, copie de fichier en SQLite) →
compression gzip → chiffrement AES-256-CBC (OpenSSL, clé dédiée) → envoi sur
le disque configuré (`config/backup.php`) → suppression de tout fichier local
intermédiaire, y compris le dump en clair.

## Configuration

```bash
# .env
BACKUP_DISK=local              # ou `s3` (déjà configuré dans config/filesystems.php)
BACKUP_PATH=backups
BACKUP_RETENTION_DAYS=30
BACKUP_ENCRYPTION_KEY=          # openssl rand -base64 32
```

`BACKUP_DISK=local` place les sauvegardes sur le même disque que
l'application — acceptable tant que l'hébergement n'est pas encore choisi,
mais ne protège pas contre la perte du serveur lui-même. Passer à `s3` (ou
tout autre disque distant de `config/filesystems.php`) une fois un
hébergement décidé ne demande aucun changement de code.

`BACKUP_ENCRYPTION_KEY` est **distincte** d'`APP_KEY` : une rotation
d'`APP_KEY` (voir `docs/production-secrets.md`) ne doit jamais rendre les
sauvegardes existantes illisibles.

## Restaurer une sauvegarde

```bash
php artisan backup:restore <nom_du_fichier> --database=<base_de_verification>
```

`--database` est obligatoire et doit nommer une base **différente** de celle
configurée pour l'application — `--force` est requis pour écraser la base
réelle, un garde-fou volontaire contre une restauration accidentelle par-dessus
des données en production.

## Exercice de restauration trimestriel

Une sauvegarde jamais restaurée n'est qu'une hypothèse. Tous les trimestres :

1. Lister les sauvegardes disponibles sur le disque configuré.
2. Restaurer la plus récente vers une base de vérification dédiée
   (`--database=ecole_verif_trimestrielle`, jamais la base réelle).
3. Vérifier que les données restaurées sont cohérentes (nombre de lignes sur
   quelques tables clés, dernière date de paiement, etc.).
4. Supprimer la base de vérification.
5. Noter la date de l'exercice et son résultat quelque part de traçable
   (ce fichier, un ticket, un canal d'astreinte).

## Vérification automatisée

`tests/Feature/BackupRestoreTest.php` exerce le cycle complet
(sauvegarde → vérification du chiffrement → restauration → vérification du
contenu) contre un vrai serveur MySQL, jamais SQLite : ce sont `mysqldump` et
`mysql` en ligne de commande qui tournent réellement en production, un test
qui ne passerait que sur SQLite ne prouverait rien sur eux.

La suite de tests tourne sur SQLite par défaut (`phpunit.xml`) et ne charge
pas `.env` : sans identifiants MySQL réels fournis explicitement, ce test se
saute silencieusement plutôt que d'échouer. Pour l'exécuter pour de vrai :

```bash
DB_HOST=127.0.0.1 DB_PORT=3306 DB_USERNAME=<utilisateur> DB_PASSWORD=<mot_de_passe> \
  php artisan test tests/Feature/BackupRestoreTest.php
```

Il crée et supprime deux bases jetables (`ecole_backup_test_source`,
`ecole_backup_test_restore`) — jamais la base réelle de développement.
