<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Disque de destination
    |--------------------------------------------------------------------------
    |
    | N'importe quel disque de config/filesystems.php : `local` (par défaut,
    | pour ne rien casser tant que l'hébergement de production n'est pas
    | arrêté) ou `s3` (déjà configuré dans ce fichier, juste inactif) une fois
    | l'hébergement choisi. Un backup sur le même disque que la base qu'il
    | protège ne survit pas à la perte du serveur — passer à `s3` (ou tout
    | autre disque distant) dès qu'un hébergement est décidé n'exige aucun
    | changement de code, seulement `BACKUP_DISK=s3` dans `.env`.
    |
    */

    'disk' => env('BACKUP_DISK', 'local'),

    'path' => env('BACKUP_PATH', 'backups'),

    /*
    |--------------------------------------------------------------------------
    | Rétention
    |--------------------------------------------------------------------------
    */

    'retention_days' => (int) env('BACKUP_RETENTION_DAYS', 30),

    /*
    |--------------------------------------------------------------------------
    | Clé de chiffrement
    |--------------------------------------------------------------------------
    |
    | Symétrique (AES-256-CBC via OpenSSL), distincte d'APP_KEY : APP_KEY
    | chiffre les données applicatives (colonnes `Crypt::`, cookies de
    | session) et sa rotation invalide ces données existantes — les backups
    | doivent rester déchiffrables même après une rotation d'APP_KEY (l'un
    | des cas où une rotation est justement nécessaire, cf.
    | docs/production-secrets.md). Générer avec `openssl rand -base64 32`.
    |
    | Cette base contient des paiements et des dossiers médicaux (voir le
    | plan d'ajouts, dimension Sécurité) : un backup en clair vaut, pour qui
    | y accède, un accès à toute la base — que ce soit un disque volé, un
    | bucket mal configuré, ou un accès du support de l'hébergeur.
    |
    */

    'encryption_key' => env('BACKUP_ENCRYPTION_KEY'),

];
