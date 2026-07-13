# Audit de cohérence Base de Données — Rapport complet

## Résumé des problèmes trouvés (par sévérité)

### 🔴 CRITIQUE — Provoque des erreurs 500 à l'exécution

| # | Problème | Fichiers concernés | Détail |
|---|----------|-------------------|--------|
| C1 | **Modèle `Sessions` en conflit avec la table système `sessions` de Laravel** | `app/Models/Sessions.php`, `database/migrations/2026_07_08_090555_create_sessions_table.php` | La migration crée la table interne `sessions` (id string, payload, last_activity). Le modèle `Sessions` remplit `nom`, `statut`, `date_debut`, `date_fin` — colonnes absentes. Toute opération `Sessions::create()` échoue car les colonnes n'existent pas. |
| C2 | **Nom de classe `Enseignants` (pluriel) utilisé mais classe `Enseignant` (singulier) existe** | `app/Models/RendezVous.php:31`, `app/Models/EmploiDuTemps.php:36` | `RendezVous::enseignant()` et `EmploiDuTemps::enseignant()` référence `Enseignants::class` (classe inexistante). Provoque `Class "App\Models\Enseignants" not found`. |
| C3 | **`CompleteDataSeeder` importe des classes qui n'existent pas** | `database/seeders/CompleteDataSeeder.php` | Importe `Eleves::class`, `Enseignants::class`, `Parents::class`, `Paiement::class`. Les classes réelles sont `Eleve`, `Enseignant`, `UserParent`, `PaiementEleve`. (Heureusement commenté dans DatabaseSeeder) |
| C4 | **Pivot `sessions_candidats` référencé mais aucune migration ne le crée** | `app/Models/Sessions.php:19` | `Sessions::eleves()` utilise `belongsToMany(Eleve::class, 'sessions_candidats')`. La table n'existe pas. |
| C5 | **FK `enseignants_id` dans `enseignantmp_classe` cible la mauvaise table** | `database/migrations/2025_10_28_102424_enseignantmp_classe.php:19` | `$table->foreignId('enseignants_id')->constrained()` → Laravel infère la table `enseignants`. Mais le modèle cible est `EnseignantsMaternellePrimaire` (table: `enseignants_martenel_primaire`). |

### 🟠 HAUTE — Données incohérentes ou fonctionnalités cassées

| # | Problème | Fichiers | Détail |
|---|----------|----------|--------|
| H1 | **`ecole_id` manquant dans 15+ migrations mais leurs modèles utilisent le trait `BelongsToEcole`** | Voir liste complète ci-dessous | Le trait filtre sur `ecole_id` et tente d'écrire `ecole_id` à la création. Les colonnes n'existant pas, toute requête échoue ou retourne 0 résultat. |
| H2 | **Trois systèmes de paiement concurrents sans intégration** | `PaiementEleve` (paiements), `Payment` (payments), `TransactionPaiement`+`StatutTranche` (transaction_paiements) | Chaque système a son propre modèle, sa propre table, ses propres flow. Aucune passerelle unifiée. Dysfonctionnel pour les rapports financiers. |
| H3 | **Colonne `eleves_id` (pluriel) ET `eleve_id` (singulier) coexistent dans `paiements`** | `database/migrations/2024_01_05_000002_paiements.php:20`, `database/migrations/2025_01_10_000001_add_columns_to_paiements_table.php:14` | La migration initiale crée `eleves_id` (pluriel). La migration d'ajout crée `eleve_id` (singulier). Deux FK pour la même relation. |
| H4 | **Colonne `parents_id` (pluriel) dans `paiements` — incohérent** | `database/migrations/2024_01_05_000002_paiements.php:19` | Partout ailleurs, c'est `parent_id` (singulier). |
| H5 | **Relation `Contributions::paiements()` utilise `id_contribution` mais `PaiementEleve` utilise `contribution_id`** | `app/Models/Contributions.php:45`, `app/Models/PaiementEleve.php:16` | `contributions` table a `id` PK. `Contributions::paiements()` attend `paiements.id_contribution`. Mais `PaiementEleve::$fillable` a `contribution_id`. La colonne réelle après migration d'ajout est `contribution_id`. |
| H6 | **`Matieres` seeder insère `ecole_id` mais la migration ne définit pas cette colonne** | `database/seeders/BeninEducationSeeder.php:84`, `database/migrations/2023_01_01_000002_create_matieres_table.php` | La colonne `ecole_id` n'existe pas dans `matieres`, le seeder `BeninEducationSeeder` plante. |
| H7 | **Modèle `Coefficients` sans migration correspondante** | `app/Models/Coefficients.php` | Table `coefficients` (par convention Laravel) n'est créée par aucune migration. Mais `coefficient_matieres` existe. |
| H8 | **Migration `2025_11_25_111706_create_paiements_u_table.php` crée la table `uni_paiements`** | Le filename dit `paiements_u` mais Schema::create dit `uni_paiements` | Confusion possible. Le modèle `Universite\Paiement` utilise `uni_paiements` — correct. |
| H9 | **`evenements` table sans `ecole_id`, modèle sans BelongsToEcole** | OK pour cette table | Mais les dashboards frontend filtrent par école via API. Données inter-écoles non isolées. |

