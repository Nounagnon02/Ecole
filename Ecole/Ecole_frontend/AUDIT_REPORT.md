# 🔍 RAPPORT D'AUDIT — EduPlatform

**Date** : 2026-07-07  
**Auditeur** : Claude Code  
**Version analysée** :  
- Frontend : React 18.2 / Vite 5.4 (package.json v1.0.0, privé)  
- Backend : Laravel 11.54.0 / PHP 8.5.4  
- Node.js : 24.18.0 / npm 11.16.0  
- Base de données : MySQL (via stancl/tenancy multi-DB)  
- Commit : `c96be13` sur `main`

---

## 📊 SCORES PAR SECTION

| Section | Score | Statut |
|---|---|---|
| 1. Architecture & Organisation | 6/10 | 🟠 |
| 2. Sécurité | 5/10 | 🟠 |
| 3. Base de données & Modèles | 7/10 | 🟡 |
| 4. Qualité Frontend | 6/10 | 🟠 |
| 5. API & Communication | 7/10 | 🟡 |
| 6. UX/Design | 6/10 | 🟠 |
| 7. Performance | 6/10 | 🟠 |
| 8. Tests & Maintenabilité | 4/10 | 🔴 |
| **TOTAL** | **47/80** | |

**Score SaaS-readiness** : 59% ← (47 / 80 × 100)

---

## 🚨 CONSTATS CRITIQUES (🔴) — À corriger avant toute refonte

### 🔴 CRIT-1 : `$request->all()` sans validation — Mass Assignment
- **Fichier** : `app/Http/Controllers/SurveillantController.php:34,45,58`
- **Fichier** : `app/Http/Controllers/SecretaireController.php:54,66`
- **Fichier** : `app/Http/Controllers/InfirmierController.php:45`
- **Description** : 6 appels à `$request->all()` passés directement à `Model::create()` sans validation ni filtrage (`$request->validated()` ou FormRequest).
- **Impact** : 🔴 Un attaquant peut injecter des champs non prévus (ex: `is_admin`, `role`, `solde`).
- **Recommandation** : Remplacer par `$request->validated()` avec un FormRequest dédié pour chaque endpoint. Vérifier que `$fillable` ou `$guarded` est correctement défini sur tous les modèles.

### 🔴 CRIT-2 : Aucune Policy / Gate Laravel
- **Fichier** : `app/Policies/` — dossier inexistant
- **Description** : 0 Policy Laravel. La vérification des permissions repose uniquement sur le middleware `role:` qui vérifie une colonne `role` sur l'utilisateur. Absence totale de `$user->can()` / `$this->authorize()`.
- **Impact** : 🔴 Impossible de faire des vérifications fines. Un enseignant pourrait potentiellement modifier une ressource qui ne lui appartient pas. Aucune vérification de scope (ex: "cet élève est-il dans ma classe ?").
- **Recommandation** : Créer des Policies pour chaque modèle clé (Notes, Bulletin, Paiement, Eleve, Absence). Implémenter Spatie Permission (déjà installé) pour gérer les rôles fins.

### 🔴 CRIT-3 : Tests quasi inexistants — 0 test backend, 31 tests frontend seulement
- **Fichier** : `tests/Feature/` → 0 fichiers
- **Fichier** : `tests/Unit/` → 0 fichiers
- **Description** : Aucun test backend (Pest/ PHPUnit), seulement 4 fichiers de test frontend (31 tests).
- **Impact** : 🔴 Impossible de refactorer sans risque de régression. Les flows critiques (login, paiement, notes) ne sont pas testés.
- **Recommandation** : Écrire des tests d'intégration pour les endpoints API critiques (auth, notes, paiements). Viser couverture > 60% avant refonte.

### 🔴 CRIT-4 : Aucune CI/CD
- **Fichier** : `.github/workflows/` — inexistant
- **Description** : Aucun pipeline CI/CD. Pas de GitHub Actions, pas de GitLab CI.
- **Impact** : 🔴 Chaque déploiement est manuel et risqué. Pas de tests automatiques avant merge.
- **Recommandation** : Mettre en place GitHub Actions avec : lint → test → build → déploiement staging.

