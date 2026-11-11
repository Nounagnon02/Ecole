<?php

namespace App\Http\Controllers;

use App\Services\ImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImportController extends Controller
{
    protected $importService;

    public function __construct(ImportService $importService)
    {
        $this->importService = $importService;
    }

    /**
     * Importer des élèves en masse
     * POST /api/imports/eleves
     */
    public function importEleves(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv'
        ]);

        $file = $request->file('file');
        $ecoleId = Auth::user()->ecole_id;

        $results = $this->importService->importEleves($file->getRealPath(), $ecoleId);

        return response()->json([
            'message' => 'Importation terminée',
            'details' => $results
        ]);
    }

    /**
     * Inscription en masse : élèves, parents, enseignants et personnel dans un
     * seul fichier CSV. `simulation=1` contrôle le fichier sans rien créer.
     * POST /api/imports/comptes
     */
    public function importComptes(Request $request, \App\Services\Import\ComptesImport $import)
    {
        $request->validate([
            'file' => 'required|file|max:1024|extensions:csv,txt',
            'simulation' => 'nullable|boolean',
        ]);

        // Un hachage de mot de passe par compte : laisser le temps d'un fichier plein.
        @set_time_limit(300);

        $resultat = $import->importer(
            (string) file_get_contents($request->file('file')->getRealPath()),
            $request->user(),
            $request->boolean('simulation'),
        );

        if ($resultat['success'] && ! $resultat['simulation']) {
            \Cache::forget('dashboard_directeur_'.($request->user()->ecole_id ?? 'global'));
        }

        // Un fichier lu puis refusé est un résultat, pas une erreur HTTP : le
        // client du web ne transmet pas le corps d'un 422 hors du champ
        // `errors`, et la liste des lignes à corriger se perdait.
        return response()->json($resultat);
    }
}