### 🟡 MOYENNE — Incohérences de nommage, conventions

| # | Problème | Fichiers | Détail |
|---|----------|----------|--------|
| M1 | **Pivot table naming convention inconsistente** | `classe_series` (sing+plur), `classe_matieres` (sing+plur), `serie_matieres` (sing+plur), `eleves_parents` (plur+plur), `parent_eleve` (filename) | Laravel convention: `singular_alphabetical_singular` → `classe_serie`, `classe_matiere`, `serie_matiere`, `eleve_parent` |
| M2 | **`class_id` vs `classe_id`** | `eleves`, `emplois_du_temps` utilisent `class_id` (anglais). Toutes les autres tables utilisent `classe_id` (français). | Incohérence franco-anglaise. Idéalement uniformiser en `classe_id`. |
| M3 | **`eleves_id` (pluriel) dans `moyennes`** | `database/migrations/2026_07_08_100002_create_moyennes_table.php` | Partout ailleurs c'est `eleve_id` (singulier). |
| M4 | **`id_classe` / `id_serie` préfixé dans `contributions`** | `database/migrations/2024_01_05_000001_contributions.php` | Partout ailleurs c'est suffixé (`classe_id`). |
| M5 | **Migration filename vs contenu divergent** | `2025_10_28_102424_enseignantmp_classe.php` (dit `mp` mais devrait être `maternelle_primaire`), `2025_11_25_111706_create_paiements_u_table.php` (crée `uni_paiements`) | `martenel` est une faute d'orthographe (devrait être `maternelle`). |
| M6 | **Modèle `SeriesMatieres` table `series_matieres` mais la migration crée `serie_matieres`** | `app/Models/SeriesMatieres.php:9` vs `database/migrations/2024_01_02_000003_serie_matieres.php` | Le `SeriesMatieres` (extends Pivot) n'est probablement pas utilisé, mais si une relation `->using(SeriesMatieres::class)` existe, elle plantera sur une table inexistante. |
| M7 | **Classe `periodes` en minuscule** | `app/Models/periodes.php` | Violation de convention PSR-4/PSR-1 : les namespaces doivent commencer par une majuscule. |

### 🔵 BASSE — Problèmes cosmétiques ou non bloquants

| # | Problème | Détail |
|---|----------|--------|
| L1 | **`notes` table a `type_evaluation` enum string au lieu de FK vers `type_evaluations`** | Mauvaise normalisation |
| L2 | **`eleves_matieres` utilise `matieres_id` (pluriel) au lieu de `matiere_id`** | Incohérence FK |
| L3 | **`typeevaluation_classes` utilise `periode_id` comme FK pivot (logique métier)** | Design discutable mais fonctionnel |
| L4 | **17 tables sans `softDeletes()`** | Aucun modèle ne supporte la suppression logique |

---

## Liste détaillée : Tables avec `ecole_id` manquant mais modèle avec `BelongsToEcole`

Ces modèles utilisent le trait `BelongsToEcole` qui filtre/écrit `ecole_id`, mais la colonne n'existe pas dans la migration :

| Modèle | Table | Colonne ecole_id ? | Migration à modifier |
|--------|-------|-------------------|---------------------|
| `Absence` | absences | ❌ | `2024_01_06_000002_create_absences_table.php` |
| `Bourse` | bourses | ❌ | `2024_01_06_000001_create_bourses_table.php` |
| `ConseilClasse` | conseils_classe | ❌ | `2024_01_06_000016_create_conseils_classe_table.php` |
| `ConsultationMedicale` | consultations_medicales | ❌ | `2024_01_06_000005_create_consultations_medicales_table.php` |
| `DossierMedical` | dossiers_medicaux | ❌ | `2024_01_06_000006_create_dossiers_medicaux_table.php` |
| `EmploiDuTemps` | emplois_du_temps | ❌ | `2024_01_06_000015_create_emplois_du_temps_table.php` |
| `Examen` | examens | ❌ | `2024_01_06_000017_create_examens_table.php` |
| `Incident` | incidents | ❌ | `2024_01_06_000003_create_incidents_table.php` |
| `Message` | messages | ❌ | `2024_01_06_000013_create_messages_table.php` |
| `Notification` | notifications | ❌ | `2024_01_06_000018_create_notifications_table.php` |
| `Notes` | notes | ❌ | `2024_01_04_000003_notes.php` |
| `periodes` | periodes | ❌ | `2024_01_01_000005_periodes.php` |
| `Sanction` | sanctions | ❌ | `2024_01_06_000004_create_sanctions_table.php` |
| `Series` | series | ❌ | `2023_01_01_000001_create_series_table.php` |
| `TypeEvaluation` | type_evaluations | ❌ | `2024_01_01_000004_typeevaluation.php` |
| `Vaccination` | vaccinations | ❌ | `2024_01_06_000007_create_vaccinations_table.php` |
| `Personnel` | personnel | ❌ | `2026_04_09_124130_create_hr_and_finance_tables.php` |
| `Universite\Paiement` | uni_paiements | ❌ | `2025_11_25_111706_create_paiements_u_table.php` |
| `RendezVous` | rendez_vous | ❌ | `2024_01_06_000011_create_rendez_vous_table.php` |
| `Certificat` | certificats | ❌ | `2024_01_06_000012_create_certificats_table.php` |

