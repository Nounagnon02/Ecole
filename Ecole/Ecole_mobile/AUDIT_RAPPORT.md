# Audit Mobile Érudit v4 — Rapport Complet

> **Date :** 2026-07-13  
> **Périmètre :** Application mobile (`Ecole_mobile/`) vs API Backend Laravel  
> **Build :** Expo SDK 54, React Native 0.76.5, 57 fichiers source, ~9 500 lignes

---

## 🔴 Résumé Exécutif

| Criticité | Problème | Statut |
|-----------|----------|--------|
| 🔴 Critique | Auth endpoint cassé → login 404 | ✅ Corrigé |
| 🟠 Haute | 15+ endpoints dashboard mauvais chemin | ✅ Corrigés |
| 🟠 Haute | Module Devoirs manquant (3 dashboards) | ✅ Backend créé |
| 🟡 Moyenne | Endpoints parent, bourses, enseignant manquants | 🔧 Backend partiel |
| 🟡 Moyenne | Admin/utilisateurs endpoint manquant | ✅ Corrigé |
| 🟡 Moyenne | DashboardController::admin() format mobile manquant | ✅ Corrigé |
| 🟡 Moyenne | Mobile baseURL /api/v1 → /api (routes non chargées) | ✅ Corrigé |
| 🟡 Moyenne | Navigation duale (Expo Router + App.js legacy) | ✅ App.js marqué legacy |
| 🟢 Faible | Constants API erronées | ✅ Corrigé |
| 🟢 Faible | AdminDashboard unwrap response.data.data | ✅ Corrigé |

---

## 1. 🔴 CRITIQUE — Auth Endpoint Mismatch (Corrigé)

**AuthContext.js** appelait `POST /v1/login` avec baseURL `/api/v1` → URL réelle : `/api/v1/v1/login` → **404**.
Le backend attend `POST /api/v1/auth/login`.

| Fichier | Ancien → Nouveau |
|---------|------------------|
| `AuthContext.js:58` | `/v1/login` → `/auth/login` |
| `AuthContext.js:86` | `/v1/logout` → `/auth/logout` |
| `AuthContext.js:102` | `/v1/forgot-password` → `/auth/forgot-password` |
| `AuthContext.js:119` | `/v1/reset-password` → `/auth/reset-password` |
| `constants/api.tsx` | `+ '/login'` → `+ '/auth/login'` (×5) |

---

## 2. 🟠 HAUTE — Endpoints Dashboard (Corrigés)

### 2.1 Préfixe rôle manquant (POST/PUT)
| Fichier | Ancien | Nouveau |
|---------|--------|---------|
| `SurveillantDashboard.js:63` | `POST /absences` | `POST /surveillant/absences` |
| `SurveillantDashboard.js:163` | `POST /incidents` | `POST /surveillant/incidents` |
| `SecretaireDashboard.js:167` | `POST /rendez-vous` | `POST /secretaire/rendez-vous` |
| `SecretaireDashboard.js:287` | `POST /certificats` | `POST /secretaire/certificats` |
| `BibliothecaireDashboard.js:75` | `POST /livres` | `POST /bibliothecaire/livres` |
| `BibliothecaireDashboard.js:199` | `PUT /emprunts/{id}/retour` | `PUT /bibliothecaire/emprunts/{id}/retour` |
| `BibliothecaireDashboard.js:305` | `PUT /reservations/{id}/confirmer` | `PUT /bibliothecaire/reservations/{id}/confirmer` |
| `InfirmierDashboard.js:68` | `POST /consultations` | `POST /infirmier/consultations` |
| `UniversiteDashboard.js:286` | `POST /candidatures` | `POST /universite/candidatures` |

### 2.2 Mauvais chemin (GET)
| Fichier | Ancien | Nouveau |
|---------|--------|---------|
| `EleveDashboard.js:75` | `GET /eleve/bulletin/{p}` | `GET /eleves/me/bulletin/{p}` |
| `EleveDashboard.js:282` | `GET /eleve/emploi-du-temps` | `GET /eleves/me/emploi-du-temps` |
| `EnseignantDashboard.js:135` | `POST /notes` | `POST /notes/store` |
| `AdminDashboard.js:47` | `GET /admin/statistiques` | `GET /dashboard/admin` |
| `AdminDashboard.js:176` | `GET /admin/utilisateurs` | *(aucun endpoint backend — à créer)* |
| `UniversiteDashboard.js:50` | `GET /universite/statistiques` | `GET /dashboard/universite` |
| `UniversiteDashboard.js:51` | `GET /universite/activites` | `GET /dashboard/universite` (activités extraites) |

