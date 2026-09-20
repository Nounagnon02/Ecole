# École — plateforme de gestion scolaire

Gestion d'établissements scolaires multi-écoles (Bénin), du maternel au
supérieur : élèves, notes et bulletins, paiements, bibliothèque, infirmerie,
transport, messagerie. Quatre surfaces partagent une même API.

## Les quatre surfaces

| Surface | Pile | Emplacement |
|---|---|---|
| **API** | Laravel 11 · PHP 8.2 · MySQL 8 | [`Ecole/Ecole_backend`](./Ecole/Ecole_backend) |
| **Web** | React 18 · Vite 6 · Tailwind 4 · TanStack Query | [`Ecole/Ecole_frontend`](./Ecole/Ecole_frontend) |
| **Mobile** | Expo 52 · React Native 0.76 · Expo Router | [`Ecole/Ecole_mobile`](./Ecole/Ecole_mobile) |
| **Desktop** | Electron 28, enveloppe du build web | [`Ecole/Ecole_desktop`](./Ecole/Ecole_desktop) |

## Démarrer

```bash
# API — http://localhost:8000
cd Ecole/Ecole_backend
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
php artisan serve

# Web — http://localhost:3002 (proxy /api vers le port 8000)
cd Ecole/Ecole_frontend
npm ci
npm start
```

## Tests

```bash
cd Ecole/Ecole_backend  && vendor/bin/pest          # 467 tests
cd Ecole/Ecole_frontend && npm test                 # 360 tests
cd Ecole/Ecole_frontend && npm run test:e2e         # 78 tests Playwright
```

La suite backend tourne sur SQLite en mémoire par défaut. La CI la rejoue sur
**MySQL 8**, parce que les deux moteurs ne se comportent pas pareil : types
`decimal` rendus en chaîne, clés étrangères réellement appliquées, `YEAR`
borné à 1901‑2155. Pour reproduire ce passage en local :

```bash
DB_CONNECTION=mysql DB_DATABASE=ecole_test vendor/bin/pest
```

## Ce qu'il faut savoir avant de toucher au code

**Le cloisonnement par école est un scope global, pas un `where` manuel.**
`app/Traits/BelongsToEcole.php` filtre 71 des 82 modèles sur `ecole_id` et,
faute d'école résolue, bloque tout (`whereRaw('1 = 0')`) plutôt que de laisser
passer. `User` en est exempté — la connexion doit trouver un compte avant de
connaître son école — ce qui impose un filtrage manuel partout où l'on
interroge `users`.

**Hors requête HTTP, il n'y a ni `auth()` ni session.** Un job en file, une
commande Artisan, un webhook de paiement : tous perdent le contexte et le scope
retombe sur « aucun résultat », silencieusement. Ces chemins doivent lier une
école explicitement avec `App\Support\SchoolContext::for()`.

**Les rôles sont une colonne `string` et un middleware maison**
(`app/Http/Middleware/CheckRole.php`, alias `role:`), pas un paquet de
permissions. Le référentiel des rôles vit dans `app/Support/Roles.php`.

## Documentation

| Chemin | Contenu |
|---|---|
| [`docs/production-secrets.md`](./docs/production-secrets.md) | Gestion des secrets et procédure de rotation — **à lire avant tout déploiement** |
| [`docs/reference/`](./docs/reference) | Conception du cloisonnement, API universitaire, structure des migrations |
| [`docs/archive/`](./docs/archive) | Audits, plans et rapports historiques, conservés pour mémoire |

## CI

Cinq workflows sous [`.github/workflows/`](./.github/workflows), orchestrés par
`ci.yml`, qui est le seul habilité à déclencher un déploiement. Le backend est
testé deux fois — SQLite puis MySQL 8 — et le déploiement dépend des deux.

`ci.yml` scanne aussi les secrets (gitleaks) sur les seuls commits introduits
par le push ou la PR — jamais tout l'historique — et bloque le déploiement en
cas de fuite détectée. Dependabot ([`.github/dependabot.yml`](./.github/dependabot.yml))
ouvre une PR hebdomadaire par écosystème (composer, npm, github-actions) pour
les mises à jour de sécurité.

Pour attraper une fuite avant même de pousser :
`git config core.hooksPath .githooks` (une fois, par dépôt local) active un
hook de pre-commit qui lance le même scan sur ce qui est indexé — sans effet
si `gitleaks` n'est pas installé, la CI reste le filet de sécurité.
