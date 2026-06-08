<?php

namespace Database\Seeders;

use App\Models\Universite\Universite;
use App\Models\Universite\Faculte;
use App\Models\Universite\Departement;
use App\Models\Universite\Filiere;
use App\Models\Universite\Enseignant;
use App\Models\Universite\AnneeAcademique;
use App\Models\Universite\Semestre;
use App\Models\Universite\Matiere;
use App\Models\Universite\Etudiant;
use App\Models\Universite\Inscription;
use App\Models\Universite\Note;
use App\Models\Universite\Paiement;
use App\Models\Universite\Personnel;
use App\Models\Universite\Diplome;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UniversiteSeeder extends Seeder
{
    /**
     * Seed the university module with realistic Beninese data.
     */
    public function run(): void
    {
        // Disable foreign key checks for smooth seeding across related tables
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // ---- 1. UNIVERSITE ----
        $universite = Universite::create([
            'nom' => "Université d'Abomey-Calavi",
            'sigle' => 'UAC',
            'adresse' => 'Abomey-Calavi, Atlantique, Bénin',
            'telephone' => '+229 21 30 50 00',
            'email' => 'contact@uac.bj',
            'site_web' => 'https://www.uac.bj',
        ]);

        // ---- 2. FACULTES ----
        $fast = Faculte::create([
            'nom' => 'Faculté des Sciences et Techniques',
            'sigle' => 'FAST',
            'universite_id' => $universite->id,
        ]);

        $flash = Faculte::create([
            'nom' => 'Faculté des Lettres et Sciences Humaines',
            'sigle' => 'FLASH',
            'universite_id' => $universite->id,
        ]);

        $faseg = Faculte::create([
            'nom' => 'Faculté des Sciences Économiques et de Gestion',
            'sigle' => 'FASEG',
            'universite_id' => $universite->id,
        ]);

        // ---- 3. DEPARTEMENTS ----
        // FAST
        $depMaths = Departement::create(['nom' => 'Département de Mathématiques', 'faculte_id' => $fast->id]);
        $depPhysique = Departement::create(['nom' => 'Département de Physique', 'faculte_id' => $fast->id]);
        $depInfo = Departement::create(['nom' => "Département d'Informatique", 'faculte_id' => $fast->id]);

        // FLASH
        $depLettres = Departement::create(['nom' => 'Département de Lettres Modernes', 'faculte_id' => $flash->id]);
        $depHistoire = Departement::create(['nom' => "Département d'Histoire et Archéologie", 'faculte_id' => $flash->id]);
        $depGeo = Departement::create(['nom' => 'Département de Géographie', 'faculte_id' => $flash->id]);

        // FASEG
        $depEconomie = Departement::create(['nom' => "Département d'Économie", 'faculte_id' => $faseg->id]);
        $depGestion = Departement::create(['nom' => 'Département de Gestion', 'faculte_id' => $faseg->id]);

        // ---- 4. FILIERES ----
        // Mathématiques
        $licenceMaths = Filiere::create(['nom' => 'Licence Mathématiques', 'niveau' => 'Licence', 'departement_id' => $depMaths->id]);
        $masterMaths = Filiere::create(['nom' => 'Master Mathématiques', 'niveau' => 'Master', 'departement_id' => $depMaths->id]);

        // Physique
        $licencePhysique = Filiere::create(['nom' => 'Licence Physique', 'niveau' => 'Licence', 'departement_id' => $depPhysique->id]);

        // Informatique
        $licenceInfo = Filiere::create(['nom' => 'Licence Informatique', 'niveau' => 'Licence', 'departement_id' => $depInfo->id]);
        $masterInfo = Filiere::create(['nom' => 'Master Informatique', 'niveau' => 'Master', 'departement_id' => $depInfo->id]);

        // Lettres Modernes
        $licenceLettres = Filiere::create(['nom' => 'Licence Lettres Modernes', 'niveau' => 'Licence', 'departement_id' => $depLettres->id]);

        // Histoire
        $licenceHistoire = Filiere::create(['nom' => 'Licence Histoire', 'niveau' => 'Licence', 'departement_id' => $depHistoire->id]);
        $masterHistoire = Filiere::create(['nom' => 'Master Histoire', 'niveau' => 'Master', 'departement_id' => $depHistoire->id]);

        // Géographie
        $licenceGeo = Filiere::create(['nom' => 'Licence Géographie', 'niveau' => 'Licence', 'departement_id' => $depGeo->id]);

        // Économie
        $licenceEconomie = Filiere::create(['nom' => 'Licence Sciences Économiques', 'niveau' => 'Licence', 'departement_id' => $depEconomie->id]);
        $masterEconomie = Filiere::create(['nom' => 'Master Sciences Économiques', 'niveau' => 'Master', 'departement_id' => $depEconomie->id]);

        // Gestion
        $licenceGestion = Filiere::create(['nom' => 'Licence Gestion', 'niveau' => 'Licence', 'departement_id' => $depGestion->id]);
        $masterGestion = Filiere::create(['nom' => 'Master Gestion', 'niveau' => 'Master', 'departement_id' => $depGestion->id]);

        // ---- 5. ANNEE ACADEMIQUE ----
        $annee = AnneeAcademique::create([
            'libelle' => '2024-2025',
            'date_debut' => '2024-10-01',
            'date_fin' => '2025-09-30',
        ]);

        // ---- 6. SEMESTRES ----
        $semestre1 = Semestre::create([
            'libelle' => 'Semestre 1',
            'annee_academique_id' => $annee->id,
        ]);

        $semestre2 = Semestre::create([
            'libelle' => 'Semestre 2',
            'annee_academique_id' => $annee->id,
        ]);

        // ---- 7. ENSEIGNANTS ----
        $enseignant1 = Enseignant::create([
            'nom' => 'KODJOGBÉ',
            'prenom' => 'Vincent',
            'grade' => 'Professeur Titulaire',
            'specialite' => 'Algèbre et Géométrie',
            'telephone' => '+229 97 01 02 03',
            'email' => 'vincent.kodjogbe@uac.bj',
            'departement_id' => $depMaths->id,
        ]);

        $enseignant2 = Enseignant::create([
            'nom' => 'DOSSOU',
            'prenom' => 'Afi Marie',
            'grade' => 'Maître de Conférences',
            'specialite' => 'Intelligence Artificielle',
            'telephone' => '+229 97 04 05 06',
            'email' => 'marie.dossou@uac.bj',
            'departement_id' => $depInfo->id,
        ]);

        $enseignant3 = Enseignant::create([
            'nom' => 'HOUNKANRIN',
            'prenom' => 'Colette',
            'grade' => 'Maître-Assistant',
            'specialite' => 'Physique Quantique',
            'telephone' => '+229 97 07 08 09',
            'email' => 'colette.hounkanrin@uac.bj',
            'departement_id' => $depPhysique->id,
        ]);

        $enseignant4 = Enseignant::create([
            'nom' => 'GANDONOU',
            'prenom' => 'Éric',
            'grade' => 'Professeur Titulaire',
            'specialite' => 'Littérature Francophone',
            'telephone' => '+229 97 10 11 12',
            'email' => 'eric.gandonou@uac.bj',
            'departement_id' => $depLettres->id,
        ]);

        $enseignant5 = Enseignant::create([
            'nom' => 'AGBODJAN',
            'prenom' => 'Fifamè',
            'grade' => 'Maître de Conférences',
            'specialite' => 'Histoire Contemporaine',
            'telephone' => '+229 97 13 14 15',
            'email' => 'fifame.agbodjan@uac.bj',
            'departement_id' => $depHistoire->id,
        ]);

        $enseignant6 = Enseignant::create([
            'nom' => 'KOUASSI',
            'prenom' => 'Amenan',
            'grade' => 'Assistant',
            'specialite' => "Finance d'Entreprise",
            'telephone' => '+229 97 16 17 18',
            'email' => 'amenan.kouassi@uac.bj',
            'departement_id' => $depGestion->id,
        ]);

        // ---- 8. PERSONNELS ----
        Personnel::create([
            'nom' => 'BOSSOU',
            'prenom' => 'Marcellin',
            'poste' => 'Secrétaire Général',
            'telephone' => '+229 97 20 21 22',
            'email' => 'marcellin.bossou@uac.bj',
            'universite_id' => $universite->id,
        ]);

        Personnel::create([
            'nom' => 'DA SILVA',
            'prenom' => 'Béatrice',
            'poste' => 'Agent Comptable',
            'telephone' => '+229 97 23 24 25',
            'email' => 'beatrice.dasilva@uac.bj',
            'universite_id' => $universite->id,
        ]);

        Personnel::create([
            'nom' => 'SAGBO',
            'prenom' => 'Hugues',
            'poste' => 'Bibliothécaire',
            'telephone' => '+229 97 26 27 28',
            'email' => 'hugues.sagbo@uac.bj',
            'universite_id' => $universite->id,
        ]);

        Personnel::create([
            'nom' => 'ZANNOU',
            'prenom' => 'Georgette',
            'poste' => 'Secrétaire Pédagogique',
            'telephone' => '+229 97 29 30 31',
            'email' => 'georgette.zannou@uac.bj',
            'universite_id' => $universite->id,
        ]);

        // ---- 9. ETUDIANTS ----
        $etudiant1 = Etudiant::create([
            'matricule' => 'UAC2024001',
            'nom' => 'ADJOVI',
            'prenom' => 'Kossi',
            'date_naissance' => '2004-03-15',
            'lieu_naissance' => 'Cotonou',
            'sexe' => 'M',
            'telephone' => '+229 96 01 02 03',
            'email' => 'kossi.adjovi@etu.uac.bj',
            'adresse' => 'Cotonou, Bénin',
            'annee_entree' => 2024,
            'filiere_id' => $licenceInfo->id,
        ]);

        $etudiant2 = Etudiant::create([
            'matricule' => 'UAC2024002',
            'nom' => 'AHLONSOU',
            'prenom' => 'Mawulé',
            'date_naissance' => '2003-07-22',
            'lieu_naissance' => 'Lomé',
            'sexe' => 'M',
            'telephone' => '+229 96 04 05 06',
            'email' => 'mawule.ahlonsou@etu.uac.bj',
            'adresse' => 'Abomey-Calavi, Bénin',
            'annee_entree' => 2024,
            'filiere_id' => $licenceMaths->id,
        ]);

        $etudiant3 = Etudiant::create([
            'matricule' => 'UAC2024003',
            'nom' => 'TOSSAVI',
            'prenom' => 'Euloge',
            'date_naissance' => '2004-11-02',
            'lieu_naissance' => 'Porto-Novo',
            'sexe' => 'M',
            'telephone' => '+229 96 07 08 09',
            'email' => 'euloge.tossavi@etu.uac.bj',
            'adresse' => 'Porto-Novo, Bénin',
            'annee_entree' => 2024,
            'filiere_id' => $licenceInfo->id,
        ]);

        $etudiant4 = Etudiant::create([
            'matricule' => 'UAC2024004',
            'nom' => 'MENSAH',
            'prenom' => 'Akouavi',
            'date_naissance' => '2003-05-18',
            'lieu_naissance' => 'Ouidah',
            'sexe' => 'F',
            'telephone' => '+229 96 10 11 12',
            'email' => 'akouavi.mensah@etu.uac.bj',
            'adresse' => 'Ouidah, Bénin',
            'annee_entree' => 2024,
            'filiere_id' => $licenceLettres->id,
        ]);

        $etudiant5 = Etudiant::create([
            'matricule' => 'UAC2024005',
            'nom' => 'ZINSOU',
            'prenom' => 'Yawo',
            'date_naissance' => '2004-09-30',
            'lieu_naissance' => 'Bohicon',
            'sexe' => 'M',
            'telephone' => '+229 96 13 14 15',
            'email' => 'yawo.zinsou@etu.uac.bj',
            'adresse' => 'Bohicon, Bénin',
            'annee_entree' => 2024,
            'filiere_id' => $licencePhysique->id,
        ]);

        $etudiant6 = Etudiant::create([
            'matricule' => 'UAC2024006',
            'nom' => 'NONVI',
            'prenom' => 'Edwige',
            'date_naissance' => '2003-12-05',
            'lieu_naissance' => 'Cotonou',
            'sexe' => 'F',
            'telephone' => '+229 96 16 17 18',
            'email' => 'edwige.nonvi@etu.uac.bj',
            'adresse' => 'Cotonou, Bénin',
            'annee_entree' => 2024,
            'filiere_id' => $licenceGestion->id,
        ]);

        $etudiant7 = Etudiant::create([
            'matricule' => 'UAC2024007',
            'nom' => 'TOVIHO',
            'prenom' => 'Judicaël',
            'date_naissance' => '2004-01-14',
            'lieu_naissance' => 'Parakou',
            'sexe' => 'M',
            'telephone' => '+229 96 19 20 21',
            'email' => 'judicael.toviho@etu.uac.bj',
            'adresse' => 'Parakou, Bénin',
            'annee_entree' => 2023,
            'filiere_id' => $masterMaths->id,
        ]);

        $etudiant8 = Etudiant::create([
            'matricule' => 'UAC2024008',
            'nom' => 'ALI',
            'prenom' => 'Rachida',
            'date_naissance' => '2003-08-25',
            'lieu_naissance' => 'Natitingou',
            'sexe' => 'F',
            'telephone' => '+229 96 22 23 24',
            'email' => 'rachida.ali@etu.uac.bj',
            'adresse' => 'Natitingou, Bénin',
            'annee_entree' => 2024,
            'filiere_id' => $licenceEconomie->id,
        ]);

        $etudiant9 = Etudiant::create([
            'matricule' => 'UAC2024009',
            'nom' => 'GBENOU',
            'prenom' => 'Dossa',
            'date_naissance' => '2004-04-10',
            'lieu_naissance' => 'Abomey',
            'sexe' => 'M',
            'telephone' => '+229 96 25 26 27',
            'email' => 'dossa.gbenou@etu.uac.bj',
            'adresse' => 'Abomey, Bénin',
            'annee_entree' => 2024,
            'filiere_id' => $licenceHistoire->id,
        ]);

        $etudiant10 = Etudiant::create([
            'matricule' => 'UAC2024010',
            'nom' => 'SEWAVI',
            'prenom' => 'Béatrice',
            'date_naissance' => '2003-06-17',
            'lieu_naissance' => 'Lokossa',
            'sexe' => 'F',
            'telephone' => '+229 96 28 29 30',
            'email' => 'beatrice.sewavi@etu.uac.bj',
            'adresse' => 'Lokossa, Bénin',
            'annee_entree' => 2024,
            'filiere_id' => $licenceGeo->id,
        ]);

        $etudiant11 = Etudiant::create([
            'matricule' => 'UAC2024011',
            'nom' => 'HOUNKPE',
            'prenom' => 'Kokou',
            'date_naissance' => '2004-10-20',
            'lieu_naissance' => 'Kandi',
            'sexe' => 'M',
            'telephone' => '+229 96 31 32 33',
            'email' => 'kokou.hounkpe@etu.uac.bj',
            'adresse' => 'Kandi, Bénin',
            'annee_entree' => 2024,
            'filiere_id' => $licenceGestion->id,
        ]);

        $etudiant12 = Etudiant::create([
            'matricule' => 'UAC2024012',
            'nom' => 'GANDONOU',
            'prenom' => 'Amivi',
            'date_naissance' => '2003-02-28',
            'lieu_naissance' => 'Djougou',
            'sexe' => 'F',
            'telephone' => '+229 96 34 35 36',
            'email' => 'amivi.gandonou@etu.uac.bj',
            'adresse' => 'Djougou, Bénin',
            'annee_entree' => 2024,
            'filiere_id' => $licenceHistoire->id,
        ]);

        $etudiants = [$etudiant1, $etudiant2, $etudiant3, $etudiant4, $etudiant5, $etudiant6,
                      $etudiant7, $etudiant8, $etudiant9, $etudiant10, $etudiant11, $etudiant12];

        // ---- 10. MATIERES ----
        // Licence Informatique - Semestre 1
        $matiereInf101 = Matiere::create([
            'code' => 'INF101',
            'intitule' => 'Algorithmique et Programmation I',
            'credit' => 4,
            'enseignant_id' => $enseignant2->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licenceInfo->id,
        ]);

        $matiereInf102 = Matiere::create([
            'code' => 'INF102',
            'intitule' => 'Architecture des Ordinateurs',
            'credit' => 3,
            'enseignant_id' => $enseignant2->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licenceInfo->id,
        ]);

        $matiereInf103 = Matiere::create([
            'code' => 'INF103',
            'intitule' => "Mathématiques pour l'Informatique",
            'credit' => 5,
            'enseignant_id' => $enseignant1->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licenceInfo->id,
        ]);

        // Licence Informatique - Semestre 2
        $matiereInf201 = Matiere::create([
            'code' => 'INF201',
            'intitule' => 'Algorithmique et Programmation II',
            'credit' => 4,
            'enseignant_id' => $enseignant2->id,
            'semestre_id' => $semestre2->id,
            'filiere_id' => $licenceInfo->id,
        ]);

        $matiereInf202 = Matiere::create([
            'code' => 'INF202',
            'intitule' => 'Bases de Données',
            'credit' => 4,
            'enseignant_id' => $enseignant2->id,
            'semestre_id' => $semestre2->id,
            'filiere_id' => $licenceInfo->id,
        ]);

        // Licence Mathématiques - Semestre 1
        $matiereMath101 = Matiere::create([
            'code' => 'MATH101',
            'intitule' => 'Algèbre Linéaire',
            'credit' => 5,
            'enseignant_id' => $enseignant1->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licenceMaths->id,
        ]);

        $matiereMath102 = Matiere::create([
            'code' => 'MATH102',
            'intitule' => 'Analyse Mathématique I',
            'credit' => 5,
            'enseignant_id' => $enseignant1->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licenceMaths->id,
        ]);

        $matiereMath103 = Matiere::create([
            'code' => 'MATH103',
            'intitule' => 'Probabilités et Statistiques',
            'credit' => 4,
            'enseignant_id' => $enseignant1->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licenceMaths->id,
        ]);

        // Licence Physique - Semestre 1
        $matierePhy101 = Matiere::create([
            'code' => 'PHY101',
            'intitule' => 'Mécanique Générale',
            'credit' => 4,
            'enseignant_id' => $enseignant3->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licencePhysique->id,
        ]);

        $matierePhy102 = Matiere::create([
            'code' => 'PHY102',
            'intitule' => 'Thermodynamique',
            'credit' => 4,
            'enseignant_id' => $enseignant3->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licencePhysique->id,
        ]);

        // Licence Lettres Modernes - Semestre 1
        $matiereLet101 = Matiere::create([
            'code' => 'LET101',
            'intitule' => 'Grammaire et Linguistique',
            'credit' => 4,
            'enseignant_id' => $enseignant4->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licenceLettres->id,
        ]);

        $matiereLet102 = Matiere::create([
            'code' => 'LET102',
            'intitule' => 'Littérature Française du XVIIIe siècle',
            'credit' => 3,
            'enseignant_id' => $enseignant4->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licenceLettres->id,
        ]);

        // Licence Histoire - Semestre 1
        $matiereHis101 = Matiere::create([
            'code' => 'HIS101',
            'intitule' => "Histoire Générale de l'Afrique",
            'credit' => 4,
            'enseignant_id' => $enseignant5->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licenceHistoire->id,
        ]);

        $matiereHis102 = Matiere::create([
            'code' => 'HIS102',
            'intitule' => 'Histoire du Bénin',
            'credit' => 3,
            'enseignant_id' => $enseignant5->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licenceHistoire->id,
        ]);

        // Licence Gestion - Semestre 1
        $matiereGst101 = Matiere::create([
            'code' => 'GST101',
            'intitule' => 'Comptabilité Générale',
            'credit' => 4,
            'enseignant_id' => $enseignant6->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licenceGestion->id,
        ]);

        $matiereGst102 = Matiere::create([
            'code' => 'GST102',
            'intitule' => 'Principes de Management',
            'credit' => 3,
            'enseignant_id' => $enseignant6->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licenceGestion->id,
        ]);

        $matiereGst103 = Matiere::create([
            'code' => 'GST103',
            'intitule' => 'Microéconomie',
            'credit' => 4,
            'enseignant_id' => $enseignant6->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licenceGestion->id,
        ]);

        // Licence Sciences Économiques - Semestre 1
        $matiereEco101 = Matiere::create([
            'code' => 'ECO101',
            'intitule' => 'Macroéconomie',
            'credit' => 4,
            'enseignant_id' => $enseignant6->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licenceEconomie->id,
        ]);

        $matiereEco102 = Matiere::create([
            'code' => 'ECO102',
            'intitule' => 'Statistiques Descriptives',
            'credit' => 3,
            'enseignant_id' => $enseignant1->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licenceEconomie->id,
        ]);

        // Licence Géographie - Semestre 1
        $matiereGeo101 = Matiere::create([
            'code' => 'GEO101',
            'intitule' => 'Géographie Physique Générale',
            'credit' => 4,
            'enseignant_id' => $enseignant5->id,
            'semestre_id' => $semestre1->id,
            'filiere_id' => $licenceGeo->id,
        ]);

        $matieres = [
            $matiereInf101, $matiereInf102, $matiereInf103,
            $matiereInf201, $matiereInf202,
            $matiereMath101, $matiereMath102, $matiereMath103,
            $matierePhy101, $matierePhy102,
            $matiereLet101, $matiereLet102,
            $matiereHis101, $matiereHis102,
            $matiereGst101, $matiereGst102, $matiereGst103,
            $matiereEco101, $matiereEco102,
            $matiereGeo101,
        ];

        // ---- 11. INSCRIPTIONS ----
        foreach ($etudiants as $etudiant) {
            Inscription::create([
                'etudiant_id' => $etudiant->id,
                'annee_academique_id' => $annee->id,
                'date_inscription' => '2024-09-' . str_pad(rand(15, 30), 2, '0', STR_PAD_LEFT),
                'montant_frais' => 150000,
                'statut' => 'Validée',
            ]);
        }

        // ---- 12. NOTES ----
        foreach ($etudiants as $etudiant) {
            // Get matieres for this student's filiere
            $matieresEtudiant = [];
            foreach ($matieres as $matiere) {
                if ($matiere->filiere_id === $etudiant->filiere_id) {
                    $matieresEtudiant[] = $matiere;
                }
            }

            foreach ($matieresEtudiant as $matiere) {
                // CC note (Contrôle Continu)
                Note::create([
                    'etudiant_id' => $etudiant->id,
                    'matiere_id' => $matiere->id,
                    'note' => round(rand(50, 180) / 10, 2),
                    'type' => 'CC',
                    'date_evaluation' => now()->subDays(rand(30, 60)),
                ]);

                // TP note (about half of matieres have practical work)
                if (rand(0, 1)) {
                    Note::create([
                        'etudiant_id' => $etudiant->id,
                        'matiere_id' => $matiere->id,
                        'note' => round(rand(50, 190) / 10, 2),
                        'type' => 'TP',
                        'date_evaluation' => now()->subDays(rand(15, 30)),
                    ]);
                }

                // Examen final
                Note::create([
                    'etudiant_id' => $etudiant->id,
                    'matiere_id' => $matiere->id,
                    'note' => round(rand(40, 190) / 10, 2),
                    'type' => 'Examen',
                    'date_evaluation' => now()->subDays(rand(1, 14)),
                ]);
            }
        }

        // ---- 13. PAIEMENTS ----
        foreach ($etudiants as $index => $etudiant) {
            Paiement::create([
                'etudiant_id' => $etudiant->id,
                'montant' => 150000,
                'date_paiement' => '2024-10-' . str_pad(rand(1, 15), 2, '0', STR_PAD_LEFT),
                'motif' => "Frais d'inscription 2024-2025",
            ]);

            // Half of students also pay second semester fees
            if ($index % 2 === 0) {
                Paiement::create([
                    'etudiant_id' => $etudiant->id,
                    'montant' => 50000,
                    'date_paiement' => '2025-01-' . str_pad(rand(5, 20), 2, '0', STR_PAD_LEFT),
                    'motif' => 'Frais de scolarité - Semestre 2',
                ]);
            }
        }

        // ---- 14. DIPLOMES ----
        // Judicaël (Master student) got his Licence diploma previously
        Diplome::create([
            'etudiant_id' => $etudiant7->id,
            'intitule' => 'Licence Mathématiques',
            'date_delivrance' => '2024-07-15',
            'mention' => 'Bien',
        ]);

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $this->command->info('✓ Module universitaire seedé avec succès !');
        $this->command->info('  1 Université, 3 Facultés, 8 Départements, 13 Filières');
        $this->command->info('  6 Enseignants, 12 Étudiants, 4 Personnels');
        $this->command->info('  1 Année Académique, 2 Semestres');
        $this->command->info('  ' . count($matieres) . ' Matières');
        $this->command->info('  12 Inscriptions avec notes et paiements');
        $this->command->info('  1 Diplôme');
    }
}
