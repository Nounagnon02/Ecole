<?php

namespace Database\Seeders;

use App\Models\User;
use Database\Seeders\Concerns\RefusesInProduction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Jeu de données des tests de charge (voir /loadtests) : plusieurs écoles
 * étanches, chacune avec un volume réaliste de classes, d'élèves, de notes et
 * de paiements. `DemoDataSeeder` ne convient pas : il est écrit pour une seule
 * école, avec des noms et des e-mails figés.
 *
 * Tout nom d'utilisateur d'une école porte le préfixe `LTS{n}-` : le scénario
 * k6 s'en sert pour détecter une fuite entre écoles sous charge (une réponse à
 * un utilisateur de l'école 1 ne doit jamais contenir `LTS2-`).
 *
 * Volume réglable par variables d'environnement (lues avant `config:cache`) :
 * LOADTEST_SCHOOLS (5), LOADTEST_CLASSES (8), LOADTEST_STUDENTS_PER_CLASS (30).
 * Écrit les jetons Bearer des personas dans storage/app/loadtest-tokens.json.
 */
class LoadTestSeeder extends Seeder
{
    use RefusesInProduction;

    private const SUBJECTS = [
        'Mathématiques', 'Français', 'Anglais', 'Histoire-Géographie',
        'SVT', 'Physique-Chimie', 'EPS', 'Philosophie',
    ];

    private const TOKENS_PER_SCHOOL = ['eleve' => 20, 'parent' => 20];

    public function run(): void
    {
        if ($this->abortIfProduction()) {
            return;
        }

        $schools = (int) env('LOADTEST_SCHOOLS', 5);
        $classes = (int) env('LOADTEST_CLASSES', 8);
        $perClass = (int) env('LOADTEST_STUDENTS_PER_CLASS', 30);

        // Ces comptes ne se connectent jamais par mot de passe (jetons Bearer) :
        // un seul hachage réutilisé. `Hash::make()` par utilisateur coûterait
        // plusieurs minutes de bcrypt pour rien.
        $password = Hash::make(Str::random(40));

        $tokens = [];
        $totals = ['ecoles' => 0, 'users' => 0, 'eleves' => 0, 'notes' => 0, 'paiements' => 0];

        for ($s = 1; $s <= $schools; $s++) {
            $this->seedSchool($s, $classes, $perClass, $password, $tokens, $totals);
        }

        file_put_contents(
            storage_path('app/loadtest-tokens.json'),
            json_encode(['schools' => $schools, 'users' => $tokens], JSON_PRETTY_PRINT)
        );

        $this->command?->info(sprintf(
            'Jeu de charge : %d écoles, %d utilisateurs, %d élèves, %d notes, %d paiements, %d jetons.',
            $totals['ecoles'], $totals['users'], $totals['eleves'], $totals['notes'], $totals['paiements'], count($tokens)
        ));
    }