### 2.3 Devoirs — Mise à jour mobile
| Fichier | Ancien | Nouveau |
|---------|--------|---------|
| `EnseignantDashboard.js:259` | `GET /enseignant/devoirs` | `GET /devoirs/enseignant` |
| `EleveDashboard.js:201` | `GET /eleve/devoirs` | `GET /devoirs/eleve` |

---

## 3. ✅ Module Devoirs — Créé sur le Backend

**Migration :** `2026_07_13_000001_create_devoirs_table.php`
- Table `devoirs` — devoir créé par un enseignant pour une classe
- Table `devoir_eleve` — pivot avec rendu, note, réponse fichier

**Model :** `app/Models/Devoir.php`
- Traits `BelongsToEcole` (multi-tenant), `Auditable`
- Relations : enseignant, classe, matiere, eleves (BelongsToMany)

**Controller :** `app/Http/Controllers/DevoirController.php`
- `indexEnseignant()` — devoirs de l'enseignant connecté
- `indexEleve()` — devoirs publiés pour l'élève connecté
- `store()` — création avec auto-attribution aux élèves de la classe
- `soumettre()` — élève rend son devoir
- `noter()` — enseignant note une soumission
- `show()` / `destroy()`

**Routes** (`routes/api/academic.php`):
```
GET    /devoirs/enseignant  → indexEnseignant
GET    /devoirs/eleve       → indexEleve
POST   /devoirs             → store
GET    /devoirs/{id}        → show
POST   /devoirs/{id}/soumettre → soumettre
POST   /devoirs/{id}/noter/{eleveId} → noter
DELETE /devoirs/{id}        → destroy
```

---

## 4. 🟡 MOYENNE — Endpoints Backend Encore Manquants

### ✅ Corrigés (cette session)

| Dashboard | Endpoint | Solution |
|-----------|----------|----------|
| `ParentDashboard.js:104` | `GET /parent/enfants` | ✅ `ParentController@enfants` créé |
| `ParentDashboard.js:190` | `GET /parent/bulletins` | ✅ `ParentController@bulletins` créé |
| `ParentDashboard.js:205` | `GET /parent/bulletin/{id}/{periode}` | ✅ `ParentController@bulletinDetail` créé |
| `ComptableDashboard.js:261` | `GET /comptable/bourses` | ✅ Route ajoutée → `ComptableController@bourses` (existait) |
| `EnseignantDashboard.js:46` | `GET /enseignant/classes` | ✅ Route ajoutée → `EnseignantController@classes` (existait) |
| `EnseignantDashboard.js:118` | `GET /enseignant/notes` | ✅ `EnseignantController@notes()` créé |
| `AdminDashboard.js:176` | `GET /admin/utilisateurs` | ✅ `AdminController` + routes |

### ✅ Corrigés (cette session)

| Dashboard | Endpoint | Solution |
|-----------|----------|----------|
| `ParentDashboard.js:302` | `GET /parent/messages` | ✅ `ParentController@messages` créé |
| `ParentDashboard.js:303` | `GET /parent/rendez-vous` | ✅ `ParentController@rendezVous` créé |

Tous les endpoints backend manquants de l'audit sont désormais **implémentés**. Aucun endpoint manquant restant dans l'audit actuel.

---

## 5. 🟠 Architecture & Navigation

### 5.1 Navigation Duale — Résolu
- **Expo Router** est l'entrée active (`package.json` → `expo-router/entry`)
- **`App.js`** est désormais marqué **LEGACY** avec un commentaire explicite
- Les 12 dashboards sont importés par les deux systèmes → pas de duplication de code

### 5.2 LoginScreen
- Utilise `navigation.replace()` via Expo Router proxy → fonctionnel
- Navigation vers `/(app)/{role}` correspond aux screens définis dans `app/(app)/_layout.tsx`

---

## 6. 📊 Qualité du Code

### ✅ Points forts
- Design system cohérent (composants Érudit, useTheme, tokens)
- Zéro dépendance react-native-paper
- Axios interceptor : retry 3× sur 5xx, 401 auto-logout, timeout 15s
- Mode sombre/clair complet
- Skeletons et états vides sur tous les écrans
- Mémoïsation (useCallback, React.memo)
- Multi-tenant (ecole_id scope via BelongsToEcole trait)

