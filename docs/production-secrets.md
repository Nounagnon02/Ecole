# Gestion des secrets en production

## 🔴 À TRAITER EN PRIORITÉ — secrets compromis

Vérifié le 2026-09-17 sur l'état réel du dépôt. Les valeurs ne figurent plus dans
les fichiers, **mais restent lisibles dans l'historique Git poussé sur GitHub** :
`git show <commit>:<fichier>` suffit, sur n'importe quel clone.

### Ce qui est exposé, et où

| Commit | Date | Fichier | Contenu |
|---|---|---|---|
| `6c7b714` | 2026-07-10 | `Ecole_backend/.env.testing` | `DB_PASSWORD`, `DB_USERNAME`, `APP_KEY` |
| `bf95e9b` | 2026-07-31 | `Ecole_backend/.env.testing` | idem (commit de nettoyage) |
| `a122082` | 2026-08-20 | `Ecole/credentials.md` | annuaire complet des comptes de test, mot de passe universel `password` |

Les trois sont **atteignables depuis `origin/fix/audit-securite-perf-fonctionnel`**,
donc présents sur GitHub.

Un quatrième commit, `38963e0`, porte les mêmes valeurs mais n'est atteignable
depuis aucune référence : objet orphelin local, jamais poussé. Il disparaîtra au
prochain `git gc` et ne change pas le diagnostic.

### État de chaque secret

| Secret | État vérifié | Gravité |
|---|---|---|
| `DB_PASSWORD` | ⚠️ **identique à celui en service** dans `.env` | **Compromission active.** Accès lecture/écriture complet à la base. |
| `DB_USERNAME` | exposé (ressemble à un compte personnel) | Facilite le ciblage. |
| `APP_KEY` | ✅ diffère de la valeur actuelle — déjà tournée | Résiduelle : l'ancienne clé ne déchiffre plus rien d'actuel. |
| Comptes de `credentials.md` | mot de passe universel `password` | Critique si ces comptes existent hors poste local. |

L'`APP_KEY` mérite une note : elle ne permet pas seulement de **déchiffrer** les
cookies de session et les données `Crypt::`, elle permet de les **forger**. Celle
qui a fuité n'est plus en service — c'est la bonne nouvelle du lot.

### Procédure de remédiation, dans l'ordre

L'ordre compte : toute réécriture d'historique avant la rotation laisse une
fenêtre où les valeurs sont encore valides et déjà clonées ailleurs.

**1. Déterminer si le dépôt est public.** S'il l'est, traiter comme une
compromission complète : rotation de tout, y compris ce qui paraît anodin.

**2. Tourner le mot de passe de base** — c'est le seul secret encore vivant.

```sql
ALTER USER 'prince12'@'localhost' IDENTIFIED BY '<nouveau-secret>';
FLUSH PRIVILEGES;
```

Puis mettre à jour `.env` (ou le gestionnaire de secrets) et recharger PHP-FPM.
Profiter de l'occasion pour cesser d'utiliser un compte nominatif : créer un
compte applicatif dédié, limité à la base `ecole`.

**3. Réinitialiser les comptes de `credentials.md`** sur tout environnement qui
n'est pas un poste local. Le fichier liste nommément l'établissement, les
identifiants et les rôles.

**4. Vérifier qu'aucun secret vivant ne subsiste dans l'historique.**

```bash
git log --all -S'<ancien-mot-de-passe>' --oneline   # doit ne rien renvoyer après purge
```

**5. Purger l'historique — en dernier, et en connaissance de cause.**

`git filter-repo` réécrit tous les SHA : chaque clone existant devient
incompatible et doit être refait. Sur une branche déjà poussée, cela impose un
`push --force` et casse les PR ouvertes. À faire quand personne d'autre ne
travaille sur le dépôt.

```bash
# Sauvegarde d'abord — cette opération ne se défait pas.
git clone --mirror https://github.com/Nounagnon02/Ecole ecole-backup.git

pip install git-filter-repo
git filter-repo --path Ecole/Ecole_backend/.env.testing --path Ecole/credentials.md --invert-paths

git remote add origin https://github.com/Nounagnon02/Ecole
git push --force --all
git push --force --tags
```

La purge **réduit l'exposition future, elle ne remplace pas la rotation** : les
valeurs ont déjà pu être clonées, et GitHub conserve des objets accessibles par
SHA un certain temps après un force-push.

**6. Empêcher la récidive.**

- `Ecole/Ecole_mobile/.gitignore` n'ignore que `.env*.local` : y ajouter `.env`
  et retirer le fichier du suivi (`git rm --cached Ecole/Ecole_mobile/.env`).
- Le `.gitignore` racine ne couvre ni `.env`, ni `vendor/`, ni `node_modules/`.
- Envisager un hook de pre-commit détectant les motifs de secrets.

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
