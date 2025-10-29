<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TestDataSeeder extends Seeder
{
    public function run()
    {
        // Users
        DB::table('users')->insert([
            ['name' => 'Admin', 'email' => 'admin@ecole.com', 'password' => Hash::make('password'), 'role' => 'admin', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Directeur', 'email' => 'directeur@ecole.com', 'password' => Hash::make('password'), 'role' => 'directeur', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Parent1', 'email' => 'parent1@ecole.com', 'password' => Hash::make('password'), 'role' => 'parent', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Parent2', 'email' => 'parent2@ecole.com', 'password' => Hash::make('password'), 'role' => 'parent', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Series
        DB::table('series')->insert([
            ['nom' => 'Maternelle', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Primaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Collège', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Lycée', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Matieres
        DB::table('matieres')->insert([
            ['nom' => 'Mathématiques', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Français', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Anglais', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Histoire-Géographie', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Sciences', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Classes
        DB::table('classes')->insert([
            ['nom' => '6ème A', 'serie_id' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['nom' => '5ème A', 'serie_id' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['nom' => '4ème A', 'serie_id' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['nom' => '3ème A', 'serie_id' => 3, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Type evaluations
        DB::table('type_evaluations')->insert([
            ['nom' => 'Devoir 1', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Devoir 2', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Interrogation', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Composition', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Periodes
        DB::table('periodes')->insert([
            ['nom' => 'Trimestre 1', 'date_debut' => '2024-09-01', 'date_fin' => '2024-12-15', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Trimestre 2', 'date_debut' => '2025-01-06', 'date_fin' => '2025-03-31', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Trimestre 3', 'date_debut' => '2025-04-01', 'date_fin' => '2025-06-30', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Parents
        DB::table('parents')->insert([
            ['nom' => 'Kouassi', 'prenom' => 'Jean', 'email' => 'parent1@ecole.com', 'telephone' => '0123456789', 'adresse' => 'Abidjan', 'user_id' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Yao', 'prenom' => 'Marie', 'email' => 'parent2@ecole.com', 'telephone' => '0123456788', 'adresse' => 'Abidjan', 'user_id' => 4, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Eleves
        DB::table('eleves')->insert([
            ['nom' => 'Kouassi', 'prenom' => 'Aya', 'date_naissance' => '2010-05-15', 'lieu_naissance' => 'Abidjan', 'sexe' => 'F', 'classe_id' => 1, 'matricule' => 'EL001', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Kouassi', 'prenom' => 'Koffi', 'date_naissance' => '2012-08-20', 'lieu_naissance' => 'Abidjan', 'sexe' => 'M', 'classe_id' => 2, 'matricule' => 'EL002', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Yao', 'prenom' => 'Adjoua', 'date_naissance' => '2011-03-10', 'lieu_naissance' => 'Abidjan', 'sexe' => 'F', 'classe_id' => 1, 'matricule' => 'EL003', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Parent-Eleve
        DB::table('parent_eleve')->insert([
            ['parent_id' => 1, 'eleve_id' => 1, 'lien_parente' => 'père', 'created_at' => now(), 'updated_at' => now()],
            ['parent_id' => 1, 'eleve_id' => 2, 'lien_parente' => 'père', 'created_at' => now(), 'updated_at' => now()],
            ['parent_id' => 2, 'eleve_id' => 3, 'lien_parente' => 'mère', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Enseignants
        DB::table('enseignants')->insert([
            ['nom' => 'Diallo', 'prenom' => 'Amadou', 'email' => 'diallo@ecole.com', 'telephone' => '0123456787', 'specialite' => 'Mathématiques', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Traore', 'prenom' => 'Fatou', 'email' => 'traore@ecole.com', 'telephone' => '0123456786', 'specialite' => 'Français', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Enseignant-Matiere
        DB::table('enseignant_matiere')->insert([
            ['enseignant_id' => 1, 'matiere_id' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['enseignant_id' => 2, 'matiere_id' => 2, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Classe-Matieres
        DB::table('classe_matieres')->insert([
            ['classe_id' => 1, 'matiere_id' => 1, 'coefficient' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['classe_id' => 1, 'matiere_id' => 2, 'coefficient' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['classe_id' => 1, 'matiere_id' => 3, 'coefficient' => 2, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Notes
        DB::table('notes')->insert([
            ['eleve_id' => 1, 'matiere_id' => 1, 'type_evaluation_id' => 1, 'periode_id' => 1, 'note' => 15.5, 'created_at' => now(), 'updated_at' => now()],
            ['eleve_id' => 1, 'matiere_id' => 1, 'type_evaluation_id' => 2, 'periode_id' => 1, 'note' => 14.0, 'created_at' => now(), 'updated_at' => now()],
            ['eleve_id' => 1, 'matiere_id' => 2, 'type_evaluation_id' => 1, 'periode_id' => 1, 'note' => 13.5, 'created_at' => now(), 'updated_at' => now()],
            ['eleve_id' => 2, 'matiere_id' => 1, 'type_evaluation_id' => 1, 'periode_id' => 1, 'note' => 12.0, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Contributions
        DB::table('contributions')->insert([
            ['classe_id' => 1, 'montant' => 150000, 'montant_premiere_tranche' => 50000, 'date_fin_premiere_tranche' => '2024-10-31', 'montant_deuxieme_tranche' => 50000, 'date_fin_deuxieme_tranche' => '2024-12-31', 'montant_troisieme_tranche' => 50000, 'date_fin_troisieme_tranche' => '2025-02-28', 'created_at' => now(), 'updated_at' => now()],
            ['classe_id' => 2, 'montant' => 150000, 'montant_premiere_tranche' => 50000, 'date_fin_premiere_tranche' => '2024-10-31', 'montant_deuxieme_tranche' => 50000, 'date_fin_deuxieme_tranche' => '2024-12-31', 'montant_troisieme_tranche' => 50000, 'date_fin_troisieme_tranche' => '2025-02-28', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Paiements
        DB::table('paiements')->insert([
            ['eleve_id' => 1, 'parents_id' => 1, 'contribution_id' => 1, 'montant_total' => 150000, 'montant_paye' => 50000, 'montant_restant' => 100000, 'statut_global' => 'EN_COURS', 'created_at' => now(), 'updated_at' => now()],
            ['eleve_id' => 2, 'parents_id' => 1, 'contribution_id' => 2, 'montant_total' => 150000, 'montant_paye' => 0, 'montant_restant' => 150000, 'statut_global' => 'EN_ATTENTE', 'created_at' => now(), 'updated_at' => now()],
            ['eleve_id' => 3, 'parents_id' => 2, 'contribution_id' => 1, 'montant_total' => 150000, 'montant_paye' => 150000, 'montant_restant' => 0, 'statut_global' => 'PAYE', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Absences
        DB::table('absences')->insert([
            ['eleve_id' => 1, 'date_absence' => '2024-10-15', 'motif' => 'Maladie', 'justifiee' => true, 'created_at' => now(), 'updated_at' => now()],
            ['eleve_id' => 2, 'date_absence' => '2024-10-16', 'motif' => 'Rendez-vous médical', 'justifiee' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Devoirs
        DB::table('devoirs')->insert([
            ['classe_id' => 1, 'matiere_id' => 1, 'enseignant_id' => 1, 'titre' => 'Exercices sur les fractions', 'description' => 'Faire les exercices 1 à 10 page 45', 'date_donnee' => '2024-10-01', 'date_rendu' => '2024-10-08', 'created_at' => now(), 'updated_at' => now()],
            ['classe_id' => 1, 'matiere_id' => 2, 'enseignant_id' => 2, 'titre' => 'Rédaction', 'description' => 'Écrire une rédaction de 300 mots', 'date_donnee' => '2024-10-02', 'date_rendu' => '2024-10-09', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Messages
        DB::table('messages')->insert([
            ['expediteur_id' => 3, 'destinataire_id' => 1, 'sujet' => 'Demande de rendez-vous', 'contenu' => 'Bonjour, je souhaiterais prendre rendez-vous pour discuter des résultats de mon enfant.', 'lu' => false, 'created_at' => now(), 'updated_at' => now()],
            ['expediteur_id' => 1, 'destinataire_id' => 3, 'sujet' => 'Re: Demande de rendez-vous', 'contenu' => 'Bonjour, je suis disponible mardi prochain à 14h.', 'lu' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Livres
        DB::table('livres')->insert([
            ['titre' => 'Le Petit Prince', 'auteur' => 'Antoine de Saint-Exupéry', 'isbn' => '9782070612758', 'quantite_disponible' => 10, 'quantite_totale' => 15, 'created_at' => now(), 'updated_at' => now()],
            ['titre' => 'Les Misérables', 'auteur' => 'Victor Hugo', 'isbn' => '9782070409228', 'quantite_disponible' => 5, 'quantite_totale' => 8, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Emprunts
        DB::table('emprunts')->insert([
            ['eleve_id' => 1, 'livre_id' => 1, 'date_emprunt' => '2024-10-01', 'date_retour_prevue' => '2024-10-15', 'statut' => 'en_cours', 'created_at' => now(), 'updated_at' => now()],
        ]);

        echo "Données de test créées avec succès!\n";
        echo "Connexions:\n";
        echo "- Admin: admin@ecole.com / password\n";
        echo "- Directeur: directeur@ecole.com / password\n";
        echo "- Parent1: parent1@ecole.com / password\n";
        echo "- Parent2: parent2@ecole.com / password\n";
    }
}
