<?php

namespace App\Services;

use App\Models\{Eleve, User, Classes, Series};
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportService
{
    /**
     * Importation massive d'élèves depuis un fichier Excel/CSV
     * Colonnes: Nom, Prenom, Matricule, Classe, Serie
     */
    public function importEleves(string $filePath, int $ecoleId)
    {
        $spreadsheet = IOFactory::load($filePath);
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();

        $stats = ['success' => 0, 'errors' => 0, 'messages' => []];

        // On saute l'entête
        foreach (array_slice($rows, 1) as $index => $row) {
            if (empty($row[0])) continue; // Skip empty rows

            try {
                DB::transaction(function () use ($row, $ecoleId, &$stats) {
                    $nom = $row[0];
                    $prenom = $row[1];
                    $matricule = $row[2];
                    $classeNom = $row[3];
                    $serieNom = $row[4] ?? null;

                    // 1. Trouver ou créer la classe
                    $classe = Classes::firstOrCreate(['nom_classe' => $classeNom, 'ecole_id' => $ecoleId]);
                    
                    // 2. Trouver la série si spécifiée
                    $serieId = null;
                    if ($serieNom) {
                        $serie = Series::where('nom_serie', $serieNom)->first();
                        $serieId = $serie ? $serie->id : null;
                    }

                    // 3. Créer l'utilisateur (Compte d'accès)
                    $user = User::create([
                        'name' => $nom,
                        'prenom' => $prenom,
                        'identifiant' => $matricule,
                        'password' => Hash::make(Str::random(12)), // Mot de passe aléatoire généré
                        'role' => 'eleve',
                        'ecole_id' => $ecoleId
                    ]);

                    // 4. Créer le profil élève
                    Eleve::create([
                        'user_id' => $user->id,
                        'numero_matricule' => $matricule,
                        'class_id' => $classe->id,
                        'serie_id' => $serieId,
                        'statut_eleve' => 'actif'
                    ]);

                    $stats['success']++;
                });
            } catch (\Exception $e) {
                $stats['errors']++;
                $stats['messages'][] = "Ligne " . ($index + 2) . ": " . $e->getMessage();
            }
        }

        return $stats;
    }
}
