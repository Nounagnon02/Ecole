<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class FixParentLinksSeeder extends Seeder
{
    public function run()
    {
        $ecoleId = DB::table('ecoles')->first()->id;

        $parents = DB::table('users')
            ->where('role', 'parent')
            ->where('ecole_id', $ecoleId)
            ->get();

        $parentUserIds = $parents->pluck('id')->toArray();
        $parentRows = DB::table('parents')
            ->where('ecole_id', $ecoleId)
            ->get();
        $parentIds = $parentRows->pluck('id')->toArray();

        $existingEleves = DB::table('eleves')->where('ecole_id', $ecoleId)->pluck('id')->toArray();
        $existingLinks = DB::table('eleves_parents')
            ->where('ecole_id', $ecoleId)
            ->get()
            ->groupBy('parent_id')
            ->map(fn($g) => $g->pluck('eleve_id')->toArray())
            ->toArray();

        $linksCount = 0;
        $newStudents = 0;
        $newPayments = 0;

        $names = [
            ['ADJOUKE','Afam','M'], ['AGBODJAN','Amina','F'], ['AHOUANSOU','Brice','M'],
            ['AKPOVI','Chantal','F'], ['BOKO','Didier','M'], ['CHABI','Estelle','F'],
            ['DEGBEGNI','Fabrice','M'], ['EGBETOKO','Gisèle','F'], ['FIGNON','Hugues','M'],
            ['GBAGUIDI','Inès','F'], ['HESSOU','Jean','M'], ['HOUNKPATIN','Karen','F'],
            ['HOUNDJO','Léonard','M'], ['HOUNGBO','Maëva','F'], ['IDOHOU','Norbert','M'],
            ['JOHNSON','Olivia','F'], ['KINTO','Pascal','M'], ['LOKO','Quintin','M'],
            ['MESSAN','Rachel','F'], ['NONVIGNON','Séverin','M'], ['OGOUDJOFOU','Tatiana','F'],
            ['PADONOU','Ulysse','M'], ['QUENUM','Viviane','F'], ['SAGBO','Wilfried','M'],
            ['TOSSA','Xavière','F'], ['VICTOIRE','Yann','M'], ['YEHOUESSI','Zéphirin','M'],
            ['BIAOU','Aïcha','F'], ['CODJO','Bernard','M'], ['DJOKO','Cécile','F'],
            ['KOUASSI','Aristide','M'], ['HOUNON','Bianca','F'], ['TOSSOU','Cédric','M'],
            ['DANSOU','Diana','F'], ['GBEDJESSI','Emmanuel','M'], ['SINON','Flore','F'],
            ['HOUDEHOUE','Gaël','M'], ['ADAMOU','Hélène','F'], ['AHOMADONGBE','Irvin','M'],
            ['AGUEMON','Joséphine','F'], ['DOSSOU-YOVO','Kevin','M'], ['GANHO','Lydie','F'],
            ['HOUESSINON','Marc','M'], ['KPODJEHO','Nathalie','F'], ['LAWANI','Olivier','M'],
            ['MISSINHOU','Priscilla','F'], ['NOUCHI','Renaud','M'], ['SOSSOU','Sandrine','F'],
            ['TOGNON','Thierry','M'], ['ZANOU','Valérie','F'],
            ['ADJANOHOUN','Achille','M'], ['AGBAGBA','Bénédicte','F'], ['AHINOU','Clément','M'],
            ['AMOUSSOU','Dorothée','F'], ['BAGUIDI','Émile','M'], ['CASSIN','Flora','F'],
            ['DEGNON','Gérard','M'], ['EDO','Honorine','F'], ['FOLIVI','Isidore','M'],
            ['GOHIN','Judith','F'], ['HOUNKANRIN','Kossi','M'], ['KOUAKOU','Laurence','F'],
            ['LAWAL','Marius','M'], ['MOÏNI','Nadia','F'], ['NOUWEGNON','Oscar','M'],
            ['PLACIDE','Patricia','F'], ['RICHARD','Quentin','M'], ['SAGNAN','Rita','F'],
            ['TCHASSON','Sylvain','M'], ['VIHOTOGLO','Thérèse','F'],
        ];

        $counter = DB::table('users')->where('role', 'eleve')->count() + 1000;

        foreach ($parentIds as $pIdx => $parentId) {
            $current = $existingLinks[$parentId] ?? [];
            $needed = 3 - count($current);
            if ($needed <= 0) continue;

            for ($n = 0; $n < $needed; $n++) {
                $nameIdx = ($pIdx * 3 + $n) % count($names);
                $nm = $names[$nameIdx];
                $counter++;
                $mat = 'EL' . str_pad($counter, 4, '0', STR_PAD_LEFT);

                $userId = DB::table('users')->insertGetId([
                    'name' => $nm[0], 'prenom' => $nm[1],
                    'identifiant' => $mat,
                    'password' => Hash::make('password'),
                    'role' => 'eleve', 'ecole_id' => $ecoleId,
                    'created_at' => now(), 'updated_at' => now(),
                ]);

                $classNames = DB::table('classes')->where('ecole_id', $ecoleId)->pluck('id')->toArray();
                $classeId = $classNames[array_rand($classNames)];

                $eleveId = DB::table('eleves')->insertGetId([
                    'ecole_id' => $ecoleId, 'user_id' => $userId,
                    'numero_matricule' => $mat, 'sexe' => $nm[2],
                    'classe_id' => $classeId,
                    'created_at' => now(), 'updated_at' => now(),
                ]);

                DB::table('eleves_parents')->insert([
                    'ecole_id' => $ecoleId,
                    'parent_id' => $parentId,
                    'eleve_id' => $eleveId,
                    'role' => $n % 2 === 0 ? 'père' : 'mère',
                    'is_primary' => true,
                    'created_at' => now(), 'updated_at' => now(),
                ]);

                $existingLinks[$parentId][] = $eleveId;
                $linksCount++;
                $newStudents++;

                $contribution = DB::table('contributions')
                    ->where('ecole_id', $ecoleId)
                    ->where('id_classe', $classeId)
                    ->first();
                $montantTotal = $contribution->montant ?? 150000;
                $paye = round($montantTotal * mt_rand(20, 100) / 100, -2);

                $statut = match(true) {
                    $paye >= $montantTotal => 'payee',
                    $paye > 0 => 'partiel',
                    default => 'en_attente',
                };

                DB::table('paiements')->insert([
                    'ecole_id' => $ecoleId,
                    'eleve_id' => $eleveId,
                    'contribution_id' => $contribution->id ?? null,
                    'montant_total' => $montantTotal,
                    'montant_paye' => $paye,
                    'montant_restant' => $montantTotal - $paye,
                    'statut_global' => $statut,
                    'montant' => $paye,
                    'mode_paiement' => ['Espèces', 'Mobile Money', 'Virement'][array_rand([0,1,2])],
                    'date_paiement' => now()->subDays(mt_rand(1, 60)),
                    'created_at' => now(), 'updated_at' => now(),
                ]);
                $newPayments++;
            }
        }

        echo "✓ {$newStudents} nouveaux élèves créés\n";
        echo "✓ {$linksCount} liens parent-enfant ajoutés\n";
        echo "✓ {$newPayments} paiements créés\n";

        $total = DB::table('eleves_parents')->where('ecole_id', $ecoleId)->count();
        $parentsLinked = DB::table('eleves_parents')
            ->where('ecole_id', $ecoleId)
            ->select('parent_id')
            ->groupBy('parent_id')
            ->havingRaw('COUNT(eleve_id) >= 3')
            ->count();
        echo "Total liens: {$total} | Parents avec ≥3 enfants: {$parentsLinked}/" . count($parentIds) . "\n";
    }
}