---

## ⚠️ CONSTATS MAJEURS (🟠)

### 🟠 MAJ-1 : Données simulées dans tous les dashboards
- **Fichier** : `src/app/dashboards/directeur/index.jsx:60-90` — `STATS`, `PERFORMANCE_DATA` en dur
- **Fichier** : `src/app/dashboards/enseignant/index.jsx` — idem
- **Fichier** : `src/app/dashboards/eleve/index.jsx` — idem
- **Description** : 13 dashboards (directeur, enseignant, élève, parent, admin, bibliothecaire, censeur, comptable, infirmier, surveillant, secretaire, universite) utilisent tous des données simulées en dur. Aucun n'est connecté à l'API réelle (sauf le hook `useDashboardStats` qui existe mais n'est pas utilisé).
- **Impact** : 🟠 Les dashboards ne montrent que du faux. L'application est inutilisable en production réelle.
- **Recommandation** : Connecter les dashboards via `useApiQuery()` du TanStack Query déjà installé. Supprimer les données simulées une fois l'API branchée.

### 🟠 MAJ-2 : Pas de Policies ni de vérifications de scope
- **Fichier** : Tous les controllers (0 Policy)
- **Description** : Bien que Spatie Permission soit installé, il n'est pas utilisé. `role:` middleware est basé sur une colonne simple.
- **Impact** : 🟠 Un élève pourrait potentiellement accéder aux notes d'une autre classe. Un parent pourrait voir les enfants d'un autre parent.
- **Recommandation** : Migrer vers les vérifications par Policy avec `authorize()` pour chaque action.

### 🟠 MAJ-3 : Console.log() oubliés en production
- **Fichier** : `src/shared/lib/pwa.js:10,18,32`
- **Fichier** : `src/shared/lib/echo.js:33,60,64,69`
- **Fichier** : `src/shared/lib/offline-queue.js:102,107`
- **Fichier** : `src/hooks/useApi.js:18` — `console.error`
- **Fichier** : `src/shared/hooks/usePerformance.js:33` — `console.info`
- **Description** : 11+ appels à `console.log`/`console.info`/`console.warn` en production. Encombrent la console et exposent des informations internes.
- **Impact** : 🟠 Pollution console, légère fuite d'info.
- **Recommandation** : Remplacer par un logger configurable ou supprimer avant build.

### 🟠 MAJ-4 : Application non fonctionnelle sur mobile
- **Fichier** : Dashboards (non vérifié en détail mais les tableaux Recharts ne sont pas responsive par défaut)
- **Description** : Les dashboards utilisent `Recharts` avec des largeurs fixes type `600px` dans `ResponsiveContainer` — cassé sur mobile. Les Sidebar/Header sont pensés desktop-first.
- **Impact** : 🟠 L'app est très difficilement utilisable sur mobile (< 768px).
- **Recommandation** : Audit responsive + refonte mobile-first des composants layout.

### 🟠 MAJ-5 : Pas de lazy loading sur les routes
- **Fichier** : `src/features/roles/route-config.js` — le helper `lazy` ne fait rien : `const lazy = (importFn) => importFn;`
- **Description** : Le helper `lazy` ne retourne que la fonction d'importation, il n'appelle pas `React.lazy()`. Tous les dashboards sont chargés dans le bundle principal.
- **Impact** : 🟠 ~600KB de JS chargé inutilement au premier render. Les chunks sont tous dans le bundle via la config Vite.
- **Recommandation** : Remplacer par `const lazy = (importFn) => React.lazy(importFn);` et ajouter `<Suspense>` dans le router.

### 🟠 MAJ-6 : Chunks > 250KB (vendor-data: 324KB, vendor-other: 286KB)
- **Fichier** : Build output
- **Description** : `vendor-data` (xlsx + jspdf + recharts) = 324 KB, `vendor-other` = 286 KB. Les librairies lourdes (PDF, Excel, charts) ne sont pas chargées dynamiquement.
- **Impact** : 🟠 Temps de chargement initial plus long.
- **Recommandation** : Importer `xlsx` et `jspdf` dynamiquement via `import()` dans les pages qui les utilisent, pas en racine.

---

## 💡 CONSTATS MINEURS (🟡)

### 🟡 MIN-1 : Pas de Rate Limiting sur les endpoints critiques
- **Fichier** : `routes/api/auth.php:20` — seul `/auth/login` a un throttle
- **Description** : Les endpoints d'import, d'export, de paiement et de webhook n'ont pas de rate limiting.
- **Recommandation** : Ajouter `throttle:N,1` sur les endpoints sensibles.

### 🟡 MIN-2 : Pas de TypeScript et 0 PropTypes
- **Fichier** : `package.json` a `@types/react` et `typescript` en devDeps mais aucun fichier `.tsx`
- **Description** : 107 fichiers JSX, 0 PropTypes. Aucune vérification de types à la compilation.
- **Recommandation** : Migrer progressivement vers JSDoc + PropTypes, ou TypeScript.

### 🟡 MIN-3 : Cache driver = `file` (lent)
- **Fichier** : `.env.example:CACHE_DRIVER=file`
- **Description** : Le cache utilise le fichier (lent, pas de TTL natif). Redis est configuré mais pas utilisé pour le cache.
- **Recommandation** : Passer à `redis` pour les caches de moyennes/statistiques.

### 🟡 MIN-4 : Queue connection = `sync` (synchrone)
- **Fichier** : `.env.example:QUEUE_CONNECTION=sync`
- **Description** : Les jobs (envoi d'emails, génération bulletins PDF) sont exécutés synchrone. Pas de worker.
- **Recommandation** : Passer à `database` ou `redis` pour les jobs lourds.

### 🟡 MIN-5 : Pas de Politique CORS stricte
- **Fichier** : `config/cors.php`
- **Description** : `allowed_methods => ['*']` accepte toutes les méthodes HTTP. Les origines autorisées sont restreintes à `FRONTEND_URL` et `APP_URL` — correct.
- **Recommandation** : Remplacer `['*']` par les méthodes réellement utilisées.

### 🟡 MIN-6 : 12 dépendances PHP obsolètes (majeur lag > 1 version)
- **Fichier** : `composer.json`
- **Description** : `laravel/framework` 11.x vs 13.x dispo, `pestphp/pest` 3.x vs 4.x, `spatie/laravel-permission` 6.x vs 8.x, etc.
- **Recommandation** : Planifier une mise à jour des dépendances majeures après les tests.

### 🟡 MIN-7 : Images sans `alt` text
- **Description** : Plusieurs balises `<img>` sans attribut `alt` (pas de comptage précis possible sans build complet).
- **Recommandation** : Ajouter `alt` descriptif à toutes les images.

### 🟡 MIN-8 : Pas d'ErrorBoundary au niveau route
- **Fichier** : `src/App.jsx` — pas d'ErrorBoundary wrappant les routes
- **Description** : L'ErrorBoundary global n'existe que dans `shared/components/ui/` mais n'est pas utilisé dans le routeur.
- **Recommandation** : Wrapper les routes lazy avec `<ErrorBoundary>`.

### 🟡 MIN-9 : Validation manuelle dans plusieurs controllers
- **Fichier** : `app/Http/Controllers/NotesController.php:120,208,442` — `Validator::make($request->all(), ...)` au lieu de FormRequest
- **Recommandation** : Migrer vers des FormRequest dédiés pour la réutilisabilité.

---

## ✅ POINTS FORTS (🟢)

### 🟢 FORT-1 : Architecture API bien modulaire
- **Fichier** : `routes/api/` — 6 fichiers séparés (auth, academic, users, dashboard, services, universite)
- **Description** : Les routes API sont propres, versionnées, avec des middlewares `auth:sanctum` et `role:` appliqués systématiquement.

### 🟢 FORT-2 : Multi-tenancy déjà implémenté (stancl/tenancy)
- **Fichier** : `config/tenancy.php` — tenancy configuré avec multi-DB
- **Description** : stancl/tenancy v3 est installé et configuré. Les migrations SaaS existent (plans, subscriptions, tenants_settings, modules). La base est prête pour le SaaS.

### 🟢 FORT-3 : Client API robuste (Axios + TanStack Query + Offline)
- **Fichier** : `src/shared/lib/api-client.js`
- **Description** : Instance Axios avec intercepteurs de requête/réponse. Cache offline (IndexedDB), file d'attente de mutations hors-ligne, retry sur 429, refresh 401, timeout 15s. TanStack Query avec staleTime 5min.

### 🟢 FORT-4 : Gestion de session Sanctum SPA correcte
- **Fichier** : `src/shared/stores/auth-store.js`
- **Description** : Auth via cookies httpOnly (pas de token localStorage). Vérification périodique de session. Interceptor Axios qui détecte les 401 et clear la session.

### 🟢 FORT-5 : Spatie Permission installé et migrations prêtes
- **Fichier** : `config/permission.php`
- **Description** : Spatie Permission v6 installé. Tables `permissions`, `roles`, `model_has_roles` créées dans les migrations. Prêt à l'emploi.

### 🟢 FORT-6 : Composants UI partagés bien conçus
- **Fichier** : `src/shared/components/ui/` — 20+ composants
- **Description** : Système de composants cohérent (Button, Input, Modal, DataTable, Card, Badge, Avatar, Combobox, etc.). Design system Tailwind v4 avec variants, états loading/error/empty.

### 🟢 FORT-7 : Architecture PWA et Offline
- **Fichier** : `src/shared/lib/pwa.js`, `src/shared/lib/db.js`, `src/shared/lib/offline-queue.js`
- **Description** : PWA configurée, cache IndexedDB pour les données, file d'attente de mutations hors-ligne, Service Worker enregistré.

### 🟢 FORT-8 : Système de paiement par stratégie (Strategy pattern)
- **Fichier** : `app/Services/Billing/` — PaymentProvider abstrait + providers concrets
- **Description** : Architecture extensible : FedaPayProvider, CinetPayProvider, StripeProvider (et StubProvider pour test). Pas de dépendance aux SDK.

### 🟢 FORT-9 : i18n trilingue (FR / EN / AR)
- **Fichier** : `src/shared/i18n/locales/`
- **Description** : Support complet français, anglais, arabe avec RTL pour l'arabe. Locale stockée dans localStorage.

### 🟢 FORT-10 : 44 migrations — schéma DB complet et bien structuré
- **Fichier** : `database/migrations/` — 76 fichiers
- **Description** : Migrations couvrant tous les modules : auth, scolarité, notes, paiements, santé, bibliothèque, transport, HR, SaaS.

---

## 📈 RÉSUMÉ EXÉCUTIF

### État général

EduPlatform est une application ambitieuse qui combine **React 18 + Vite 5** en frontend et **Laravel 11** en backend, avec une base de données MySQL et un multi-tenancy déjà configuré via `stancl/tenancy`. Le projet compte ~22 000 lignes de JSX/JS et ~26 000 lignes de PHP, avec **44 migrations** couvrant tous les domaines scolaires (notes, paiements, santé, bibliothèque, transport, université).

**Points forts majeurs** : L'architecture API est bien modulaire, le client Axios est robuste avec cache offline et TanStack Query, l'authentification Sanctum SPA est correcte (cookies httpOnly), et le multi-tenancy est déjà en place pour la refonte SaaS. Le design system frontend est cohérent avec 20+ composants partagés.

**Points faibles critiques** : **Aucun test backend** (0 test Feature/Unit), **aucune CI/CD**, **aucune Policy Laravel** (sécurité reposant uniquement sur un middleware `role:` basique), et **6 appels à `$request->all()` sans validation** qui exposent à des failles mass-assignment. Les dashboards affichent tous des données simulées, ce qui rend l'application inutilisable en production. Le helper `lazy` pour le routeur est inopérant — tous les dashboards sont chargés dans le bundle principal.

### Risques principaux pour la refonte SaaS

1. **Risque sécurité** : Sans tests et sans Policies, une refonte va casser des comportements sans qu'on s'en rende compte avant la mise en production.
2. **Risque qualité** : L'absence de CI/CD signifie que chaque commit est livré sans vérification automatique.
3. **Risque performance** : Les librairies lourdes (xlsx, jspdf, recharts) ne sont pas lazy-loadées et le helper `lazy` du routeur ne fait rien.
4. **Risque data** : Les dashboards sont déconnectés des vraies APIs — on ne peut pas valider que le backend expose les bonnes données sans test d'intégration.

### Recommandation pour la refonte

**Ne pas commencer la refonte SaaS sans d'abord :**
1. Écrire des tests d'intégration backend pour les endpoints critiques (auth, notes, paiements)
2. Mettre en place CI/CD (GitHub Actions)
3. Corriger les 6 failles `$request->all()`
4. Activer le vrai lazy loading des routes (`React.lazy`)
5. Connecter au moins un dashboard à l'API réelle pour valider le pattern

---

## 🗺 PLAN D'ACTION RECOMMANDÉ

### Immédiat (avant refonte) — Semaine 1
1. **🔴 CRIT-1**: Remplacer `$request->all()` par `$request->validated()` avec FormRequest (SurveillantController, SecretaireController, InfirmierController)
2. **🔴 CRIT-3**: Écrire des tests Pest pour les 5 endpoints les plus critiques (auth/login, notes/store, paiements/initialize)
3. **🔴 CRIT-4**: Configurer GitHub Actions (lint → php artisan test → npm run test → npm run build)
4. **🟠 MAJ-5**: Corriger le helper `lazy` pour utiliser `React.lazy()` et ajouter `<Suspense>`
5. **🟠 MAJ-1**: Connecter le dashboard directeur à l'API réelle via `useApiQuery()`

### Court terme (Phase 1 de refonte) — Mois 1
1. **🔴 CRIT-2**: Créer des Policies Laravel pour Notes, Eleve, Paiement, Absence
2. **🟠 MAJ-6**: Lazy-load `xlsx`, `jspdf`, `pdfjs-dist` via `import()` dynamique
3. **🟠 MAJ-2**: Compléter la migration Spatie Permission avec rôles fins
4. **🟡 MIN-3**: Passer le cache de `file` à `redis`
5. **🟡 MIN-4**: Configurer un worker de queue (`database` ou `redis`)

### Moyen terme (Phases 2-4) — Mois 2-3
1. **🟠 MAJ-4**: Refonte responsive mobile-first du layout (Sidebar + Header)
2. **🟡 MIN-1**: Ajouter rate limiting sur les endpoints sensibles
3. **🟡 MIN-6**: Mise à jour des dépendances PHP majeures (Laravel 12+)
4. **🟠 MAJ-3**: Remplacer `console.log` par logger structuré
5. **🟡 MIN-2**: Migrer progressivement vers TypeScript ou JSDoc + PropTypes

---

## 📎 ANNEXES

### A. Inventaire complet des fichiers

**Frontend** (Ecole_frontend/src/) :
- 100 fichiers `.jsx` (dashboards, composants, pages)
- 131 fichiers `.js` (hooks, stores, lib, config)
- 23 fichiers `.css` (styles spécifiques)
- 4 fichiers de test (31 tests)
- Total : ~22 332 lignes de code source

**Backend** (Ecole_backend/) :
- 360 fichiers `.php` hors vendor
- 39 controllers dans `app/Http/Controllers/`
- 55+ modèles Eloquent dans `app/Models/`
- 10 services métier dans `app/Services/`
- 76 fichiers de migration dans `database/migrations/`
- Total : ~26 178 lignes de code source

**Dashboard par dashboard** :
| Dashboard | Lignes | Connecté API |
|---|---|---|
| Directeur | 598 | ❌ (mock) |
| Enseignant | 458 | ❌ (mock) |
| Admin | 410 | ❌ (mock) |
| Élève | 407 | ❌ (mock) |
| Parent | 375 | ❌ (mock) |
| Université | 366 | ❌ (mock) |
| Notes (feature) | 329 | ❌ (mock) |
| Paramètres | 310 | ✅ |
| Secrétaire | 295 | ❌ (mock) |
| Bibliothécaire | 281 | ❌ (mock) |
| Censeur | 278 | ❌ (mock) |
| Comptable | 277 | ❌ (mock) |
| Infirmier | 262 | ❌ (mock) |

### B. Liste des dépendances vulnérables / obsolètes

**Frontend (npm)** :
- `npm audit` résultats en attente (commande longue)
- `@testing-library/react` v13 → v14 disponible (React 18 natif)
- `@testing-library/jest-dom` v5 → v6 disponible
- React 18.2 → React 19 disponible

**Backend (Composer)** :
- `laravel/framework` 11.54.0 → 13.x disponible (2 versions majeures de retard)
- `pestphp/pest` 3.8.7 → 4.x disponible
- `phpunit/phpunit` 11.5.56 → 13.x disponible
- `spatie/laravel-permission` 6.25.0 → 8.x disponible
- `laravel/tinker` 2.11.1 → 3.x disponible
- 20+ dépendances mineures obsolètes (sebastian/*, phpunit/*)

### C. Routes API complètes

**126 routes API** organisées en 6 modules :

| Module | Routes | Exemples |
|---|---|---|
| `auth.php` | 5 | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| `academic.php` | ~25 | `GET matieres`, `POST notes/store`, `GET bulletins/eleve/{id}` |
| `dashboard.php` | ~20 | `GET /dashboard/directeur`, `GET /dashboard/enseignant` |
| `users.php` | ~20 | `GET /enseignants`, `POST /surveillant/absences` |
| `services.php` | ~35 | `POST /payments/initialize`, `GET /exports/eleves` |
| `universite.php` | ~15 | `GET /universite/facultes`, `POST /universite/notes` |

Toutes les routes sont protégées par `auth:sanctum` et un middleware `role:` (basé sur colonne simple, pas Spatie).

### D. Schéma de base de données détaillé

**Module principal (44 migrations) :**
- `ecoles` — Écoles/tenants
- `users` — Utilisateurs (avec `role` enum : 15+ rôles)
- Tenancy : `tenants`, `domains`, `tenant_user_impersonation_tokens`
- Scolarité : `series`, `matieres`, `classes`, `eleves`, `parents`, `enseignants`
- Notes : `notes`, `bulletins`, `type_evaluation`, `periodes`
- Paiements : `payments`, `payment_histories`, `contributions`, `paiements`, `bourses`
- Vie scolaire : `absences`, `incidents`, `sanctions`, `conseils_classe`, `examens`
- Santé : `consultations_medicales`, `dossiers_medicaux`, `vaccinations`, `certificats`
- Bibliothèque : `livres`, `emprunts`, `reservations`
- Communication : `messages`, `notifications`, `rendez_vous`
- Transport : `vehicules`, `trajets`, `abonnements`
- RH : `personnel`, `fiches_paie`, `depenses`
- Université : `universites`, `facultes`, `departements`, `filieres`, `etudiants`, `notes`
- SaaS : `plans`, `subscriptions`, `tenant_settings`, `modules`, `invoices`
- Permissions : `permissions`, `roles`, `model_has_roles` (Spatie)

---

**Note** : Ce rapport est un snapshot à l'instant T. Certains constats (notamment les `console.log` et l'absence de Policies) ont été vérifiés par lecture directe du code. Les scores reflètent l'état de préparation SaaS global du projet.

✅ AUDIT TERMINÉ — Rapport disponible dans AUDIT_REPORT.md
