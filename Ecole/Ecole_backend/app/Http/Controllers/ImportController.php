<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\BeninPhoneNumber;
use App\Services\Import\ComptesImport;
use App\Support\Roles;
use Illuminate\Http\Request;

class ImportController extends Controller
{
    /**
     * Inscription en masse : élèves, parents, enseignants et personnel dans un
     * seul fichier CSV. `simulation=1` contrôle le fichier sans rien créer.
     * POST /api/imports/comptes
     */
    public function importComptes(Request $request, ComptesImport $import)
    {
        $request->validate([
            'file' => 'required|file|max:1024|extensions:csv,txt',
            'simulation' => 'nullable|boolean',
            'creer_classes' => 'nullable|boolean',
        ]);

        // Un hachage de mot de passe par compte : laisser le temps d'un fichier plein.
        @set_time_limit(300);

        $resultat = $import->importer(
            (string) file_get_contents($request->file('file')->getRealPath()),
            $request->user(),
            $request->boolean('simulation'),
            $request->boolean('creer_classes'),
        );

        if ($resultat['success'] && ! $resultat['simulation']) {
            \Cache::forget('dashboard_directeur_'.($request->user()->ecole_id ?? 'global'));
        }

        // Un fichier lu puis refusé est un résultat, pas une erreur HTTP : le
        // client du web ne transmet pas le corps d'un 422 hors du champ
        // `errors`, et la liste des lignes à corriger se perdait.
        return response()->json($resultat);
    }

    /**
     * Comptes du personnel de l'école (enseignants, administration).
     * GET /api/personnel/comptes
     */
    public function comptesPersonnel(Request $request)
    {
        $roles = array_diff(Roles::provisionable(), ['eleve', 'parent', 'admin']);

        return response()->json([
            'success' => true,
            'data' => User::where('ecole_id', $request->user()->ecole_id)
                ->whereIn('role', $roles)
                ->orderBy('name')->orderBy('prenom')
                ->get(['id', 'name', 'prenom', 'role', 'identifiant', 'telephone', 'email', 'is_active', 'password_change_required'])
                ->map(fn ($compte) => $compte->only(['id', 'name', 'prenom', 'role', 'identifiant', 'telephone', 'email', 'is_active'])
                    + ['mot_de_passe_provisoire' => (bool) $compte->password_change_required]),
        ]);
    }

    /**
     * Créer directement le compte d'un membre du personnel, sans fichier.
     * POST /api/personnel/comptes
     */
    public function creerComptePersonnel(Request $request, ComptesImport $import)
    {
        $donnees = $request->validate([
            'role' => 'required|string|not_in:eleve,parent',
            'nom' => 'required|string|max:255',
            'prenom' => 'nullable|string|max:255',
            'telephone' => ['required', 'string', new BeninPhoneNumber],
            'email' => 'nullable|email',
        ]);

        $resultat = $import->creerCompte($donnees, $request->user());

        if ($resultat['erreur'] !== null) {
            return response()->json(['message' => $resultat['erreur'], 'errors' => ['compte' => [$resultat['erreur']]]], 422);
        }

        return response()->json(['success' => true, 'acces' => $resultat['acces']], 201);
    }
}
