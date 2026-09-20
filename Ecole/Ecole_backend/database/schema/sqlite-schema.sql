CREATE TABLE "ecoles"(
  "id" integer primary key autoincrement not null,
  "nom" varchar not null,
  "email" varchar not null,
  "adresse" varchar not null,
  "phone" varchar,
  "logo" varchar,
  "description" text,
  "status" varchar not null default 'active',
  "pays" varchar,
  "ville" varchar,
  "code_postal" varchar,
  "slug" varchar,
  "domain" varchar,
  "deleted_at" datetime,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE INDEX "ecoles_status_index" on "ecoles"("status");
CREATE INDEX "ecoles_ville_pays_index" on "ecoles"("ville", "pays");
CREATE UNIQUE INDEX "ecoles_email_unique" on "ecoles"("email");
CREATE UNIQUE INDEX "ecoles_slug_unique" on "ecoles"("slug");
CREATE UNIQUE INDEX "ecoles_domain_unique" on "ecoles"("domain");
CREATE TABLE "password_resets"(
  "email" varchar not null,
  "token" varchar not null,
  "created_at" datetime,
  primary key("email")
);
CREATE TABLE "failed_jobs"(
  "id" integer primary key autoincrement not null,
  "uuid" varchar not null,
  "connection" text not null,
  "queue" text not null,
  "payload" text not null,
  "exception" text not null,
  "failed_at" datetime not null default CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "failed_jobs_uuid_unique" on "failed_jobs"("uuid");
CREATE TABLE "domains"(
  "id" integer primary key autoincrement not null,
  "domain" varchar not null,
  "tenant_id" varchar not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("tenant_id") references "tenants"("id") on delete cascade on update cascade
);
CREATE UNIQUE INDEX "domains_domain_unique" on "domains"("domain");
CREATE TABLE "personal_access_tokens"(
  "id" integer primary key autoincrement not null,
  "tokenable_type" varchar not null,
  "tokenable_id" integer not null,
  "name" varchar not null,
  "token" varchar not null,
  "abilities" text,
  "last_used_at" datetime,
  "expires_at" datetime,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE INDEX "personal_access_tokens_tokenable_type_tokenable_id_index" on "personal_access_tokens"(
  "tokenable_type",
  "tokenable_id"
);
CREATE UNIQUE INDEX "personal_access_tokens_token_unique" on "personal_access_tokens"(
  "token"
);
CREATE TABLE "tenant_user_impersonation_tokens"(
  "token" varchar not null,
  "tenant_id" varchar not null,
  "user_id" varchar not null,
  "auth_guard" varchar not null,
  "redirect_url" varchar not null,
  "created_at" datetime not null,
  foreign key("tenant_id") references "tenants"("id") on delete cascade on update cascade,
  primary key("token")
);
CREATE TABLE "payment_histories"(
  "id" integer primary key autoincrement not null,
  "payment_id" integer not null,
  "status" varchar not null,
  "note" text,
  "created_by" integer,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("payment_id") references "payments"("id") on delete cascade,
  foreign key("created_by") references "users"("id")
);
CREATE TABLE "universites"(
  "id" integer primary key autoincrement not null,
  "nom" varchar not null,
  "sigle" varchar not null,
  "adresse" text,
  "telephone" varchar,
  "email" varchar,
  "site_web" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer
);
CREATE TABLE "facultes"(
  "id" integer primary key autoincrement not null,
  "nom" varchar not null,
  "sigle" varchar not null,
  "universite_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("universite_id") references "universites"("id") on delete cascade
);
CREATE TABLE "departements"(
  "id" integer primary key autoincrement not null,
  "nom" varchar not null,
  "faculte_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("faculte_id") references "facultes"("id") on delete cascade
);
CREATE TABLE "filieres"(
  "id" integer primary key autoincrement not null,
  "nom" varchar not null,
  "niveau" varchar not null,
  "departement_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("departement_id") references "departements"("id") on delete cascade
);
CREATE TABLE "etudiants"(
  "id" integer primary key autoincrement not null,
  "matricule" varchar not null,
  "nom" varchar not null,
  "prenom" varchar not null,
  "date_naissance" date not null,
  "lieu_naissance" varchar not null,
  "sexe" varchar check("sexe" in('M', 'F')) not null,
  "telephone" varchar,
  "email" varchar,
  "adresse" text,
  "annee_entree" integer not null,
  "filiere_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  "user_id" integer,
  "statut" varchar not null default 'active',
  "deleted_at" datetime,
  foreign key("filiere_id") references "filieres"("id") on delete cascade
);
CREATE TABLE "uni_enseignants"(
  "id" integer primary key autoincrement not null,
  "nom" varchar not null,
  "prenom" varchar not null,
  "grade" varchar,
  "specialite" varchar,
  "telephone" varchar,
  "email" varchar,
  "departement_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  "user_id" integer,
  foreign key("departement_id") references "departements"("id") on delete cascade
);
CREATE TABLE "personnels"(
  "id" integer primary key autoincrement not null,
  "nom" varchar not null,
  "prenom" varchar not null,
  "poste" varchar not null,
  "telephone" varchar,
  "email" varchar,
  "universite_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("universite_id") references "universites"("id") on delete cascade
);
CREATE TABLE "annee_academiques"(
  "id" integer primary key autoincrement not null,
  "libelle" varchar not null,
  "date_debut" date not null,
  "date_fin" date not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer
);
CREATE TABLE "semestres"(
  "id" integer primary key autoincrement not null,
  "libelle" varchar not null,
  "annee_academique_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("annee_academique_id") references "annee_academiques"("id") on delete cascade
);
CREATE TABLE "uni_matieres"(
  "id" integer primary key autoincrement not null,
  "code" varchar not null,
  "intitule" varchar not null,
  "credit" integer,
  "enseignant_id" integer not null,
  "semestre_id" integer not null,
  "filiere_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("enseignant_id") references "uni_enseignants"("id") on delete cascade,
  foreign key("semestre_id") references "semestres"("id") on delete cascade,
  foreign key("filiere_id") references "filieres"("id") on delete cascade
);
CREATE TABLE "utilisateurs"(
  "id" integer primary key autoincrement not null,
  "nom_utilisateur" varchar not null,
  "mot_de_passe" varchar not null,
  "role" varchar check("role" in('Etudiant', 'Enseignant', 'Admin', 'Comptable', 'Scolarite')) not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer
);
CREATE UNIQUE INDEX "utilisateurs_nom_utilisateur_unique" on "utilisateurs"(
  "nom_utilisateur"
);
CREATE TABLE "fiches_paie"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "periode" varchar not null,
  "salaire_brut" numeric not null,
  "primes" numeric not null default '0',
  "retenues" numeric not null default '0',
  "salaire_net" numeric not null,
  "statut" varchar not null default 'EN_ATTENTE',
  "date_paiement" date,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE TABLE "cahier_de_textes"(
  "id" integer primary key autoincrement not null,
  "classe_id" integer not null,
  "matiere_id" integer not null,
  "enseignant_id" integer not null,
  "date" date not null,
  "titre_lecon" varchar not null,
  "contenu" text not null,
  "devoirs_donnes" text,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  "deleted_at" datetime,
  foreign key("classe_id") references "classes"("id") on delete cascade,
  foreign key("matiere_id") references "matieres"("id") on delete cascade,
  foreign key("enseignant_id") references "enseignants"("id") on delete cascade
);
CREATE TABLE "vehicules"(
  "id" integer primary key autoincrement not null,
  "immatriculation" varchar not null,
  "modele" varchar not null,
  "capacite" integer not null,
  "chauffeur_nom" varchar,
  "chauffeur_tel" varchar,
  "is_active" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer
);
CREATE UNIQUE INDEX "vehicules_immatriculation_unique" on "vehicules"(
  "immatriculation"
);
CREATE TABLE "trajets_transport"(
  "id" integer primary key autoincrement not null,
  "nom_trajet" varchar not null,
  "zones" text not null,
  "prix_mensuel" numeric not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer
);
CREATE TABLE "plans"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "slug" varchar not null,
  "description" text,
  "price_monthly" numeric not null default '0',
  "price_yearly" numeric not null default '0',
  "max_students" integer,
  "max_schools" integer not null default '1',
  "features" text,
  "modules" text,
  "is_popular" tinyint(1) not null default '0',
  "is_active" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime
);
CREATE UNIQUE INDEX "plans_slug_unique" on "plans"("slug");
CREATE TABLE "subscriptions"(
  "id" integer primary key autoincrement not null,
  "tenant_id" varchar not null,
  "plan_id" integer not null,
  "status" varchar not null,
  "trial_ends_at" datetime,
  "starts_at" datetime,
  "ends_at" datetime,
  "canceled_at" datetime,
  "billing_cycle" varchar not null,
  "amount" numeric not null default '0',
  "payment_provider" varchar,
  "payment_provider_id" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("tenant_id") references "tenants"("id") on delete cascade,
  foreign key("plan_id") references "plans"("id") on delete cascade
);
CREATE TABLE "tenant_settings"(
  "id" integer primary key autoincrement not null,
  "tenant_id" varchar not null,
  "key" varchar not null,
  "value" text,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("tenant_id") references "tenants"("id") on delete cascade
);
CREATE UNIQUE INDEX "tenant_settings_tenant_id_key_unique" on "tenant_settings"(
  "tenant_id",
  "key"
);
CREATE TABLE "modules"(
  "id" integer primary key autoincrement not null,
  "slug" varchar not null,
  "name" varchar not null,
  "description" text,
  "is_core" tinyint(1) not null default '0',
  "is_active" tinyint(1) not null default '1',
  "required_roles" text,
  "created_at" datetime,
  "updated_at" datetime
);
CREATE UNIQUE INDEX "modules_slug_unique" on "modules"("slug");
CREATE TABLE "tenant_modules"(
  "id" integer primary key autoincrement not null,
  "tenant_id" varchar not null,
  "module_id" integer not null,
  "enabled_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("tenant_id") references "tenants"("id") on delete cascade,
  foreign key("module_id") references "modules"("id") on delete cascade
);
CREATE UNIQUE INDEX "tenant_modules_tenant_id_module_id_unique" on "tenant_modules"(
  "tenant_id",
  "module_id"
);
CREATE TABLE "tenants"(
  "id" varchar not null,
  "created_at" datetime,
  "updated_at" datetime,
  "data" text,
  "name" varchar,
  "slug" varchar,
  "domain" varchar,
  "plan_id" integer,
  "status" varchar not null default 'trial',
  "school_type" varchar,
  foreign key("plan_id") references "plans"("id") on delete set null,
  primary key("id")
);
CREATE UNIQUE INDEX "tenants_slug_unique" on "tenants"("slug");
CREATE TABLE "invoices"(
  "id" integer primary key autoincrement not null,
  "tenant_id" varchar not null,
  "subscription_id" integer,
  "invoice_number" varchar not null,
  "status" varchar not null default 'pending',
  "amount" numeric not null,
  "currency" varchar not null default 'XOF',
  "billing_cycle" varchar,
  "payment_provider" varchar,
  "payment_provider_id" varchar,
  "payment_method" varchar,
  "paid_at" datetime,
  "due_at" datetime,
  "metadata" text,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("subscription_id") references "subscriptions"("id") on delete set null
);
CREATE INDEX "invoices_tenant_id_status_index" on "invoices"(
  "tenant_id",
  "status"
);
CREATE INDEX "invoices_payment_provider_payment_provider_id_index" on "invoices"(
  "payment_provider",
  "payment_provider_id"
);
CREATE UNIQUE INDEX "invoices_invoice_number_unique" on "invoices"(
  "invoice_number"
);
CREATE TABLE "sessions"(
  "id" varchar not null,
  "user_id" integer,
  "ip_address" varchar,
  "user_agent" text,
  "payload" text not null,
  "last_activity" integer not null,
  primary key("id")
);
CREATE INDEX "sessions_user_id_index" on "sessions"("user_id");
CREATE INDEX "sessions_last_activity_index" on "sessions"("last_activity");
CREATE TABLE "evenements"(
  "id" integer primary key autoincrement not null,
  "titre" varchar not null,
  "description" text,
  "date_debut" datetime not null,
  "date_fin" datetime,
  "lieu" varchar,
  "type" varchar not null default 'academique',
  "created_by" integer,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("created_by") references "users"("id") on delete set null
);
CREATE TABLE "coefficient_matieres"(
  "id" integer primary key autoincrement not null,
  "matiere_id" integer not null,
  "classe_id" integer,
  "serie_id" integer,
  "coefficient" numeric not null default '1',
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("matiere_id") references "matieres"("id") on delete cascade,
  foreign key("classe_id") references "classes"("id") on delete cascade,
  foreign key("serie_id") references "series"("id") on delete cascade
);
CREATE TABLE "sessions_matieres"(
  "id" integer primary key autoincrement not null,
  "session_id" integer not null,
  "matiere_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("session_id") references "sessions_academiques"("id") on delete cascade,
  foreign key("matiere_id") references "matieres"("id") on delete cascade
);
CREATE TABLE "audit_logs"(
  "id" integer primary key autoincrement not null,
  "user_id" integer,
  "ecole_id" integer,
  "event" varchar not null,
  "auditable_type" varchar not null,
  "auditable_id" integer not null,
  "old_values" text,
  "new_values" text,
  "ip_address" varchar,
  "user_agent" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete set null,
  foreign key("ecole_id") references "ecoles"("id") on delete set null
);
CREATE INDEX "audit_logs_auditable_type_auditable_id_index" on "audit_logs"(
  "auditable_type",
  "auditable_id"
);
CREATE INDEX "audit_logs_user_id_index" on "audit_logs"("user_id");
CREATE INDEX "audit_logs_event_index" on "audit_logs"("event");
CREATE INDEX "audit_logs_created_at_index" on "audit_logs"("created_at");
CREATE TABLE "devoir_eleve"(
  "id" integer primary key autoincrement not null,
  "devoir_id" integer not null,
  "eleve_id" integer not null,
  "reponse" text,
  "fichier" varchar,
  "rendu" tinyint(1) not null default '0',
  "date_remise" datetime,
  "note" numeric,
  "commentaire" text,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("devoir_id") references "devoirs"("id") on delete cascade,
  foreign key("eleve_id") references "users"("id") on delete cascade
);
CREATE UNIQUE INDEX "devoir_eleve_devoir_id_eleve_id_unique" on "devoir_eleve"(
  "devoir_id",
  "eleve_id"
);
CREATE INDEX "cahier_de_textes_ecole_id_index" on "cahier_de_textes"(
  "ecole_id"
);
CREATE INDEX "evenements_ecole_id_index" on "evenements"("ecole_id");
CREATE INDEX "payment_histories_ecole_id_index" on "payment_histories"(
  "ecole_id"
);
CREATE INDEX "vehicules_ecole_id_index" on "vehicules"("ecole_id");
CREATE INDEX "trajets_transport_ecole_id_index" on "trajets_transport"(
  "ecole_id"
);
CREATE INDEX "coefficient_matieres_ecole_id_index" on "coefficient_matieres"(
  "ecole_id"
);
CREATE INDEX "fiches_paie_ecole_id_index" on "fiches_paie"("ecole_id");
CREATE INDEX "universites_ecole_id_index" on "universites"("ecole_id");
CREATE INDEX "facultes_ecole_id_index" on "facultes"("ecole_id");
CREATE INDEX "departements_ecole_id_index" on "departements"("ecole_id");
CREATE INDEX "filieres_ecole_id_index" on "filieres"("ecole_id");
CREATE INDEX "etudiants_ecole_id_index" on "etudiants"("ecole_id");
CREATE INDEX "semestres_ecole_id_index" on "semestres"("ecole_id");
CREATE INDEX "annee_academiques_ecole_id_index" on "annee_academiques"(
  "ecole_id"
);
CREATE INDEX "uni_enseignants_ecole_id_index" on "uni_enseignants"("ecole_id");
CREATE INDEX "uni_matieres_ecole_id_index" on "uni_matieres"("ecole_id");
CREATE INDEX "personnels_ecole_id_index" on "personnels"("ecole_id");
CREATE INDEX "utilisateurs_ecole_id_index" on "utilisateurs"("ecole_id");
CREATE INDEX "evenements_date_debut_index" on "evenements"("date_debut");
CREATE INDEX "devoir_eleve_eleve_rendu_index" on "devoir_eleve"(
  "eleve_id",
  "rendu"
);
CREATE TABLE "classe_matieres"(
  "id" integer primary key autoincrement not null,
  "classe_id" integer not null,
  "matiere_id" integer not null,
  "coefficient" float not null default('1'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("classe_id") references classes("id") on delete cascade on update no action,
  foreign key("matiere_id") references matieres("id") on delete cascade on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "classe_matieres_ecole_id_index" on "classe_matieres"("ecole_id");
CREATE TABLE "classe_series"(
  "id" integer primary key autoincrement not null,
  "classe_id" integer not null,
  "serie_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("classe_id") references classes("id") on delete cascade on update no action,
  foreign key("serie_id") references series("id") on delete cascade on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "classe_series_ecole_id_index" on "classe_series"("ecole_id");
CREATE TABLE "classes"(
  "id" integer primary key autoincrement not null,
  "nom_classe" varchar not null,
  "categorie_classe" varchar not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  "capacite_max" integer,
  "deleted_at" datetime,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "classes_ecole_id_index" on "classes"("ecole_id");
CREATE TABLE "conseils_classe"(
  "id" integer primary key autoincrement not null,
  "classe_id" integer not null,
  "date" date not null,
  "trimestre" varchar not null,
  "participants" text,
  "decisions" text,
  "statut" varchar not null default('programmé'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("classe_id") references classes("id") on delete cascade on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "conseils_classe_ecole_id_index" on "conseils_classe"("ecole_id");
CREATE TABLE "contributions"(
  "id" integer primary key autoincrement not null,
  "montant" integer not null,
  "date_fin_premiere_tranche" date not null,
  "montant_premiere_tranche" integer not null,
  "date_fin_deuxieme_tranche" date not null,
  "montant_deuxieme_tranche" integer not null,
  "date_fin_troisieme_tranche" date not null,
  "montant_troisieme_tranche" integer not null,
  "id_classe" integer not null,
  "id_serie" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  "deleted_at" datetime,
  foreign key("id_classe") references classes("id") on delete no action on update no action,
  foreign key("id_serie") references series("id") on delete no action on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "contributions_ecole_id_index" on "contributions"("ecole_id");
CREATE TABLE "depenses"(
  "id" integer primary key autoincrement not null,
  "ecole_id" integer not null,
  "categorie" varchar not null,
  "description" varchar not null,
  "montant" numeric not null,
  "date_depense" date not null,
  "justificatif_path" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  "deleted_at" datetime,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE TABLE "devoirs"(
  "id" integer primary key autoincrement not null,
  "enseignant_id" integer not null,
  "classe_id" integer not null,
  "matiere_id" integer,
  "titre" varchar not null,
  "description" text,
  "date_limite" datetime,
  "fichier" varchar,
  "type" varchar not null default('devoir'),
  "publie" tinyint(1) not null default('0'),
  "ecole_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "deleted_at" datetime,
  foreign key("matiere_id") references matieres("id") on delete set null on update no action,
  foreign key("classe_id") references classes("id") on delete cascade on update no action,
  foreign key("enseignant_id") references users("id") on delete cascade on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE TABLE "eleves"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "numero_matricule" varchar not null,
  "date_naissance" date,
  "lieu_naissance" varchar,
  "sexe" varchar,
  "classe_id" integer not null,
  "serie_id" integer,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  "statut" varchar not null default 'active',
  "deleted_at" datetime,
  foreign key("user_id") references users("id") on delete cascade on update no action,
  foreign key("classe_id") references classes("id") on delete no action on update no action,
  foreign key("serie_id") references series("id") on delete no action on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "eleves_class_id_index" on "eleves"("classe_id");
CREATE INDEX "eleves_ecole_id_index" on "eleves"("ecole_id");
CREATE INDEX "eleves_serie_id_index" on "eleves"("serie_id");
CREATE TABLE "emplois_du_temps"(
  "id" integer primary key autoincrement not null,
  "classe_id" integer not null,
  "matiere_id" integer not null,
  "enseignant_id" integer not null,
  "jour" varchar not null,
  "heure_debut" time not null,
  "heure_fin" time not null,
  "salle" varchar not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  "deleted_at" datetime,
  foreign key("classe_id") references classes("id") on delete cascade on update no action,
  foreign key("matiere_id") references matieres("id") on delete cascade on update no action,
  foreign key("enseignant_id") references enseignants("id") on delete cascade on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "emplois_du_temps_ecole_id_index" on "emplois_du_temps"(
  "ecole_id"
);
CREATE TABLE "enseignant_matiere"(
  "id" integer primary key autoincrement not null,
  "enseignant_id" integer not null,
  "matiere_id" integer not null,
  "classe_id" integer not null,
  "serie_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("enseignant_id") references enseignants("id") on delete no action on update no action,
  foreign key("matiere_id") references matieres("id") on delete no action on update no action,
  foreign key("classe_id") references classes("id") on delete no action on update no action,
  foreign key("serie_id") references series("id") on delete no action on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "enseignant_matiere_ecole_id_index" on "enseignant_matiere"(
  "ecole_id"
);
CREATE TABLE "enseignantmp_classe"(
  "id" integer primary key autoincrement not null,
  "enseignants_id" integer not null,
  "classe_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("enseignants_id") references enseignants("id") on delete no action on update no action,
  foreign key("classe_id") references classes("id") on delete no action on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "enseignantmp_classe_ecole_id_index" on "enseignantmp_classe"(
  "ecole_id"
);
CREATE TABLE "enseignants"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "date_naissance" date,
  "lieu_naissance" varchar,
  "sexe" varchar,
  "specialite" varchar,
  "grade" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  "deleted_at" datetime,
  foreign key("user_id") references users("id") on delete cascade on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "enseignants_ecole_id_index" on "enseignants"("ecole_id");
CREATE TABLE "enseignants_maternelle_primaire"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "date_naissance" date,
  "lieu_naissance" varchar,
  "sexe" varchar,
  "classe_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("user_id") references users("id") on delete cascade on update no action,
  foreign key("classe_id") references classes("id") on delete no action on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "enseignants_martenel_primaire_ecole_id_index" on "enseignants_maternelle_primaire"(
  "ecole_id"
);
CREATE TABLE "examens"(
  "id" integer primary key autoincrement not null,
  "nom" varchar not null,
  "type" varchar not null,
  "date_debut" date not null,
  "date_fin" date not null,
  "classes" text,
  "matieres" text,
  "statut" varchar not null default('programmé'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "examens_ecole_id_index" on "examens"("ecole_id");
CREATE TABLE "exercices"(
  "id" integer primary key autoincrement not null,
  "titre" varchar not null,
  "description" text not null,
  "classe_id" integer not null,
  "enseignant_id" integer not null,
  "date_limite" date not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("classe_id") references classes("id") on delete cascade on update no action,
  foreign key("enseignant_id") references enseignants("id") on delete cascade on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "exercices_ecole_id_index" on "exercices"("ecole_id");
CREATE TABLE "incidents"(
  "id" integer primary key autoincrement not null,
  "description" text not null,
  "date" datetime not null,
  "gravite" varchar not null,
  "statut" varchar not null default('ouvert'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "incidents_ecole_id_index" on "incidents"("ecole_id");
CREATE INDEX "incidents_gravite_date_index" on "incidents"("gravite", "date");
CREATE TABLE "matieres"(
  "id" integer primary key autoincrement not null,
  "nom" varchar not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  "volume_horaire" integer,
  "deleted_at" datetime,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "matieres_ecole_id_index" on "matieres"("ecole_id");
CREATE TABLE "messages"(
  "id" integer primary key autoincrement not null,
  "sujet" varchar not null,
  "contenu" text not null,
  "expediteur" varchar not null,
  "destinataire" varchar not null,
  "lu" tinyint(1) not null default('0'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "messages_destinataire_lu_index" on "messages"(
  "destinataire",
  "lu"
);
CREATE INDEX "messages_ecole_id_index" on "messages"("ecole_id");
CREATE INDEX "messages_expediteur_index" on "messages"("expediteur");
CREATE TABLE "parents"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "profession" varchar,
  "adresse" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("user_id") references users("id") on delete cascade on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "parents_ecole_id_index" on "parents"("ecole_id");
CREATE TABLE "periodes"(
  "id" integer primary key autoincrement not null,
  "nom" varchar not null,
  "date_debut" date not null,
  "date_fin" date not null,
  "is_active" tinyint(1) not null default('0'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "periodes_ecole_id_index" on "periodes"("ecole_id");
CREATE TABLE "personnel"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "poste" varchar not null,
  "type_contrat" varchar not null default('CDI'),
  "salaire_base" numeric not null default('0'),
  "date_embauche" date not null,
  "is_active" tinyint(1) not null default('1'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("user_id") references users("id") on delete cascade on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE TABLE "serie_matieres"(
  "id" integer primary key autoincrement not null,
  "serie_id" integer not null,
  "matiere_id" integer not null,
  "classe_id" integer not null,
  "coefficient" float not null default('1'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("serie_id") references series("id") on delete cascade on update no action,
  foreign key("matiere_id") references matieres("id") on delete cascade on update no action,
  foreign key("classe_id") references classes("id") on delete cascade on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "serie_matieres_ecole_id_index" on "serie_matieres"("ecole_id");
CREATE UNIQUE INDEX "serie_matieres_serie_id_matiere_id_classe_id_unique" on "serie_matieres"(
  "serie_id",
  "matiere_id",
  "classe_id"
);
CREATE TABLE "series"(
  "id" integer primary key autoincrement not null,
  "nom" varchar not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "series_ecole_id_index" on "series"("ecole_id");
CREATE TABLE "sessions_academiques"(
  "id" integer primary key autoincrement not null,
  "nom" varchar not null,
  "statut" varchar not null default('planifiee'),
  "date_debut" date not null,
  "date_fin" date,
  "ecole_id" integer,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE TABLE "statut_tranches"(
  "id" integer primary key autoincrement not null,
  "id_paiement_eleve" integer not null,
  "tranche" varchar,
  "statut" varchar not null default('EN_ATTENTE'),
  "date_limite" datetime,
  "montant_tranche" numeric not null default('0'),
  "date_paiement" datetime,
  "ecole_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("id_paiement_eleve") references paiements("id") on delete cascade on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE TABLE "transaction_paiements"(
  "id" integer primary key autoincrement not null,
  "id_paiement_eleve" integer not null,
  "tranche" varchar,
  "montant_paye" numeric not null default('0'),
  "date_paiement" datetime,
  "statut" varchar not null default('EN_ATTENTE'),
  "methode_paiement" varchar,
  "reference_transaction" varchar,
  "recu_par" varchar,
  "observation" text,
  "ecole_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "deleted_at" datetime,
  foreign key("id_paiement_eleve") references paiements("id") on delete cascade on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE TABLE "type_evaluations"(
  "id" integer primary key autoincrement not null,
  "nom" varchar not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "type_evaluations_ecole_id_index" on "type_evaluations"(
  "ecole_id"
);
CREATE TABLE "typeevaluation_classes"(
  "id" integer primary key autoincrement not null,
  "periode_id" integer not null,
  "serie_id" integer not null,
  "typeevaluation_id" integer not null,
  "classe_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("periode_id") references periodes("id") on delete cascade on update no action,
  foreign key("serie_id") references series("id") on delete cascade on update no action,
  foreign key("typeevaluation_id") references type_evaluations("id") on delete cascade on update no action,
  foreign key("classe_id") references classes("id") on delete cascade on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE UNIQUE INDEX "te_classes_unique" on "typeevaluation_classes"(
  "periode_id",
  "typeevaluation_id",
  "classe_id"
);
CREATE INDEX "typeevaluation_classes_ecole_id_index" on "typeevaluation_classes"(
  "ecole_id"
);
CREATE TABLE "users"(
  "id" integer primary key autoincrement not null,
  "identifiant" varchar,
  "name" varchar not null,
  "prenom" varchar,
  "email" varchar,
  "telephone" varchar,
  "role" varchar not null default('user'),
  "is_active" tinyint(1) not null default('1'),
  "ecole_id" integer,
  "email_verified_at" datetime,
  "password" varchar not null,
  "remember_token" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  "deleted_at" datetime,
  "avatar" text,
  "two_factor_enabled" tinyint(1) not null default '0',
  "two_factor_secret" text,
  "two_factor_verified_at" datetime,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "users_ecole_role_index" on "users"("ecole_id", "role");
CREATE UNIQUE INDEX "users_email_unique" on "users"("email");
CREATE UNIQUE INDEX "users_identifiant_unique" on "users"("identifiant");
CREATE INDEX "users_is_active_index" on "users"("is_active");
CREATE TABLE "migrations"(
  "id" integer primary key autoincrement not null,
  "migration" varchar not null,
  "batch" integer not null
);
CREATE UNIQUE INDEX "eleves_ecole_id_numero_matricule_unique" on "eleves"(
  "ecole_id",
  "numero_matricule"
);
CREATE UNIQUE INDEX "etudiants_ecole_id_matricule_unique" on "etudiants"(
  "ecole_id",
  "matricule"
);
CREATE UNIQUE INDEX "type_evaluations_ecole_id_nom_unique" on "type_evaluations"(
  "ecole_id",
  "nom"
);
CREATE UNIQUE INDEX "etudiants_user_id_unique" on "etudiants"("user_id");
CREATE UNIQUE INDEX "uni_enseignants_user_id_unique" on "uni_enseignants"(
  "user_id"
);
CREATE TABLE "communications"(
  "id" integer primary key autoincrement not null,
  "ecole_id" integer not null,
  "auteur_id" integer,
  "titre" varchar not null,
  "contenu" text not null,
  "categorie" varchar not null default 'info',
  "audience" varchar not null default 'ecole',
  "audience_cycle" varchar,
  "audience_role" varchar,
  "classe_id" integer,
  "tags" text,
  "epingle" tinyint(1) not null default '0',
  "publie_le" datetime,
  "expire_le" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  "deleted_at" datetime,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict,
  foreign key("auteur_id") references "users"("id") on delete set null,
  foreign key("classe_id") references "classes"("id") on delete cascade
);
CREATE INDEX "communications_school_published_index" on "communications"(
  "ecole_id",
  "publie_le"
);
CREATE INDEX "communications_school_audience_index" on "communications"(
  "ecole_id",
  "audience"
);
CREATE TABLE "uni_emplois_du_temps"(
  "id" integer primary key autoincrement not null,
  "ecole_id" integer not null,
  "titre" varchar not null,
  "type" varchar not null default 'cours',
  "date" date not null,
  "heure_debut" time not null,
  "heure_fin" time not null,
  "salle" varchar,
  "statut" varchar not null default 'planifie',
  "matiere_id" integer,
  "enseignant_id" integer,
  "semestre_id" integer,
  "filiere_id" integer,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict,
  foreign key("matiere_id") references "uni_matieres"("id") on delete set null,
  foreign key("enseignant_id") references "uni_enseignants"("id") on delete set null,
  foreign key("semestre_id") references "semestres"("id") on delete set null,
  foreign key("filiere_id") references "filieres"("id") on delete set null
);
CREATE INDEX "uni_planning_school_date_index" on "uni_emplois_du_temps"(
  "ecole_id",
  "date"
);
CREATE INDEX "uni_planning_school_filiere_index" on "uni_emplois_du_temps"(
  "ecole_id",
  "filiere_id"
);
CREATE TABLE "uni_devoirs"(
  "id" integer primary key autoincrement not null,
  "ecole_id" integer not null,
  "matiere_id" integer not null,
  "created_by" integer,
  "titre" varchar not null,
  "description" text,
  "type" varchar not null default 'devoir',
  "priorite" varchar not null default 'moyenne',
  "statut" varchar not null default 'en_cours',
  "date_limite" datetime,
  "publie" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict,
  foreign key("matiere_id") references "uni_matieres"("id") on delete cascade,
  foreign key("created_by") references "users"("id") on delete set null
);
CREATE INDEX "uni_devoirs_school_deadline_index" on "uni_devoirs"(
  "ecole_id",
  "date_limite"
);
CREATE INDEX "uni_devoirs_school_subject_index" on "uni_devoirs"(
  "ecole_id",
  "matiere_id"
);
CREATE INDEX "eleves_statut_index" on "eleves"("statut");
CREATE INDEX "etudiants_statut_index" on "etudiants"("statut");
CREATE TABLE "abonnements_transport"(
  "id" integer primary key autoincrement not null,
  "eleve_id" integer not null,
  "trajet_id" integer not null,
  "vehicule_id" integer,
  "date_debut" date not null,
  "date_fin" date,
  "statut" varchar not null default('active'),
  "montant_paye" numeric not null default('0'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("vehicule_id") references vehicules("id") on delete set null on update no action,
  foreign key("trajet_id") references trajets_transport("id") on delete cascade on update no action,
  foreign key("eleve_id") references "eleves"("id") on delete restrict
);
CREATE INDEX "abonnements_transport_ecole_id_index" on "abonnements_transport"(
  "ecole_id"
);
CREATE TABLE "absences"(
  "id" integer primary key autoincrement not null,
  "eleve_id" integer not null,
  "date" date not null,
  "type" varchar not null,
  "justifiee" tinyint(1) not null default('0'),
  "motif" text,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  "deleted_at" datetime,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action,
  foreign key("eleve_id") references "eleves"("id") on delete restrict
);
CREATE INDEX "absences_ecole_id_index" on "absences"("ecole_id");
CREATE INDEX "absences_eleve_date_index" on "absences"("eleve_id", "date");
CREATE TABLE "bourses"(
  "id" integer primary key autoincrement not null,
  "eleve_id" integer not null,
  "type_bourse" varchar not null,
  "montant" numeric not null,
  "pourcentage" integer not null,
  "periode" varchar not null,
  "statut" varchar not null default('active'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action,
  foreign key("eleve_id") references "eleves"("id") on delete restrict
);
CREATE INDEX "bourses_ecole_id_index" on "bourses"("ecole_id");
CREATE TABLE "certificats"(
  "id" integer primary key autoincrement not null,
  "type_certificat" varchar not null,
  "eleve_id" integer not null,
  "date_emission" datetime not null,
  "numero_certificat" varchar not null,
  "delivre" tinyint(1) not null default('0'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action,
  foreign key("eleve_id") references "eleves"("id") on delete restrict
);
CREATE INDEX "certificats_ecole_id_index" on "certificats"("ecole_id");
CREATE UNIQUE INDEX "certificats_ecole_id_numero_certificat_unique" on "certificats"(
  "ecole_id",
  "numero_certificat"
);
CREATE TABLE "consultations_medicales"(
  "id" integer primary key autoincrement not null,
  "eleve_id" integer not null,
  "motif" varchar not null,
  "diagnostic" text not null,
  "date" datetime not null,
  "traitement" text,
  "urgence" tinyint(1) not null default('0'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action,
  foreign key("eleve_id") references "eleves"("id") on delete restrict
);
CREATE INDEX "consultations_date_urgence_index" on "consultations_medicales"(
  "date",
  "urgence"
);
CREATE INDEX "consultations_medicales_ecole_id_index" on "consultations_medicales"(
  "ecole_id"
);
CREATE TABLE "diplomes"(
  "id" integer primary key autoincrement not null,
  "etudiant_id" integer not null,
  "intitule" varchar not null,
  "date_delivrance" date not null,
  "mention" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("etudiant_id") references "etudiants"("id") on delete restrict
);
CREATE INDEX "diplomes_ecole_id_index" on "diplomes"("ecole_id");
CREATE TABLE "dossiers_medicaux"(
  "id" integer primary key autoincrement not null,
  "eleve_id" integer not null,
  "groupe_sanguin" varchar,
  "allergies" text,
  "maladies_chroniques" text,
  "contact_urgence" varchar not null,
  "derniere_visite" datetime,
  "vaccins_a_jour" tinyint(1) not null default('1'),
  "aptitude_sport" tinyint(1) not null default('1'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action,
  foreign key("eleve_id") references "eleves"("id") on delete restrict
);
CREATE INDEX "dossiers_medicaux_ecole_id_index" on "dossiers_medicaux"(
  "ecole_id"
);
CREATE TABLE "eleves_matieres"(
  "id" integer primary key autoincrement not null,
  "matieres_id" integer not null,
  "eleves_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action,
  foreign key("matieres_id") references matieres("id") on delete cascade on update no action,
  foreign key("eleves_id") references "eleves"("id") on delete restrict
);
CREATE INDEX "eleves_matieres_ecole_id_index" on "eleves_matieres"("ecole_id");
CREATE TABLE "eleves_parents"(
  "id" integer primary key autoincrement not null,
  "parent_id" integer not null,
  "eleve_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  "role" varchar check("role" in('père', 'mère', 'tuteur', 'correspondant')),
  "is_primary" tinyint(1) not null default '0',
  "is_guardian" tinyint(1) not null default '0',
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action,
  foreign key("parent_id") references parents("id") on delete cascade on update no action,
  foreign key("eleve_id") references "eleves"("id") on delete restrict
);
CREATE INDEX "eleves_parents_ecole_id_index" on "eleves_parents"("ecole_id");
CREATE TABLE "emprunts"(
  "id" integer primary key autoincrement not null,
  "livre_id" integer not null,
  "eleve_id" integer not null,
  "date_emprunt" date not null,
  "date_retour_prevue" date not null,
  "date_retour_effective" date,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  "deleted_at" datetime,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action,
  foreign key("livre_id") references livres("id") on delete cascade on update no action,
  foreign key("eleve_id") references "eleves"("id") on delete restrict
);
CREATE INDEX "emprunts_ecole_id_index" on "emprunts"("ecole_id");
CREATE INDEX "emprunts_retour_index" on "emprunts"(
  "date_retour_prevue",
  "date_retour_effective"
);
CREATE TABLE "inscriptions"(
  "id" integer primary key autoincrement not null,
  "etudiant_id" integer not null,
  "annee_academique_id" integer not null,
  "date_inscription" date not null,
  "montant_frais" numeric not null,
  "statut" varchar not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("annee_academique_id") references annee_academiques("id") on delete cascade on update no action,
  foreign key("etudiant_id") references "etudiants"("id") on delete restrict
);
CREATE INDEX "inscriptions_ecole_id_index" on "inscriptions"("ecole_id");
CREATE TABLE "rendez_vous"(
  "id" integer primary key autoincrement not null,
  "motif" varchar not null,
  "parent_id" integer not null,
  "eleve_id" integer,
  "enseignant_id" integer,
  "date" datetime not null,
  "heure" varchar not null,
  "statut" varchar not null default('programmé'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action,
  foreign key("enseignant_id") references enseignants("id") on delete cascade on update no action,
  foreign key("parent_id") references parents("id") on delete cascade on update no action,
  foreign key("eleve_id") references "eleves"("id") on delete restrict
);
CREATE INDEX "rendez_vous_ecole_id_index" on "rendez_vous"("ecole_id");
CREATE TABLE "reservations"(
  "id" integer primary key autoincrement not null,
  "livre_id" integer not null,
  "eleve_id" integer not null,
  "date_reservation" date not null,
  "date_limite" date not null,
  "statut" varchar not null default('en_attente'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action,
  foreign key("livre_id") references livres("id") on delete cascade on update no action,
  foreign key("eleve_id") references "eleves"("id") on delete restrict
);
CREATE INDEX "reservations_ecole_id_index" on "reservations"("ecole_id");
CREATE TABLE "sanctions"(
  "id" integer primary key autoincrement not null,
  "eleve_id" integer not null,
  "type_sanction" varchar not null,
  "motif" text not null,
  "date" date not null,
  "duree" integer,
  "statut" varchar not null default('active'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  "deleted_at" datetime,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action,
  foreign key("eleve_id") references "eleves"("id") on delete restrict
);
CREATE INDEX "sanctions_ecole_id_index" on "sanctions"("ecole_id");
CREATE INDEX "sanctions_eleve_date_index" on "sanctions"("eleve_id", "date");
CREATE TABLE "sessions_candidats"(
  "id" integer primary key autoincrement not null,
  "session_id" integer not null,
  "eleve_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("session_id") references sessions_academiques("id") on delete cascade on update no action,
  foreign key("eleve_id") references "eleves"("id") on delete restrict
);
CREATE TABLE "uni_devoir_etudiant"(
  "id" integer primary key autoincrement not null,
  "devoir_id" integer not null,
  "etudiant_id" integer not null,
  "reponse" text,
  "fichier" varchar,
  "rendu" tinyint(1) not null default('0'),
  "date_remise" datetime,
  "note" numeric,
  "commentaire" text,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("devoir_id") references uni_devoirs("id") on delete cascade on update no action,
  foreign key("etudiant_id") references "etudiants"("id") on delete restrict
);
CREATE UNIQUE INDEX "uni_devoir_etudiant_devoir_id_etudiant_id_unique" on "uni_devoir_etudiant"(
  "devoir_id",
  "etudiant_id"
);
CREATE TABLE "uni_notes"(
  "id" integer primary key autoincrement not null,
  "etudiant_id" integer not null,
  "matiere_id" integer not null,
  "note" numeric not null,
  "type" varchar not null,
  "date_evaluation" date not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("matiere_id") references uni_matieres("id") on delete cascade on update no action,
  foreign key("etudiant_id") references "etudiants"("id") on delete restrict
);
CREATE INDEX "uni_notes_ecole_id_index" on "uni_notes"("ecole_id");
CREATE TABLE "uni_paiements"(
  "id" integer primary key autoincrement not null,
  "etudiant_id" integer not null,
  "montant" numeric not null,
  "date_paiement" date not null,
  "motif" varchar not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action,
  foreign key("etudiant_id") references "etudiants"("id") on delete restrict
);
CREATE TABLE "vaccinations"(
  "id" integer primary key autoincrement not null,
  "eleve_id" integer not null,
  "nom_vaccin" varchar not null,
  "date_vaccination" date not null,
  "numero_lot" varchar not null,
  "date_rappel" date,
  "effets_secondaires" tinyint(1) not null default('0'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action,
  foreign key("eleve_id") references "eleves"("id") on delete restrict
);
CREATE INDEX "vaccinations_date_rappel_index" on "vaccinations"("date_rappel");
CREATE INDEX "vaccinations_ecole_id_index" on "vaccinations"("ecole_id");
CREATE TABLE "notes"(
  "id" integer primary key autoincrement not null,
  "eleve_id" integer not null,
  "classe_id" integer not null,
  "matiere_id" integer not null,
  "note" numeric not null,
  "note_sur" numeric not null default('20'),
  "type_evaluation" varchar not null,
  "date_evaluation" date not null,
  "periode" varchar not null,
  "observation" text,
  "created_by" integer,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  "locked" tinyint(1) not null default('0'),
  "annee_scolaire" varchar,
  "deleted_at" datetime,
  foreign key("eleve_id") references eleves("id") on delete restrict on update no action,
  foreign key("classe_id") references classes("id") on delete cascade on update no action,
  foreign key("matiere_id") references matieres("id") on delete cascade on update no action,
  foreign key("created_by") references users("id") on delete no action on update no action,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action
);
CREATE INDEX "notes_classe_periode_index" on "notes"("classe_id", "periode");
CREATE INDEX "notes_ecole_id_index" on "notes"("ecole_id");
CREATE INDEX "notes_eleve_periode_index" on "notes"("eleve_id", "periode");
CREATE INDEX "notes_matiere_periode_index" on "notes"("matiere_id", "periode");
CREATE INDEX "notes_type_evaluation_index" on "notes"("type_evaluation");
CREATE TABLE "moyennes"(
  "id" integer primary key autoincrement not null,
  "eleve_id" integer not null,
  "classe_id" integer not null,
  "matiere_id" integer,
  "periode" varchar not null,
  "annee_scolaire" varchar,
  "valeur" numeric not null,
  "coefficient" numeric,
  "rang" integer,
  "total_eleves" integer,
  "created_by" integer,
  "ecole_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("eleve_id") references "eleves"("id") on delete restrict,
  foreign key("classe_id") references "classes"("id") on delete cascade,
  foreign key("matiere_id") references "matieres"("id") on delete cascade,
  foreign key("created_by") references "users"("id") on delete set null,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE INDEX "moyennes_eleve_id_periode_index" on "moyennes"(
  "eleve_id",
  "periode"
);
CREATE INDEX "moyennes_classe_id_periode_index" on "moyennes"(
  "classe_id",
  "periode"
);
CREATE INDEX "moyennes_matiere_id_index" on "moyennes"("matiere_id");
CREATE INDEX "notes_classe_periode_annee_index" on "notes"(
  "classe_id",
  "periode",
  "annee_scolaire"
);
CREATE TABLE "bulletins"(
  "id" integer primary key autoincrement not null,
  "eleve_id" integer not null,
  "classe_id" integer not null,
  "periode" varchar not null,
  "annee_scolaire" varchar not null,
  "moyenne_generale" numeric not null,
  "rang" integer not null,
  "total_eleves" integer,
  "mention" varchar,
  "data" text,
  "appreciation" text,
  "pdf_path" varchar,
  "publie" tinyint(1) not null default '0',
  "publie_le" datetime,
  "created_by" integer,
  "ecole_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "deleted_at" datetime,
  foreign key("eleve_id") references "eleves"("id") on delete restrict,
  foreign key("classe_id") references "classes"("id") on delete cascade,
  foreign key("created_by") references "users"("id") on delete set null,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE UNIQUE INDEX "bulletins_eleve_periode_annee_unique" on "bulletins"(
  "eleve_id",
  "periode",
  "annee_scolaire",
  "ecole_id"
);
CREATE INDEX "bulletins_classe_periode_annee_index" on "bulletins"(
  "classe_id",
  "periode",
  "annee_scolaire"
);
CREATE UNIQUE INDEX "eleves_parents_eleve_parent_unique" on "eleves_parents"(
  "eleve_id",
  "parent_id"
);
CREATE UNIQUE INDEX "enseignant_matiere_unique" on "enseignant_matiere"(
  "enseignant_id",
  "matiere_id",
  "classe_id",
  "serie_id"
);
CREATE TABLE "parent_invitations"(
  "id" integer primary key autoincrement not null,
  "ecole_id" integer not null,
  "eleve_id" integer not null,
  "created_by" integer not null,
  "email" varchar not null,
  "token" varchar not null,
  "role" varchar,
  "is_primary" tinyint(1) not null default '0',
  "is_guardian" tinyint(1) not null default '0',
  "is_accepted" tinyint(1) not null default '0',
  "accepted_at" datetime,
  "expires_at" datetime not null,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict,
  foreign key("eleve_id") references "eleves"("id") on delete restrict,
  foreign key("created_by") references "users"("id") on delete cascade
);
CREATE UNIQUE INDEX "invite_unique_eleve_email" on "parent_invitations"(
  "eleve_id",
  "email"
);
CREATE INDEX "parent_invitations_token_index" on "parent_invitations"("token");
CREATE INDEX "parent_invitations_email_index" on "parent_invitations"("email");
CREATE UNIQUE INDEX "parent_invitations_token_unique" on "parent_invitations"(
  "token"
);
CREATE UNIQUE INDEX "classe_matieres_unique" on "classe_matieres"(
  "classe_id",
  "matiere_id"
);
CREATE UNIQUE INDEX "eleves_matieres_unique" on "eleves_matieres"(
  "eleves_id",
  "matieres_id"
);
CREATE UNIQUE INDEX "sessions_matieres_unique" on "sessions_matieres"(
  "session_id",
  "matiere_id"
);
CREATE UNIQUE INDEX "sessions_candidats_unique" on "sessions_candidats"(
  "session_id",
  "eleve_id"
);
CREATE UNIQUE INDEX "enseignantmp_classe_unique" on "enseignantmp_classe"(
  "enseignants_id",
  "classe_id"
);
CREATE UNIQUE INDEX "notes_unicite_note" on "notes"(
  "eleve_id",
  "classe_id",
  "matiere_id",
  "type_evaluation",
  "periode",
  "date_evaluation",
  "annee_scolaire"
);
CREATE TABLE "enseignant_experiences"(
  "id" integer primary key autoincrement not null,
  "enseignant_id" integer not null,
  "poste" varchar not null,
  "etablissement" varchar,
  "date_debut" date not null,
  "date_fin" date,
  "description" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("enseignant_id") references enseignants("id") on delete cascade on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE TABLE "enseignant_matiere_maitrisee"(
  "id" integer primary key autoincrement not null,
  "enseignant_id" integer not null,
  "matiere_id" integer not null,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  foreign key("matiere_id") references matieres("id") on delete cascade on update no action,
  foreign key("enseignant_id") references enseignants("id") on delete cascade on update no action,
  foreign key("ecole_id") references "ecoles"("id") on delete restrict
);
CREATE UNIQUE INDEX "enseignant_matiere_maitrisee_enseignant_id_matiere_id_unique" on "enseignant_matiere_maitrisee"(
  "enseignant_id",
  "matiere_id"
);
CREATE TABLE "payments"(
  "id" integer primary key autoincrement not null,
  "eleve_id" integer not null,
  "ecole_id" integer not null,
  "transaction_id" varchar,
  "amount" numeric not null,
  "currency" varchar not null default('XOF'),
  "type" varchar not null,
  "description" text not null,
  "periode" varchar,
  "status" varchar not null default('pending'),
  "payment_method" varchar,
  "paid_at" datetime,
  "refund_status" varchar not null default('none'),
  "refund_reason" text,
  "refunded_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  "paiement_eleve_id" integer,
  foreign key("eleve_id") references eleves("id") on delete restrict on update no action,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action,
  foreign key("paiement_eleve_id") references "paiements"("id") on delete set null
);
CREATE INDEX "payments_ecole_id_status_index" on "payments"(
  "ecole_id",
  "status"
);
CREATE INDEX "payments_eleve_id_status_index" on "payments"(
  "eleve_id",
  "status"
);
CREATE INDEX "payments_status_paid_at_index" on "payments"(
  "status",
  "paid_at"
);
CREATE UNIQUE INDEX "payments_transaction_id_unique" on "payments"(
  "transaction_id"
);
CREATE TABLE "paiements"(
  "id" integer primary key autoincrement not null,
  "parents_id" integer,
  "montant" numeric not null,
  "mode_paiement" varchar not null,
  "date_paiement" datetime not null,
  "created_at" datetime,
  "updated_at" datetime,
  "eleve_id" integer,
  "contribution_id" integer,
  "montant_total" numeric not null default('0'),
  "montant_paye" numeric not null default('0'),
  "montant_restant" numeric not null default('0'),
  "statut_global" varchar not null default('EN_ATTENTE'),
  "ecole_id" integer,
  "reference" varchar,
  "type_paiement" varchar,
  "deleted_at" datetime,
  foreign key("parents_id") references parents("id") on delete cascade on update no action,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action
);
CREATE INDEX "paiements_date_statut_index" on "paiements"(
  "date_paiement",
  "statut_global"
);
CREATE INDEX "paiements_ecole_id_index" on "paiements"("ecole_id");
CREATE INDEX "paiements_eleve_statut_index" on "paiements"(
  "eleve_id",
  "statut_global"
);
CREATE INDEX "paiements_reference_index" on "paiements"("reference");
CREATE INDEX "paiements_eleve_id_index" on "paiements"("eleve_id");
CREATE INDEX "paiements_contribution_id_index" on "paiements"(
  "contribution_id"
);
CREATE TABLE "email_verification_tokens"(
  "email" varchar not null,
  "token" varchar not null,
  "created_at" datetime not null
);
CREATE TABLE "notifications"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "type" varchar not null,
  "message" text,
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  "title" varchar,
  "data" text,
  "read_at" datetime,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action,
  foreign key("user_id") references users("id") on delete cascade on update no action
);
CREATE INDEX "notifications_ecole_id_index" on "notifications"("ecole_id");
CREATE INDEX "notes_eleve_id_matiere_id_periode_type_evaluation_index" on "notes"(
  "eleve_id",
  "matiere_id",
  "periode",
  "type_evaluation"
);
CREATE INDEX "bulletins_ecole_id_index" on "bulletins"("ecole_id");
CREATE INDEX "devoirs_ecole_id_index" on "devoirs"("ecole_id");
CREATE TABLE "livres"(
  "id" integer primary key autoincrement not null,
  "titre" varchar not null,
  "auteur" varchar not null,
  "isbn" varchar not null,
  "categorie" varchar not null,
  "annee_publication" integer not null,
  "nombre_exemplaires" integer not null default('1'),
  "disponible" tinyint(1) not null default('1'),
  "created_at" datetime,
  "updated_at" datetime,
  "ecole_id" integer,
  "deleted_at" datetime,
  foreign key("ecole_id") references ecoles("id") on delete restrict on update no action
);
CREATE INDEX "livres_ecole_id_index" on "livres"("ecole_id");
CREATE UNIQUE INDEX "transaction_paiements_reference_transaction_unique" on "transaction_paiements"(
  "reference_transaction"
);

INSERT INTO migrations VALUES(1,'2013_01_01_000000_create_ecoles_table',1);
INSERT INTO migrations VALUES(2,'2014_10_12_000000_create_users_table',1);
INSERT INTO migrations VALUES(3,'2014_10_12_100000_create_password_resets_table',1);
INSERT INTO migrations VALUES(4,'2019_08_19_000000_create_failed_jobs_table',1);
INSERT INTO migrations VALUES(5,'2019_09_15_000010_create_tenants_table',1);
INSERT INTO migrations VALUES(6,'2019_09_15_000020_create_domains_table',1);
INSERT INTO migrations VALUES(7,'2019_12_14_000001_create_personal_access_tokens_table',1);
INSERT INTO migrations VALUES(8,'2020_05_15_000010_create_tenant_user_impersonation_tokens_table',1);
INSERT INTO migrations VALUES(9,'2023_01_01_000001_create_series_table',1);
INSERT INTO migrations VALUES(10,'2023_01_01_000002_create_matieres_table',1);
INSERT INTO migrations VALUES(11,'2023_01_01_000003_create_classes_table',1);
INSERT INTO migrations VALUES(12,'2023_02_01_000001_create_parents_table',1);
INSERT INTO migrations VALUES(13,'2023_02_01_000002_create_eleves_table',1);
INSERT INTO migrations VALUES(14,'2023_02_01_000003_create_enseignants_table',1);
INSERT INTO migrations VALUES(15,'2024_01_01_000001_create_payments_table',1);
INSERT INTO migrations VALUES(16,'2024_01_01_000002_create_payment_histories_table',1);
INSERT INTO migrations VALUES(17,'2024_01_01_000004_typeevaluation',1);
INSERT INTO migrations VALUES(18,'2024_01_01_000005_periodes',1);
INSERT INTO migrations VALUES(19,'2024_01_02_000001_classe_series',1);
INSERT INTO migrations VALUES(20,'2024_01_02_000002_classe_matieres',1);
INSERT INTO migrations VALUES(21,'2024_01_02_000003_serie_matieres',1);
INSERT INTO migrations VALUES(22,'2024_01_03_000001_enseignants_mp',1);
INSERT INTO migrations VALUES(23,'2024_01_03_000003_enseignant_matiere',1);
INSERT INTO migrations VALUES(24,'2024_01_04_000001_eleves_matieres',1);
INSERT INTO migrations VALUES(25,'2024_01_04_000002_parent_eleve',1);
INSERT INTO migrations VALUES(26,'2024_01_04_000003_notes',1);
INSERT INTO migrations VALUES(27,'2024_01_05_000001_contributions',1);
INSERT INTO migrations VALUES(28,'2024_01_05_000002_paiements',1);
INSERT INTO migrations VALUES(29,'2024_01_06_000001_create_bourses_table',1);
INSERT INTO migrations VALUES(30,'2024_01_06_000002_create_absences_table',1);
INSERT INTO migrations VALUES(31,'2024_01_06_000003_create_incidents_table',1);
INSERT INTO migrations VALUES(32,'2024_01_06_000004_create_sanctions_table',1);
INSERT INTO migrations VALUES(33,'2024_01_06_000005_create_consultations_medicales_table',1);
INSERT INTO migrations VALUES(34,'2024_01_06_000006_create_dossiers_medicaux_table',1);
INSERT INTO migrations VALUES(35,'2024_01_06_000007_create_vaccinations_table',1);
INSERT INTO migrations VALUES(36,'2024_01_06_000008_create_livres_table',1);
INSERT INTO migrations VALUES(37,'2024_01_06_000009_create_emprunts_table',1);
INSERT INTO migrations VALUES(38,'2024_01_06_000010_create_reservations_table',1);
INSERT INTO migrations VALUES(39,'2024_01_06_000011_create_rendez_vous_table',1);
INSERT INTO migrations VALUES(40,'2024_01_06_000012_create_certificats_table',1);
INSERT INTO migrations VALUES(41,'2024_01_06_000013_create_messages_table',1);
INSERT INTO migrations VALUES(42,'2024_01_06_000014_create_exercices_table',1);
INSERT INTO migrations VALUES(43,'2024_01_06_000015_create_emplois_du_temps_table',1);
INSERT INTO migrations VALUES(44,'2024_01_06_000016_create_conseils_classe_table',1);
INSERT INTO migrations VALUES(45,'2024_01_06_000017_create_examens_table',1);
INSERT INTO migrations VALUES(46,'2024_01_06_000018_create_notifications_table',1);
INSERT INTO migrations VALUES(47,'2024_01_07_000001_typeevaluation_classes',1);
INSERT INTO migrations VALUES(48,'2025_01_10_000001_add_columns_to_paiements_table',1);
INSERT INTO migrations VALUES(49,'2025_10_28_102424_enseignantmp_classe',1);
INSERT INTO migrations VALUES(50,'2025_11_01_041712_ecole_add_id',1);
INSERT INTO migrations VALUES(51,'2025_11_25_103503_create_universites_table',1);
INSERT INTO migrations VALUES(52,'2025_11_25_103508_create_facultes_table',1);
INSERT INTO migrations VALUES(53,'2025_11_25_103512_create_departements_table',1);
INSERT INTO migrations VALUES(54,'2025_11_25_103516_create_filieres_table',1);
INSERT INTO migrations VALUES(55,'2025_11_25_103520_create_etudiants_table',1);
INSERT INTO migrations VALUES(56,'2025_11_25_103524_create_uni_enseignants_table',1);
INSERT INTO migrations VALUES(57,'2025_11_25_103528_create_personnels_table',1);
INSERT INTO migrations VALUES(58,'2025_11_25_103531_create_annee_academiques_table',1);
INSERT INTO migrations VALUES(59,'2025_11_25_103537_create_inscriptions_table',1);
INSERT INTO migrations VALUES(60,'2025_11_25_103544_create_semestres_table',1);
INSERT INTO migrations VALUES(61,'2025_11_25_103550_create_uni_matieres_table',1);
INSERT INTO migrations VALUES(62,'2025_11_25_103555_create_uni_notes_table',1);
INSERT INTO migrations VALUES(63,'2025_11_25_103601_create_diplomes_table',1);
INSERT INTO migrations VALUES(64,'2025_11_25_103605_create_utilisateurs_table',1);
INSERT INTO migrations VALUES(65,'2025_11_25_111706_create_paiements_u_table',1);
INSERT INTO migrations VALUES(66,'2026_04_09_124130_create_hr_and_finance_tables',1);
INSERT INTO migrations VALUES(67,'2026_04_09_125320_create_cahier_de_textes_table',1);
INSERT INTO migrations VALUES(68,'2026_04_09_125855_create_transport_tables',1);
INSERT INTO migrations VALUES(69,'2026_07_06_145001_create_plans_table',1);
INSERT INTO migrations VALUES(70,'2026_07_06_145002_create_subscriptions_table',1);
INSERT INTO migrations VALUES(71,'2026_07_06_145003_create_tenant_settings_table',1);
INSERT INTO migrations VALUES(72,'2026_07_06_145004_create_modules_table',1);
INSERT INTO migrations VALUES(73,'2026_07_06_145005_create_tenant_modules_table',1);
INSERT INTO migrations VALUES(74,'2026_07_06_145010_add_saas_columns_to_tenants_table',1);
INSERT INTO migrations VALUES(75,'2026_07_06_183001_create_invoices_table',1);
INSERT INTO migrations VALUES(76,'2026_07_08_090555_create_sessions_table',1);
INSERT INTO migrations VALUES(77,'2026_07_08_100001_create_evenements_table',1);
INSERT INTO migrations VALUES(78,'2026_07_08_100002_create_moyennes_table',1);
INSERT INTO migrations VALUES(79,'2026_07_08_100003_create_coefficient_matieres_table',1);
INSERT INTO migrations VALUES(80,'2026_07_08_100004_create_transaction_paiements_table',1);
INSERT INTO migrations VALUES(81,'2026_07_08_100005_create_statut_tranches_table',1);
INSERT INTO migrations VALUES(82,'2026_07_08_155402_add_ecole_id_to_missing_tables',1);
INSERT INTO migrations VALUES(83,'2026_07_08_155449_create_sessions_academiques_tables',1);
INSERT INTO migrations VALUES(84,'2026_07_09_214818_add_locked_to_notes_table',1);
INSERT INTO migrations VALUES(85,'2026_07_10_104554_add_performance_indexes',1);
INSERT INTO migrations VALUES(86,'2026_07_10_104843_create_audit_logs_table',1);
INSERT INTO migrations VALUES(87,'2026_07_13_000001_create_devoirs_table',1);
INSERT INTO migrations VALUES(88,'2026_07_31_090000_add_ecole_id_to_untenanted_tables',1);
INSERT INTO migrations VALUES(89,'2026_07_31_090100_add_missing_performance_indexes',1);
INSERT INTO migrations VALUES(90,'2026_08_03_100000_restrict_school_deletion',1);
INSERT INTO migrations VALUES(91,'2026_08_03_110000_normalise_class_cycle_casing',1);
INSERT INTO migrations VALUES(92,'2026_08_03_120000_scope_unique_identifiers_per_school',1);
INSERT INTO migrations VALUES(93,'2026_08_03_130000_add_reference_and_type_to_paiements',1);
INSERT INTO migrations VALUES(94,'2026_08_04_100000_link_university_profiles_to_accounts',1);
INSERT INTO migrations VALUES(95,'2026_08_04_100100_create_communications_table',1);
INSERT INTO migrations VALUES(96,'2026_08_04_100200_create_uni_emplois_du_temps_table',1);
INSERT INTO migrations VALUES(97,'2026_08_04_100300_create_uni_devoirs_table',1);
INSERT INTO migrations VALUES(98,'2026_08_05_100000_add_enrolment_status_to_students',1);
INSERT INTO migrations VALUES(99,'2026_08_05_100100_restrict_student_deletion',1);
INSERT INTO migrations VALUES(100,'2026_08_06_000001_switch_notes_periode_to_trimestres',1);
INSERT INTO migrations VALUES(101,'2026_08_06_000010_rebuild_moyennes_table',1);
INSERT INTO migrations VALUES(102,'2026_08_06_000020_add_annee_scolaire_to_notes',1);
INSERT INTO migrations VALUES(103,'2026_08_06_000030_create_bulletins_table',1);
INSERT INTO migrations VALUES(104,'2026_08_06_113549_add_unique_indexes_to_pivot_tables',1);
INSERT INTO migrations VALUES(105,'2026_08_06_113845_rename_class_id_to_classe_id_in_eleves_table',1);
INSERT INTO migrations VALUES(106,'2026_08_07_000001_add_filiation_info_to_eleves_parents',1);
INSERT INTO migrations VALUES(107,'2026_08_10_103648_create_parent_invitations_table',1);
INSERT INTO migrations VALUES(108,'2026_08_11_000001_add_volume_horaire_and_capacite_max',1);
INSERT INTO migrations VALUES(109,'2026_08_12_000001_rename_maternelle_primaire_table',1);
INSERT INTO migrations VALUES(110,'2026_08_12_000002_add_unique_pivot_indexes',1);
INSERT INTO migrations VALUES(111,'2026_08_12_000003_add_unique_note_index',1);
INSERT INTO migrations VALUES(112,'2026_08_12_000004_add_soft_deletes_to_users',1);
INSERT INTO migrations VALUES(113,'2026_08_13_000001_add_avatar_and_teacher_profile_tables',1);
INSERT INTO migrations VALUES(114,'2026_08_14_100000_add_paiement_eleve_id_to_payments_table',1);
INSERT INTO migrations VALUES(115,'2026_08_14_200000_cleanup_paiements_schema',1);
INSERT INTO migrations VALUES(116,'2026_08_14_300000_drop_dead_paiement_tables',1);
INSERT INTO migrations VALUES(117,'2026_08_18_093659_add_two_factor_to_users_table',1);
INSERT INTO migrations VALUES(118,'2026_08_18_094455_create_email_verification_tokens_table',1);
INSERT INTO migrations VALUES(119,'2026_08_18_094607_add_soft_deletes_to_key_tables',1);
INSERT INTO migrations VALUES(120,'2026_08_18_094803_fix_database_integrity',1);
INSERT INTO migrations VALUES(121,'2026_08_19_091639_align_notifications_with_frontend',1);
INSERT INTO migrations VALUES(122,'2026_08_19_120000_add_composite_index_to_notes_table',1);
INSERT INTO migrations VALUES(123,'2026_08_19_130000_add_ecole_id_index_to_tenanted_tables',1);
INSERT INTO migrations VALUES(124,'2026_08_25_124352_add_soft_deletes_to_finance_tables',1);
INSERT INTO migrations VALUES(125,'2026_09_17_120000_widen_livre_publication_year',1);
INSERT INTO migrations VALUES(126,'2026_09_17_120100_restrict_school_deletion_on_remaining_tables',1);
INSERT INTO migrations VALUES(127,'2026_09_20_140000_add_unique_index_to_transaction_paiements_reference',2);
