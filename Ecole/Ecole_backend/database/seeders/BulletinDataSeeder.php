<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class BulletinDataSeeder extends Seeder
{
    public function run()
    {
        $prenomsBenin = ['Yèhossou', 'Ayodélé', 'Fifamè', 'Kossivi', 'Adjovi', 'Sèmèvo', 'Rachelle', 'Honoré', 'Sylvie', 'Koffi', 'Aya', 'Adjoua', 'Kossi', 'Akouvi', 'Edem', 'Kafui', 'Mawuli', 'Sena', 'Yawa', 'Afi'];
        $nomsBenin = ['AGBODJAN', 'HOUNGBO', 'DOSSOU', 'AKPOVI', 'ZINSOU', 'GBAGUIDI', 'KOUDJO', 'SOGLO', 'KEREKOU', 'YAYI'];
        
        if (DB::table('enseignants')->where('email', 'akpovi@ecole.bj')->exists()) {
            echo "Les enseignants existent déjà. Passage à la création des élèves...\n";
        } else {
        // Enseignants
        $enseignants = [
            ['nom' => 'AKPOVI', 'prenom' => 'Sèmèvo', 'email' => 'akpovi@ecole.bj', 'numero_de_telephone' => '+22997456789', 'matiere_id' => 1, 'class_id' => 13, 'identifiant' => 'ENS001', 'password1' => Hash::make('password'), 'role' => 'enseignant', 'sexe' => 'M', 'date_naissance' => '1985-05-15', 'lieu_naissance' => 'Cotonou'],
            ['nom' => 'ZINSOU', 'prenom' => 'Rachelle', 'email' => 'zinsou@ecole.bj', 'numero_de_telephone' => '+22997567890', 'matiere_id' => 2, 'class_id' => 13, 'identifiant' => 'ENS002', 'password1' => Hash::make('password'), 'role' => 'enseignant', 'sexe' => 'F', 'date_naissance' => '1987-08-20', 'lieu_naissance' => 'Porto-Novo'],
            ['nom' => 'GBAGUIDI', 'prenom' => 'Honoré', 'email' => 'gbaguidi@ecole.bj', 'numero_de_telephone' => '+22997678901', 'matiere_id' => 6, 'class_id' => 13, 'identifiant' => 'ENS003', 'password1' => Hash::make('password'), 'role' => 'enseignant', 'sexe' => 'M', 'date_naissance' => '1983-03-10', 'lieu_naissance' => 'Abomey'],
            ['nom' => 'KOUDJO', 'prenom' => 'Sylvie', 'email' => 'koudjo@ecole.bj', 'numero_de_telephone' => '+22997789012', 'matiere_id' => 4, 'class_id' => 13, 'identifiant' => 'ENS004', 'password1' => Hash::make('password'), 'role' => 'enseignant', 'sexe' => 'F', 'date_naissance' => '1986-11-25', 'lieu_naissance' => 'Parakou'],
            ['nom' => 'SOGLO', 'prenom' => 'Jean', 'email' => 'soglo@ecole.bj', 'numero_de_telephone' => '+22997890123', 'matiere_id' => 5, 'class_id' => 13, 'identifiant' => 'ENS005', 'password1' => Hash::make('password'), 'role' => 'enseignant', 'sexe' => 'M', 'date_naissance' => '1984-07-12', 'lieu_naissance' => 'Cotonou'],
            ['nom' => 'KEREKOU', 'prenom' => 'Marie', 'email' => 'kerekou@ecole.bj', 'numero_de_telephone' => '+22997901234', 'matiere_id' => 3, 'class_id' => 13, 'identifiant' => 'ENS006', 'password1' => Hash::make('password'), 'role' => 'enseignant', 'sexe' => 'F', 'date_naissance' => '1988-02-18', 'lieu_naissance' => 'Porto-Novo'],
        ];
        foreach ($enseignants as $ens) {
            DB::table('enseignants')->insert(array_merge($ens, ['created_at' => now(), 'updated_at' => now()]));
        }

        // Enseignant-Matiere
        DB::table('enseignant_matiere')->insert([
            ['enseignant_id' => 1, 'matiere_id' => 1, 'classe_id' => 13, 'serie_id' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['enseignant_id' => 2, 'matiere_id' => 2, 'classe_id' => 13, 'serie_id' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['enseignant_id' => 3, 'matiere_id' => 6, 'classe_id' => 13, 'serie_id' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['enseignant_id' => 4, 'matiere_id' => 4, 'classe_id' => 13, 'serie_id' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['enseignant_id' => 5, 'matiere_id' => 5, 'classe_id' => 13, 'serie_id' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['enseignant_id' => 6, 'matiere_id' => 3, 'classe_id' => 13, 'serie_id' => 3, 'created_at' => now(), 'updated_at' => now()],
        ]);

        }
        
        // Classe-Matieres pour 3ème (classe_id = 13)
        $matieres3eme = [
            ['classe_id' => 13, 'matiere_id' => 1, 'coefficient' => 4],
            ['classe_id' => 13, 'matiere_id' => 2, 'coefficient' => 4],
            ['classe_id' => 13, 'matiere_id' => 3, 'coefficient' => 2],
            ['classe_id' => 13, 'matiere_id' => 4, 'coefficient' => 3],
            ['classe_id' => 13, 'matiere_id' => 5, 'coefficient' => 3],
            ['classe_id' => 13, 'matiere_id' => 6, 'coefficient' => 3],
            ['classe_id' => 13, 'matiere_id' => 8, 'coefficient' => 1],
            ['classe_id' => 13, 'matiere_id' => 9, 'coefficient' => 2],
        ];
        foreach ($matieres3eme as $cm) {
            DB::table('classe_matieres')->insert(array_merge($cm, ['created_at' => now(), 'updated_at' => now()]));
        }

        // Créer 30 élèves en 3ème
        if (DB::table('eleves')->where('class_id', 13)->count() >= 30) {
            echo "Les élèves existent déjà.\n";
            return;
        }
        
        for ($i = 1; $i <= 30; $i++) {
            $nom = $nomsBenin[array_rand($nomsBenin)];
            $prenom = $prenomsBenin[array_rand($prenomsBenin)];
            $sexe = rand(0, 1) ? 'M' : 'F';
            
            // Parent (1 parent pour 2 élèves)
            $parentNum = ceil($i / 2);
            $parentEmail = 'parent' . ($parentNum + 10) . '@ecole.bj';
            
            $existingParent = DB::table('parents')->where('email', $parentEmail)->first();
            
            if (!$existingParent && $i % 2 == 1) {
                DB::table('parents')->insert([
                    'nom' => $nom,
                    'prenom' => $prenom . ' Parent',
                    'email' => $parentEmail,
                    'numero_de_telephone' => '+229' . (97000000 + $parentNum + 1000),
                    'identifiant' => 'PAR' . str_pad($parentNum + 10, 3, '0', STR_PAD_LEFT),
                    'password1' => Hash::make('password'),
                    'role' => 'parent',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
                $existingParent = DB::table('parents')->where('email', $parentEmail)->first();
            }
            
            $currentParentId = $existingParent ? $existingParent->id : (ceil($i / 2) + 10);

            // Eleve
            $eleveDbId = $i + 4;
            DB::table('eleves')->insert([
                'nom' => $nom,
                'prenom' => $prenom,
                'date_naissance' => '2010-' . str_pad(rand(1, 12), 2, '0', STR_PAD_LEFT) . '-' . str_pad(rand(1, 28), 2, '0', STR_PAD_LEFT),
                'lieu_naissance' => ['Cotonou', 'Porto-Novo', 'Abomey', 'Parakou'][rand(0, 3)],
                'sexe' => $sexe,
                'class_id' => 13,
                'serie_id' => 3,
                'numero_matricule' => 'BEN2024' . str_pad($i + 100, 3, '0', STR_PAD_LEFT),
                'identifiant' => 'EL' . str_pad($i + 100, 3, '0', STR_PAD_LEFT),
                'numero_de_telephone' => '+229' . (96000000 + $i + 100),
                'password1' => Hash::make('password'),
                'role' => 'eleve',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Parent-Eleve
            DB::table('eleves_parents')->insert([
                'parent_id' => $currentParentId,
                'eleve_id' => $eleveDbId,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Notes pour chaque matière (Devoir 1, Devoir 2, Interrogations)
            $matieres = [1, 2, 3, 4, 5, 6, 8, 9];
            foreach ($matieres as $matiereId) {
                // Devoir 1
                DB::table('notes')->insert([
                    'eleve_id' => $eleveDbId,
                    'matiere_id' => $matiereId,
                    'classe_id' => 13,
                    'type_evaluation' => 'DS1',
                    'periode' => '1er Trimestre',
                    'note' => rand(8, 18) + (rand(0, 10) / 10),
                    'note_sur' => 20,
                    'date_evaluation' => '2024-10-15',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                // Devoir 2
                DB::table('notes')->insert([
                    'eleve_id' => $eleveDbId,
                    'matiere_id' => $matiereId,
                    'classe_id' => 13,
                    'type_evaluation' => 'DS2',
                    'periode' => '1er Trimestre',
                    'note' => rand(8, 18) + (rand(0, 10) / 10),
                    'note_sur' => 20,
                    'date_evaluation' => '2024-11-15',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                // Interrogations (3 notes)
                for ($j = 0; $j < 3; $j++) {
                    DB::table('notes')->insert([
                        'eleve_id' => $eleveDbId,
                        'matiere_id' => $matiereId,
                        'classe_id' => 13,
                        'type_evaluation' => 'INT' . ($j + 1),
                        'periode' => '1er Trimestre',
                        'note' => rand(8, 18) + (rand(0, 10) / 10),
                        'note_sur' => 20,
                        'date_evaluation' => '2024-10-' . (10 + $j * 5),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }
        }

        // Contributions pour 3ème
        DB::table('contributions')->insert([
            'id_classe' => 13,
            'id_serie' => 3,
            'montant' => 120000,
            'montant_premiere_tranche' => 40000,
            'date_fin_premiere_tranche' => '2024-10-31',
            'montant_deuxieme_tranche' => 40000,
            'date_fin_deuxieme_tranche' => '2025-01-31',
            'montant_troisieme_tranche' => 40000,
            'date_fin_troisieme_tranche' => '2025-04-30',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Paiements pour tous les élèves
        for ($i = 1; $i <= 30; $i++) {
            $statuts = ['EN_ATTENTE', 'EN_COURS', 'PAYE'];
            $statut = $statuts[rand(0, 2)];
            $montantPaye = $statut == 'PAYE' ? 120000 : ($statut == 'EN_COURS' ? rand(40000, 80000) : 0);
            
            DB::table('paiements')->insert([
                'eleve_id' => $i + 4,
                'parents_id' => ceil($i / 2) + 10,
                'contribution_id' => 1,
                'montant_total' => 120000,
                'montant_paye' => $montantPaye,
                'montant_restant' => 120000 - $montantPaye,
                'statut_global' => $statut,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        echo "✓ Données complètes pour bulletins créées!\n";
        echo "- 30 élèves en 3ème avec notes complètes\n";
        echo "- 8 matières avec coefficients\n";
        echo "- Notes: Devoir 1, Devoir 2, 3 Interrogations par matière\n";
        echo "- Parents et paiements associés\n";
    }
}
