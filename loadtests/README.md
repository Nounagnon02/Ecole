# Tests de charge (k6)

Mesurent l'API sur **l'image de production** (`Ecole_backend/Dockerfile`, php-fpm) derrière nginx, avec MySQL 8 et Redis — pas sur la pile de développement de `../docker-compose.yml`, qui lance `artisan serve` avec `APP_DEBUG=true` : la mesurer ne dirait rien de la capacité réelle.

## Lancer

Depuis la racine du dépôt. `LOADTEST_APP_KEY` est exigée par `docker compose` pour toute commande sur ce fichier (base jetable : n'importe quelle clé valide).

```bash
export LOADTEST_APP_KEY="base64:$(openssl rand -base64 32)"
DC="docker compose -f loadtests/docker-compose.yml"

$DC up -d --build mysql redis app nginx
$DC exec app php artisan migrate --force

# Avant `config:cache`. `APP_ENV=local` : le seeder crée des comptes à mot de
# passe prévisible et refuse de tourner en production — ici, base jetable.
$DC exec -e APP_ENV=local -e LOADTEST_SCHOOLS=20 app \
    php artisan db:seed --class='Database\Seeders\LoadTestSeeder' --force
$DC exec app cat storage/app/loadtest-tokens.json > loadtests/data/tokens.json

# Optimisations de production, comme railway.json et le déploiement SSH.
$DC exec app sh -c 'php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan event:cache'

$DC run --rm k6 run /scripts/smoke.js                       # recette : doit passer avant toute mesure
$DC run --rm -e PEAK_VUS=300 k6 run /scripts/school-day.js  # charge
```

L'API répond aussi sur `http://127.0.0.1:18081` pour des essais à la main. `loadtests/data/` est ignoré par git : il contient des jetons valides.

Volume du jeu de données : `LOADTEST_SCHOOLS` (5), `LOADTEST_CLASSES` (8 par école), `LOADTEST_STUDENTS_PER_CLASS` (30).

## Scénarios

- **`smoke.js`** : un utilisateur, chaque rôle parcourt tous ses écrans une fois, sans pause. Échoue au premier non-200, à la première donnée d'une autre école, au premier 429.
- **`school-day.js`** : mélange pondéré de rôles (élèves 40 %, parents 35 %, enseignants 20 %, comptables 3 %, directeurs 2 %), temps de réflexion humains (1 à 3 s entre deux appels d'un même écran, 5 à 15 s passées sur un écran), montée puis palier. Variables : `PEAK_VUS` (50), `RAMP` (1m), `HOLD` (3m), `THINK` (1 ; 0 enchaîne sans pause).

Chaque réponse est vérifiée : statut 200, aucun 429, aucune donnée d'une autre école (tout nom du jeu de données porte le préfixe `LTS{n}-` de son école). Ce dernier contrôle vise ce que les tests fonctionnels ne voient pas : une fuite qui n'apparaîtrait qu'en concurrence (cache mal clé, état statique réutilisé d'une requête à l'autre par un worker php-fpm). Seuils : p95 < 1,5 s par endpoint, moins de 1 % d'échecs.

Authentification par jetons Bearer pré-générés, jamais par `POST /auth/login` : ce dernier est limité à 20 tentatives/min/IP par conception (garde-fou contre la force brute), ce n'est pas une capacité à mesurer.

## Résultats de référence (21/09/2026)

Poste de développement partagé : 14 cœurs, 15 Go, bureau et autres projets actifs, client k6 sur la même machine. 20 écoles, 4 800 élèves, 115 200 notes, 3 200 paiements. Scénario `school-day.js`, palier de 2 min.

| Utilisateurs simultanés | Workers php-fpm | req/s | p95 | p99 | Échecs | File d'attente php-fpm |
|---|---|---|---|---|---|---|
| 100 | 5 (défaut) | 15,7 | 114 ms | 135 ms | 0 % | non |
| 300 | 5 | 46,6 | 109 ms | 139 ms | 0 % | oui |
| 600 | 5 | 93,7 | 55 ms | 81 ms | 0 % | oui |
| 1 000 | 5 | 152 | **751 ms** | 1,3 s | 0 % | oui |
| 1 000 | 20 | 156 | **57 ms** | 522 ms | 0 % | non |
| 1 500 | 20 | 216 | 1,5 s (seuil dépassé) | 1,7 s | 0 % | oui |

« File d'attente » : php-fpm a journalisé `server reached pm.max_children`, des requêtes ont attendu un worker libre. Le passage à 100 utilisateurs était le premier après le peuplement, sur une base froide : relancé ensuite, p95 de 46 ms.

- **Le pool par défaut, 5 workers, n'avait jamais été choisi** : c'est celui de l'image `php:8.3-fpm`. Il fait attendre des requêtes dès 300 utilisateurs et se dégrade nettement à 1 000. À 20 workers (`Ecole_backend/docker/prod/www.conf`, environ 7 Mo de mémoire chacun), le p95 à 1 000 utilisateurs est divisé par 13.
- **À 1 500 utilisateurs**, MySQL monte à 151 % de CPU (87 % à 1 000, même configuration) : c'est probablement le goulot suivant. Mais ce chiffre est un plancher, pas une capacité : le client k6 partageait la machine, et une nouvelle tentative a été tuée faute de mémoire. À refaire sur une machine dédiée avant d'en tirer un dimensionnement.
- **Aucune donnée d'une autre école** dans les quelque 143 000 réponses, à toutes les charges.

## Ce que ces tests ont trouvé

L'image de production n'avait jamais été lancée pour de vrai. Corrigé dans le même lot :

1. `docker build` échouait : `COPY . .` emportait `storage/framework/testing/`, des fichiers créés par root pendant les tests et illisibles pour Docker. Ajouté à `.dockerignore`.
2. nginx répondait 502 à toute requête : `docker/nginx.conf` visait la socket `php8.2-fpm.sock` d'une installation Debian, absente de l'image (php-fpm 8.3 y écoute en TCP sur le port 9000).
3. Le tableau de bord parent répondait 500 : l'extension PHP `calendar` (`easter_days()`, calendrier officiel) manquait, dans l'image de production comme dans celle de développement.
4. `php artisan route:cache` échouait : noms de route `matieres.*` et `notes.*` en double entre `routes/tenant.php` et le module université. `railway.json` l'enchaîne avec `&&` avant `artisan serve` : le serveur ne pouvait pas démarrer. Le déploiement SSH le lance sur une ligne à part : les routes y restaient simplement non mises en cache. Test de non-régression : `tests/Feature/RouteNamesTest.php`.
5. Le pool php-fpm de 5 workers (voir résultats).

**Observation, non corrigée** : les limites `throttle:60,1` partagent un seul compteur par utilisateur entre toutes les routes qui les portent (`/auth/me`, `/comptable/*`, `/notes/*`, bulletins). Mesuré : 30 appels à `/auth/me` consomment 30 des 60 requêtes par minute de `/comptable/finances`. Aucun 429 avec des parcours réalistes, mais un premier modèle qui rappelait `/auth/me` à chaque écran en a provoqué 102 avec seulement 50 utilisateurs. À garder en tête si un écran se met à enchaîner les appels.

## Limites

- **Lecture seule** : aucun scénario n'écrit (saisie de notes, paiements). À ajouter avant de conclure sur la capacité en période de saisie des notes.
- Données synthétiques : 20 écoles de 240 élèves.
- Pas de pic de connexions (voir « Scénarios »).

## Arrêt

```bash
docker compose -f loadtests/docker-compose.yml down      # garde la base peuplée
docker compose -f loadtests/docker-compose.yml down -v   # supprime aussi la base
```
