<?php

namespace App\Http\Controllers;

use App\Models\Ecole;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EcoleController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Ecole::all()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'required|email|unique:ecoles',
            'telephone' => 'nullable|string',
            'adresse' => 'required|string',
            'slug' => 'nullable|unique:ecoles',
        ]);

        // Générer slug automatiquement si non fourni
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['nom']);
        }

        $ecole = Ecole::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'École créée avec succès',
            'data' => $ecole
        ], 201);
    }

    public function show(Ecole $ecole)
    {
        return response()->json([
            'success' => true,
            'data' => $ecole->load(['users', 'eleves', 'enseignants', 'classes'])
        ]);
    }

    public function update(Request $request, Ecole $ecole)
    {
        $validated = $request->validate([
            'nom' => 'string|max:255',
            'email' => 'email|unique:ecoles,email,' . $ecole->id,
            'telephone' => 'nullable|string',
            'adresse' => 'string',
            'slug' => 'nullable|unique:ecoles,slug,' . $ecole->id,
        ]);

        $ecole->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'École mise à jour avec succès',
            'data' => $ecole
        ]);
    }

    public function destroy(Ecole $ecole)
    {
        // Vérifier s'il y a des données liées
        $hasData = $ecole->eleves()->exists() || 
                   $ecole->enseignants()->exists() || 
                   $ecole->classes()->exists();

        if ($hasData) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer : des données sont liées à cette école'
            ], 422);
        }

        $ecole->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'École supprimée avec succès'
        ]);
    }

    // Statistiques d'une école
    public function stats(Ecole $ecole)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'nom' => $ecole->nom,
                'total_eleves' => $ecole->eleves()->count(),
                'total_enseignants' => $ecole->enseignants()->count(),
                'total_classes' => $ecole->classes()->count(),
                'total_parents' => $ecole->parents()->count(),
            ]
        ]);
    }
}
