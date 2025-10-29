<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class BeninEducationSeeder extends Seeder
{
    public function run()
    {
        // Users
        if (DB::table('users')->where('email', 'directeur@ecole.bj')->exists()) {
            echo "Les données existent déjà. Utilisez 'php artisan migrate:fresh --seed' pour réinitialiser.\n";
            return;
        }
        
        DB::table('users')->insert([
            ['name' => 'Directeur Général', 'email' => 'directeur@ecole.bj', 'password' => Hash::make('password'), 'role' => 'directeur', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'AGBODJAN Koffi', 'email' => 'agbodjan@ecole.bj', 'password' => Hash::make('password'), 'role' => 'parent', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'HOUNGBO Adjovi', 'email' => 'houngbo@ecole.bj', 'password' => Hash::make('password'), 'role' => 'parent', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'DOSSOU Marie', 'email' => 'dossou@ecole.bj', 'password' => Hash::make('password'), 'role' => 'parent', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Series - Système éducatif béninois
        DB::table('series')->insert([
            ['nom' => 'Maternelle', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Primaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Collège', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Série A', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Série C', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Série D', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Matieres - Programme béninois
        DB::table('matieres')->insert([
            ['nom' => 'Mathématiques', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Français', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Anglais', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Histoire-Géographie', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Sciences de la Vie et de la Terre (SVT)', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Sciences Physiques', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Philosophie', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Éducation Physique et Sportive (EPS)', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Éducation Civique et Morale (ECM)', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Allemand', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Espagnol', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Informatique', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Classes
        DB::table('classes')->insert([
            ['nom_classe' => 'Petite Section', 'categorie_classe' => 'Maternelle', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'Moyenne Section', 'categorie_classe' => 'Maternelle', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'Grande Section', 'categorie_classe' => 'Maternelle', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'CI', 'categorie_classe' => 'Primaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'CP', 'categorie_classe' => 'Primaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'CE1', 'categorie_classe' => 'Primaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'CE2', 'categorie_classe' => 'Primaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'CM1', 'categorie_classe' => 'Primaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'CM2', 'categorie_classe' => 'Primaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => '6ème', 'categorie_classe' => 'Secondaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => '5ème', 'categorie_classe' => 'Secondaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => '4ème', 'categorie_classe' => 'Secondaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => '3ème', 'categorie_classe' => 'Secondaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'Seconde A', 'categorie_classe' => 'Secondaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'Première A', 'categorie_classe' => 'Secondaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'Terminale A', 'categorie_classe' => 'Secondaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'Seconde C', 'categorie_classe' => 'Secondaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'Première C', 'categorie_classe' => 'Secondaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'Terminale C', 'categorie_classe' => 'Secondaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'Seconde D', 'categorie_classe' => 'Secondaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'Première D', 'categorie_classe' => 'Secondaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom_classe' => 'Terminale D', 'categorie_classe' => 'Secondaire', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Type evaluations
        DB::table('type_evaluations')->insert([
            ['nom' => 'Interrogation Écrite', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Devoir Surveillé', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Composition', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Travaux Pratiques', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Periodes - Système trimestre béninois
        DB::table('periodes')->insert([
            ['nom' => '1er Trimestre', 'date_debut' => '2024-09-16', 'date_fin' => '2024-12-20', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nom' => '2ème Trimestre', 'date_debut' => '2025-01-06', 'date_fin' => '2025-04-04', 'is_active' => false, 'created_at' => now(), 'updated_at' => now()],
            ['nom' => '3ème Trimestre', 'date_debut' => '2025-04-14', 'date_fin' => '2025-07-11', 'is_active' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Parents - Noms béninois
        DB::table('parents')->insert([
            ['nom' => 'AGBODJAN', 'prenom' => 'Koffi', 'email' => 'agbodjan@ecole.bj', 'numero_de_telephone' => '+22997123456', 'identifiant' => 'PAR001', 'password1' => Hash::make('password'), 'role' => 'parent', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'HOUNGBO', 'prenom' => 'Adjovi', 'email' => 'houngbo@ecole.bj', 'numero_de_telephone' => '+22997234567', 'identifiant' => 'PAR002', 'password1' => Hash::make('password'), 'role' => 'parent', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'DOSSOU', 'prenom' => 'Marie', 'email' => 'dossou@ecole.bj', 'numero_de_telephone' => '+22997345678', 'identifiant' => 'PAR003', 'password1' => Hash::make('password'), 'role' => 'parent', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Eleves - Prénoms béninois
        DB::table('eleves')->insert([
            ['nom' => 'AGBODJAN', 'prenom' => 'Yèhossou', 'date_naissance' => '2010-03-15', 'lieu_naissance' => 'Cotonou', 'sexe' => 'M', 'class_id' => 13, 'serie_id' => 4, 'numero_matricule' => 'BEN2024001', 'identifiant' => 'EL001', 'numero_de_telephone' => '+22997111111', 'password1' => Hash::make('password'), 'role' => 'eleve', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'AGBODJAN', 'prenom' => 'Ayodélé', 'date_naissance' => '2012-07-22', 'lieu_naissance' => 'Cotonou', 'sexe' => 'F', 'class_id' => 11, 'serie_id' => 3, 'numero_matricule' => 'BEN2024002', 'identifiant' => 'EL002', 'numero_de_telephone' => '+22997222222', 'password1' => Hash::make('password'), 'role' => 'eleve', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'HOUNGBO', 'prenom' => 'Fifamè', 'date_naissance' => '2011-11-08', 'lieu_naissance' => 'Porto-Novo', 'sexe' => 'F', 'class_id' => 12, 'serie_id' => 3, 'numero_matricule' => 'BEN2024003', 'identifiant' => 'EL003', 'numero_de_telephone' => '+22997333333', 'password1' => Hash::make('password'), 'role' => 'eleve', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'DOSSOU', 'prenom' => 'Kossivi', 'date_naissance' => '2009-05-30', 'lieu_naissance' => 'Abomey', 'sexe' => 'M', 'class_id' => 14, 'serie_id' => 4, 'numero_matricule' => 'BEN2024004', 'identifiant' => 'EL004', 'numero_de_telephone' => '+22997444444', 'password1' => Hash::make('password'), 'role' => 'eleve', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Parent-Eleve
        DB::table('eleves_parents')->insert([
            ['parent_id' => 1, 'eleve_id' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['parent_id' => 1, 'eleve_id' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['parent_id' => 2, 'eleve_id' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['parent_id' => 3, 'eleve_id' => 4, 'created_at' => now(), 'updated_at' => now()],
        ]);



        // Contributions - Frais de scolarité béninois (en FCFA)
        DB::table('contributions')->insert([
            ['id_classe' => 10, 'id_serie' => 3, 'montant' => 75000, 'montant_premiere_tranche' => 25000, 'date_fin_premiere_tranche' => '2024-10-31', 'montant_deuxieme_tranche' => 25000, 'date_fin_deuxieme_tranche' => '2025-01-31', 'montant_troisieme_tranche' => 25000, 'date_fin_troisieme_tranche' => '2025-04-30', 'created_at' => now(), 'updated_at' => now()],
            ['id_classe' => 13, 'id_serie' => 3, 'montant' => 120000, 'montant_premiere_tranche' => 40000, 'date_fin_premiere_tranche' => '2024-10-31', 'montant_deuxieme_tranche' => 40000, 'date_fin_deuxieme_tranche' => '2025-01-31', 'montant_troisieme_tranche' => 40000, 'date_fin_troisieme_tranche' => '2025-04-30', 'created_at' => now(), 'updated_at' => now()],
            ['id_classe' => 16, 'id_serie' => 4, 'montant' => 150000, 'montant_premiere_tranche' => 50000, 'date_fin_premiere_tranche' => '2024-10-31', 'montant_deuxieme_tranche' => 50000, 'date_fin_deuxieme_tranche' => '2025-01-31', 'montant_troisieme_tranche' => 50000, 'date_fin_troisieme_tranche' => '2025-04-30', 'created_at' => now(), 'updated_at' => now()],
        ]);

        echo "✓ Données du système éducatif béninois créées avec succès!\n\n";
        echo "Connexions:\n";
        echo "- Directeur: directeur@ecole.bj / password\n";
        echo "- Parent AGBODJAN: agbodjan@ecole.bj / password\n";
        echo "- Parent HOUNGBO: houngbo@ecole.bj / password\n";
        echo "- Parent DOSSOU: dossou@ecole.bj / password\n";
    }
}
