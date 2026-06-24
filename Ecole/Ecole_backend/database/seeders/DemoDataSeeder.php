<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run()
    {
        $ecoleId = 1; // Complexe Scolaire Excellence

        echo "== Démographie complète pour l'école #{$ecoleId} ==\n";

        // ─── 1. Fix existing data: set ecole_id where null ────────────────
        DB::table('matieres')->whereNull('ecole_id')->update(['ecole_id' => $ecoleId]);
        DB::table('eleves')->whereNull('ecole_id')->update(['ecole_id' => $ecoleId]);

        // ─── 2. More subjects ────────────────────────────────────────────
        $newMatieres = [
            'Histoire-Géographie', 'Physique-Chimie', 'EPS',
            'Espagnol', 'Allemand', 'Philosophie', 'Musique',
            'Arts Plastiques', 'ECM', 'TIC',
        ];
        $matiereIds = DB::table('matieres')->pluck('id', 'nom')->toArray();
        foreach ($newMatieres as $nom) {
            if (!isset($matiereIds[$nom])) {
                $matiereIds[$nom] = DB::table('matieres')->insertGetId([
                    'ecole_id' => $ecoleId,
                    'nom' => $nom,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
        echo "✓ Matières: " . count($matiereIds) . " au total\n";

        // ─── 3. More classes ────────────────────────────────────────────
        $classDefs = [
            // [nom, catégorie, série_id]
            ['Petite Section', 'Maternelle', 1],
            ['Moyenne Section', 'Maternelle', 1],
            ['Grande Section', 'Maternelle', 1],
            ['CP', 'Primaire', 2],
            ['CE1', 'Primaire', 2],
            ['CE2', 'Primaire', 2],
            ['CM1', 'Primaire', 2],
            ['CM2', 'Primaire', 2],
            ['6ème', 'Secondaire', 3],
            ['5ème', 'Secondaire', 3],
            ['4ème', 'Secondaire', 3],
            // 3ème already exists (id=1)
            ['2nde A', 'Secondaire', 4],
            ['2nde C', 'Secondaire', 5],
            ['1ère A', 'Secondaire', 4],
            ['1ère C', 'Secondaire', 5],
            ['1ère D', 'Secondaire', 6],
            ['Tle A', 'Secondaire', 4],
            ['Tle C', 'Secondaire', 5],
            ['Tle D', 'Secondaire', 6],
        ];

        $existingClasses = DB::table('classes')->where('ecole_id', $ecoleId)->pluck('id', 'nom_classe')->toArray();
        $classIds = [];
        foreach ($classDefs as [$nom, $categorie, $serieId]) {
            if (isset($existingClasses[$nom])) {
                $classIds[$nom] = $existingClasses[$nom];
                continue;
            }
            $classIds[$nom] = DB::table('classes')->insertGetId([
                'ecole_id' => $ecoleId,
                'nom_classe' => $nom,
                'categorie_classe' => $categorie,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        echo '✓ Classes: ' . count($classIds) . " au total\n";

        // ─── 4. Classe-Matieres linking ────────────────────────────────
        $matiereIdList = array_values($matiereIds);
        $existingLinks = DB::table('classe_matieres')
            ->where('ecole_id', $ecoleId)
            ->pluck('matiere_id', 'classe_id')
            ->toArray();

        foreach ($classIds as $nom => $classeId) {
            $categorie = $this->categorieForClass($nom);
            $linked = 0;
            foreach ($matiereIdList as $mId) {
                $key = "{$classeId}_{$mId}";
                if (isset($existingLinks[$key])) continue;

                $skip = $this->shouldSkipMatiere($nom, $mId, $matiereIds);
                if ($skip) continue;

                DB::table('classe_matieres')->insert([
                    'ecole_id' => $ecoleId,
                    'classe_id' => $classeId,
                    'matiere_id' => $mId,
                    'coefficient' => $this->coefficientFor($nom, $mId, $matiereIds),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $linked++;
            }
        }
        echo "✓ Liens classe-matière créés\n";

        // ─── 5. Teachers ──────────────────────────────────────────────
        $teachers = [
            ['name' => 'KOUASSI Yao', 'prenom' => 'Yao', 'email' => 'yao.kouassi@ecole.bj', 'specialite' => 'Mathématiques', 'sexe' => 'M'],
            ['name' => 'ADJAHOUN', 'prenom' => 'Marcelle', 'email' => 'marcelle.adjahoun@ecole.bj', 'specialite' => 'Français', 'sexe' => 'F'],
            ['name' => 'HOUNKPATIN', 'prenom' => 'Sylvain', 'email' => 'sylvain.hounkpatin@ecole.bj', 'specialite' => 'Anglais', 'sexe' => 'M'],
            ['name' => 'GNANOU', 'prenom' => 'Jacqueline', 'email' => 'jacqueline.gnanou@ecole.bj', 'specialite' => 'SVT', 'sexe' => 'F'],
            ['name' => 'ZINSOU', 'prenom' => 'Gilles', 'email' => 'gilles.zinsou@ecole.bj', 'specialite' => 'Physique-Chimie', 'sexe' => 'M'],
            ['name' => 'DAOUDA', 'prenom' => 'Fatouma', 'email' => 'fatouma.daouda@ecole.bj', 'specialite' => 'Histoire-Géographie', 'sexe' => 'F'],
            ['name' => 'ACLOMBESSI', 'prenom' => 'Émile', 'email' => 'emile.aclombessi@ecole.bj', 'specialite' => 'EPS', 'sexe' => 'M'],
            ['name' => 'TOVOKOU', 'prenom' => 'Bénédicte', 'email' => 'benedicte.tovokou@ecole.bj', 'specialite' => 'Philosophie', 'sexe' => 'F'],
            ['name' => 'GBAGUIDI', 'prenom' => 'Alain', 'email' => 'alain.gbaguidi@ecole.bj', 'specialite' => 'Espagnol', 'sexe' => 'M'],
            ['name' => 'HOUESSINON', 'prenom' => 'Raïssa', 'email' => 'raissa.houessinon@ecole.bj', 'specialite' => 'TIC', 'sexe' => 'F'],
        ];

        $existingTeacherEmails = DB::table('users')
            ->where('role', 'enseignant')
            ->where('ecole_id', $ecoleId)
            ->pluck('email')
            ->toArray();

        $enseignantIds = [];
        foreach ($teachers as $t) {
            if (in_array($t['email'], $existingTeacherEmails)) continue;

            $userId = DB::table('users')->insertGetId([
                'name' => $t['name'],
                'prenom' => $t['prenom'],
                'email' => $t['email'],
                'password' => Hash::make('password'),
                'role' => 'enseignant',
                'ecole_id' => $ecoleId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $enseignantIds[] = DB::table('enseignants')->insertGetId([
                'ecole_id' => $ecoleId,
                'user_id' => $userId,
                'specialite' => $t['specialite'],
                'sexe' => $t['sexe'],
                'grade' => 'Licence',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        $ensCount = DB::table('enseignants')->where('ecole_id', $ecoleId)->count();
        echo "✓ Enseignants: {$ensCount}\n";

        // ─── 6. More students (30+) ────────────────────────────────────
        $studentNames = [
            ['name' => 'ADJOVI', 'prenom' => 'Koffi', 'mat' => 'SCO2025001', 'sexe' => 'M'],
            ['name' => 'AHOUANSOU', 'prenom' => 'Mirabelle', 'mat' => 'SCO2025002', 'sexe' => 'F'],
            ['name' => 'AKPOVI', 'prenom' => 'Joël', 'mat' => 'SCO2025003', 'sexe' => 'M'],
            ['name' => 'BOKO', 'prenom' => 'Urbain', 'mat' => 'SCO2025004', 'sexe' => 'M'],
            ['name' => 'CHABI', 'prenom' => 'Ornella', 'mat' => 'SCO2025005', 'sexe' => 'F'],
            ['name' => 'DEGBEGNI', 'prenom' => 'Ruth', 'mat' => 'SCO2025006', 'sexe' => 'F'],
            ['name' => 'EGBETOKO', 'prenom' => 'Sylvère', 'mat' => 'SCO2025007', 'sexe' => 'M'],
            ['name' => 'FIGNON', 'prenom' => 'Bérenger', 'mat' => 'SCO2025008', 'sexe' => 'M'],
            ['name' => 'GBAGUIDI', 'prenom' => 'Carmelle', 'mat' => 'SCO2025009', 'sexe' => 'F'],
            ['name' => 'HESSOU', 'prenom' => 'Fernand', 'mat' => 'SCO2025010', 'sexe' => 'M'],
            ['name' => 'HOUNKPATIN', 'prenom' => 'Déborah', 'mat' => 'SCO2025011', 'sexe' => 'F'],
            ['name' => 'HOUNDJO', 'prenom' => 'Eliakim', 'mat' => 'SCO2025012', 'sexe' => 'M'],
            ['name' => 'HOUNGBO', 'prenom' => 'Grâce', 'mat' => 'SCO2025013', 'sexe' => 'F'],
            ['name' => 'IDOHOU', 'prenom' => 'Gilles', 'mat' => 'SCO2025014', 'sexe' => 'M'],
            ['name' => 'JOHNSON', 'prenom' => 'Hortense', 'mat' => 'SCO2025015', 'sexe' => 'F'],
            ['name' => 'KINTO', 'prenom' => 'Ismaël', 'mat' => 'SCO2025016', 'sexe' => 'M'],
            ['name' => 'LOKO', 'prenom' => 'Jospin', 'mat' => 'SCO2025017', 'sexe' => 'M'],
            ['name' => 'MESSAN', 'prenom' => 'Keren', 'mat' => 'SCO2025018', 'sexe' => 'F'],
            ['name' => 'NONVIGNON', 'prenom' => 'Léonard', 'mat' => 'SCO2025019', 'sexe' => 'M'],
            ['name' => 'OGOUDJOFOU', 'prenom' => 'Marthe', 'mat' => 'SCO2025020', 'sexe' => 'F'],
            ['name' => 'PADONOU', 'prenom' => 'Nazaire', 'mat' => 'SCO2025021', 'sexe' => 'M'],
            ['name' => 'QUENUM', 'prenom' => 'Odile', 'mat' => 'SCO2025022', 'sexe' => 'F'],
            ['name' => 'SAGBO', 'prenom' => 'Pascal', 'mat' => 'SCO2025023', 'sexe' => 'M'],
            ['name' => 'TOSSA', 'prenom' => 'Reine', 'mat' => 'SCO2025024', 'sexe' => 'F'],
            ['name' => 'VICTOIRE', 'prenom' => 'Sébastien', 'mat' => 'SCO2025025', 'sexe' => 'M'],
            ['name' => 'YEHOUESSI', 'prenom' => 'Thérèse', 'mat' => 'SCO2025026', 'sexe' => 'F'],
            ['name' => 'ZANNOU', 'prenom' => 'Ulrich', 'mat' => 'SCO2025027', 'sexe' => 'M'],
            ['name' => 'BIAOU', 'prenom' => 'Viviane', 'mat' => 'SCO2025028', 'sexe' => 'F'],
            ['name' => 'CODJO', 'prenom' => 'Wilfried', 'mat' => 'SCO2025029', 'sexe' => 'M'],
            ['name' => 'DJOKO', 'prenom' => 'Yvette', 'mat' => 'SCO2025030', 'sexe' => 'F'],
        ];

        $classNames = array_keys($classIds);
        $existingEleveMatricules = DB::table('eleves')
            ->where('ecole_id', $ecoleId)
            ->pluck('numero_matricule')
            ->toArray();

        $newEleveIds = [];
        foreach ($studentNames as $i => $e) {
            if (in_array($e['mat'], $existingEleveMatricules)) continue;

            // Assign to class round-robin among Secondaire classes
            $classIdx = $i % count($classNames);
            $targetClass = $classNames[$classIdx];

            $userId = DB::table('users')->insertGetId([
                'name' => $e['name'],
                'prenom' => $e['prenom'],
                'identifiant' => 'EL' . str_pad($i + 100, 4, '0', STR_PAD_LEFT),
                'password' => Hash::make('password'),
                'role' => 'eleve',
                'ecole_id' => $ecoleId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $newEleveIds[] = DB::table('eleves')->insertGetId([
                'ecole_id' => $ecoleId,
                'user_id' => $userId,
                'numero_matricule' => $e['mat'],
                'sexe' => $e['sexe'],
                'class_id' => $classIds[$targetClass],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        $eleveCount = DB::table('eleves')->where('ecole_id', $ecoleId)->count();
        echo "✓ Élèves: {$eleveCount}\n";

        // ─── 7. Parents for new students ─────────────────────────────────
        $parentNames = [
            ['nom' => 'ADJOVI', 'prenom' => 'Basile', 'email' => 'basile.adjovi@parent.bj'],
            ['nom' => 'AHOUANSOU', 'prenom' => 'Clémence', 'email' => 'clemence.ahouansou@parent.bj'],
            ['nom' => 'AKPOVI', 'prenom' => 'Dieudonné', 'email' => 'dieudonne.akpovi@parent.bj'],
            ['nom' => 'BOKO', 'prenom' => 'Eugénie', 'email' => 'eugenie.boko@parent.bj'],
            ['nom' => 'CHABI', 'prenom' => 'Félicien', 'email' => 'felicien.chabi@parent.bj'],
            ['nom' => 'DEGBEGNI', 'prenom' => 'Germaine', 'email' => 'germaine.degbegni@parent.bj'],
            ['nom' => 'EGBETOKO', 'prenom' => 'Honoré', 'email' => 'honore.egbetoko@parent.bj'],
            ['nom' => 'FIGNON', 'prenom' => 'Irène', 'email' => 'irene.fignon@parent.bj'],
            ['nom' => 'GBAGUIDI', 'prenom' => 'Justin', 'email' => 'justin.gbaguidi@parent.bj'],
            ['nom' => 'HESSOU', 'prenom' => 'Katherine', 'email' => 'katherine.hessou@parent.bj'],
            ['nom' => 'HOUNKPATIN', 'prenom' => 'Libère', 'email' => 'libere.hounkpatin@parent.bj'],
            ['nom' => 'HOUNDJO', 'prenom' => 'Monique', 'email' => 'monique.houndjo@parent.bj'],
            ['nom' => 'HOUNGBO', 'prenom' => 'Nestor', 'email' => 'nestor.houngbo@parent.bj'],
            ['nom' => 'IDOHOU', 'prenom' => 'Odette', 'email' => 'odette.idohou@parent.bj'],
            ['nom' => 'JOHNSON', 'prenom' => 'Patrice', 'email' => 'patrice.johnson@parent.bj'],
            ['nom' => 'KINTO', 'prenom' => 'Reine', 'email' => 'reine.kinto@parent.bj'],
            ['nom' => 'LOKO', 'prenom' => 'Sylvain', 'email' => 'sylvain.loko@parent.bj'],
            ['nom' => 'MESSAN', 'prenom' => 'Thérèse', 'email' => 'therese.messan@parent.bj'],
            ['nom' => 'NONVIGNON', 'prenom' => 'Urbain', 'email' => 'urbain.nonvignon@parent.bj'],
            ['nom' => 'OGOUDJOFOU', 'prenom' => 'Victoire', 'email' => 'victoire.ogoudjofou@parent.bj'],
            ['nom' => 'PADONOU', 'prenom' => 'Willy', 'email' => 'willy.padonou@parent.bj'],
            ['nom' => 'QUENUM', 'prenom' => 'Xavière', 'email' => 'xaviere.quenum@parent.bj'],
            ['nom' => 'SAGBO', 'prenom' => 'Yannick', 'email' => 'yannick.sagbo@parent.bj'],
            ['nom' => 'TOSSA', 'prenom' => 'Zélie', 'email' => 'zelie.tossa@parent.bj'],
            ['nom' => 'VICTOIRE', 'prenom' => 'Armand', 'email' => 'armand.victoire@parent.bj'],
            ['nom' => 'YEHOUESSI', 'prenom' => 'Béatrice', 'email' => 'beatrice.yehouessi@parent.bj'],
            ['nom' => 'ZANNOU', 'prenom' => 'Constant', 'email' => 'constant.zannou@parent.bj'],
            ['nom' => 'BIAOU', 'prenom' => 'Dorothée', 'email' => 'dorothee.biaou@parent.bj'],
            ['nom' => 'CODJO', 'prenom' => 'Étienne', 'email' => 'etienne.codjo@parent.bj'],
            ['nom' => 'DJOKO', 'prenom' => 'Françoise', 'email' => 'francoise.djoko@parent.bj'],
        ];

        $existingParentEmails = DB::table('users')
            ->where('role', 'parent')
            ->pluck('email')
            ->toArray();

        $newParentIds = [];
        foreach ($parentNames as $i => $p) {
            if (in_array($p['email'], $existingParentEmails)) {
                $userId = DB::table('users')->where('email', $p['email'])->value('id');
                $parentId = DB::table('parents')->where('user_id', $userId)->value('id');
                if ($parentId) {
                    $newParentIds[$i] = $parentId;
                }
                continue;
            }

            $userId = DB::table('users')->insertGetId([
                'name' => $p['nom'],
                'prenom' => $p['prenom'],
                'email' => $p['email'],
                'telephone' => '+22997' . str_pad(mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT),
                'password' => Hash::make('password'),
                'role' => 'parent',
                'ecole_id' => $ecoleId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $newParentIds[$i] = DB::table('parents')->insertGetId([
                'ecole_id' => $ecoleId,
                'user_id' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // ─── 8. Link parents to students ─────────────────────────────
        $existingLinks = DB::table('eleves_parents')
            ->where('ecole_id', $ecoleId)
            ->pluck('parent_id', 'eleve_id')
            ->toArray();

        foreach ($newEleveIds as $i => $eleveId) {
            if (isset($existingLinks[$eleveId])) continue;
            if (!isset($newParentIds[$i])) continue;

            DB::table('eleves_parents')->insert([
                'ecole_id' => $ecoleId,
                'parent_id' => $newParentIds[$i],
                'eleve_id' => $eleveId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        echo "✓ Parents liés aux élèves\n";

        // ─── 9. Notes for all students ────────────────────────────────
        $allEleves = DB::table('eleves')
            ->where('ecole_id', $ecoleId)
            ->get(['id', 'class_id']);

        $periodes = ['Semestre 1', 'Semestre 2'];
        $evalTypes = ['Devoir1', 'Devoir2', 'Interrogation', '1ère evaluation', '2ème evaluation'];

        // No existing notes to check on fresh seed

        $noteCount = 0;
        $batchNotes = [];
        $now = now();

        // Up to 3 notes per student per subject, spread across periods
        foreach ($allEleves as $eleve) {
            $classeMatieres = DB::table('classe_matieres')
                ->where('ecole_id', $ecoleId)
                ->where('classe_id', $eleve->class_id)
                ->get();

            foreach ($classeMatieres as $cm) {
                $noteCountForStudent = mt_rand(1, 3);
                $usedPeriodeTypes = [];

                for ($k = 0; $k < $noteCountForStudent; $k++) {
                    $periode = $periodes[array_rand($periodes)];
                    $type = $evalTypes[array_rand($evalTypes)];
                    $key = $periode . '|' . $type;

                    if (in_array($key, $usedPeriodeTypes)) continue;
                    $usedPeriodeTypes[] = $key;

                    $note = round(mt_rand(50, 195) / 10, 1); // 5.0 – 19.5
                    $noteSur = 20;
                    $observation = $note >= 16 ? 'Très bien' : ($note >= 13 ? 'Bien' : ($note >= 10 ? 'Assez bien' : ($note >= 8 ? 'Insuffisant' : 'Faible')));

                    $batchNotes[] = [
                        'ecole_id' => $ecoleId,
                        'eleve_id' => $eleve->id,
                        'classe_id' => $eleve->class_id,
                        'matiere_id' => $cm->matiere_id,
                        'note' => $note,
                        'note_sur' => $noteSur,
                        'type_evaluation' => $type,
                        'date_evaluation' => $now,
                        'periode' => $periode,
                        'observation' => $observation,
                        'created_by' => 1,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                    $noteCount++;
                }
            }
        }

        // Insert in chunks of 100
        foreach (array_chunk($batchNotes, 100) as $chunk) {
            DB::table('notes')->insert($chunk);
        }
        echo "✓ Notes: {$noteCount} créées\n";

        // ─── 10. Contributions (fee structure) ─────────────────────────
        // series: 1=Maternelle, 2=Primaire, 3=Collège, 4=Série A, 5=Série C, 6=Série D
        $contributions = [
            ['montant' => 150000, 'id_classe' => $classIds['6ème'] ?? 0, 'serie_id' => 3],
            ['montant' => 150000, 'id_classe' => $classIds['5ème'] ?? 0, 'serie_id' => 3],
            ['montant' => 150000, 'id_classe' => $classIds['4ème'] ?? 0, 'serie_id' => 3],
            ['montant' => 175000, 'id_classe' => $classIds['3ème'] ?? 0, 'serie_id' => 3],
            ['montant' => 200000, 'id_classe' => $classIds['2nde A'] ?? 0, 'serie_id' => 4],
            ['montant' => 220000, 'id_classe' => $classIds['2nde C'] ?? 0, 'serie_id' => 5],
            ['montant' => 200000, 'id_classe' => $classIds['1ère A'] ?? 0, 'serie_id' => 4],
            ['montant' => 230000, 'id_classe' => $classIds['1ère C'] ?? 0, 'serie_id' => 5],
            ['montant' => 230000, 'id_classe' => $classIds['1ère D'] ?? 0, 'serie_id' => 6],
            ['montant' => 210000, 'id_classe' => $classIds['Tle A'] ?? 0, 'serie_id' => 4],
            ['montant' => 250000, 'id_classe' => $classIds['Tle C'] ?? 0, 'serie_id' => 5],
            ['montant' => 250000, 'id_classe' => $classIds['Tle D'] ?? 0, 'serie_id' => 6],
        ];

        foreach ($contributions as $c) {
            if (!$c['id_classe']) continue;
            $existing = DB::table('contributions')
                ->where('ecole_id', $ecoleId)
                ->where('id_classe', $c['id_classe'])
                ->exists();
            if (!$existing) {
                DB::table('contributions')->insert([
                    'ecole_id' => $ecoleId,
                    'montant' => $c['montant'],
                    'date_fin_premiere_tranche' => now()->addMonths(3),
                    'montant_premiere_tranche' => round($c['montant'] * 0.5),
                    'date_fin_deuxieme_tranche' => now()->addMonths(6),
                    'montant_deuxieme_tranche' => round($c['montant'] * 0.3),
                    'date_fin_troisieme_tranche' => now()->addMonths(9),
                    'montant_troisieme_tranche' => round($c['montant'] * 0.2),
                    'id_classe' => $c['id_classe'],
                    'id_serie' => $c['serie_id'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
        echo "✓ Contributions (frais) créées\n";

        // ─── 11. Payments for some students ───────────────────────────
        $modes = ['Espèces', 'Mobile Money', 'Virement'];
        $existingPaiements = DB::table('paiements')
            ->where('ecole_id', $ecoleId)
            ->pluck('eleve_id')
            ->toArray();

        $paiementCount = 0;
        foreach ($allEleves as $eleve) {
            if (in_array($eleve->id, $existingPaiements)) continue;
            if (mt_rand(0, 2) === 0) continue; // 1/3 skip

            $contribution = DB::table('contributions')
                ->where('ecole_id', $ecoleId)
                ->where('id_classe', $eleve->class_id)
                ->first();

            $montant = $contribution ? $contribution->montant : 150000;
            $paye = round($montant * mt_rand(50, 100) / 100, -2); // 50-100%

            DB::table('paiements')->insert([
                'ecole_id' => $ecoleId,
                'eleve_id' => $eleve->id,
                'contribution_id' => $contribution->id ?? null,
                'montant_total' => $montant,
                'montant_paye' => $paye,
                'montant_restant' => $montant - $paye,
                'statut_global' => $paye >= $montant ? 'payé' : ($paye > 0 ? 'partiel' : 'impayé'),
                'montant' => $paye,
                'mode_paiement' => $modes[array_rand($modes)],
                'date_paiement' => now()->subDays(mt_rand(1, 90)),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $paiementCount++;
        }
        echo "✓ Paiements: {$paiementCount} effectués\n";

        echo "\n✅ Base de données peuplée avec succès!\n";
    }

    private function categorieForClass($nom)
    {
        if (in_array($nom, ['Petite Section', 'Moyenne Section', 'Grande Section'])) return 'Maternelle';
        if (in_array($nom, ['CP', 'CE1', 'CE2', 'CM1', 'CM2'])) return 'Primaire';
        return 'Secondaire';
    }

    private function shouldSkipMatiere($className, $matiereId, $matiereIds)
    {
        $maternelleClasses = ['Petite Section', 'Moyenne Section', 'Grande Section'];
        $primaireClasses = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'];
        $advancedSubjects = ['Philosophie', 'Physique-Chimie', 'Espagnol', 'Allemand'];

        $matiereNom = array_search($matiereId, $matiereIds);
        if (!$matiereNom) return false;

        // Maternelle: only basic subjects
        if (in_array($className, $maternelleClasses)) {
            return !in_array($matiereNom, ['Français', 'Mathématiques', 'EPS', 'Musique', 'Arts Plastiques']);
        }

        // Primaire: no philosophy, physics
        if (in_array($className, $primaireClasses)) {
            return in_array($matiereNom, ['Philosophie', 'Physique-Chimie', 'Espagnol', 'Allemand']);
        }

        return false;
    }

    private function coefficientFor($className, $matiereId, $matiereIds)
    {
        $matiereNom = array_search($matiereId, $matiereIds);
        if (!$matiereNom) return 1;

        $prio = ['Mathématiques' => 5, 'Français' => 4, 'Physique-Chimie' => 3, 'SVT' => 2];
        return $prio[$matiereNom] ?? 1;
    }
}