    private function seedSchool(int $s, int $nbClasses, int $perClass, string $password, array &$tokens, array &$totals): void
    {
        $now = now();
        $tag = "LTS{$s}";

        $ecoleId = DB::table('ecoles')->insertGetId([
            'nom' => "{$tag}-Ecole",
            'email' => "loadtest-s{$s}@loadtest.local",
            'adresse' => 'Cotonou',
            'status' => 'active',
            'pays' => 'Bénin',
            'ville' => 'Cotonou',
            'slug' => "loadtest-s{$s}",
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $totals['ecoles']++;

        $serieId = DB::table('series')->insertGetId([
            'ecole_id' => $ecoleId, 'nom' => 'Collège', 'created_at' => $now, 'updated_at' => $now,
        ]);

        $user = function (string $role, string $name, string $prenom, int $n) use ($ecoleId, $s, $password, $now, &$totals): int {
            $totals['users']++;

            return DB::table('users')->insertGetId([
                'identifiant' => "LT{$s}{$role}{$n}",
                'name' => $name,
                'prenom' => $prenom,
                'email' => "lt-s{$s}-{$role}-{$n}@loadtest.local",
                'role' => $role,
                'is_active' => 1,
                // Sans cela, le middleware 2FA refuse ces rôles (obligatoires).
                'two_factor_enabled' => in_array($role, ['directeur', 'comptable'], true) ? 1 : 0,
                'ecole_id' => $ecoleId,
                'password' => $password,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        };

        $directeurId = $user('directeur', "LTS{$s}-Directeur", 'Chef', 1);
        $comptableId = $user('comptable', "LTS{$s}-Comptable", 'Caisse', 1);
        $tokens[] = $this->token($directeurId, 'directeur', $s, $ecoleId);
        $tokens[] = $this->token($comptableId, 'comptable', $s, $ecoleId);

        $matiereIds = [];
        foreach (self::SUBJECTS as $nom) {
            $matiereIds[] = DB::table('matieres')->insertGetId([
                'ecole_id' => $ecoleId, 'nom' => $nom, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        $classeIds = [];
        for ($c = 1; $c <= $nbClasses; $c++) {
            $classeId = DB::table('classes')->insertGetId([
                'ecole_id' => $ecoleId, 'nom_classe' => "{$tag}-Classe{$c}", 'categorie_classe' => 'Secondaire',
                'created_at' => $now, 'updated_at' => $now,
            ]);
            $classeIds[] = $classeId;

            DB::table('classe_series')->insert([
                'ecole_id' => $ecoleId, 'classe_id' => $classeId, 'serie_id' => $serieId,
                'created_at' => $now, 'updated_at' => $now,
            ]);

            foreach ($matiereIds as $matiereId) {
                DB::table('classe_matieres')->insert([
                    'ecole_id' => $ecoleId, 'classe_id' => $classeId, 'matiere_id' => $matiereId,
                    'coefficient' => 2, 'created_at' => $now, 'updated_at' => $now,
                ]);
            }

            DB::table('contributions')->insert([
                'ecole_id' => $ecoleId, 'montant' => 150000,
                'date_fin_premiere_tranche' => $now->copy()->addMonths(3), 'montant_premiere_tranche' => 75000,
                'date_fin_deuxieme_tranche' => $now->copy()->addMonths(6), 'montant_deuxieme_tranche' => 45000,
                'date_fin_troisieme_tranche' => $now->copy()->addMonths(9), 'montant_troisieme_tranche' => 30000,
                'id_classe' => $classeId, 'id_serie' => $serieId,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        // Un enseignant par matière, affecté à quatre classes.
        foreach ($matiereIds as $i => $matiereId) {
            $userId = $user('enseignant', "LTS{$s}-Prof" . ($i + 1), 'Prof', $i + 1);
            $enseignantId = DB::table('enseignants')->insertGetId([
                'ecole_id' => $ecoleId, 'user_id' => $userId, 'specialite' => self::SUBJECTS[$i],
                'sexe' => 'M', 'grade' => 'Licence', 'created_at' => $now, 'updated_at' => $now,
            ]);
            foreach (array_slice($classeIds, 0, 4) as $classeId) {
                DB::table('enseignant_matiere')->insert([
                    'ecole_id' => $ecoleId, 'enseignant_id' => $enseignantId, 'matiere_id' => $matiereId,
                    'classe_id' => $classeId, 'serie_id' => $serieId, 'created_at' => $now, 'updated_at' => $now,
                ]);
            }
            $tokens[] = $this->token($userId, 'enseignant', $s, $ecoleId);
        }

        $tokenQuota = self::TOKENS_PER_SCHOOL;
        $notes = [];
        $n = 0;

        foreach ($classeIds as $classeId) {
            $parentId = null;

            for ($e = 1; $e <= $perClass; $e++) {
                $n++;
                $userId = $user('eleve', "{$tag}-Eleve{$n}", 'Eleve', $n);
                $eleveId = DB::table('eleves')->insertGetId([
                    'ecole_id' => $ecoleId, 'user_id' => $userId, 'numero_matricule' => "{$tag}-MAT{$n}",
                    'sexe' => $n % 2 ? 'M' : 'F', 'classe_id' => $classeId,
                    'created_at' => $now, 'updated_at' => $now,
                ]);
                $totals['eleves']++;

                if ($tokenQuota['eleve'] > 0) {
                    $tokens[] = $this->token($userId, 'eleve', $s, $ecoleId);
                    $tokenQuota['eleve']--;
                }

                // Un parent pour deux élèves consécutifs (fratrie).
                if ($e % 2 === 1) {
                    $parentUserId = $user('parent', "{$tag}-Parent{$n}", 'Parent', $n);
                    $parentId = DB::table('parents')->insertGetId([
                        'ecole_id' => $ecoleId, 'user_id' => $parentUserId, 'created_at' => $now, 'updated_at' => $now,
                    ]);
                    if ($tokenQuota['parent'] > 0) {
                        $tokens[] = $this->token($parentUserId, 'parent', $s, $ecoleId);
                        $tokenQuota['parent']--;
                    }
                }

                DB::table('eleves_parents')->insert([
                    'ecole_id' => $ecoleId, 'parent_id' => $parentId, 'eleve_id' => $eleveId,
                    'role' => 'père', 'is_primary' => true, 'created_at' => $now, 'updated_at' => $now,
                ]);

                foreach ($matiereIds as $matiereId) {
                    foreach (['Devoir1', 'Devoir2', 'Interrogation'] as $type) {
                        $notes[] = [
                            'ecole_id' => $ecoleId, 'eleve_id' => $eleveId, 'classe_id' => $classeId,
                            'matiere_id' => $matiereId, 'note' => mt_rand(50, 195) / 10, 'note_sur' => 20,
                            'type_evaluation' => $type, 'date_evaluation' => $now->toDateString(),
                            'periode' => 'Trimestre 1', 'created_by' => $directeurId,
                            'created_at' => $now, 'updated_at' => $now,
                        ];
                    }
                }

                if ($n % 3 !== 0) {
                    $paye = mt_rand(50, 100) * 1500;
                    DB::table('paiements')->insert([
                        'ecole_id' => $ecoleId, 'eleve_id' => $eleveId, 'montant_total' => 150000,
                        'montant_paye' => $paye, 'montant_restant' => 150000 - $paye,
                        'statut_global' => $paye >= 150000 ? 'PAID' : 'PARTIAL',
                        'montant' => $paye, 'mode_paiement' => 'Mobile Money',
                        'date_paiement' => $now->copy()->subDays(mt_rand(1, 90)),
                        'created_at' => $now, 'updated_at' => $now,
                    ]);
                    $totals['paiements']++;
                }
            }
        }

        foreach (array_chunk($notes, 500) as $chunk) {
            DB::table('notes')->insert($chunk);
        }
        $totals['notes'] += count($notes);
    }

    private function token(int $userId, string $role, int $school, int $ecoleId): array
    {
        return [
            'role' => $role,
            'school' => $school,
            'ecole_id' => $ecoleId,
            'user_id' => $userId,
            'token' => User::findOrFail($userId)->createToken('loadtest')->plainTextToken,
        ];
    }
}
