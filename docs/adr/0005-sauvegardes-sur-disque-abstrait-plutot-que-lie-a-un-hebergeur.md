# ADR-0005 : Sauvegardes chiffrées sur disque abstrait (`Storage`), pas lié à un hébergeur

**Statut** : Acceptée
**Date** : 2026-09-20

## Contexte

Aucune stratégie de sauvegarde/reprise n'existait pour une plateforme qui
porte des paiements et des dossiers médicaux — une perte de données non
récupérable serait existentielle. Une commande `BackupDatabase` existait
déjà dans le dépôt mais n'était ni planifiée ni chiffrée. L'hébergement de
production n'est pas encore choisi (réponse explicite : « je ne sais pas
encore / à déterminer » quand la question a été posée directement).

## Décision

Les sauvegardes passent par l'abstraction de système de fichiers de
Laravel (`Storage::disk()`), avec `local` comme disque par défaut et `s3`
déjà configuré dans `config/filesystems.php` mais inactif. Changer
d'hébergement de production ne demande qu'un changement de
`BACKUP_DISK` en configuration, aucun changement de code. Le chiffrement
(AES-256-CBC via `openssl` en ligne de commande, en flux plutôt qu'en
mémoire) utilise une clé dédiée (`BACKUP_ENCRYPTION_KEY`), distincte
d'`APP_KEY` : une rotation d'`APP_KEY` ne doit jamais rendre les
sauvegardes existantes illisibles.

L'alternative — attendre le choix d'hébergement pour implémenter
directement contre lui (S3, un stockage propre à l'hébergeur...) — aurait
produit une solution plus simple mais bloquée tant que la décision
d'infrastructure n'est pas prise. Le disque abstrait permet de livrer la
protection maintenant, sans deviner une décision qui appartient à
l'utilisateur.

## Conséquences

Le paramétrage est vérifié en local (chiffrement, restauration prouvée
contre un vrai MySQL) mais aucun environnement de production réel ne
tourne encore dessus — la vérification en conditions réelles (débit
réseau vers S3, coût de stockage, fréquence de restauration testée en
production) reste à faire une fois l'hébergement choisi.

À revoir si : l'hébergement de production est décidé — c'est le signal
pour basculer `BACKUP_DISK=s3` (ou équivalent) et refaire l'exercice de
restauration trimestriel contre l'environnement réel, pas seulement contre
une base jetable locale.