## Liste : Tables créées par migration mais sans modèle Eloquent

Ces tables existent dans les migrations mais n'ont pas de modèle PHP correspondant :

| Table | Migration | Utilisation |
|-------|-----------|------------|
| `paiement_details` | `2024_01_05_000002_paiements.php` | Sous-table paiement |
| `paiement_status` | (idem) | Sous-table paiement |
| `paiement_retries` | (idem) | Sous-table paiement |
| `paiement_notifications` | (idem) | Sous-table paiement |
| `paiement_logs` | (idem) | Sous-table paiement |
| `paiement_audits` | (idem) | Sous-table paiement |
| `paiement_refunds` | (idem) | Sous-table paiement |
| `paiement_disputes` | (idem) | Sous-table paiement |
| `paiement_invoices` | (idem) | Sous-table paiement |
| `paiement_receipts` | (idem) | Sous-table paiement |
| `paiement_schedules` | (idem) | Sous-table paiement |
| `paiement_methods` | (idem) | Sous-table paiement |
| `paiement_method_details` | (idem) | Sous-table paiement |
| `exercices` | `2024_01_06_000014_create_exercices_table.php` | Exercices scolaires |
| `password_resets` | `2014_10_12_100000_create_password_resets_table.php` | Laravel system |
| `personal_access_tokens` | `2019_12_14_000001_create_personal_access_tokens_table.php` | Sanctum |
| `failed_jobs` | `2019_08_19_000000_create_failed_jobs_table.php` | Laravel system |
| `domains` | `2019_09_15_000020_create_domains_table.php` | Stancl/tenancy |
| `tenant_user_impersonation_tokens` | `2020_05_15_000010_create_tenant_user_impersonation_tokens_table.php` | Stancl |
| `sessions` | `2026_07_08_090555_create_sessions_table.php` | Laravel session driver |

## Liste : Modèles sans migration correspondante (orphans)

| Modèle | Table attendue | Commentaire |
|--------|---------------|-------------|
| `Coefficients` | `coefficients` | Aucune migration ne crée `coefficients`. `coefficient_matieres` existe (modèle `CoefficientMatiere`). |
| `SessionsMatieres` | `sessions_matieres` | Aucune migration ne crée cette table pivot. |
| `Exercices` | `exercices` (pas de modèle) | ✅ Migration existe, modèle manquant. |

## Problèmes de seeders

| Seeder | Problème | Sévérité |
|--------|----------|----------|
| `BeninEducationSeeder` | Insère `ecole_id` dans `matieres` (colonne inexistante) | 🔴 Plante |
| `CompleteDataSeeder` | Importe classes inexistantes (`Eleves`, `Enseignants`, `Parents`, `Paiement`) | 🔴 Plante (commenté) |
| `UniversiteSeeder` | Commenté dans DatabaseSeeder — cause non identifiée | Info |

## Résumé des incohérences de nommage FK

- `eleves_id` (pluriel) vs `eleve_id` (singulier) — 2 colonnes différentes coexistent dans `paiements`
- `parents_id` (pluriel) vs `parent_id` (singulier)
- `class_id` (anglais) vs `classe_id` (français) — utilisé dans `eleves` et `emplois_du_temps`
- `id_classe` (préfixé) vs `classe_id` (suffixé) — utilisé dans `contributions`
- `id_serie` (préfixé) vs `serie_id` (suffixé) — utilisé dans `contributions`
- `enseignants_id` (pluriel) vs `enseignant_id` (singulier)
- `matieres_id` (pluriel) vs `matiere_id` (singulier) — dans `eleves_matieres`

## Recommandations d'action immédiate

1. **Migration d'ajout `ecole_id`** : Créer une migration unique qui ajoute `ecole_id` sur toutes les tables listées ci-dessus (H1).
2. **Supprimer colonne dupliquée `eleves_id`** : Renommer `eleves_id` → `eleve_id` dans `paiements` (consolidation).
3. **Renommer `class_id`** → `classe_id` dans `eleves` et `emplois_du_temps` (uniformisation).
4. **Renommer `Sessions`** → `SessionAcademique` pour éviter conflit avec Laravel session.
5. **Corriger les relations** qui pointent vers des classes inexistantes (`Enseignants::class` → `Enseignant::class`).
6. **Corriger `enseignants_martenel_primaire`** → `enseignants_maternelle_primaire` (faute d'orthographe).
7. **Corriger `Contributions::paiements()`** pour utiliser `contribution_id` au lieu de `id_contribution`.
8. **Ajouter pivot `sessions_matieres` et `sessions_candidats`** si les sessions académiques sont actives.
