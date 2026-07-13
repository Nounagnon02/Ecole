# Gestion des secrets en production

## ⚠️ Problème actuel

Le fichier `.env` contient des informations sensibles en clair :

```env
DB_PASSWORD=Mesetudeskp12@
APP_KEY=base64:/vOPmm1PHYV9jR+cYGMOPEyTA0smi8+79ljGl9/wH+4=
MAIL_PASSWORD=(pas défini)
FEDAPAY_SECRET_KEY=(pas défini)
```

**Ne JAMAIS commiter le `.env` dans le dépôt Git.**

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