### ⚠️ Points à améliorer
- Pas de TypeScript dans les dashboards (seulement types/auth.ts)
- Pas de tests (0 fichier .test.js)
- Gestion d'erreur non centralisée (chaque screen fait son Alert)
- localhost:8000 en dur dans api.js et constants/api.tsx
- AsyncStorage sans chiffrement
- react-native-chart-kit vieillissant
- Pas de refresh token Sanctum

---

## 7. 📋 Plan d'Action Mis à Jour

| # | Priorité | Tâche | Effort | Statut |
|---|----------|-------|--------|--------|
| 1 | 🔴 **Critique** | Auth endpoint fix | 5 min | ✅ Fait |
| 2 | 🟠 **Haute** | Endpoints dashboard fixes (×15) | 30 min | ✅ Fait |
| 3 | 🟠 **Haute** | Module Devoirs backend complet | 2h | ✅ Fait |
| 4 | 🟡 **Moyenne** | Clean App.js legacy | 5 min | ✅ Fait |
| 5 | 🟡 **Moyenne** | ParentController backend | 1-2j | ✅ **Fait** |
| 6 | 🟡 **Moyenne** | Bourses route comptable | 1j | ✅ **Fait** |
| 7 | 🟡 **Moyenne** | Enseignant/classes + notes endpoints | 1j | ✅ **Fait** |
| 8 | ⚪ **Faible** | Admin/utilisateurs endpoint | 1j | ✅ **Fait** |
| 9 | ⚪ **Faible** | DashboardController::admin() enrichi (flat + array) | 30min | ✅ **Fait** |
| 10 | ⚪ **Faible** | Fix mobile baseURL /api/v1 → /api | 5min | ✅ **Fait** |
| 11 | ⚪ **Faible** | Unwrap response.data.data (Parent, Enseignant, Admin) | 15min | ✅ **Fait** |
| 12 | ⚪ **Faible** | Tests unitaires | 2-3j | 💡 Suggestion |
| 13 | ⚪ **Faible** | TypeScript dashboards | 2-3j | 💡 Suggestion |

---

## 8. Fichiers Modifiés (Résumé Complet)

```
BACKEND (créés):
  database/migrations/2026_07_13_000001_create_devoirs_table.php
  app/Models/Devoir.php
  app/Http/Controllers/DevoirController.php
  routes/api/academic.php                  ← +7 routes devoirs

BACKEND (modifié):
  routes/api/academic.php                  ← + use DevoirController

BACKEND (créés — Phase 2):
  app/Http/Controllers/AdminController.php  ← +4 endpoints utilisateurs
  routes/api/admin.php                      ← +4 routes admin
  app/Http/Controllers/ParentController.php ← +3 endpoints (enfants, bulletins, bulletinDetail)

BACKEND (modifiés — Phase 2):
  app/Http/Controllers/DashboardController.php — admin() enrichi (flat + array)
  app/Http/Controllers/EnseignantController.php — +notes() + routes classes/notes
  app/Http/Controllers/ParentController.php   — +messages() + rendezVous()
  routes/api.php                                — + require admin.php
  routes/api/users.php                          — +7 routes (parent, enseignant, bourses, messages, rendez-vous)

MOBILE (corrigés — Phase 2):
  src/context/AuthContext.js              — 4 endpoints auth
  constants/api.tsx                        — 5 constantes auth + baseURL fix
  src/services/api.js                      — baseURL /api/v1 → /api
  src/screens/SurveillantDashboard.js      — 2 POST
  src/screens/EnseignantDashboard.js       — 3 endpoints (notes, devoirs, classes) + unwrap
  src/screens/EleveDashboard.js            — 3 endpoints (bulletin, emploi, devoirs)
  src/screens/ParentDashboard.js           — 3 endpoints (enfants, bulletins, bulletin) + unwrap
  src/screens/SecretaireDashboard.js       — 2 POST
  src/screens/BibliothecaireDashboard.js   — 3 POST/PUT
  src/screens/InfirmierDashboard.js        — 1 POST
  src/screens/AdminDashboard.js            — Aperçu + Utilisateurs (unwrap fix)
  src/screens/UniversiteDashboard.js       — 2 GET + 1 POST + extraction activites
  App.js                                   — Marqué LEGACY
```

---

*Rapport généré automatiquement par audit mobile Érudit v4 — Juillet 2026*
