# Plan de Correction — Gouvernance des Rôles & Contrats API

Chef de projet : (rôle unique assumé)
Base : branche `fix/audit-securite-perf-fonctionnel` — 3 explorations complètes (backend routes, frontend dashboards, seeders/tests) réalisées le 07/08.

---

## 1. Constats consolidés (par ordre de gravité)

### Bloquants (verrouillent des utilisateurs)
- **C1 — Conflit orthographique enseignant de cycle.** `Roles.php` déclare `enseignementM/P`, `EnseignantController.php:37,148` valide `enseignantM/P`. Un compte créé via l'API « créer un enseignant » avec un rôle de cycle se retrouve dans un vocabulaire inconnu de la famille `enseignant` → **403 partout côté backend** (lockout `directeurP` rejoué).
- **C2 — `admin` orphelin.** Utilisé dans 7 gates backend et tout le front (`/admin/dashboard`, menus, redirects), mais absent de `Roles.php` et **créé par aucun provisioning** (seul `TestDataSeeder`, non exécuté).
- **C3 — Dashboards sans comptes.** Aucun seeder ne crée `infirmier`, `bibliothecaire`, `recteur`, `doyen`, `professeur`, `personnel`. Ces dashboards existent mais personne ne peut s'y connecter en base de test.

### Contrats API cassés (écrans vides)
- **C4 — Dashboard Parent incompatible.** Backend renvoie `children/name/class`, le front attend `enfants/nom/classe` + `stats/evolution/communications` → écran « Aucun enfant trouvé » permanent.
- **C5 — 8 dashboards staff/admin incomplets.** `repartition`, `types_sanctions`, `frequentation`, `activite`, `categories`, `flux_inscriptions`, `points_surveillance`, `emploi_temps`, `devoirs`, `traffic/logs/health` jamais produits par `DashboardController` → cartes et graphiques vides.
- **C6 — `/admin/dashboard` ouvert aux `directeur` côté front, 403 côté backend** → écran d'erreur.

