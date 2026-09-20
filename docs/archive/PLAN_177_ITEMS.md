# PLAN D'IMPLÉMENTATION — 177 ITEMS

> Généré le 2026-08-17 à partir de l'audit complet (AUDIT_OUTSTANDING_ITEMS.md)
> 10 phases, chaque phase indépendante et commitable
> Priorité : Sécurité → Bugs → Performance → Dette → UX → Infra → Features

---

## PHASE 1 : Sécurité Critique

**Effort estimé :** L (5-7 jours)
**Dépendances :** Aucune (point d'entrée)

### Items concernés

| ID | Sévérité | Description |
|----|----------|-------------|
| S1 | CRITICAL | isAdmin() bypass dans CheckRole — tous les directeur* bypassent |
| S2 | CRITICAL | CorsMiddleware reflète n'importe quel origin avec Allow-Credentials |
| S24 | CRITICAL | Secrets (APP_KEY + DB_PASSWORD) versionnés dans Git history |
| S11 | HIGH | FedaPay webhook sans vérification de signature |
| AUTH-5 | MEDIUM | Timing attack sur webhook — pas de hash_equals() |
| S7 | HIGH | Uploads sans restriction de type, publiquement exposés |
| S20 | MEDIUM | 12 contrôleurs exposent les messages d'exception aux clients |
| S21 | MEDIUM | $request->all() loggé en clair — violation RGPD |
| S22 | LOW | CSP avec unsafe-inline et unsafe-eval |
| SEC-2 | MEDIUM | Headers CSP et HSTS manquants |
| SEC-5 | LOW | Headers COEP et COOP manquants |

### Étapes d'implémentation

#### 1.1 — Corriger le bypass isAdmin (S1)
- **Fichier :** `app/Http/Middleware/CheckRole.php`
- `Roles::SUPER_ADMIN` est le seul rôle transverse. S'assurer qu'aucune variante de directeur (`directeurM`, `directeurP`, `directeurS`) n'est ajoutée au tableau `$transversal`. Vérifier `app/Support/Roles.php` pour la hiérarchie.
- **Test :** Un utilisateur `role:directeur` appelle une route `role:comptable` → doit recevoir 403.
- **Test :** Seul `role:super-admin` passe toutes les routes.

#### 1.2 — Supprimer la réflexion CORS (S2)
- **Fichiers :** `app/Http/Middleware/` (supprimer tout `CorsMiddleware` custom si présent), `app/Http/Kernel.php`
- Confirmer que `HandleCors` (Laravel natif) est le seul middleware CORS utilisé (déjà le cas dans Kernel.php ligne 22).
- Vérifier qu'aucun fichier `CorsMiddleware.php` n'existe et n'est chargé. Si un tel fichier existe, le supprimer.
- **Fichier :** `config/cors.php` — la whitelist est correcte, ne rien changer.
- **Test :** Requête avec `Origin: https://evil.com` → pas de `Access-Control-Allow-Origin` dans la réponse.

#### 1.3 — Nettoyer les secrets du Git history (S24)
- **Action :** Utiliser `git filter-repo` ou BFG Repo-Cleaner pour purger `APP_KEY` et `DB_PASSWORD` de l'historique.
- Ajouter `.env` et `.env.*` au `.gitignore` s'il ne l'est pas déjà.
- Ajouter un hook `pre-commit` ou CI step qui détecte les secrets (via `gitleaks` ou `trufflehog`).
- **Fichier :** `.gitignore`, `.github/workflows/secret-scan.yml` (nouveau)

#### 1.4 — Vérification de signature webhook (S11, AUTH-5)
- **Fichiers :** `app/Http/Controllers/PaymentController.php` (méthode `webhook`), `app/Http/Controllers/Central/WebhookController.php`
- Pour FedaPay : vérifier le header `X-FedaPay-Signature` avec `hash_equals()` (pas `==`).
- Pour CinetPay : vérifier `X-Signature` ou le champ `signature` dans le body.
- Pour Stripe : utiliser `Stripe\Webhook::constructEvent()` avec le `STRIPE_WEBHOOK_SECRET`.
- Remplacer toute comparaison `==` par `hash_equals()` pour éviter les timing attacks.
- **Test :** Webhook avec signature invalide → 401/403, pas de traitement.

#### 1.5 — Restrictions d'upload (S7)
- **Fichiers :** `app/Http/Controllers/` (tout contrôleur avec `storeUploadedFile` ou `move()`)
- Créer `app/Services/FileUploadService.php` :
  - MIME type vérifié via `finfo_file()` (pas le Content-Type du client)
  - Liste blanche : `['image/jpeg', 'image/png', 'image/webp', 'application/pdf']`
  - Taille max : 5 Mo (configurable via `config/filesystems.php`)
  - Stockage dans `storage/app/private/` avec symlink symbolique
  - Nom de fichier : UUID + extension (pas le nom original)
- **Test :** Upload d'un `.php` → rejeté. Upload d'un `.jpg` > 5Mo → rejeté.

#### 1.6 — Masquer les exceptions (S20)
- **Fichiers :** Les 12 contrôleurs concernés (grep pour `catch (\Exception $e) { return response()->json(['message' => $e->getMessage()])
- Remplacer par un message générique : `'Une erreur est survenue. Veuillez réessayer.'`
- Logger l'erreur complète dans `storage/logs/laravel.log` via `Log::error()`
- Alternative : ajouter un handler global dans `app/Exceptions/Handler.php` (méthode `render()`)
- **Test :** Provocation d'une exception → message générique dans la réponse, stacktrace dans les logs.

#### 1.7 — Logs RGPD (S21)
- **Fichiers :** Tout fichier contenant `$request->all()` ou `$request->input()` dans un contexte de logging
- Créer `app/Support/SanitizedRequestLog.php` :
  - Fonction `forLog(Request $request): array` qui masque les champs sensibles (`password`, `token`, `secret`, `numero_matricule`)
- Remplacer tous `$request->all()` dans les logs par `SanitizedRequestLog::forLog($request)`
- **Test :** Un log ne contient jamais de mot de passe en clair.

#### 1.8 — CSP, HSTS, COEP, COOP (S22, SEC-2, SEC-5)
- **Fichier :** `app/Http/Middleware/SecurityHeaders.php` (déjà existant et corrigé)
- Vérifier que le CSP exclut `unsafe-inline` et `unsafe-eval` en production (déjà fait, ligne 27-28).
- Ajouter les headers manquants :
  ```php
  $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');
  $response->headers->set('Cross-Origin-Embedder-Policy', 'require-corp');
  ```
- **Test :** `curl -I https://app.example.com/api/v1/health` → tous les headers présents.

### Fichiers à modifier/créer
| Fichier | Action |
|---------|--------|
| `app/Http/Middleware/CheckRole.php` | Modifier |
| `app/Support/Roles.php` | Vérifier |
| `app/Http/Kernel.php` | Vérifier pas de CorsMiddleware custom |
| `config/cors.php` | Vérifier |
| `app/Http/Controllers/PaymentController.php` | Modifier (webhook) |
| `app/Http/Controllers/Central/WebhookController.php` | Modifier |
| `app/Services/FileUploadService.php` | **Créer** |
| `app/Exceptions/Handler.php` | Modifier |
| `app/Http/Middleware/SecurityHeaders.php` | Modifier (COEP/COOP) |
| `app/Support/SanitizedRequestLog.php` | **Créer** |
| `.gitignore` | Modifier |
| `.github/workflows/secret-scan.yml` | **Créer** |

### Tests à écrire
- `tests/Feature/Security/AdminRoleBypassTest.php`
- `tests/Feature/Security/CorsTest.php`
- `tests/Feature/Security/WebhookSignatureTest.php`
- `tests/Feature/Security/FileUploadTest.php`
- `tests/Feature/Security/ExceptionLeakTest.php`
- `tests/Feature/Security/SecurityHeadersTest.php`

---

## PHASE 2 : Authentification & Sessions

**Effort estimé :** L (5-7 jours)
**Dépendances :** Phase 1 (CheckRole, CORS déjà corrigés)

### Items concernés

| ID | Sévérité | Description |
|----|----------|-------------|
| AUTH-1 | CRITICAL | Tokens Sanctum sans expiration — vol = accès indefini |
| AUTH-2 | CRITICAL | Inscription publique sans auth — n'importe qui crée des comptes avec n'importe quel rôle |
| AUTH-7 | HIGH | Rate limiting inefficace — 10 000 req/min |
| S16 | HIGH | Auth rate limiter indexé uniquement sur email — brute-force depuis une IP |
| SEC-4 | MEDIUM | Login rate-limited mais pas de lockout de compte |
| S15 | HIGH | Plusieurs routes sans middleware role |
| AUTH-8 | HIGH | Certaines routes accessibles sans auth:sanctum |
| S9 | HIGH | getPaymentHistory sans vérification de propriété |
| S10 | HIGH | getPaymentStats accepte ecole_id du request |
| S12 | HIGH | POST /fedapay/init/{eleve_id} sans role ni ownership |
| AUTH-9 | HIGH | IDOR sur GET /api/eleves/{id} |
| AUTH-10 | HIGH | IDOR sur GET /api/notes/eleve/{id} |
| SEC-3 | MEDIUM | Pas de régénération de session après login |
| S17 | MEDIUM | IndexedDB jamais purgée au logout |
| S19 | MEDIUM | Token stocké dans AsyncStorage (non chiffré) |
| SEC-1 | MEDIUM | 2FA absent |

### Étapes d'implémentation

#### 2.1 — Expiration des tokens Sanctum (AUTH-1)
- **Fichier :** `config/sanctum.php` — la ligne 51 définit déjà `expiration => 1440` (24h).
- Vérifier que les tokens mobiles utilisent `createToken()` avec une durée explicite.
- Vérifier que les refresh tokens ou la ré-authentification sont gérés côté client.
- **Test :** Token créé il y a 25h → requête → 401.

#### 2.2 — Sécuriser l'inscription (AUTH-2)
- **Fichier :** `routes/api/auth.php` — la route `/inscription` est déjà protégée par `auth:sanctum, role:directeur,super-admin`.
- Vérifier que `AuthController::inscription()` n'accepte pas de champ `role` dans le body (ou l'ignore).
- Si un endpoint `/register` public existe dans `routes/` → le supprimer ou le protéger.
- **Test :** POST /inscription sans token → 401. POST /inscription avec role:super-admin → le rôle est ignoré.

#### 2.3 — Rate limiting robuste (AUTH-7, S16, SEC-4)
- **Fichier :** `config/rate-limiters.php` (vérifier/créer), `app/Providers/AppServiceProvider.php`
- Configurer un rate limiter par IP + email :
  ```php
  RateLimiter::for('auth', function (Request $request) {
      return Limit::perMinute(5)->by(
          $request->input('email') . '|' . $request->ip()
      );
  });
  ```
- Implémenter un account lockout : après 5 tentatives échouées sur 15 min, le compte est verrouillé 30 min. Stocker en Redis (`account_lockout_{email}`).
- Modifier `AuthController::connexion()` pour vérifier le lockout avant de tenter l'auth.
- **Test :** 6 tentatives échouées avec le même email → 7ème tentative → 429 "Compte temporairement verrouillé".

#### 2.4 — Sécuriser les routes manquantes (S15, AUTH-8)
- **Fichiers :** `routes/api/academic.php`, `routes/api/services.php`, `routes/api/users.php`
- Audit des routes sans middleware `role:` — chaque route doit avoir un role explicite.
- Lister les routes identifiées dans l'audit et ajouter les middlewares manquants.
- **Test :** `php artisan route:list --middleware=auth:sanctum` → toutes les routes API ont un middleware de rôle.

#### 2.5 — Corriger les IDOR (S9, S10, S12, AUTH-9, AUTH-10)
- **Fichiers :** `app/Http/Controllers/PaymentController.php`, `app/Http/Controllers/EleveController.php`, `app/Http/Controllers/NotesController.php`
- Pour chaque endpoint qui prend un ID en paramètre :
  - Vérifier que l'objet appartient à `ecole_id` de la session (`session('ecole_id')`)
  - Pour les endpoints personnels (élève, parent) : vérifier que l'utilisateur est bien le propriétaire
- Exemples concrets :
  - `getPaymentHistory` : ajouter `->where('ecole_id', session('ecole_id'))`
  - `getPaymentStats` : ignorer le paramètre `ecole_id` du request, utiliser celui de la session
  - `GET /eleves/{id}` : vérifier que l'élève appartient à l'école connectée
  - `GET /notes/eleve/{id}` : même chose
- **Test :** Un utilisateur d'école A essaie d'accéder aux données d'un élève de l'école B → 404/403.

#### 2.6 — Régénération de session (SEC-3)
- **Fichier :** `app/Http/Controllers/AuthController.php` (méthode `connexion`)
- Après `Auth::attempt()`成功的登录, ajouter :
  ```php
  $request->session()->regenerate();
  ```
- **Test :** Le session ID change après login.

#### 2.7 — Purge IndexedDB au logout (S17)
- **Fichiers :** Frontend web — fonction `logout()` (probablement dans `src/contexts/AuthContext.jsx` ou `src/services/api.js`)
- Ajouter avant le appel API logout :
  ```javascript
  indexedDB.databases().then(dbs => dbs.forEach(db => indexedDB.deleteDatabase(db.name)));
  ```

#### 2.8 — Token dans SecureStore (S19)
- **Fichiers :** Mobile — `src/services/api.js` ou `src/contexts/AuthContext.jsx`
- Remplacer `AsyncStorage.setItem('token', token)` par :
  ```javascript
  import * as SecureStore from 'expo-secure-store';
  await SecureStore.setItemAsync('token', token);
  ```
- **Test :** Le token n'est plus visible dans les settings de l'appareil.

#### 2.9 — 2FA (SEC-1)
- **Fichiers :** `app/Models/User.php`, `app/Http/Controllers/AuthController.php`, `routes/api/auth.php`
- Ajouter colonnes `two_factor_secret`, `two_factor_enabled`, `two_factor_recovery_codes` à la table `users`.
- Créer `app/Services/TwoFactorService.php` : générer secret TOTP, valider code, gérer recovery codes.
- Ajouter routes : `POST /auth/2fa/enable`, `POST /auth/2fa/verify`, `POST /auth/2fa/disable`.
- Modifier `connexion()` : si 2FA activé, retourner un token temporaire + demander le code TOTP.
- **Test :** Login avec 2FA → premier appel retourne "2FA required", second appel avec code valide → token complet.

### Fichiers à modifier/créer
| Fichier | Action |
|---------|--------|
| `config/sanctum.php` | Vérifier expiration |
| `config/rate-limiters.php` | Modifier |
| `app/Providers/AppServiceProvider.php` | Modifier (rate limiters) |
| `app/Http/Controllers/AuthController.php` | Modifier (login, 2FA) |
| `app/Http/Controllers/PaymentController.php` | Modifier (IDOR) |
| `app/Http/Controllers/EleveController.php` | Modifier (IDOR) |
| `app/Http/Controllers/NotesController.php` | Modifier (IDOR) |
| `app/Services/TwoFactorService.php` | **Créer** |
| `routes/api/auth.php` | Modifier (2FA routes) |
| `routes/api/academic.php` | Vérifier middlewares |
| `routes/api/services.php` | Vérifier middlewares |
| `database/migrations/xxxx_add_2fa_to_users.php` | **Créer** |
| Frontend `logout()` | Modifier |
| Mobile `SecureStore` | Modifier |

### Tests à écrire
- `tests/Feature/Auth/TokenExpirationTest.php`
- `tests/Feature/Auth/RegistrationSecurityTest.php`
- `tests/Feature/Auth/RateLimitingTest.php`
- `tests/Feature/Auth/AccountLockoutTest.php`
- `tests/Feature/Auth/IdorTest.php`
- `tests/Feature/Auth/TwoFactorTest.php`
- `tests/Feature/Auth/SessionRegenerationTest.php`

---

## PHASE 3 : Paiement & Données

**Effort estimé :** M (3-5 jours)
**Dépendances :** Phase 1 (signatures webhook), Phase 2 (IDOR corrigés)

### Items concernés

| ID | Sévérité | Description |
|----|----------|-------------|
| AUTH-3 | CRITICAL | Données carte de crédit via fetch() brut — violation PCI DSS |
| S3 | CRITICAL | Paiement marqué complété sans vérification provider |
| AUTH-4 | HIGH | Mot de passe par défaut dans ImportService — 'ecole123' |
| SEC-6 | HIGH | Mots de passe codés en dur dans AdminUsersSeeder |
| SEC-7 | HIGH | SchoolProvision — mot de passe par défaut 'password1234' |
| S5 | CRITICAL | Cross-tenant leak dans EcoleController — Ecole::all() |
| S6 | CRITICAL | Module université hors multi-tenant — 12 modèles sans BelongsToEcole |
| S13 | HIGH | X-Ecole-Id écrit en session sans vérification d'appartenance |
| S14 | MEDIUM | Énumération via forgot-password |
| S18 | MEDIUM | Password reset: pas d'invalidation session active, token en query string |
| SEC-8 | MEDIUM | Pas de vérification email |

### Étapes d'implémentation

#### 3.1 — PCI DSS : paiement carte (AUTH-3)
- **Fichiers :** `app/Http/Controllers/PaymentController.php`, frontend
- Ne JAMAIS recevoir les données de carte côté backend. Utiliser un iframe/payment sheet du provider (FedaPay, CinetPay, Stripe Elements).
- Si le frontend envoie des numéros de carte → refuser immédiatement + logger l'incident.
- **Test :** POST /payments/initialize avec champ `card_number` → 400 + incident loggé.

#### 3.2 — Vérification provider avant marking (S3)
- **Fichier :** `app/Http/Controllers/PaymentController.php`
- Dans la callback/webhook : appeler l'API du provider pour confirmer le statut AVANT de marquer le paiement comme complété.
- Exemple pour FedaPay : `GET /v1/transactions/{id}` → vérifier `status === 'approved'`.
- Pour CinetPay : `POST /api/v2/payment/check` avec le `cpm_trans_id`.
- Ne JAMAIS faire confiance au seul callback sans vérification server-to-server.
- **Test :** Un webhook avec `status: approved` mais la vérification provider retourne `pending` → paiement non marqué.

#### 3.3 — Mots de passe par défaut (AUTH-4, SEC-6, SEC-7)
- **Fichiers :** `app/Services/ImportService.php`, `database/seeders/AdminUsersSeeder.php`, `app/Services/SchoolProvision.php`
- Remplacer les mots de passe codés en dur par des mots de passe générés aléatoirement :
  ```php
  $temporaryPassword = Str::random(12);
  ```
- Envoyer le mot de passe temporaire par email au premier login.
- Ajouter un flag `must_change_password` dans la table `users`.
- **Test :** Aucun mot de passe en dur ne figure dans le code source (grep).

#### 3.4 — Cloisonnement multi-tenant (S5, S6)
- **Fichiers :** `app/Http/Controllers/EcoleController.php`, 12 modèles universitaires
- Dans `EcoleController::index()` : remplacer `Ecole::all()` par `Ecole::where('id', session('ecole_id'))->get()` ou filtrer selon le rôle.
- Pour les 12 modèles universitaires : ajouter `BelongsToEcole` trait et la colonne `ecole_id`.
- **Test :** Un directeur de l'école A ne voit pas les données de l'école B.

#### 3.5 — Vérification X-Ecole-Id (S13)
- **Fichier :** `app/Http/Middleware/EcoleScope.php` — déjà corrigé (vérifier la propriété `ecole_id`).
- Confirmer que seul un `super-admin` peut utiliser l'en-tête X-Ecole-Id.
- **Test :** Un utilisateur normal avec header X-Ecole-Id → l'en-tête est ignoré.

#### 3.6 — Énumération email (S14)
- **Fichier :** `app/Http/Controllers/Api/PasswordResetController.php`
- Toujours retourner un message identique que l'email existe ou non :
  `"Si un compte est associé à cette adresse, un email de réinitialisation a été envoyé."`
- **Test :** POST /forgot-password avec email existant et inexistant → même réponse.

#### 3.7 — Sécuriser password reset (S18)
- **Fichiers :** `app/Http/Controllers/Api/PasswordResetController.php`, `app/Models/User.php`
- Au reset : invalider toutes les sessions actives de l'utilisateur (`$user->sessions()->delete()`).
- Supprimer tous les tokens existants avant de créer un nouveau.
- Passer le token en body POST而不是 en query string.
- **Test :** Après reset, les anciens tokens sont invalides et les anciennes sessions sont détruites.

#### 3.8 — Vérification email (SEC-8)
- **Fichiers :** `app/Models/User.php`, `app/Http/Controllers/AuthController.php`, `routes/api/auth.php`
- Ajouter `MustVerifyEmail` au modèle User.
- Créer route `GET /auth/verify-email/{id}/{hash}` pour la vérification.
- Ajouter middleware `verified` sur les routes sensibles.
- **Test :** Utilisateur non vérifié ne peut pas accéder aux routes protégées par `verified`.

### Fichiers à modifier/créer
| Fichier | Action |
|---------|--------|
| `app/Http/Controllers/PaymentController.php` | Modifier (PCI, vérification) |
| `app/Services/ImportService.php` | Modifier (mots de passe) |
| `database/seeders/AdminUsersSeeder.php` | Modifier |
| `app/Services/SchoolProvision.php` | Modifier |
| `app/Http/Controllers/EcoleController.php` | Modifier (cloisonnement) |
| 12 modèles universitaires | Modifier (BelongsToEcole) |
| `app/Http/Controllers/Api/PasswordResetController.php` | Modifier |
| `app/Models/User.php` | Modifier (MustVerifyEmail) |
| `routes/api/auth.php` | Modifier (verify route) |

### Tests à écrire
- `tests/Feature/Payment/PciComplianceTest.php`
- `tests/Feature/Payment/ProviderVerificationTest.php`
- `tests/Feature/Security/PasswordDefaultTest.php`
- `tests/Feature/Tenant/CrossTenantLeakTest.php`
- `tests/Feature/Auth/PasswordResetTest.php`
- `tests/Feature/Auth/EmailVerificationTest.php`

---

## PHASE 4 : Bugs Critiques

**Effort estimé :** M (3-5 jours)
**Dépendances :** Phase 1 (CheckRole), Phase 3 (S5/S6/S13)

### Items concernés

| ID | Sévérité | Description |
|----|----------|-------------|
| F4 | CRITICAL | Deux features crashent en 500 — imports manquants ClassesController/AuthController |
| F8 | CRITICAL | Namespace université — PSR-4 casse sur Linux |
| F9 | CRITICAL | AIService TypeError au boot — null assigné à propriété string |
| C1 | CRITICAL | Modèle Sessions conflict avec la table Laravel sessions |
| C2 | CRITICAL | Enseignants (pluriel) référencé mais inexistant |
| C5 | HIGH | FK enseignants_id cible la mauvaise table |
| C4 | HIGH | Pivot sessions_candidats référencé mais jamais créé |
| C3 | MEDIUM | CompleteDataSeeder importe des classes inexistantes |
| C3-old | MEDIUM | BulletinDataSeeder complètement obsolète |
| F3 | HIGH | Calcul moyenne bulletin — division hardcodée sur 3, Maternelle/Primaire inatteignable |
| F5 | HIGH | Multi-school selection flow cassé — frontend attend des données non retournées |
| F16 | HIGH | DevoirController::show sélectionne colonne inexistante users.nom |
| F17 | MEDIUM | routes/tenant.php référence PaiementController inexistant |
| DEBT-6 | LOW | Dead code: routes/api_ecoles.php jamais chargé |
| DEBT-7 | MEDIUM | CORS middlewares en double |

### Étapes d'implémentation

#### 4.1 — Crashes 500 (F4)
- **Fichiers :** `app/Http/Controllers/ClassesController.php`, `app/Http/Controllers/AuthController.php`
- Vérifier les `use` statements en haut de chaque fichier. Ajouter les imports manquants.
- Pour ClassesController : probablement `use App\Models\Classe;` manquant.
- Pour AuthController : probablement un import de modèle ou service manquant.
- **Test :** Appeler chaque endpoint du contrôleur → aucun 500.

#### 4.2 — Namespace université PSR-4 (F8)
- **Fichiers :** `app/Modules/Universite/`, `composer.json`
- Vérifier le mapping PSR-4 dans `composer.json` :
  ```json
  "App\\Modules\\Universite\\": "app/Modules/Universite/"
  ```
- S'assurer que la casse des noms de fichiers correspond exactement au namespace (sensible à la casse sur Linux).
- Relancer `composer dump-autoload`.
- **Test :** `php artisan tinker` → `App\Modules\Universite\Models\...::first()` fonctionne.

#### 4.3 — AIService TypeError (F9)
- **Fichier :** `app/Services/AIService.php`
- La propriété typée `string` reçoit `null`. Ajouter un default :
  ```php
  private string $apiUrl;
  // OU
  private ?string $apiUrl = null;
  ```
- Vérifier tous les assignements dans le constructeur.
- **Test :** `new AIService()` sans config → pas de TypeError.

#### 4.4 — Conflit modèle Sessions (C1)
- **Fichiers :** `app/Models/Session.php` (si existant), migration
- Renommer le modèle en `SessionCandidat` (ou autre) pour éviter le conflit avec la table `sessions` de Laravel.
- Mettre à jour toutes les références : routes, contrôleurs, migrations.
- **Test :** La table `sessions` Laravel fonctionne normalement (auth par session).

#### 4.5 — Enseignants pluriel (C2) et FK (C5)
- **Fichiers :** Migration, modèle `Enseignant`
- Si la table s'appelle `enseignants` (pluriel) mais le modèle `Enseignant` (singulier) : standardiser.
- Vérifier les FK : `enseignants_id` doit référencer `enseignants.id` (pas `users.id`).
- Si la FK doit pointer vers `users.id` → renommer en `user_id`.
- **Test :** `Schema::getColumnType('table', 'enseignants_id')` → bigint unsigned.

#### 4.6 — Pivot sessions_candidats (C4)
- **Fichiers :** Migration, modèle `Session`/`SessionCandidat`, modèle `Candidat`
- Créer la table pivot `sessions_candidats` si elle n'existe pas :
  ```php
  Schema::create('sessions_candidats', function (Blueprint $table) {
      $table->foreignId('session_id')->constrained()->cascadeOnDelete();
      $table->foreignId('candidat_id')->constrained()->cascadeOnDelete();
      $table->primary(['session_id', 'candidat_id']);
  });
  ```

#### 4.7 — Seeders cassés (C3, C3-old)
- **Fichiers :** `database/seeders/CompleteDataSeeder.php`, `database/seeders/BulletinDataSeeder.php`
- Corriger les imports ou supprimer les classes inexistantes.
- Si BulletinDataSeeder est obsolète → le supprimer de `DatabaseSeeder.php`.
- **Test :** `php artisan db:seed` → aucun error.

#### 4.8 — Calcul moyenne bulletin (F3)
- **Fichier :** `app/Http/Controllers/BulletinController.php` ou `app/Services/BulletinService.php`
- Remplacer la division hardcodée `... / 3` par le nombre réel de périodes de la série/classe.
- Récupérer les périodes actives : `$periodes = Periode::where('classe_id', $classeId)->get()`.
- **Test :** Bulletin avec 2 périodes → division par 2. Avec 4 périodes → division par 4.

#### 4.9 — Multi-school selection (F5)
- **Fichiers :** Frontend `src/pages/Login.jsx` ou `src/contexts/AuthContext.jsx`, Backend `AuthController::selectSchool()`
- Vérifier que le backend retourne la liste des écoles de l'utilisateur connecté.
- Le frontend attend un tableau `ecoles` dans la réponse de `/auth/me`.
- **Test :** Login avec un compte multi-écoles → la page de sélection s'affiche.

#### 4.10 — DevoirController colonne (F16)
- **Fichier :** `app/Http/Controllers/DevoirController.php`
- Remplacer `users.nom` par `users.name` ou la bonne colonne dans la jointure.
- Vérifier la migration `users` pour le nom exact de la colonne.
- **Test :** `GET /devoirs/{id}` → pas d'erreur SQL.

#### 4.11 — PaiementController fantôme (F17) + dead code (DEBT-6, DEBT-7)
- **Fichiers :** `routes/tenant.php`, `routes/api_ecoles.php` (supprimer), double CORS
- Dans `routes/tenant.php` : la ressource `paiements` pointe vers `PaiementController` inexistant → supprimer cette ligne (les paiements passent par `PaymentController` dans `services.php`).
- Supprimer `routes/api_ecoles.php` s'il existe et n'est pas chargé.
- Vérifier qu'il n'y a qu'un seul middleware CORS dans `Kernel.php`.
- **Test :** `php artisan route:list` → aucune route pointant vers un contrôleur inexistant.

### Fichiers à modifier/créer
| Fichier | Action |
|---------|--------|
| `app/Http/Controllers/ClassesController.php` | Modifier (imports) |
| `app/Http/Controllers/AuthController.php` | Modifier (imports) |
| `app/Services/AIService.php` | Modifier (nullable) |
| `app/Http/Controllers/DevoirController.php` | Modifier (colonne) |
| `app/Services/BulletinService.php` | Modifier (division) |
| `routes/tenant.php` | Modifier (supprimer ressource paiements) |
| `database/seeders/CompleteDataSeeder.php` | Modifier |
| `database/seeders/BulletinDataSeeder.php` | Supprimer |
| `composer.json` | Vérifier PSR-4 |
| Migration `sessions_candidats` | **Créer** |

### Tests à écrire
- `tests/Feature/Bugs/CrashClassesControllerTest.php`
- `tests/Feature/Bugs/CrashAuthControllerTest.php`
- `tests/Feature/Bugs/AIServiceTest.php`
- `tests/Feature/Bugs/BulletinMoyenneTest.php`
- `tests/Feature/Bugs/DevoirShowTest.php`

---

## PHASE 5 : DB & Schema

**Effort estimé :** M (3-5 jours)
**Dépendances :** Phase 4 (bugs de schema corrigés)

### Items concernés

| ID | Sévérité | Description |
|----|----------|-------------|
| D12 | HIGH | ecole_id reste nullable partout — pas de backfill |
| D13 | HIGH | cascadeOnDelete sur ecole_id — pas de soft-delete |
| D9 | HIGH | FK manquantes sur tables critiques |
| D2 | MEDIUM | Noms pluriels — Notes, Matieres, Classes |
| D3 | MEDIUM | Naming controllers incohérent — snake_case vs PascalCase |
| H2 | MEDIUM | 3 systèmes de paiement concurrents sans intégration |
| H3 | MEDIUM | Double eleves_id et eleve_id dans paiements |
| H4 | MEDIUM | Contributions::paiements() utilise mauvais nom de FK |
| F15 | MEDIUM | AIService envoie temperature et lit mauvais format réponse |
| F11 | HIGH | APP_KEY invalide dans .env.testing — 31 bytes au lieu de 32 |
| F12 | HIGH | Composer.lock pinne version Symfony incompatible — PHP 8.4 requis, CI en 8.2 |
| F14 | MEDIUM | CI workflow utilise options dépréciées — --verbose removed in PHPUnit 10+ |
| F13 | LOW | Composer advisory ignore list sous mauvaise clé config |
| DEBT-12 | HIGH | 17 tables sans softDeletes() |

### Étapes d'implémentation

#### 5.1 — Backfill ecole_id (D12)
- **Migration :** `database/migrations/xxxx_backfill_ecole_id.php`
- Pour chaque table avec `ecole_id nullable` : UPDATE SET ecole_id = (valeur par défaut ou 1) WHERE ecole_id IS NULL.
- Puis rendre la colonne NOT NULL.
- **Test :** `Schema::getColumnType('eleves', 'ecole_id')` → non-nullable.

#### 5.2 — Soft-delete au lieu de cascade (D13, DEBT-12)
- **Fichiers :** 17 migrations + modèles concernés
- Pour chaque modèle : ajouter `use SoftDeletes;` et la migration `$table->softDeletes();`.
- Retirer `cascadeOnDelete` sur les FK `ecole_id` (un école ne se supprime jamais).
- **Test :** Supprimer une école → les données restent (soft-deleted).

#### 5.3 — FK manquantes (D9)
- **Migration :** `database/migrations/xxxx_add_missing_foreign_keys.php`
- Identifier les tables sans FK et les ajouter :
  ```php
  Schema::table('notes', function (Blueprint $table) {
      $table->foreign('eleve_id')->references('id')->on('eleves');
      $table->foreign('matiere_id')->references('id')->on('matieres');
      $table->foreign('classe_id')->references('id')->on('classes');
  });
  ```
- **Test :** `Schema::getForeignKeys('notes')` → FK présentes.

#### 5.4 — Standardiser les noms (D2, D3)
- **Approche :** Ne PAS renommer les tables maintenant (trop risqué). Documenter la dette technique.
- Créer un `ALIAS_MAP` dans les modèles pour que `Note::all()` fonctionne avec la table `notes`.
- À long terme : migration de renommage avec `RENAME TABLE`.

#### 5.5 — Paiements schema (H2, H3, H4)
- **Fichiers :** `database/migrations/xxxx_fix_paiements_schema.php`, `app/Models/Contribution.php`
- Unifier `eleves_id` et `eleve_id` en une seule colonne `eleve_id`.
- Corriger `Contributions::paiements()` pour utiliser la bonne FK.
- **Test :** `Contribution::first()->paiements` retourne les paiements.

#### 5.6 — AIService temperature (F15)
- **Fichier :** `app/Services/AIService.php`
- Retirer le paramètre `temperature` si le provider ne le supporte pas.
- Corriger le parsing de la réponse (vérifier le format JSON attendu vs réel).
- **Test :** `AIService::analyser(...)` retourne une string, pas null.

#### 5.7 — CI/Dev (F11, F12, F13, F14)
- **Fichiers :** `.env.testing`, `composer.json`, `composer.lock`, `.github/workflows/ci.yml`
- `APP_KEY` : régénérer avec `php artisan key:generate` → 32 bytes exactement.
- `composer.json` : ajuster les contraintes PHP pour correspondre à la version CI (8.2 ou 8.4).
- `composer.lock` : `composer update` pour résoudre les incompatibilités.
- CI workflow : remplacer `--verbose` par `--display-` options de PHPUnit 10+.
- `config/composer.php` : vérifier la clé d'ignore des advisories.
- **Test :** `composer validate` → pas d'erreur. CI green.

### Fichiers à modifier/créer
| Fichier | Action |
|---------|--------|
| `database/migrations/xxxx_backfill_ecole_id.php` | **Créer** |
| 17 migrations softDeletes | **Créer** |
| `database/migrations/xxxx_add_missing_foreign_keys.php` | **Créer** |
| `database/migrations/xxxx_fix_paiements_schema.php` | **Créer** |
| `app/Services/AIService.php` | Modifier |
| `app/Models/Contribution.php` | Modifier |
| `.env.testing` | Modifier (APP_KEY) |
| `composer.json` | Modifier |
| `composer.lock` | Régénérer |
| `.github/workflows/ci.yml` | Modifier |

### Tests à écrire
- `tests/Database/BackfillEcoleIdTest.php`
- `tests/Database/SoftDeletesTest.php`
- `tests/Database/ForeignKeysTest.php`
- `tests/Feature/PaiementsSchemaTest.php`

---

## PHASE 6 : Performance

**Effort estimé :** M (3-5 jours)
**Dépendances :** Phase 5 (schema DB corrigé)

### Items concernés

| ID | Sévérité | Description |
|----|----------|-------------|
| P1 | CRITICAL | SQL logging actif en production — log chaque query avec PII |
| P2 | HIGH | Cache invalidation cassée — mauvaise clé utilisée |
| P3 | HIGH | Endpoints non paginés — charge TOUTES les données |
| P4 | HIGH | N+1 queries dans plusieurs contrôleurs |
| PERF-6 | HIGH | N+1 dans BulletinService::calculerRangGeneral |
| P5 | MEDIUM | Index DB insuffisants — 8 sur 88 migrations |
| P6 | LOW | Schema::defaultStringLength(191) force DB connection au boot |
| P7 | MEDIUM | Gros bundles frontend — xlsx, jspdf, recharts, framer-motion |
| PERF-5 | MEDIUM | Bundle size estimé 2MB+ |
| PERF-7 | MEDIUM | Pas d'OPcache configuré |
| PERF-8 | MEDIUM | Three.js pour éléments décoratifs — 30+ Mo pour effets visuels |
| PERF-2 | MEDIUM | Pas de cache sur les endpoints liste |
| PERF-3 | MEDIUM | Pas de virtual scrolling |
| PERF-4 | LOW | Images non optimisées |
| P8 | LOW | Axios retry sur 429 sans backoff exponentiel |

### Étapes d'implémentation

#### 6.1 — Désactiver SQL logging en production (P1)
- **Fichiers :** `app/Providers/AppServiceProvider.php`
- Vérifier `DB::listen()` : seulement en `local` ou `testing`.
- Si c'est dans le Kernel ou un provider → conditionner par `app()->environment('local')`.

#### 6.2 — Corriger cache invalidation (P2)
- **Fichiers :** `app/Http/Controllers/DashboardController.php`
- Vérifier que la clé de cache utilisée dans `invalidateCache()` correspond à celle utilisée dans `getDashboardData()`.
- **Test :** Invalider le cache → la prochaine requête retourne les données fraîches.

#### 6.3 — Pagination (P3, FEAT-4)
- **Fichiers :** Tout contrôleur avec `::all()` ou `->get()`
- Remplacer par `->paginate(25)` ou `->cursor()`.
- Ajouter `?page=1&per_page=25` sur le frontend.
- Créer un trait `App\Traits\HasPagination` pour standardiser.

#### 6.4 — Corriger N+1 queries (P4, PERF-6)
- **Fichiers :** `app/Http/Controllers/DashboardController.php`, `app/Services/BulletinService.php`
- Ajouter `->with()` sur les requêtes Eloquent.
- Pour `BulletinService::calculerRangGeneral` : eager-load `notes.matiere`.
- Utiliser `Barryvdh\Debugbar` en local pour identifier les N+1.
- **Test :** `DB::enableQueryLog()` → le nombre de queries ne croît pas linéairement avec le nombre de résultats.

#### 6.5 — Index DB (P5)
- **Migration :** `database/migrations/xxxx_add_performance_indexes.php`
- Ajouter des index sur les colonnes fréquemment filtrées :
  ```php
  Schema::table('eleves', fn(Blueprint $t) => $t->index('ecole_id'));
  Schema::table('notes', fn(Blueprint $t) => $t->index(['eleve_id', 'matiere_id']));
  Schema::table('paiements', fn(Blueprint $t) => $t->index(['ecole_id', 'eleve_id']));
  ```

#### 6.6 — Cache endpoints liste (PERF-2)
- **Fichiers :** `app/Http/Controllers/MatieresController.php`, `ClassesController.php`, etc.
- Utiliser `Cache::remember("ecole_{$id}_matieres", 300, fn() => ...)`.
- Invalider au store/update/delete.

#### 6.7 — Frontend performance (P7, PERF-5, PERF-8)
- **Fichiers :** `package.json`, composants Three.js
- Remplacer Three.js par des animations CSS/SVG pour les éléments décoratifs.
- Lazy loader les gros modules : `const JSPDF = lazy(() => import('jspdf'))`.
- Analyser le bundle : `npm run build -- --stats`.
- **Test :** Bundle < 1.5 Mo gzippé.

#### 6.8 — Virtual scrolling (PERF-3)
- **Fichiers :** Listes longues (élèves, notes, paiements)
- Installer `react-window` ou `@tanstack/react-virtual`.
- Remplacer les `<ul>` longs par `<FixedSizeList>`.

#### 6.9 — Retry 429 (P8)
- **Fichiers :** `src/services/api.js` (frontend), `src/services/api.ts` (mobile)
- Configurer axios-retry avec backoff exponentiel :
  ```javascript
  axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
  ```

#### 6.10 — OPcache + defaultStringLength (PERF-7, P6)
- **Fichiers :** `php.ini` (ou `docker/php.ini`), `config/database.php`
- OPcache : `opcache.enable=1`, `opcache.validate_timestamps=0` en production.
- `defaultStringLength(191)` : supprimer cette ligne (MySQL 5.7+ supporte 255).

### Fichiers à modifier/créer
| Fichier | Action |
|---------|--------|
| `app/Providers/AppServiceProvider.php` | Modifier (DB::listen) |
| `app/Http/Controllers/DashboardController.php` | Modifier (cache) |
| Tous les contrôleurs avec ::all() | Modifier (pagination) |
| `app/Services/BulletinService.php` | Modifier (N+1) |
| Migration index DB | **Créer** |
| `app/Traits/HasPagination.php` | **Créer** |
| `package.json` | Modifier |
| Composants Three.js | Remplacer |
| `src/services/api.js` | Modifier (retry) |
| `config/database.php` | Modifier |
| Docker PHP config | Modifier (OPcache) |

### Tests à écrire
- `tests/Performance/SqlLoggingTest.php`
- `tests/Performance/PaginationTest.php`
- `tests/Performance/NPlusOneTest.php`
- `tests/Performance/CacheInvalidationTest.php`

---

## PHASE 7 : Dette Technique

**Effort estimé :** L (5-7 jours)
**Dépendances :** Phase 6 (performance baseline établie)

### Items concernés

| ID | Sévérité | Description |
|----|----------|-------------|
| D1 | HIGH | DashboardController monolith — 12 méthodes, ~600 lignes |
| D4 | HIGH | 5 modèles paiement pour une seule entité |
| D5 | MEDIUM | Form Requests manquants |
| D6 | MEDIUM | API Resources manquants |
| D7 | MEDIUM | Pas de Repository pattern |
| D8 | HIGH | Pas de SoftDeletes sur aucun modèle (corrigé en Phase 5) |
| D10 | MEDIUM | Pas de versioning API |
| D11 | LOW | Documentation divergente — Laravel 10 vs 11 |
| D16 | MEDIUM | app/Modules/Central non connecté à l'autoload |
| D17 | MEDIUM | 5 pages orphelines derrière flag API_AVAILABLE=false |
| DEBT-1 | MEDIUM | Config routes en double |
| DEBT-2 | MEDIUM | Deux systèmes de client API coexistant |
| DEBT-3 | LOW | Hooks legacy inutilisés |
| DEBT-4 | MEDIUM | 3 seeders se chevauchent sur les séries |
| DEBT-5 | LOW | CommunicationService existe mais jamais appelé |
| DEBT-8 | MEDIUM | ~30 fichiers CSS avec deux systèmes conflictuels |
| DEBT-9 | LOW | Deux répertoires pour le module université |
| DEBT-10 | MEDIUM | Routes redondantes par rôle |
| UX-13 | LOW | Warnings lint frontend — 1330 web, 75 mobile |

### Étapes d'implémentation

#### 7.1 — Décomposer DashboardController (D1)
- **Fichier :** `app/Http/Controllers/DashboardController.php`
- Créer des contrôleurs dédiés :
  - `app/Http/Controllers/Dashboard/DirecteurDashboard.php`
  - `app/Http/Controllers/Dashboard/EnseignantDashboard.php`
  - `app/Http/Controllers/Dashboard/EleveDashboard.php`
  - `app/Http/Controllers/Dashboard/ParentDashboard.php`
  - `app/Http/Controllers/Dashboard/ComptableDashboard.php`
  - etc.
- Chaque contrôleur a une seule responsabilité.
- `DashboardController` devient un dispatcher qui délègue.

#### 7.2 — Unifier les modèles paiement (D4)
- **Fichiers :** `app/Models/Payment.php`, `app/Models/Paiement.php`, `app/Models/FedaPayTransaction.php`, etc.
- Garder UN modèle `Payment` (ou `Paiement`) avec un `type` enum : `fedapay`, `cinetpay`, `stripe`, `mobile_money`.
- Supprimer les doublons et mettre à jour les contrôleurs.

#### 7.3 — Form Requests (D5)
- **Fichiers :** `app/Http/Requests/`
- Créer des Form Request pour chaque opération de store/update :
  - `StoreEleveRequest.php`, `UpdateEleveRequest.php`
  - `StoreNoteRequest.php`, `StorePaiementRequest.php`
  - etc.
- Déplacer la validation des contrôleurs vers les Form Requests.
- **Test :** Validation toujours testée via Form Request.

#### 7.4 — API Resources (D6)
- **Fichiers :** `app/Http/Resources/`
- Créer des Resources pour les entités principales :
  - `EleveResource.php`, `NoteResource.php`, `ClasseResource.php`
  - `PaiementResource.php`, `BulletinResource.php`
- Standardiser la forme de la réponse JSON.

#### 7.5 — Versioning API (D10)
- **Fichiers :** `routes/api.php`
- Le prefix `/v1/` est déjà en place. Le garder et documenter.
- Ajouter un header `X-API-Version` optionnel pour les breaking changes futurs.
- Ne PAS créer `/v2/` maintenant — c'est de la documentation.

#### 7.6 — Modules Central autoload (D16)
- **Fichiers :** `composer.json`
- Vérifier le mapping PSR-4 :
  ```json
  "App\\Modules\\Central\\": "app/Modules/Central/"
  ```
- Relancer `composer dump-autoload`.

#### 7.7 — Pages orphelines (D17)
- **Fichiers :** Frontend — les 5 pages derrière `API_AVAILABLE=false`
- Soit les connecter à l'API, soit les supprimer.
- **Test :** Aucune page n'est inatteignable.

#### 7.8 — Seeders overlap (DEBT-4)
- **Fichiers :** `database/seeders/SeriesSeeder.php` et les 2 autres seeders qui insèrent des séries
- Garder UN seulSeeder pour les séries, supprimer les doublons.

#### 7.9 — Nettoyage divers (DEBT-1, 2, 3, 5, 8, 9, 10, UX-13)
- Supprimer les configs routes en double.
- Choisir UN système de client API (axios) et supprimer l'autre.
- Supprimer les hooks legacy inutilisés.
- Supprimer `CommunicationService` s'il n'est pas utilisé.
- Standardiser les CSS (garder Tailwind, supprimer l'autre système).
- Fusionner les deux répertoires université.
- Supprimer les routes redondantes par rôle.
- `npm run lint -- --fix` pour les warnings frontend.

### Fichiers à modifier/créer
| Fichier | Action |
|---------|--------|
| `app/Http/Controllers/DashboardController.php` | Décomposer |
| `app/Http/Controllers/Dashboard/*.php` | **Créer** |
| 5 modèles paiement | Unifier |
| `app/Http/Requests/*.php` | **Créer** |
| `app/Http/Resources/*.php` | **Créer** |
| `composer.json` | Vérifier autoload |
| Frontend pages orphelines | Supprimer/connecter |
| Seeders série | Unifier |
| `package.json` | Supprimer dépendances inutiles |
| CSS files | Standardiser |

### Tests à écrire
- `tests/Feature/Dashboard/DecomposedDashboardTest.php`
- `tests/Feature/Payment/UnifiedModelTest.php`
- `tests/Feature/Validation/FormRequestTest.php`
- `tests/Feature/Resources/ApiResourceTest.php`

---

## PHASE 8 : UX/UI

**Effort estimé :** L (5-7 jours)
**Dépendances :** Phase 7 (Dashboard décomposé, Form Requests)

### Items concernés

| ID | Sévérité | Description |
|----|----------|-------------|
| UX-1 | HIGH | Pas d'onboarding pour nouveaux utilisateurs |
| UX-2 | MEDIUM | Pas d'undo sur actions destructrices |
| UX-3 | MEDIUM | Toast feedback incohérent |
| UX-4 | HIGH | Dashboards à 70% placeholders |
| UX-5 | MEDIUM | Pas de breadcrumbs |
| UX-6 | HIGH | Accessibilité absente — pas de ARIA, pas de WCAG |
| UX-7 | MEDIUM | Pas d'autocomplete global sur les champs recherche |
| UX-8 | HIGH | 8 dashboards utilisent alert() navigateur |
| UX-9 | HIGH | 8 dashboards sans loading states |
| UX-10 | MEDIUM | console.error utilisé silencieusement |
| UX-11 | MEDIUM | Design visuel incohérent — deux systèmes CSS |
| UX-12 | HIGH | Tabs secondaires des dashboards sont des pages vides |
| UX-14 | MEDIUM | Certains boutons "View" mènent nulle part |
| DEBT-15 | — | Pistes pédagogiques (feature à implémenter) |
| S23 | LOW | Electron: pas de setWindowOpenHandler |
| FEAT-5 | HIGH | Pas de mode offline complet |

### Étapes d'implémentation

#### 8.1 — Onboarding (UX-1)
- **Fichiers :** `src/components/Onboarding/`, `src/pages/Onboarding.jsx`
- Créer un flux wizard en 4 étapes : Profil → École → Élèves → Premier cours.
- Stocker la progression dans `localStorage` (marqué comme complété).
- **Test :** Premier login → l'onboarding s'affiche. Logout/Login → pas d'onboarding.

#### 8.2 — Undo actions destructrices (UX-2)
- **Fichiers :** Composants de confirmation (Delete, Deactivate)
- Avant une action destructive : afficher un toast "Annuler" pendant 5 secondes.
- Si "Annuler" cliqué → annuler l'action côté backend (soft-delete puis restore).
- **Test :** Suppression d'un élève → toast "Annuler" → restauration.

#### 8.3 — Toast system (UX-3)
- **Fichiers :** `src/components/ui/Toast.jsx`, `src/contexts/ToastContext.jsx`
- Créer un provider de toast unifié (react-hot-toast ou toaster custom).
- Remplacer tous les `alert()` par des toasts.
- **Test :** Chaque opération CRUD retourne un toast de confirmation.

#### 8.4 — Dashboards placeholders (UX-4, UX-8, UX-9, UX-12)
- **Fichiers :** 8 composants dashboard dans `src/pages/Dashboards/`
- Remplacer les `alert()` par des données réelles (Phase 7 a décomposé le controller).
- Ajouter des `<Skeleton>` loading states.
- Implémenter les tabs vides avec des KPIs réels ou des "coming soon" élégants.
- **Test :** Chaque dashboard affiche des données réelles ou un placeholder élégant (pas de `alert()`).

#### 8.5 — Breadcrumbs (UX-5)
- **Fichiers :** `src/components/Breadcrumbs.jsx`
- Utiliser `react-router-dom` `useLocation()` pour générer automatiquement les breadcrumbs.
- Ajouter `<nav aria-label="Breadcrumb">` pour l'accessibilité.
- **Test :** Navigation /ecoles/123/eleves →readcrumbs : Accueil > Écoles > #123 > Élèves.

#### 8.6 — Accessibilité (UX-6)
- **Fichiers :** Tous les composants React
- Ajouter `aria-label`, `aria-describedby`, `role` sur les éléments interactifs.
- Ajouter `tabIndex` pour la navigation clavier.
- Utiliser `eslint-plugin-jsx-a11d` pour détecter les problèmes.
- **Test :** `npm run lint` → pas d'erreurs a11d.

#### 8.7 — Autocomplete (UX-7)
- **Fichiers :** Champs de recherche (élèves, matières, classes)
- Créer un composant `<SearchableSelect>` avec debounce (300ms) et results dropdown.
- **Test :** Taper "Mam" → suggestions "Mamadou", "Mamadou Diallo".

#### 8.8 — Remplacer alert() (UX-8)
- **Fichiers :** Les 8 dashboards avec `alert()`
- Remplacer chaque `alert(message)` par `toast.success(message)` ou `toast.error(message)`.

#### 8.9 — Loading states (UX-9)
- **Fichiers :** 8 dashboards sans loading
- Ajouter un état `loading` + composant `<Skeleton>` ou `<Spinner>` pendant le fetch.

#### 8.10 — console.error silencieux (UX-10)
- **Fichiers :** Tous les `catch` qui font `console.error()` sans rien afficher
- Remplacer par des toasts d'erreur pour l'utilisateur.
- Garder le `console.error` mais ajouter `toast.error('Une erreur est survenue')`.

#### 8.11 — View buttons cassés (UX-14)
- **Fichiers :** Composants avec boutons "Voir" qui mènent nulle part
- Vérifier chaque bouton et le router vers la bonne URL ou le désactiver.

#### 8.2 — Electron guards (S23)
- **Fichiers :** `electron/main.js`
- Ajouter :
  ```javascript
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http')) shell.openExternal(url);
      return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith('file://')) event.preventDefault();
  });
  ```

#### 8.3 — Offline mode (FEAT-5)
- **Fichiers :** `src/services/api.js`, `src/hooks/useOffline.js`
- Installer `react-query` avec `persistQueryClient` (localStorage).
- Afficher un banner "Mode hors ligne" quand `navigator.onLine === false`.
- Les données en cache sont utilisées, les mutations en attente de sync.

### Fichiers à modifier/créer
| Fichier | Action |
|---------|--------|
| `src/components/Onboarding/` | **Créer** |
| `src/components/ui/Toast.jsx` | **Créer** |
| `src/contexts/ToastContext.jsx` | **Créer** |
| `src/components/Breadcrumbs.jsx` | **Créer** |
| `src/components/ui/Skeleton.jsx` | **Créer** |
| `src/components/ui/SearchableSelect.jsx` | **Créer** |
| 8 dashboards | Modifier |
| `src/hooks/useOffline.js` | **Créer** |
| `electron/main.js` | Modifier |
| `package.json` | Modifier (react-hot-toast, react-query) |

### Tests à écrire
- `tests/frontend/Onboarding.test.jsx`
- `tests/frontend/Toast.test.jsx`
- `tests/frontend/Breadcrumbs.test.jsx`
- `tests/frontend/Accessibility.test.jsx` (axe-core)

---

## PHASE 9 : Infra & DevOps

**Effort estimé :** XL (7-10 jours)
**Dépendances :** Phase 6 (performance), Phase 7 (code nettoyé)

### Items concernés

| ID | Sévérité | Description |
|----|----------|-------------|
| INF-1 | HIGH | CI pas testé en exécution réelle |
| INF-3 | HIGH | Pas de pipeline CI/CD |
| INF-7 | HIGH | Pas de CI/CD du tout |
| INF-4 | HIGH | Pas d'environnement staging |
| INF-5 | HIGH | Pas de monitoring — pas de Sentry, Telescope |
| INF-8 | HIGH | Pas de monitoring |
| INF-6 | HIGH | Pas d'automatisation backup |
| INF-10 | MEDIUM | Pas de load testing |
| INF-11 | MEDIUM | Pas de WebSocket server en production |
| INF-12 | MEDIUM | Pas de queue supervisor |
| INF-13 | MEDIUM | Pas de documentation API (Swagger/Scramble) |
| INF-14 | MEDIUM | Pas de documentation utilisateur |
| INF-15 | LOW | Pas de Laravel Telescope |
| INF-2 | MEDIUM | CI workflows mobile/desktop non testés |
| INF-9 | CRITICAL | App mobile non fonctionnelle — 5 bugs bloquants |

### Étapes d'implémentation

#### 9.1 — CI/CD Pipeline (INF-1, INF-3, INF-7)
- **Fichiers :** `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
- Pipeline CI :
  ```yaml
  jobs:
    test:
      - composer install
      - php artisan test
      - npm ci && npm run lint && npm run build
    security:
      - composer audit
      - npm audit
  ```
- Pipeline CD (sur merge vers main) :
  ```yaml
  deploy:
    - ssh deploy@server "cd /var/www/ecole && git pull && composer install && php artisan migrate && php artisan config:cache"
  ```

#### 9.2 — Staging (INF-4)
- **Fichiers :** Docker Compose, `.env.staging`
- Créer un environnement staging identique à la production.
- Déployer automatiquement sur merge vers `develop`.

#### 9.3 — Monitoring (INF-5, INF-8, INF-15)
- **Fichiers :** `config/sentry-laravel.php`, `config/telescope.php`
- Installer Sentry Laravel (`sentry/sentry-laravel`) :
  ```php
  Sentry\init(['dsn' => env('SENTRY_DSN')]);
  ```
- Installer Laravel Telescope pour le debugging local.
- **Test :** `php artisan telescope:status` → actif en local.

#### 9.4 — Backup (INF-6)
- **Fichiers :** `app/Console/Commands/BackupDatabase.php`, crontab
- Script de backup daily :
  ```bash
  mysqldump -u user -p database > backup_$(date +%Y%m%d).sql
  ```
- Envoyer le backup vers S3 ou un serveur distant.
- **Test :** `php artisan backup:run` → backup créé.

#### 9.5 — Load testing (INF-10)
- **Fichiers :** `tests/load/` (k6 ou Artillery)
- Scénarios : 100 utilisateurs simultanés sur le login, le dashboard, la liste d'élèves.
- **Test :** < 2s pour 95% des requêtes sous charge.

#### 9.6 — WebSocket (INF-11)
- **Fichiers :** `config/websockets.php`, `app/Events/`
- Installer `beyondcode/laravel-websockets` ou `laravel-echo-server`.
- Configurer pour les notifications en temps réel.

#### 9.7 — Queue supervisor (INF-12)
- **Fichiers :** `supervisor.conf`
- Configurer un worker queue :
  ```ini
  [program:ecole-worker]
  command=php artisan queue:work --sleep=3 --tries=3
  ```

#### 9.8 — Documentation API (INF-13, SEC-2)
- **Fichiers :** `config/scramble.php`
- Installer `dedoc/scramble` pour la documentation auto-générée.
- **Test :** GET `/docs/api` → Swagger UI fonctionnel.

#### 9.9 — CI mobile/desktop (INF-2)
- **Fichiers :** `.github/workflows/mobile.yml`, `.github/workflows/desktop.yml`
- Tester les builds mobile (Expo) et desktop (Electron) dans la CI.

#### 9.10 — Bugs mobiles (INF-9)
- **Fichiers :** Mobile — 5 bugs bloquants identifiés dans l'audit
- Les corriger en priorité (probablement : auth, navigation, crash, offline, permissions).

### Fichiers à modifier/créer
| Fichier | Action |
|---------|--------|
| `.github/workflows/ci.yml` | **Créer** |
| `.github/workflows/deploy.yml` | **Créer** |
| `.github/workflows/mobile.yml` | **Créer** |
| `.github/workflows/desktop.yml` | **Créer** |
| `docker-compose.yml` | **Créer** |
| `.env.staging` | **Créer** |
| `config/sentry-laravel.php` | **Créer** |
| `config/telescope.php` | **Créer** |
| `app/Console/Commands/BackupDatabase.php` | **Créer** |
| `tests/load/` | **Créer** |
| `config/websockets.php` | **Créer** |
| `supervisor.conf` | **Créer** |
| `config/scramble.php` | **Créer** |

### Tests à écrire
- `tests/CI/PipelineTest.php` (vérifier que les CI configs sont valides)
- `tests/Load/LoginLoadTest.php` (k6 script)
- `tests/Feature/WebSocketTest.php`

---

## PHASE 10 : Features Produit

**Effort estimé :** XL (10-14 jours)
**Dépendances :** Toutes les phases précédentes (sécurité, bugs, perf, dette corrigés)

### Items concernés

| ID | Priorité | Description |
|----|----------|-------------|
| F2 | CRITICAL | App mobile ne peut pas s'authentifier — createToken() manquant |
| F1 | HIGH | Couche SaaS entièrement morte — TenancyServiceProvider pas enregistré |
| FEAT-1 | HIGH | Pas de recherche globale (Command+K) |
| FEAT-2 | HIGH | Pas de notifications push (email + web) |
| FEAT-3 | MEDIUM | Pas d'export PDF/Excel partout |
| FEAT-5 | HIGH | Pas de mode offline complet |
| FEAT-6 | HIGH | Pas de paiement carte parent en ligne |
| FEAT-7 | LOW | Pas de dark mode |
| FEAT-8 | MEDIUM | Pas de dashboard personnalisable |
| FEAT-9 | MEDIUM | Pas d'auto-save pour les notes |
| FEAT-10 | MEDIUM | Pas de workflow d'approbation |
| FEAT-11 | LOW | Pas de signature électronique |
| FEAT-12 | MEDIUM | Pas d'emploi du temps visuel (calendrier) |
| FEAT-13 | MEDIUM | Pas de filtres avancés |
| FEAT-14 | LOW | Pas de trombinoscope |
| FEAT-15 | MEDIUM | Pas de cahier liaison parent |
| FEAT-16 | MEDIUM | Pas d'historique des modifications |
| FEAT-17 | HIGH | Pas de module e-learning/LMS |
| FEAT-18 | HIGH | Pas de portail d'inscription en ligne |
| FEAT-19 | MEDIUM | Pas de gestion d'examens (planning, salles, proctoring) |
| FEAT-20 | MEDIUM | Pas d'emploi du temps intelligent |
| FEAT-21 | MEDIUM | Pas de module de stage |
| FEAT-22 | LOW | Pas de portail alumni |
| FEAT-23 | MEDIUM | Pas de gestion de recherche |
| FEAT-24 | MEDIUM | Pas de workflow thèse/soutenance |
| FEAT-25 | MEDIUM | Pas de chatbot IA étudiant 24/7 |
| FEAT-26 | MEDIUM | Pas d'analyse prédictive décrochage |
| FEAT-27 | LOW | Pas de correction IA |
| FEAT-28 | MEDIUM | Pas d'emploi du temps intelligent (algo) |
| FEAT-29 | LOW | Pas de détection plagiat |
| FEAT-30 | LOW | Pas de recommandation orientation |
| FEAT-31 | HIGH | Pas de SMS/WhatsApp — critique pour le contexte africain |
| FEAT-32 | HIGH | Pas de multi-devises — seulement FCFA |
| FEAT-33 | MEDIUM | Pas de documentation API publique |
| FEAT-34 | MEDIUM | Vérifier les data gaps restants |
| FEAT-35 | LOW | Pas de QR code sur bulletins/diplômes |
| INF-11 | MEDIUM | WebSocket en production |

### Étapes d'implémentation (par ordre de priorité)

#### 10.1 — Auth mobile (F2) — CRITICAL
- **Fichiers :** `app/Http/Controllers/AuthController.php`
- Ajouter la méthode `createToken` pour mobile :
  ```php
  public function mobileLogin(Request $request) {
      $credentials = $request->validate(['email' => 'required|email', 'password' => 'required']);
      if (!Auth::attempt($credentials)) return response()->json(['error' => 'Invalid credentials'], 401);
      $token = $request->user()->createToken('mobile-token')->plainTextToken;
      return response()->json(['token' => $token, 'user' => $request->user()]);
  }
  ```
- Ajouter route : `Route::post('/auth/mobile/login', 'mobileLogin');`

#### 10.2 — SaaS layer (F1)
- **Fichiers :** `app/Providers/TenancyServiceProvider.php`, `config/tenancy.php`
- Enregistrer le `TenancyServiceProvider` dans `config/app.php`.
- Vérifier la configuration multi-tenant (déjà partiellement faite).

#### 10.3 — Recherche Command+K (FEAT-1)
- **Fichiers :** `src/components/CommandPalette.jsx`
- Installer `cmdk` (command palette React).
- Implémenter la recherche sur : élèves, matières, classes, événements.

#### 10.4 — Notifications push (FEAT-2)
- **Fichiers :** `app/Notifications/`, `src/components/NotificationCenter.jsx`
- Utiliser Laravel Notification channels : email, database, FCM (web push).
- Créer des notification classes : `NewNotePosted`, `PaymentReceived`, etc.

#### 10.5 — Export PDF/Excel (FEAT-3)
- **Fichiers :** `app/Exports/`, `app/Http/Controllers/ExportController.php`
- Utiliser `maatwebsite/excel` pour les exports Excel.
- Utiliser `barryvdh/laravel-dompdf` pour les exports PDF.
- Ajouter des boutons "Exporter" sur les listes principales.

#### 10.6 — Auto-save notes (FEAT-9)
- **Fichiers :** Composant de saisie de notes
- Debounce 2 secondes sur chaque modification → auto-save.
- Afficher "Sauvegardé" ou "En cours de sauvegarde...".

#### 10.7 — Workflow approbation (FEAT-10)
- **Fichiers :** `app/Models/Approval.php`, `app/Http/Controllers/ApprovalController.php`
- Créer un modèle `Approval` : `model_type`, `model_id`, `status`, `approved_by`.
- Ajouter un middleware ou une policy qui vérifie l'approbation.

#### 10.8 — Emploi du temps visuel (FEAT-12)
- **Fichiers :** `src/components/ScheduleCalendar.jsx`
- Utiliser `@fullcalendar/react` pour afficher l'emploi du temps en vue calendrier.

#### 10.9 — Multi-devises (FEAT-32)
- **Fichiers :** `app/Services/CurrencyService.php`, `config/currencies.php`
- Ajouter les devises : FCFA, EUR, USD, XOF.
- Stocker le montant en centimes + devise.

#### 10.10 — SMS/WhatsApp (FEAT-31)
- **Fichiers :** `app/Services/SmsService.php`, `app/Services/WhatsAppService.php`
- Intégrer un provider SMS (Twilio, Africa's Talking).
- Envoyer des notifications pour : notes, paiements, absences.

#### 10.11 — QR Code bulletins (FEAT-35)
- **Fichiers :** `app/Services/QrCodeService.php`
- Utiliser `simplesoftwareio/simple-qrcode`.
- Générer un QR code sur chaque bulletin avec un lien de vérification.

#### 10.12 — Features restantes (FEAT-5, 6, 7, 8, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 33, 34)
- Ces features sont des projets à part entière. Pour chaque :
  1. Créer une migration
  2. Créer un modèle Eloquent
  3. Créer un contrôleur
  4. Créer des routes
  5. Créer les composants React
  6. Écrire les tests
  7. Documenter dans le README

### Fichiers à modifier/créer (liste partielle)
| Fichier | Action |
|---------|--------|
| `app/Http/Controllers/AuthController.php` | Modifier (mobile login) |
| `app/Providers/TenancyServiceProvider.php` | Modifier |
| `src/components/CommandPalette.jsx` | **Créer** |
| `app/Notifications/` | **Créer** |
| `app/Exports/` | **Créer** |
| `src/components/ScheduleCalendar.jsx` | **Créer** |
| `app/Services/CurrencyService.php` | **Créer** |
| `app/Services/SmsService.php` | **Créer** |
| `app/Services/QrCodeService.php` | **Créer** |
| `src/components/NotificationCenter.jsx` | **Créer** |
| 30+ fichiers (features restantes) | **Créer** |

### Tests à écrire
- `tests/Feature/Auth/MobileLoginTest.php`
- `tests/Feature/Saas/TenancyTest.php`
- `tests/Feature/Search/CommandPaletteTest.php`
- `tests/Feature/Notifications/PushNotificationTest.php`
- `tests/Feature/Exports/PdfExportTest.php`
- `tests/Feature/Exports/ExcelExportTest.php`

---

## RÉSUMÉ DES 10 PHASES

| Phase | Titre | Effort | Items | Dépendances |
|-------|-------|--------|-------|-------------|
| 1 | Sécurité Critique | L | 11 | — |
| 2 | Auth & Session | L | 16 | Phase 1 |
| 3 | Paiement & Données | M | 11 | Phases 1-2 |
| 4 | Bugs Critiques | M | 15 | Phase 1 |
| 5 | DB & Schema | M | 14 | Phase 4 |
| 6 | Performance | M | 16 | Phase 5 |
| 7 | Dette Technique | L | 19 | Phase 6 |
| 8 | UX/UI | L | 16 | Phase 7 |
| 9 | Infra & DevOps | XL | 15 | Phases 6-7 |
| 10 | Features Produit | XL | 37+ | Toutes |
| **TOTAL** | | | **177** | |

### Estimation totale : 45-70 jours-homme

### Recommandation d'exécution
1. **Sprint 1-2 (2 semaines) :** Phases 1-3 (sécurité + paiement)
2. **Sprint 3-4 (2 semaines) :** Phases 4-5 (bugs + schema)
3. **Sprint 5-6 (2 semaines) :** Phases 6-7 (perf + dette)
4. **Sprint 7-8 (2 semaines) :** Phases 8-9 (UX + infra)
5. **Sprint 9+ (continu) :** Phase 10 (features par priorité)
