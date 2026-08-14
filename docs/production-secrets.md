# Gestion des secrets en production

## 🔴 À TRAITER EN PRIORITÉ — secrets compromis

Ce document contenait lui-même, en clair et versionné dans Git, le mot de passe
de la base de production et l'`APP_KEY` de l'application. Les valeurs ont été
retirées du fichier, **mais elles restent dans l'historique Git** : tout accès
au dépôt, présent ou passé, les expose.

Les deux doivent être considérés comme **compromis** et changés :

| Secret | Portée du risque | Action |
|---|---|---|
| `DB_PASSWORD` | Accès complet en lecture/écriture à la base | Changer sur le serveur, puis mettre à jour le gestionnaire de secrets |
| `APP_KEY` | Déchiffre et **forge** les cookies de session et toute donnée `Crypt::` | Régénérer (`php artisan key:generate`). Invalide toutes les sessions — prévoir la reconnexion des utilisateurs |

Le même mot de passe figurait aussi dans `Ecole_backend/.env.testing`, également
versionné (retiré depuis).

Purger l'historique (`git filter-repo`, ou BFG) réduit l'exposition future mais
**ne remplace pas la rotation** : les valeurs ont déjà pu être clonées.

### Format attendu (aucune valeur réelle ici)

```env
DB_PASSWORD=<depuis le gestionnaire de secrets>
APP_KEY=base64:<généré par php artisan key:generate>
MAIL_PASSWORD=<mot de passe d'application SMTP dédié>
FEDAPAY_SECRET_KEY=<clé live FedaPay>
```

**Ne JAMAIS commiter de valeur de secret — ni dans `.env`, ni dans la documentation.**

## Procédure recommandée

### 1. Utiliser des variables d'environnement système (production)

Au lieu d'un fichier `.env` sur le serveur, définir les secrets via les variables
d'environnement du système ou du conteneur :

```bash
# Exemple de configuration Nginx/Apache + PHP-FPM
export DB_PASSWORD='<secret-manager-output>'
export APP_KEY='base64:<generated-key>'
export FEDAPAY_SECRET_KEY='<live-key>'
```

### 2. Gestionnaire de secrets

| Service | Commande |
|---|---|
| **AWS Secrets Manager** | `aws secretsmanager get-secret-value --secret-id ecole/prod/db` |
| **Google Secret Manager** | `gcloud secrets versions access latest --secret=ecole-db-password` |
| **Vault HashiCorp** | `vault kv get -field=password ecole/prod/database` |
| **GitHub Actions** | Définir `APP_KEY`, `DB_PASSWORD`, etc. dans Settings → Secrets and variables |

### 3. Fichier `.env.production` (solution simple)

Créer un fichier `.env.production` **en dehors du dépôt** (ex: `/etc/ecole/.env`)
et le charger dans Laravel :

```php
// bootstrap/app.php
$app->loadEnvironmentFrom('/etc/ecole/.env');
```

### 4. Rotation des clés

- **APP_KEY** : Générer avec `php artisan key:generate`. En production, `APP_KEY` ne change jamais sans invalider toutes les sessions/chiffrement.
- **FEDAPAY_SECRET_KEY** : Utiliser la clé **live** en production (et **sandbox** en dev).
- **MAIL_PASSWORD** : Mot de passe d'application SMTP dédié (pas le mot de passe du compte principal).

## Checklist avant déploiement

- [ ] `APP_DEBUG=false`
- [ ] `APP_ENV=production`
- [ ] Clé FedaPay live (pas sandbox)
- [ ] Base de données distante (pas localhost)
- [ ] SMTP transactionnel configuré (Mailgun, SendGrid, SES…)
- [ ] `php artisan config:cache` exécuté
- [ ] `.env` absent du dépôt (`.gitignore` doit contenir `.env*` sauf `.env.example`)