### Dérives structurelles
- **C7 — Vocabulaire incomplet.** `Roles.php` ne déclare pas `eleve`, `parent`, `comptable`, `surveillant`, `censeur`, `infirmier`, `bibliothecaire`, `secretaire` → les gates et policies divergent déjà (`ElevePolicy` admet `bibliothecaire`, la route `classes/{id}/eleves` l'exclut).
- **C8 — `StoreUserRequest` et `EnseignantController` ont leurs propres listes** (divergentes entre elles et avec les routes).
- **C9 — `OnboardingController:157,161`** assigne `super-admin` (Spatie) à un `directeur` — contredit « le seul rôle transverse est super-admin ».
- **C10 — `AuthController::getRedirectRouteBasedOnRole`** : map legacy incomplète (censeur, surveillant, secretaire, infirmier, bibliothecaire tombent au fallback).
- **C11 — `CommandPalette`** : fallback = actions du **directeur** pour tout rôle non couvert + filtrage des routes sans normalisation des sous-rôles.
- **C12 — `TestDataSeeder`** legacy (`admin` sans `ecole_id`, non exécuté) — source de confusion.

---

## 2. Décisions (raisonnées + contexte ouest-africain)

### D1 — `Roles.php` devient le vocabulaire unique ET exhaustif
Ajouter les constantes manquantes (`ELEVE`, `PARENT`, `COMPTABLE`, `SURVEILLANT`, `CENSEUR`, `INFIRMIER`, `BIBLIOTHECAIRE`, `SECRETAIRE`, `ADMIN`) + deux listes SSOT : `Roles::all()` et `Roles::provisionable()` (rôles créables par l'API admin). Toute validation de rôle (Form Request, Controllers) consomme ces listes, plus aucune liste en dur.
> Justification ouest-africaine : l'organigramme d'un complexe scolaire d'Afrique de l'Ouest est précisément directeur + directeurs de cycle + censeur (discipline & pédagogie) + secrétaire + comptable/agent comptable + surveillant général + infirmier scolaire + bibliothécaire. Ce sont des postes réels du système béninois/ivoirien/sénégalais — les garder tous est correct, mais un seul endroit doit les nommer.

### D2 — Convention unique : `enseignementM/P` pour les enseignants de cycle
Unifier `EnseignantController` sur le vocabulaire `Roles.php` (`enseignementM/P`). Le rôle `enseignant` reste non confiné (un enseignant peut tenir des classes dans plusieurs cycles — réalité du terrain), les variants de cycle sont confinés via `ScopedToCycle` (déjà en place).
> Justification : instituteur du primaire ≠ professeur du secondaire au Bénin ; la distinction par cycle est pertinente. Le conflit orthographique, lui, ne l'est jamais.

### D3 — `admin` : rôle d'administration de plateforme, déclaré et provisionnable
Conserver `admin` (il est déjà gaté), l'ajouter à `Roles.php`, l'exclure de la famille `super-admin` (seul `super-admin` reste transverse), le rendre provisionnable via `user:create`. Retirer `directeur` de l'accès front à `/admin/dashboard` (alignement strict sur le backend).

### D4 — Seeders : couvrir tous les rôles de l'organigramme
Étendre `AdminUsersSeeder` avec `infirmier` + `bibliothecaire` (avec données `CompleteDataSeeder` — déjà présentes), et `UniversiteSeeder` avec `recteur`, `doyen`, `professeur`, `personnel` (comptes user liés aux modèles universitaires déjà créés). Supprimer `TestDataSeeder` de l'inventaire actif.
> Justification : pour tester un système scolaire ouest-africain, chaque poste de l'organigramme doit être testable par un compte réel.

### D5 — Réaligner les contrats API dashboard sur le front (le front est le produit)
Le front est la surface produit (design system Linear/Stripe). Le backend `DashboardController` doit produire **exactement** les clés attendues (voir annexe A). Ordre : Parent (bloquant visuel), puis staff par lot. La 4e carte « stats[4] » est ajoutée partout où elle a du sens métier (ex : « Dépenses du mois » comptable, « Élèves en observation » infirmier).

### D6 — Cohérence bibliothécaire
Ajouter `bibliothecaire` à la gate `GET /classes/{id}/eleves` (alignement sur `ElevePolicy`).

### D7 — Backend ne décide plus de la destination post-login
Le front a déjà `ROLE_REDIRECT_MAP` exhaustif (avec normalisation des sous-rôles). Aligner `getRedirectRouteBasedOnRole` sur le vocabulaire complet (tous rôles scolaires + université), pour les clients non-front (API/desktop).

### D8 — `CommandPalette` : fallback neutre
Fallback = actions génériques (pas celles du directeur) + normalisation `normalizeRole` avant filtrage des routes.

### D9 — `OnboardingController` : le tenant admin est `directeur`, jamais `super-admin`
Retirer l'assignation Spatie `super-admin` ; super-admin reste réservé au personnel de la plateforme SaaS.

---

## 3. Plan d'attaque (lots)

| Lot | Contenu | Fichiers | Test | Verrouille |
|---|---|---|---|---|
| **L1 — Vocabulaire unique** ✅ fait (07/08) | D1, D2, D7, D8, D9 | `app/Support/Roles.php`, `EnseignantController`, `StoreUserRequest`, `AuthController`, `OnboardingController`, `routes/api/users.php` (gate bibliothécaire), front `CommandPalette` | `RoleFamilyTest` étendu (satisfies/provisionable), test lockout `enseignementP` → 200, test bibliothécaire listage élèves | C1, C7, C8, C9, C10, C11, C12 |
| **L2 — Rôles seedés** ✅ fait (07/08) | D3, D4 | `AdminUsersSeeder` (+ `admin`, `infirmier`, `bibliothecaire`, `enseignant`), `UniversiteSeeder` (recteur/doyen/professeur/personnel), `TestDataSeeder` supprimé, `Roles::provisionable()` (+`admin`), front `route-config.js` `/admin/dashboard` (retirer directeur) | Test : chaque rôle provisionné a un compte qui se connecte (login API) — `RoleFamilyTest` ×2 | C2, C3 |
| **L3 — Dashboards staff** ✅ fait (07/08) | D5 (staff), D6 | `DashboardController` (comptable, surveillant, censeur, infirmier, bibliothecaire, secretaire) + stats[4] | `StaffDashboardContractTest` (6 endpoints : stats[4], `donnes_ca`, `presences_semaine`, `points_surveillance`, `evolution`, `types_sanctions`, `frequentation`, `motifs`, `activite`, `categories`, `flux_inscriptions`, `rendez_vous`, clés de ligne exactes) + front infirmier `motifs` dynamique | C5 |
| **L4 — Dashboards parent & admin** ✅ fait (07/08) | D5 (parent/admin) | `DashboardController@parent` (`enfants/stats/evolution/communications` + filiation enrichie), `@admin` (`stats/traffic/health/logs/utilisateurs`) | `ParentDashboardTest` (contrat exact), `AdminDashboardTest` (contrat exact + 403 directeur) | C4, C6 |

Chaque lot = tests verts obligatoires avant de passer au suivant (`php artisan test` complet).

---

## Annexe A — Contrats dashboard attendus (extrait du diff front/back)

| Dashboard | Clés manquantes côté backend |
|---|---|
| parent | `stats`, `evolution`, `communications`, et renommer `children`→`enfants` |
| comptable | `repartition`, carte « Dépenses du mois » |
| surveillant | `points_surveillance`, retards `temps/recurrent` |
| censeur | `types_sanctions`, série `avertissements` |
| infirmier | `frequentation`, visites `heure`, « Motifs fréquents » (retirer le codé en dur front) ✅ |
| bibliothecaire | `activite`, `categories` |
| secretaire | `flux_inscriptions`, inscriptions `type` |
| admin | `traffic`, `logs`, `health`, `utilisateurs` |
| enseignant | `stats`, `emploi_temps`, `devoirs` |
