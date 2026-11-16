/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `abonnements_transport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `abonnements_transport` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `eleve_id` bigint unsigned NOT NULL,
  `trajet_id` bigint unsigned NOT NULL,
  `vehicule_id` bigint unsigned DEFAULT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date DEFAULT NULL,
  `statut` enum('active','suspended','termine') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `montant_paye` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `abonnements_transport_trajet_id_foreign` (`trajet_id`),
  KEY `abonnements_transport_vehicule_id_foreign` (`vehicule_id`),
  KEY `abonnements_transport_ecole_id_index` (`ecole_id`),
  KEY `abonnements_transport_eleve_id_foreign` (`eleve_id`),
  CONSTRAINT `abonnements_transport_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `abonnements_transport_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `abonnements_transport_trajet_id_foreign` FOREIGN KEY (`trajet_id`) REFERENCES `trajets_transport` (`id`) ON DELETE CASCADE,
  CONSTRAINT `abonnements_transport_vehicule_id_foreign` FOREIGN KEY (`vehicule_id`) REFERENCES `vehicules` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `absences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `absences` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `eleve_id` bigint unsigned NOT NULL,
  `date` date NOT NULL,
  `type` enum('absence','retard') COLLATE utf8mb4_unicode_ci NOT NULL,
  `justifiee` tinyint(1) NOT NULL DEFAULT '0',
  `motif` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `absences_ecole_id_index` (`ecole_id`),
  KEY `absences_eleve_date_index` (`eleve_id`,`date`),
  CONSTRAINT `absences_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `absences_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `annee_academiques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `annee_academiques` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `libelle` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `annee_academiques_ecole_id_index` (`ecole_id`),
  CONSTRAINT `annee_academiques_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `event` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auditable_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auditable_id` bigint unsigned NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_ecole_id_foreign` (`ecole_id`),
  KEY `audit_logs_auditable_type_auditable_id_index` (`auditable_type`,`auditable_id`),
  KEY `audit_logs_user_id_index` (`user_id`),
  KEY `audit_logs_event_index` (`event`),
  KEY `audit_logs_created_at_index` (`created_at`),
  CONSTRAINT `audit_logs_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `bourses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bourses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `eleve_id` bigint unsigned NOT NULL,
  `type_bourse` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `pourcentage` int NOT NULL,
  `periode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` enum('active','suspendue','terminée') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bourses_ecole_id_index` (`ecole_id`),
  KEY `bourses_eleve_id_foreign` (`eleve_id`),
  CONSTRAINT `bourses_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `bourses_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `bulletins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bulletins` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `eleve_id` bigint unsigned NOT NULL,
  `classe_id` bigint unsigned NOT NULL,
  `periode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `annee_scolaire` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `moyenne_generale` decimal(5,2) NOT NULL,
  `rang` smallint unsigned NOT NULL,
  `total_eleves` int unsigned DEFAULT NULL,
  `mention` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data` json DEFAULT NULL,
  `appreciation` text COLLATE utf8mb4_unicode_ci,
  `pdf_path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `publie` tinyint(1) NOT NULL DEFAULT '0',
  `publie_le` timestamp NULL DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `ecole_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bulletins_eleve_periode_annee_unique` (`eleve_id`,`periode`,`annee_scolaire`,`ecole_id`),
  KEY `bulletins_created_by_foreign` (`created_by`),
  KEY `bulletins_ecole_id_foreign` (`ecole_id`),
  KEY `bulletins_classe_periode_annee_index` (`classe_id`,`periode`,`annee_scolaire`),
  CONSTRAINT `bulletins_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bulletins_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `bulletins_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `bulletins_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cahier_de_textes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cahier_de_textes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `classe_id` bigint unsigned NOT NULL,
  `matiere_id` bigint unsigned NOT NULL,
  `enseignant_id` bigint unsigned NOT NULL,
  `date` date NOT NULL,
  `titre_lecon` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenu` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `devoirs_donnes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cahier_de_textes_classe_id_foreign` (`classe_id`),
  KEY `cahier_de_textes_matiere_id_foreign` (`matiere_id`),
  KEY `cahier_de_textes_enseignant_id_foreign` (`enseignant_id`),
  KEY `cahier_de_textes_ecole_id_index` (`ecole_id`),
  CONSTRAINT `cahier_de_textes_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cahier_de_textes_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `cahier_de_textes_enseignant_id_foreign` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cahier_de_textes_matiere_id_foreign` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `certificats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificats` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `type_certificat` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `eleve_id` bigint unsigned NOT NULL,
  `date_emission` datetime NOT NULL,
  `numero_certificat` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivre` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificats_ecole_id_numero_certificat_unique` (`ecole_id`,`numero_certificat`),
  KEY `certificats_ecole_id_index` (`ecole_id`),
  KEY `certificats_eleve_id_foreign` (`eleve_id`),
  CONSTRAINT `certificats_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `certificats_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `classe_matieres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classe_matieres` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `classe_id` bigint unsigned NOT NULL,
  `matiere_id` bigint unsigned NOT NULL,
  `coefficient` double NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `classe_matieres_unique` (`classe_id`,`matiere_id`),
  KEY `classe_matieres_matiere_id_foreign` (`matiere_id`),
  KEY `classe_matieres_ecole_id_index` (`ecole_id`),
  CONSTRAINT `classe_matieres_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `classe_matieres_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `classe_matieres_matiere_id_foreign` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `classe_series`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classe_series` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `classe_id` bigint unsigned NOT NULL,
  `serie_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `classe_series_classe_id_foreign` (`classe_id`),
  KEY `classe_series_serie_id_foreign` (`serie_id`),
  KEY `classe_series_ecole_id_index` (`ecole_id`),
  CONSTRAINT `classe_series_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `classe_series_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `classe_series_serie_id_foreign` FOREIGN KEY (`serie_id`) REFERENCES `series` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `nom_classe` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categorie_classe` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `capacite_max` int DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `classes_ecole_id_index` (`ecole_id`),
  CONSTRAINT `classes_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `coefficient_matieres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coefficient_matieres` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `matiere_id` bigint unsigned NOT NULL,
  `classe_id` bigint unsigned DEFAULT NULL,
  `serie_id` bigint unsigned DEFAULT NULL,
  `coefficient` decimal(5,2) NOT NULL DEFAULT '1.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `coefficient_matieres_matiere_id_foreign` (`matiere_id`),
  KEY `coefficient_matieres_classe_id_foreign` (`classe_id`),
  KEY `coefficient_matieres_serie_id_foreign` (`serie_id`),
  KEY `coefficient_matieres_ecole_id_index` (`ecole_id`),
  CONSTRAINT `coefficient_matieres_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `coefficient_matieres_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `coefficient_matieres_matiere_id_foreign` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE,
  CONSTRAINT `coefficient_matieres_serie_id_foreign` FOREIGN KEY (`serie_id`) REFERENCES `series` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `communications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `communications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned NOT NULL,
  `auteur_id` bigint unsigned DEFAULT NULL,
  `titre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenu` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `categorie` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `audience` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ecole',
  `audience_cycle` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `audience_role` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `classe_id` bigint unsigned DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `epingle` tinyint(1) NOT NULL DEFAULT '0',
  `publie_le` timestamp NULL DEFAULT NULL,
  `expire_le` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `communications_auteur_id_foreign` (`auteur_id`),
  KEY `communications_classe_id_foreign` (`classe_id`),
  KEY `communications_school_published_index` (`ecole_id`,`publie_le`),
  KEY `communications_school_audience_index` (`ecole_id`,`audience`),
  CONSTRAINT `communications_auteur_id_foreign` FOREIGN KEY (`auteur_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `communications_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `communications_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `conseils_classe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conseils_classe` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `classe_id` bigint unsigned NOT NULL,
  `date` date NOT NULL,
  `trimestre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `participants` json DEFAULT NULL,
  `decisions` json DEFAULT NULL,
  `statut` enum('programmé','en_cours','terminé') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'programmé',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `conseils_classe_classe_id_foreign` (`classe_id`),
  KEY `conseils_classe_ecole_id_index` (`ecole_id`),
  CONSTRAINT `conseils_classe_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conseils_classe_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `consultations_medicales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations_medicales` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `eleve_id` bigint unsigned NOT NULL,
  `motif` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `diagnostic` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` datetime NOT NULL,
  `traitement` text COLLATE utf8mb4_unicode_ci,
  `urgence` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `consultations_medicales_ecole_id_index` (`ecole_id`),
  KEY `consultations_date_urgence_index` (`date`,`urgence`),
  KEY `consultations_medicales_eleve_id_foreign` (`eleve_id`),
  CONSTRAINT `consultations_medicales_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `consultations_medicales_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `contributions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contributions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `montant` int NOT NULL,
  `date_fin_premiere_tranche` date NOT NULL,
  `montant_premiere_tranche` int NOT NULL,
  `date_fin_deuxieme_tranche` date NOT NULL,
  `montant_deuxieme_tranche` int NOT NULL,
  `date_fin_troisieme_tranche` date NOT NULL,
  `montant_troisieme_tranche` int NOT NULL,
  `id_classe` bigint unsigned NOT NULL,
  `id_serie` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `contributions_id_classe_foreign` (`id_classe`),
  KEY `contributions_id_serie_foreign` (`id_serie`),
  KEY `contributions_ecole_id_index` (`ecole_id`),
  CONSTRAINT `contributions_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `contributions_id_classe_foreign` FOREIGN KEY (`id_classe`) REFERENCES `classes` (`id`),
  CONSTRAINT `contributions_id_serie_foreign` FOREIGN KEY (`id_serie`) REFERENCES `series` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `departements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `faculte_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `departements_faculte_id_foreign` (`faculte_id`),
  KEY `departements_ecole_id_index` (`ecole_id`),
  CONSTRAINT `departements_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `departements_faculte_id_foreign` FOREIGN KEY (`faculte_id`) REFERENCES `facultes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `depenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `depenses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned NOT NULL,
  `categorie` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `montant` decimal(12,2) NOT NULL,
  `date_depense` date NOT NULL,
  `justificatif_path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `depenses_ecole_id_foreign` (`ecole_id`),
  CONSTRAINT `depenses_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `devoir_eleve`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devoir_eleve` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `devoir_id` bigint unsigned NOT NULL,
  `eleve_id` bigint unsigned NOT NULL,
  `reponse` text COLLATE utf8mb4_unicode_ci,
  `fichier` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rendu` tinyint(1) NOT NULL DEFAULT '0',
  `date_remise` datetime DEFAULT NULL,
  `note` decimal(5,2) DEFAULT NULL,
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `devoir_eleve_devoir_id_eleve_id_unique` (`devoir_id`,`eleve_id`),
  KEY `devoir_eleve_eleve_rendu_index` (`eleve_id`,`rendu`),
  CONSTRAINT `devoir_eleve_devoir_id_foreign` FOREIGN KEY (`devoir_id`) REFERENCES `devoirs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `devoir_eleve_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `devoirs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devoirs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `enseignant_id` bigint unsigned NOT NULL,
  `classe_id` bigint unsigned NOT NULL,
  `matiere_id` bigint unsigned DEFAULT NULL,
  `titre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `date_limite` datetime DEFAULT NULL,
  `fichier` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'devoir',
  `publie` tinyint(1) NOT NULL DEFAULT '0',
  `ecole_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `devoirs_enseignant_id_foreign` (`enseignant_id`),
  KEY `devoirs_classe_id_foreign` (`classe_id`),
  KEY `devoirs_matiere_id_foreign` (`matiere_id`),
  KEY `devoirs_ecole_id_foreign` (`ecole_id`),
  CONSTRAINT `devoirs_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `devoirs_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `devoirs_enseignant_id_foreign` FOREIGN KEY (`enseignant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `devoirs_matiere_id_foreign` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `diplomes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diplomes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `etudiant_id` bigint unsigned NOT NULL,
  `intitule` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_delivrance` date NOT NULL,
  `mention` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `diplomes_ecole_id_index` (`ecole_id`),
  KEY `diplomes_etudiant_id_foreign` (`etudiant_id`),
  CONSTRAINT `diplomes_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `diplomes_etudiant_id_foreign` FOREIGN KEY (`etudiant_id`) REFERENCES `etudiants` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `domains`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `domains` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `domain` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `domains_domain_unique` (`domain`),
  KEY `domains_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `domains_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `dossiers_medicaux`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dossiers_medicaux` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `eleve_id` bigint unsigned NOT NULL,
  `groupe_sanguin` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `allergies` text COLLATE utf8mb4_unicode_ci,
  `maladies_chroniques` text COLLATE utf8mb4_unicode_ci,
  `contact_urgence` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `derniere_visite` datetime DEFAULT NULL,
  `vaccins_a_jour` tinyint(1) NOT NULL DEFAULT '1',
  `aptitude_sport` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dossiers_medicaux_ecole_id_index` (`ecole_id`),
  KEY `dossiers_medicaux_eleve_id_foreign` (`eleve_id`),
  CONSTRAINT `dossiers_medicaux_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `dossiers_medicaux_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ecoles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ecoles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `pays` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ville` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code_postal` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `domain` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ecoles_email_unique` (`email`),
  UNIQUE KEY `ecoles_slug_unique` (`slug`),
  UNIQUE KEY `ecoles_domain_unique` (`domain`),
  KEY `ecoles_status_index` (`status`),
  KEY `ecoles_ville_pays_index` (`ville`,`pays`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `eleves`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eleves` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `statut` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `user_id` bigint unsigned NOT NULL,
  `numero_matricule` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_naissance` date DEFAULT NULL,
  `lieu_naissance` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sexe` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `classe_id` bigint unsigned NOT NULL,
  `serie_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `eleves_ecole_id_numero_matricule_unique` (`ecole_id`,`numero_matricule`),
  KEY `eleves_user_id_foreign` (`user_id`),
  KEY `eleves_ecole_id_index` (`ecole_id`),
  KEY `eleves_class_id_index` (`classe_id`),
  KEY `eleves_serie_id_index` (`serie_id`),
  KEY `eleves_statut_index` (`statut`),
  CONSTRAINT `eleves_class_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `eleves_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `eleves_serie_id_foreign` FOREIGN KEY (`serie_id`) REFERENCES `series` (`id`),
  CONSTRAINT `eleves_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `eleves_matieres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eleves_matieres` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `matieres_id` bigint unsigned NOT NULL,
  `eleves_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `eleves_matieres_unique` (`eleves_id`,`matieres_id`),
  KEY `eleves_matieres_matieres_id_foreign` (`matieres_id`),
  KEY `eleves_matieres_ecole_id_index` (`ecole_id`),
  CONSTRAINT `eleves_matieres_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `eleves_matieres_eleves_id_foreign` FOREIGN KEY (`eleves_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `eleves_matieres_matieres_id_foreign` FOREIGN KEY (`matieres_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `eleves_parents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eleves_parents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `parent_id` bigint unsigned NOT NULL,
  `eleve_id` bigint unsigned NOT NULL,
  `role` enum('père','mère','tuteur','correspondant') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_guardian` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `eleves_parents_eleve_parent_unique` (`eleve_id`,`parent_id`),
  KEY `eleves_parents_parent_id_foreign` (`parent_id`),
  KEY `eleves_parents_ecole_id_index` (`ecole_id`),
  CONSTRAINT `eleves_parents_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `eleves_parents_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `eleves_parents_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `email_verification_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_verification_tokens` (
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `emplois_du_temps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emplois_du_temps` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `classe_id` bigint unsigned NOT NULL,
  `matiere_id` bigint unsigned NOT NULL,
  `enseignant_id` bigint unsigned NOT NULL,
  `jour` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `salle` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `emplois_du_temps_classe_id_foreign` (`classe_id`),
  KEY `emplois_du_temps_matiere_id_foreign` (`matiere_id`),
  KEY `emplois_du_temps_enseignant_id_foreign` (`enseignant_id`),
  KEY `emplois_du_temps_ecole_id_index` (`ecole_id`),
  CONSTRAINT `emplois_du_temps_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `emplois_du_temps_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `emplois_du_temps_enseignant_id_foreign` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `emplois_du_temps_matiere_id_foreign` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `emprunts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emprunts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `livre_id` bigint unsigned NOT NULL,
  `eleve_id` bigint unsigned NOT NULL,
  `date_emprunt` date NOT NULL,
  `date_retour_prevue` date NOT NULL,
  `date_retour_effective` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `emprunts_livre_id_foreign` (`livre_id`),
  KEY `emprunts_ecole_id_index` (`ecole_id`),
  KEY `emprunts_retour_index` (`date_retour_prevue`,`date_retour_effective`),
  KEY `emprunts_eleve_id_foreign` (`eleve_id`),
  CONSTRAINT `emprunts_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `emprunts_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `emprunts_livre_id_foreign` FOREIGN KEY (`livre_id`) REFERENCES `livres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `enseignant_experiences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enseignant_experiences` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `enseignant_id` bigint unsigned NOT NULL,
  `poste` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `etablissement` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date DEFAULT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `enseignant_experiences_enseignant_id_foreign` (`enseignant_id`),
  KEY `enseignant_experiences_ecole_id_foreign` (`ecole_id`),
  CONSTRAINT `enseignant_experiences_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `enseignant_experiences_enseignant_id_foreign` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `enseignant_matiere`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enseignant_matiere` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `enseignant_id` bigint unsigned NOT NULL,
  `matiere_id` bigint unsigned NOT NULL,
  `classe_id` bigint unsigned NOT NULL,
  `serie_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `enseignant_matiere_unique` (`enseignant_id`,`matiere_id`,`classe_id`,`serie_id`),
  KEY `enseignant_matiere_matiere_id_foreign` (`matiere_id`),
  KEY `enseignant_matiere_classe_id_foreign` (`classe_id`),
  KEY `enseignant_matiere_serie_id_foreign` (`serie_id`),
  KEY `enseignant_matiere_ecole_id_index` (`ecole_id`),
  CONSTRAINT `enseignant_matiere_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `enseignant_matiere_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `enseignant_matiere_enseignant_id_foreign` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`),
  CONSTRAINT `enseignant_matiere_matiere_id_foreign` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`),
  CONSTRAINT `enseignant_matiere_serie_id_foreign` FOREIGN KEY (`serie_id`) REFERENCES `series` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `enseignant_matiere_maitrisee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enseignant_matiere_maitrisee` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `enseignant_id` bigint unsigned NOT NULL,
  `matiere_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `enseignant_matiere_maitrisee_enseignant_id_matiere_id_unique` (`enseignant_id`,`matiere_id`),
  KEY `enseignant_matiere_maitrisee_matiere_id_foreign` (`matiere_id`),
  KEY `enseignant_matiere_maitrisee_ecole_id_foreign` (`ecole_id`),
  CONSTRAINT `enseignant_matiere_maitrisee_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `enseignant_matiere_maitrisee_enseignant_id_foreign` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `enseignant_matiere_maitrisee_matiere_id_foreign` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `enseignantmp_classe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enseignantmp_classe` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `enseignants_id` bigint unsigned NOT NULL,
  `classe_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `enseignantmp_classe_unique` (`enseignants_id`,`classe_id`),
  KEY `enseignantmp_classe_classe_id_foreign` (`classe_id`),
  KEY `enseignantmp_classe_ecole_id_index` (`ecole_id`),
  CONSTRAINT `enseignantmp_classe_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `enseignantmp_classe_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `enseignantmp_classe_enseignants_id_foreign` FOREIGN KEY (`enseignants_id`) REFERENCES `enseignants` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `enseignants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enseignants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned NOT NULL,
  `date_naissance` date DEFAULT NULL,
  `lieu_naissance` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sexe` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialite` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grade` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `enseignants_user_id_foreign` (`user_id`),
  KEY `enseignants_ecole_id_index` (`ecole_id`),
  CONSTRAINT `enseignants_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `enseignants_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `enseignants_maternelle_primaire`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enseignants_maternelle_primaire` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned NOT NULL,
  `date_naissance` date DEFAULT NULL,
  `lieu_naissance` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sexe` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `classe_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `enseignants_martenel_primaire_user_id_foreign` (`user_id`),
  KEY `enseignants_martenel_primaire_class_id_foreign` (`classe_id`),
  KEY `enseignants_martenel_primaire_ecole_id_index` (`ecole_id`),
  CONSTRAINT `enseignants_martenel_primaire_class_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `enseignants_martenel_primaire_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `enseignants_martenel_primaire_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `etudiants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `etudiants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `matricule` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_naissance` date NOT NULL,
  `lieu_naissance` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sexe` enum('M','F') COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adresse` text COLLATE utf8mb4_unicode_ci,
  `annee_entree` year NOT NULL,
  `filiere_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `statut` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `user_id` bigint unsigned DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `etudiants_ecole_id_matricule_unique` (`ecole_id`,`matricule`),
  UNIQUE KEY `etudiants_user_id_unique` (`user_id`),
  KEY `etudiants_filiere_id_foreign` (`filiere_id`),
  KEY `etudiants_ecole_id_index` (`ecole_id`),
  KEY `etudiants_statut_index` (`statut`),
  CONSTRAINT `etudiants_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `etudiants_filiere_id_foreign` FOREIGN KEY (`filiere_id`) REFERENCES `filieres` (`id`) ON DELETE CASCADE,
  CONSTRAINT `etudiants_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `evenements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evenements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `date_debut` datetime NOT NULL,
  `date_fin` datetime DEFAULT NULL,
  `lieu` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'academique',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `evenements_created_by_foreign` (`created_by`),
  KEY `evenements_ecole_id_index` (`ecole_id`),
  KEY `evenements_date_debut_index` (`date_debut`),
  CONSTRAINT `evenements_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `evenements_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `examens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `classes` json DEFAULT NULL,
  `matieres` json DEFAULT NULL,
  `statut` enum('programmé','en_cours','terminé') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'programmé',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `examens_ecole_id_index` (`ecole_id`),
  CONSTRAINT `examens_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exercices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `titre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `classe_id` bigint unsigned NOT NULL,
  `enseignant_id` bigint unsigned NOT NULL,
  `date_limite` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `exercices_classe_id_foreign` (`classe_id`),
  KEY `exercices_enseignant_id_foreign` (`enseignant_id`),
  KEY `exercices_ecole_id_index` (`ecole_id`),
  CONSTRAINT `exercices_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exercices_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `exercices_enseignant_id_foreign` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `facultes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facultes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sigle` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `universite_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `facultes_universite_id_foreign` (`universite_id`),
  KEY `facultes_ecole_id_index` (`ecole_id`),
  CONSTRAINT `facultes_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `facultes_universite_id_foreign` FOREIGN KEY (`universite_id`) REFERENCES `universites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `fiches_paie`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fiches_paie` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `periode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `salaire_brut` decimal(12,2) NOT NULL,
  `primes` decimal(12,2) NOT NULL DEFAULT '0.00',
  `retenues` decimal(12,2) NOT NULL DEFAULT '0.00',
  `salaire_net` decimal(12,2) NOT NULL,
  `statut` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EN_ATTENTE',
  `date_paiement` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fiches_paie_user_id_foreign` (`user_id`),
  KEY `fiches_paie_ecole_id_index` (`ecole_id`),
  CONSTRAINT `fiches_paie_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fiches_paie_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `filieres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `filieres` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `niveau` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `departement_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `filieres_departement_id_foreign` (`departement_id`),
  KEY `filieres_ecole_id_index` (`ecole_id`),
  CONSTRAINT `filieres_departement_id_foreign` FOREIGN KEY (`departement_id`) REFERENCES `departements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `filieres_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `incidents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incidents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` datetime NOT NULL,
  `gravite` enum('faible','moyenne','grave') COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` enum('ouvert','en_cours','resolu') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ouvert',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `incidents_ecole_id_index` (`ecole_id`),
  KEY `incidents_gravite_date_index` (`gravite`,`date`),
  CONSTRAINT `incidents_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscriptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `etudiant_id` bigint unsigned NOT NULL,
  `annee_academique_id` bigint unsigned NOT NULL,
  `date_inscription` date NOT NULL,
  `montant_frais` decimal(10,2) NOT NULL,
  `statut` enum('En cours','Validée','Annulée') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inscriptions_annee_academique_id_foreign` (`annee_academique_id`),
  KEY `inscriptions_ecole_id_index` (`ecole_id`),
  KEY `inscriptions_etudiant_id_foreign` (`etudiant_id`),
  CONSTRAINT `inscriptions_annee_academique_id_foreign` FOREIGN KEY (`annee_academique_id`) REFERENCES `annee_academiques` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inscriptions_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `inscriptions_etudiant_id_foreign` FOREIGN KEY (`etudiant_id`) REFERENCES `etudiants` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subscription_id` bigint unsigned DEFAULT NULL,
  `invoice_number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'XOF',
  `billing_cycle` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_provider` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_provider_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `due_at` timestamp NULL DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_invoice_number_unique` (`invoice_number`),
  KEY `invoices_subscription_id_foreign` (`subscription_id`),
  KEY `invoices_tenant_id_status_index` (`tenant_id`,`status`),
  KEY `invoices_payment_provider_payment_provider_id_index` (`payment_provider`,`payment_provider_id`),
  CONSTRAINT `invoices_subscription_id_foreign` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `livres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `livres` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `titre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auteur` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isbn` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categorie` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `annee_publication` smallint unsigned NOT NULL,
  `nombre_exemplaires` int NOT NULL DEFAULT '1',
  `disponible` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `livres_ecole_id_index` (`ecole_id`),
  CONSTRAINT `livres_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `matieres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matieres` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `volume_horaire` int DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `matieres_ecole_id_index` (`ecole_id`),
  CONSTRAINT `matieres_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `sujet` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenu` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `expediteur` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `destinataire` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lu` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `messages_ecole_id_index` (`ecole_id`),
  KEY `messages_destinataire_lu_index` (`destinataire`,`lu`),
  KEY `messages_expediteur_index` (`expediteur`),
  CONSTRAINT `messages_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_core` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `required_roles` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `modules_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `moyennes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `moyennes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `eleve_id` bigint unsigned NOT NULL,
  `classe_id` bigint unsigned NOT NULL,
  `matiere_id` bigint unsigned DEFAULT NULL,
  `periode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `annee_scolaire` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valeur` decimal(5,2) NOT NULL,
  `coefficient` decimal(5,2) DEFAULT NULL,
  `rang` smallint unsigned DEFAULT NULL,
  `total_eleves` int unsigned DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `ecole_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `moyennes_created_by_foreign` (`created_by`),
  KEY `moyennes_ecole_id_foreign` (`ecole_id`),
  KEY `moyennes_eleve_id_periode_index` (`eleve_id`,`periode`),
  KEY `moyennes_classe_id_periode_index` (`classe_id`,`periode`),
  KEY `moyennes_matiere_id_index` (`matiere_id`),
  CONSTRAINT `moyennes_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `moyennes_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `moyennes_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `moyennes_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `moyennes_matiere_id_foreign` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `eleve_id` bigint unsigned NOT NULL,
  `classe_id` bigint unsigned NOT NULL,
  `matiere_id` bigint unsigned NOT NULL,
  `note` decimal(5,2) NOT NULL,
  `note_sur` decimal(5,2) NOT NULL DEFAULT '20.00',
  `type_evaluation` enum('Devoir1','Devoir2','Interrogation','1ère evaluation','2ème evaluation','3ème evaluation','4ème evaluation','5ème evaluation','6ème evaluation') COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_evaluation` date NOT NULL,
  `periode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `annee_scolaire` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observation` text COLLATE utf8mb4_unicode_ci,
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `notes_unicite_note` (`eleve_id`,`classe_id`,`matiere_id`,`type_evaluation`,`periode`,`date_evaluation`,`annee_scolaire`),
  KEY `notes_created_by_foreign` (`created_by`),
  KEY `notes_ecole_id_index` (`ecole_id`),
  KEY `notes_classe_periode_index` (`classe_id`,`periode`),
  KEY `notes_matiere_periode_index` (`matiere_id`,`periode`),
  KEY `notes_eleve_periode_index` (`eleve_id`,`periode`),
  KEY `notes_type_evaluation_index` (`type_evaluation`),
  KEY `notes_classe_periode_annee_index` (`classe_id`,`periode`,`annee_scolaire`),
  KEY `notes_eleve_id_matiere_id_periode_type_evaluation_index` (`eleve_id`,`matiere_id`,`periode`,`type_evaluation`),
  CONSTRAINT `notes_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notes_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `notes_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `notes_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `notes_matiere_id_foreign` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `data` json DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_foreign` (`user_id`),
  KEY `notifications_ecole_id_index` (`ecole_id`),
  CONSTRAINT `notifications_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `paiements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paiements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `eleve_id` bigint unsigned DEFAULT NULL,
  `contribution_id` bigint unsigned DEFAULT NULL,
  `montant_total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `montant_paye` decimal(10,2) NOT NULL DEFAULT '0.00',
  `montant_restant` decimal(10,2) NOT NULL DEFAULT '0.00',
  `statut_global` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EN_ATTENTE',
  `parents_id` bigint unsigned DEFAULT NULL,
  `montant` decimal(10,2) NOT NULL,
  `mode_paiement` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type_paiement` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_paiement` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `paiements_parents_id_foreign` (`parents_id`),
  KEY `paiements_ecole_id_index` (`ecole_id`),
  KEY `paiements_eleve_statut_index` (`eleve_id`,`statut_global`),
  KEY `paiements_date_statut_index` (`date_paiement`,`statut_global`),
  KEY `paiements_reference_index` (`reference`),
  KEY `paiements_eleve_id_index` (`eleve_id`),
  KEY `paiements_contribution_id_index` (`contribution_id`),
  CONSTRAINT `paiements_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `paiements_parents_id_foreign` FOREIGN KEY (`parents_id`) REFERENCES `parents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `parent_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parent_invitations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned NOT NULL,
  `eleve_id` bigint unsigned NOT NULL,
  `created_by` bigint unsigned NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `is_guardian` tinyint(1) NOT NULL DEFAULT '0',
  `is_accepted` tinyint(1) NOT NULL DEFAULT '0',
  `accepted_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invite_unique_eleve_email` (`eleve_id`,`email`),
  UNIQUE KEY `parent_invitations_token_unique` (`token`),
  KEY `parent_invitations_ecole_id_foreign` (`ecole_id`),
  KEY `parent_invitations_created_by_foreign` (`created_by`),
  KEY `parent_invitations_token_index` (`token`),
  KEY `parent_invitations_email_index` (`email`),
  CONSTRAINT `parent_invitations_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `parent_invitations_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `parent_invitations_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `parents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned NOT NULL,
  `profession` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adresse` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parents_user_id_foreign` (`user_id`),
  KEY `parents_ecole_id_index` (`ecole_id`),
  CONSTRAINT `parents_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `parents_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `payment_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_histories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` bigint unsigned NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_histories_payment_id_foreign` (`payment_id`),
  KEY `payment_histories_created_by_foreign` (`created_by`),
  KEY `payment_histories_ecole_id_index` (`ecole_id`),
  CONSTRAINT `payment_histories_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `payment_histories_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `payment_histories_payment_id_foreign` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `eleve_id` bigint unsigned NOT NULL,
  `paiement_eleve_id` bigint unsigned DEFAULT NULL,
  `ecole_id` bigint unsigned NOT NULL,
  `transaction_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'XOF',
  `type` enum('scolarite','cantine','transport','autre') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `periode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','completed','failed','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `payment_method` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `refund_status` enum('none','requested','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none',
  `refund_reason` text COLLATE utf8mb4_unicode_ci,
  `refunded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payments_transaction_id_unique` (`transaction_id`),
  KEY `payments_ecole_id_status_index` (`ecole_id`,`status`),
  KEY `payments_eleve_id_status_index` (`eleve_id`,`status`),
  KEY `payments_status_paid_at_index` (`status`,`paid_at`),
  KEY `payments_paiement_eleve_id_foreign` (`paiement_eleve_id`),
  CONSTRAINT `payments_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `payments_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `payments_paiement_eleve_id_foreign` FOREIGN KEY (`paiement_eleve_id`) REFERENCES `paiements` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `periodes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `periodes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `periodes_ecole_id_index` (`ecole_id`),
  CONSTRAINT `periodes_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `personnel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `poste` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_contrat` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CDI',
  `salaire_base` decimal(12,2) NOT NULL DEFAULT '0.00',
  `date_embauche` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `personnel_user_id_foreign` (`user_id`),
  KEY `personnel_ecole_id_foreign` (`ecole_id`),
  CONSTRAINT `personnel_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `personnel_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `personnels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnels` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `poste` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `universite_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `personnels_universite_id_foreign` (`universite_id`),
  KEY `personnels_ecole_id_index` (`ecole_id`),
  CONSTRAINT `personnels_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `personnels_universite_id_foreign` FOREIGN KEY (`universite_id`) REFERENCES `universites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plans` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price_monthly` decimal(10,2) NOT NULL DEFAULT '0.00',
  `price_yearly` decimal(10,2) NOT NULL DEFAULT '0.00',
  `max_students` int DEFAULT NULL,
  `max_schools` int NOT NULL DEFAULT '1',
  `features` json DEFAULT NULL,
  `modules` json DEFAULT NULL,
  `is_popular` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `plans_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `rendez_vous`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rendez_vous` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `motif` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` bigint unsigned NOT NULL,
  `eleve_id` bigint unsigned DEFAULT NULL,
  `enseignant_id` bigint unsigned DEFAULT NULL,
  `date` datetime NOT NULL,
  `heure` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` enum('programmé','confirmé','annulé') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'programmé',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `rendez_vous_parent_id_foreign` (`parent_id`),
  KEY `rendez_vous_enseignant_id_foreign` (`enseignant_id`),
  KEY `rendez_vous_ecole_id_index` (`ecole_id`),
  KEY `rendez_vous_eleve_id_foreign` (`eleve_id`),
  CONSTRAINT `rendez_vous_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `rendez_vous_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `rendez_vous_enseignant_id_foreign` FOREIGN KEY (`enseignant_id`) REFERENCES `enseignants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rendez_vous_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `livre_id` bigint unsigned NOT NULL,
  `eleve_id` bigint unsigned NOT NULL,
  `date_reservation` date NOT NULL,
  `date_limite` date NOT NULL,
  `statut` enum('en_attente','confirmée','expirée') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en_attente',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reservations_livre_id_foreign` (`livre_id`),
  KEY `reservations_ecole_id_index` (`ecole_id`),
  KEY `reservations_eleve_id_foreign` (`eleve_id`),
  CONSTRAINT `reservations_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `reservations_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `reservations_livre_id_foreign` FOREIGN KEY (`livre_id`) REFERENCES `livres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sanctions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sanctions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `eleve_id` bigint unsigned NOT NULL,
  `type_sanction` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `motif` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `duree` int DEFAULT NULL,
  `statut` enum('active','levee','terminee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sanctions_ecole_id_index` (`ecole_id`),
  KEY `sanctions_eleve_date_index` (`eleve_id`,`date`),
  CONSTRAINT `sanctions_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `sanctions_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `semestres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `semestres` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `libelle` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `annee_academique_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `semestres_annee_academique_id_foreign` (`annee_academique_id`),
  KEY `semestres_ecole_id_index` (`ecole_id`),
  CONSTRAINT `semestres_annee_academique_id_foreign` FOREIGN KEY (`annee_academique_id`) REFERENCES `annee_academiques` (`id`) ON DELETE CASCADE,
  CONSTRAINT `semestres_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `serie_matieres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `serie_matieres` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `serie_id` bigint unsigned NOT NULL,
  `matiere_id` bigint unsigned NOT NULL,
  `classe_id` bigint unsigned NOT NULL,
  `coefficient` double NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `serie_matieres_serie_id_matiere_id_classe_id_unique` (`serie_id`,`matiere_id`,`classe_id`),
  KEY `serie_matieres_matiere_id_foreign` (`matiere_id`),
  KEY `serie_matieres_classe_id_foreign` (`classe_id`),
  KEY `serie_matieres_ecole_id_index` (`ecole_id`),
  CONSTRAINT `serie_matieres_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `serie_matieres_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `serie_matieres_matiere_id_foreign` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE,
  CONSTRAINT `serie_matieres_serie_id_foreign` FOREIGN KEY (`serie_id`) REFERENCES `series` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `series`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `series` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `series_ecole_id_index` (`ecole_id`),
  CONSTRAINT `series_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sessions_academiques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions_academiques` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planifiee',
  `date_debut` date NOT NULL,
  `date_fin` date DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_academiques_ecole_id_foreign` (`ecole_id`),
  CONSTRAINT `sessions_academiques_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sessions_candidats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions_candidats` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `session_id` bigint unsigned NOT NULL,
  `eleve_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessions_candidats_unique` (`session_id`,`eleve_id`),
  KEY `sessions_candidats_eleve_id_foreign` (`eleve_id`),
  CONSTRAINT `sessions_candidats_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `sessions_candidats_session_id_foreign` FOREIGN KEY (`session_id`) REFERENCES `sessions_academiques` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sessions_matieres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions_matieres` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `session_id` bigint unsigned NOT NULL,
  `matiere_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessions_matieres_unique` (`session_id`,`matiere_id`),
  KEY `sessions_matieres_matiere_id_foreign` (`matiere_id`),
  CONSTRAINT `sessions_matieres_matiere_id_foreign` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sessions_matieres_session_id_foreign` FOREIGN KEY (`session_id`) REFERENCES `sessions_academiques` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `statut_tranches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `statut_tranches` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_paiement_eleve` bigint unsigned NOT NULL,
  `tranche` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EN_ATTENTE',
  `date_limite` datetime DEFAULT NULL,
  `montant_tranche` decimal(12,2) NOT NULL DEFAULT '0.00',
  `date_paiement` datetime DEFAULT NULL,
  `ecole_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `statut_tranches_id_paiement_eleve_foreign` (`id_paiement_eleve`),
  KEY `statut_tranches_ecole_id_foreign` (`ecole_id`),
  CONSTRAINT `statut_tranches_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `statut_tranches_id_paiement_eleve_foreign` FOREIGN KEY (`id_paiement_eleve`) REFERENCES `paiements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plan_id` bigint unsigned NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_ends_at` timestamp NULL DEFAULT NULL,
  `starts_at` timestamp NULL DEFAULT NULL,
  `ends_at` timestamp NULL DEFAULT NULL,
  `canceled_at` timestamp NULL DEFAULT NULL,
  `billing_cycle` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_provider` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_provider_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `subscriptions_tenant_id_foreign` (`tenant_id`),
  KEY `subscriptions_plan_id_foreign` (`plan_id`),
  CONSTRAINT `subscriptions_plan_id_foreign` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subscriptions_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tenant_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_modules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_id` bigint unsigned NOT NULL,
  `enabled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_modules_tenant_id_module_id_unique` (`tenant_id`,`module_id`),
  KEY `tenant_modules_module_id_foreign` (`module_id`),
  CONSTRAINT `tenant_modules_module_id_foreign` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tenant_modules_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tenant_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_settings_tenant_id_key_unique` (`tenant_id`,`key`),
  CONSTRAINT `tenant_settings_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tenant_user_impersonation_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_user_impersonation_tokens` (
  `token` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auth_guard` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `redirect_url` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL,
  PRIMARY KEY (`token`),
  KEY `tenant_user_impersonation_tokens_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `tenant_user_impersonation_tokens_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `domain` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `data` json DEFAULT NULL,
  `plan_id` bigint unsigned DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'trial',
  `school_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenants_slug_unique` (`slug`),
  KEY `tenants_plan_id_foreign` (`plan_id`),
  CONSTRAINT `tenants_plan_id_foreign` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `trajets_transport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trajets_transport` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom_trajet` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `zones` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `prix_mensuel` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `trajets_transport_ecole_id_index` (`ecole_id`),
  CONSTRAINT `trajets_transport_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `transaction_paiements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_paiements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_paiement_eleve` bigint unsigned NOT NULL,
  `tranche` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `montant_paye` decimal(12,2) NOT NULL DEFAULT '0.00',
  `date_paiement` datetime DEFAULT NULL,
  `statut` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EN_ATTENTE',
  `methode_paiement` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_transaction` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recu_par` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observation` text COLLATE utf8mb4_unicode_ci,
  `ecole_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transaction_paiements_id_paiement_eleve_foreign` (`id_paiement_eleve`),
  KEY `transaction_paiements_ecole_id_foreign` (`ecole_id`),
  CONSTRAINT `transaction_paiements_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `transaction_paiements_id_paiement_eleve_foreign` FOREIGN KEY (`id_paiement_eleve`) REFERENCES `paiements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `type_evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `type_evaluations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type_evaluations_ecole_id_nom_unique` (`ecole_id`,`nom`),
  KEY `type_evaluations_ecole_id_index` (`ecole_id`),
  CONSTRAINT `type_evaluations_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `typeevaluation_classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `typeevaluation_classes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `periode_id` bigint unsigned NOT NULL,
  `serie_id` bigint unsigned NOT NULL,
  `typeevaluation_id` bigint unsigned NOT NULL,
  `classe_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `te_classes_unique` (`periode_id`,`typeevaluation_id`,`classe_id`),
  KEY `typeevaluation_classes_serie_id_foreign` (`serie_id`),
  KEY `typeevaluation_classes_typeevaluation_id_foreign` (`typeevaluation_id`),
  KEY `typeevaluation_classes_classe_id_foreign` (`classe_id`),
  KEY `typeevaluation_classes_ecole_id_index` (`ecole_id`),
  CONSTRAINT `typeevaluation_classes_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `typeevaluation_classes_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `typeevaluation_classes_periode_id_foreign` FOREIGN KEY (`periode_id`) REFERENCES `periodes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `typeevaluation_classes_serie_id_foreign` FOREIGN KEY (`serie_id`) REFERENCES `series` (`id`) ON DELETE CASCADE,
  CONSTRAINT `typeevaluation_classes_typeevaluation_id_foreign` FOREIGN KEY (`typeevaluation_id`) REFERENCES `type_evaluations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `uni_devoir_etudiant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uni_devoir_etudiant` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `devoir_id` bigint unsigned NOT NULL,
  `etudiant_id` bigint unsigned NOT NULL,
  `reponse` text COLLATE utf8mb4_unicode_ci,
  `fichier` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rendu` tinyint(1) NOT NULL DEFAULT '0',
  `date_remise` datetime DEFAULT NULL,
  `note` decimal(5,2) DEFAULT NULL,
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uni_devoir_etudiant_devoir_id_etudiant_id_unique` (`devoir_id`,`etudiant_id`),
  KEY `uni_devoir_etudiant_etudiant_id_foreign` (`etudiant_id`),
  CONSTRAINT `uni_devoir_etudiant_devoir_id_foreign` FOREIGN KEY (`devoir_id`) REFERENCES `uni_devoirs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `uni_devoir_etudiant_etudiant_id_foreign` FOREIGN KEY (`etudiant_id`) REFERENCES `etudiants` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `uni_devoirs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uni_devoirs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned NOT NULL,
  `matiere_id` bigint unsigned NOT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `titre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'devoir',
  `priorite` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'moyenne',
  `statut` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en_cours',
  `date_limite` datetime DEFAULT NULL,
  `publie` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uni_devoirs_matiere_id_foreign` (`matiere_id`),
  KEY `uni_devoirs_created_by_foreign` (`created_by`),
  KEY `uni_devoirs_school_deadline_index` (`ecole_id`,`date_limite`),
  KEY `uni_devoirs_school_subject_index` (`ecole_id`,`matiere_id`),
  CONSTRAINT `uni_devoirs_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `uni_devoirs_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `uni_devoirs_matiere_id_foreign` FOREIGN KEY (`matiere_id`) REFERENCES `uni_matieres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `uni_emplois_du_temps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uni_emplois_du_temps` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned NOT NULL,
  `titre` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cours',
  `date` date NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `salle` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planifie',
  `matiere_id` bigint unsigned DEFAULT NULL,
  `enseignant_id` bigint unsigned DEFAULT NULL,
  `semestre_id` bigint unsigned DEFAULT NULL,
  `filiere_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uni_emplois_du_temps_matiere_id_foreign` (`matiere_id`),
  KEY `uni_emplois_du_temps_enseignant_id_foreign` (`enseignant_id`),
  KEY `uni_emplois_du_temps_semestre_id_foreign` (`semestre_id`),
  KEY `uni_emplois_du_temps_filiere_id_foreign` (`filiere_id`),
  KEY `uni_planning_school_date_index` (`ecole_id`,`date`),
  KEY `uni_planning_school_filiere_index` (`ecole_id`,`filiere_id`),
  CONSTRAINT `uni_emplois_du_temps_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `uni_emplois_du_temps_enseignant_id_foreign` FOREIGN KEY (`enseignant_id`) REFERENCES `uni_enseignants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `uni_emplois_du_temps_filiere_id_foreign` FOREIGN KEY (`filiere_id`) REFERENCES `filieres` (`id`) ON DELETE SET NULL,
  CONSTRAINT `uni_emplois_du_temps_matiere_id_foreign` FOREIGN KEY (`matiere_id`) REFERENCES `uni_matieres` (`id`) ON DELETE SET NULL,
  CONSTRAINT `uni_emplois_du_temps_semestre_id_foreign` FOREIGN KEY (`semestre_id`) REFERENCES `semestres` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `uni_enseignants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uni_enseignants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grade` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialite` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `departement_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uni_enseignants_user_id_unique` (`user_id`),
  KEY `uni_enseignants_departement_id_foreign` (`departement_id`),
  KEY `uni_enseignants_ecole_id_index` (`ecole_id`),
  CONSTRAINT `uni_enseignants_departement_id_foreign` FOREIGN KEY (`departement_id`) REFERENCES `departements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `uni_enseignants_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `uni_enseignants_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `uni_matieres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uni_matieres` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `intitule` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `credit` int DEFAULT NULL,
  `enseignant_id` bigint unsigned NOT NULL,
  `semestre_id` bigint unsigned NOT NULL,
  `filiere_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uni_matieres_enseignant_id_foreign` (`enseignant_id`),
  KEY `uni_matieres_semestre_id_foreign` (`semestre_id`),
  KEY `uni_matieres_filiere_id_foreign` (`filiere_id`),
  KEY `uni_matieres_ecole_id_index` (`ecole_id`),
  CONSTRAINT `uni_matieres_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `uni_matieres_enseignant_id_foreign` FOREIGN KEY (`enseignant_id`) REFERENCES `uni_enseignants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `uni_matieres_filiere_id_foreign` FOREIGN KEY (`filiere_id`) REFERENCES `filieres` (`id`) ON DELETE CASCADE,
  CONSTRAINT `uni_matieres_semestre_id_foreign` FOREIGN KEY (`semestre_id`) REFERENCES `semestres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `uni_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uni_notes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `etudiant_id` bigint unsigned NOT NULL,
  `matiere_id` bigint unsigned NOT NULL,
  `note` decimal(5,2) NOT NULL,
  `type` enum('CC','TP','Examen') COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_evaluation` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uni_notes_matiere_id_foreign` (`matiere_id`),
  KEY `uni_notes_ecole_id_index` (`ecole_id`),
  KEY `uni_notes_etudiant_id_foreign` (`etudiant_id`),
  CONSTRAINT `uni_notes_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `uni_notes_etudiant_id_foreign` FOREIGN KEY (`etudiant_id`) REFERENCES `etudiants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `uni_notes_matiere_id_foreign` FOREIGN KEY (`matiere_id`) REFERENCES `uni_matieres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `uni_paiements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uni_paiements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `etudiant_id` bigint unsigned NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `date_paiement` date NOT NULL,
  `motif` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uni_paiements_ecole_id_foreign` (`ecole_id`),
  KEY `uni_paiements_etudiant_id_foreign` (`etudiant_id`),
  CONSTRAINT `uni_paiements_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `uni_paiements_etudiant_id_foreign` FOREIGN KEY (`etudiant_id`) REFERENCES `etudiants` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `universites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `universites` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sigle` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse` text COLLATE utf8mb4_unicode_ci,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `site_web` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `universites_ecole_id_index` (`ecole_id`),
  CONSTRAINT `universites_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `identifiant` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` text COLLATE utf8mb4_unicode_ci,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `two_factor_secret` text COLLATE utf8mb4_unicode_ci,
  `two_factor_verified_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_identifiant_unique` (`identifiant`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_ecole_role_index` (`ecole_id`,`role`),
  KEY `users_is_active_index` (`is_active`),
  CONSTRAINT `users_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `utilisateurs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilisateurs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nom_utilisateur` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mot_de_passe` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('Etudiant','Enseignant','Admin','Comptable','Scolarite') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `utilisateurs_nom_utilisateur_unique` (`nom_utilisateur`),
  KEY `utilisateurs_ecole_id_index` (`ecole_id`),
  CONSTRAINT `utilisateurs_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `vaccinations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vaccinations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ecole_id` bigint unsigned DEFAULT NULL,
  `eleve_id` bigint unsigned NOT NULL,
  `nom_vaccin` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_vaccination` date NOT NULL,
  `numero_lot` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_rappel` date DEFAULT NULL,
  `effets_secondaires` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vaccinations_ecole_id_index` (`ecole_id`),
  KEY `vaccinations_date_rappel_index` (`date_rappel`),
  KEY `vaccinations_eleve_id_foreign` (`eleve_id`),
  CONSTRAINT `vaccinations_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `vaccinations_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `vehicules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `immatriculation` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modele` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacite` int NOT NULL,
  `chauffeur_nom` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chauffeur_tel` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ecole_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vehicules_immatriculation_unique` (`immatriculation`),
  KEY `vehicules_ecole_id_index` (`ecole_id`),
  CONSTRAINT `vehicules_ecole_id_foreign` FOREIGN KEY (`ecole_id`) REFERENCES `ecoles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (1,'2013_01_01_000000_create_ecoles_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (2,'2014_10_12_000000_create_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (3,'2014_10_12_100000_create_password_resets_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (4,'2019_08_19_000000_create_failed_jobs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (5,'2019_09_15_000010_create_tenants_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (6,'2019_09_15_000020_create_domains_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (7,'2019_12_14_000001_create_personal_access_tokens_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (8,'2020_05_15_000010_create_tenant_user_impersonation_tokens_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (9,'2023_01_01_000001_create_series_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (10,'2023_01_01_000002_create_matieres_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (11,'2023_01_01_000003_create_classes_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (12,'2023_02_01_000001_create_parents_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (13,'2023_02_01_000002_create_eleves_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (14,'2023_02_01_000003_create_enseignants_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (15,'2024_01_01_000001_create_payments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (16,'2024_01_01_000002_create_payment_histories_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (17,'2024_01_01_000004_typeevaluation',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (18,'2024_01_01_000005_periodes',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (19,'2024_01_02_000001_classe_series',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (20,'2024_01_02_000002_classe_matieres',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (21,'2024_01_02_000003_serie_matieres',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (22,'2024_01_03_000001_enseignants_mp',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (23,'2024_01_03_000003_enseignant_matiere',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (24,'2024_01_04_000001_eleves_matieres',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (25,'2024_01_04_000002_parent_eleve',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (26,'2024_01_04_000003_notes',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (27,'2024_01_05_000001_contributions',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (28,'2024_01_05_000002_paiements',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (29,'2024_01_06_000001_create_bourses_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (30,'2024_01_06_000002_create_absences_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (31,'2024_01_06_000003_create_incidents_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (32,'2024_01_06_000004_create_sanctions_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (33,'2024_01_06_000005_create_consultations_medicales_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (34,'2024_01_06_000006_create_dossiers_medicaux_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (35,'2024_01_06_000007_create_vaccinations_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (36,'2024_01_06_000008_create_livres_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (37,'2024_01_06_000009_create_emprunts_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (38,'2024_01_06_000010_create_reservations_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (39,'2024_01_06_000011_create_rendez_vous_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (40,'2024_01_06_000012_create_certificats_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (41,'2024_01_06_000013_create_messages_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (42,'2024_01_06_000014_create_exercices_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (43,'2024_01_06_000015_create_emplois_du_temps_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (44,'2024_01_06_000016_create_conseils_classe_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (45,'2024_01_06_000017_create_examens_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (46,'2024_01_06_000018_create_notifications_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (47,'2024_01_07_000001_typeevaluation_classes',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (48,'2025_01_10_000001_add_columns_to_paiements_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (49,'2025_10_28_102424_enseignantmp_classe',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (50,'2025_11_01_041712_ecole_add_id',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (51,'2025_11_25_103503_create_universites_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (52,'2025_11_25_103508_create_facultes_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (53,'2025_11_25_103512_create_departements_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (54,'2025_11_25_103516_create_filieres_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (55,'2025_11_25_103520_create_etudiants_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (56,'2025_11_25_103524_create_uni_enseignants_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (57,'2025_11_25_103528_create_personnels_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (58,'2025_11_25_103531_create_annee_academiques_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (59,'2025_11_25_103537_create_inscriptions_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (60,'2025_11_25_103544_create_semestres_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (61,'2025_11_25_103550_create_uni_matieres_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (62,'2025_11_25_103555_create_uni_notes_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (63,'2025_11_25_103601_create_diplomes_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (64,'2025_11_25_103605_create_utilisateurs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (65,'2025_11_25_111706_create_paiements_u_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (66,'2026_04_09_124130_create_hr_and_finance_tables',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (67,'2026_04_09_125320_create_cahier_de_textes_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (68,'2026_04_09_125855_create_transport_tables',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (69,'2026_07_06_145001_create_plans_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (70,'2026_07_06_145002_create_subscriptions_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (71,'2026_07_06_145003_create_tenant_settings_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (72,'2026_07_06_145004_create_modules_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (73,'2026_07_06_145005_create_tenant_modules_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (74,'2026_07_06_145010_add_saas_columns_to_tenants_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (75,'2026_07_06_183001_create_invoices_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (76,'2026_07_08_090555_create_sessions_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (77,'2026_07_08_100001_create_evenements_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (78,'2026_07_08_100002_create_moyennes_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (79,'2026_07_08_100003_create_coefficient_matieres_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (80,'2026_07_08_100004_create_transaction_paiements_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (81,'2026_07_08_100005_create_statut_tranches_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (82,'2026_07_08_155402_add_ecole_id_to_missing_tables',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (83,'2026_07_08_155449_create_sessions_academiques_tables',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (84,'2026_07_09_214818_add_locked_to_notes_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (85,'2026_07_10_104554_add_performance_indexes',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (86,'2026_07_10_104843_create_audit_logs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (87,'2026_07_13_000001_create_devoirs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (88,'2026_07_31_090000_add_ecole_id_to_untenanted_tables',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (89,'2026_07_31_090100_add_missing_performance_indexes',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (90,'2026_08_03_100000_restrict_school_deletion',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (91,'2026_08_03_110000_normalise_class_cycle_casing',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (92,'2026_08_03_120000_scope_unique_identifiers_per_school',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (93,'2026_08_03_130000_add_reference_and_type_to_paiements',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (94,'2026_08_04_100000_link_university_profiles_to_accounts',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (95,'2026_08_04_100100_create_communications_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (96,'2026_08_04_100200_create_uni_emplois_du_temps_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (97,'2026_08_04_100300_create_uni_devoirs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (98,'2026_08_05_100000_add_enrolment_status_to_students',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (99,'2026_08_05_100100_restrict_student_deletion',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (100,'2026_08_06_000001_switch_notes_periode_to_trimestres',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (101,'2026_08_06_000010_rebuild_moyennes_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (102,'2026_08_06_000020_add_annee_scolaire_to_notes',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (103,'2026_08_06_000030_create_bulletins_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (104,'2026_08_06_113549_add_unique_indexes_to_pivot_tables',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (105,'2026_08_06_113845_rename_class_id_to_classe_id_in_eleves_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (106,'2026_08_07_000001_add_filiation_info_to_eleves_parents',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (107,'2026_08_10_103648_create_parent_invitations_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (108,'2026_08_11_000001_add_volume_horaire_and_capacite_max',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (109,'2026_08_12_000001_rename_maternelle_primaire_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (110,'2026_08_12_000002_add_unique_pivot_indexes',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (111,'2026_08_12_000003_add_unique_note_index',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (112,'2026_08_12_000004_add_soft_deletes_to_users',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (113,'2026_08_13_000001_add_avatar_and_teacher_profile_tables',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (114,'2026_08_14_100000_add_paiement_eleve_id_to_payments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (115,'2026_08_14_200000_cleanup_paiements_schema',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (116,'2026_08_14_300000_drop_dead_paiement_tables',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (117,'2026_08_18_093659_add_two_factor_to_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (118,'2026_08_18_094455_create_email_verification_tokens_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (119,'2026_08_18_094607_add_soft_deletes_to_key_tables',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (120,'2026_08_18_094803_fix_database_integrity',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (121,'2026_08_19_091639_align_notifications_with_frontend',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (122,'2026_08_19_120000_add_composite_index_to_notes_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (123,'2026_08_19_130000_add_ecole_id_index_to_tenanted_tables',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (124,'2026_08_25_124352_add_soft_deletes_to_finance_tables',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (125,'2026_09_17_120000_widen_livre_publication_year',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (126,'2026_09_17_120100_restrict_school_deletion_on_remaining_tables',1);
