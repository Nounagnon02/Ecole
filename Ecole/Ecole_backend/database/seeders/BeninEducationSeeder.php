<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Eleve;
use App\Models\Parent as ParentModel;
use App\Models\Ecole;

class BeninEducationSeeder extends Seeder
{
    public function run()
    {
        // 0. Ecole par défaut
        $ecole = DB::table('ecoles')->insertGetId([
            'nom' => 'Complexe Scolaire Excellence',
            'email' => 'contact@excellence.bj',
            'adresse' => 'Cotonou, Bénin',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 1. Users & Profiles
        if (DB::table('users')->where('email', 'directeur@ecole.bj')->exists()) {
            echo "Les données existent déjà. Utilisez 'php artisan migrate:fresh --seed' pour réinitialiser.\n";
            return;
        }
        
        // Directeur
        DB::table('users')->insert([
            'name' => 'Directeur Général',
            'email' => 'directeur@ecole.bj',
            'password' => Hash::make('password'),
            'role' => 'directeur',
            'ecole_id' => $ecole,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Parents
        $parentsData = [
            ['nom' => 'AGBODJAN', 'prenom' => 'Koffi', 'email' => 'agbodjan@ecole.bj', 'tel' => '+22997123456', 'ident' => 'PAR001'],
            ['nom' => 'HOUNGBO', 'prenom' => 'Adjovi', 'email' => 'houngbo@ecole.bj', 'tel' => '+22997234567', 'ident' => 'PAR002'],
            ['nom' => 'DOSSOU', 'prenom' => 'Marie', 'email' => 'dossou@ecole.bj', 'tel' => '+22997345678', 'ident' => 'PAR003'],
        ];

        $parentIds = [];
        foreach ($parentsData as $p) {
            $userId = DB::table('users')->insertGetId([
                'name' => $p['nom'],
                'prenom' => $p['prenom'],
                'email' => $p['email'],
                'identifiant' => $p['ident'],
                'telephone' => $p['tel'],
                'password' => Hash::make('password'),
                'role' => 'parent',
                'ecole_id' => $ecole,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            $parentIds[] = DB::table('parents')->insertGetId([
                'user_id' => $userId,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        // Series
        DB::table('series')->insert([
            ['nom' => 'Maternelle', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Primaire', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Collège', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Série A', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Série C', 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Série D', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Matieres
        DB::table('matieres')->insert([
            ['nom' => 'Mathématiques', 'ecole_id' => $ecole, 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Français',       'ecole_id' => $ecole, 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'Anglais',         'ecole_id' => $ecole, 'created_at' => now(), 'updated_at' => now()],
            ['nom' => 'SVT',             'ecole_id' => $ecole, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Classes
        $classeId = DB::table('classes')->insertGetId([
            'nom_classe' => '3ème',
            'categorie_classe' => 'Secondaire',
            'ecole_id' => $ecole,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Élèves
        $elevesData = [
            ['nom' => 'AGBODJAN', 'prenom' => 'Yèhossou', 'ident' => 'EL001', 'mat' => 'BEN2024001', 'parent_idx' => 0],
            ['nom' => 'HOUNGBO', 'prenom' => 'Fifamè', 'ident' => 'EL002', 'mat' => 'BEN2024002', 'parent_idx' => 1],
        ];

        $eleveIds = [];
        foreach ($elevesData as $e) {
            $userId = DB::table('users')->insertGetId([
                'name' => $e['nom'],
                'prenom' => $e['prenom'],
                'identifiant' => $e['ident'],
                'password' => Hash::make('password'),
                'role' => 'eleve',
                'ecole_id' => $ecole,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            $eleveIds[] = DB::table('eleves')->insertGetId([
                'user_id' => $userId,
                'numero_matricule' => $e['mat'],
                'class_id' => $classeId,
                'ecole_id' => $ecole,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        // Parent-Eleve (Liaison via table pivot si nécessaire, sinon via parent_id dans eleves)
        // Dans mon schéma, j'utilise eleves_parents
        DB::table('eleves_parents')->insert([
            ['parent_id' => $parentIds[0], 'eleve_id' => $eleveIds[0], 'created_at' => now(), 'updated_at' => now()],
            ['parent_id' => $parentIds[1], 'eleve_id' => $eleveIds[1], 'created_at' => now(), 'updated_at' => now()],
        ]);

        echo "✓ Données du système éducatif béninois créées avec succès!\n";
    }
}
