<?php

namespace App\Http\Controllers;

use App\Models\CahierDeTexte;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CahierDeTexteController extends Controller
{
    /**
     * Liste des leçons pour l'école (Admin) ou l'enseignant connecté
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = CahierDeTexte::with(['classe', 'matiere', 'enseignant.user']);

        if ($user->role === 'enseignant') {
            $query->where('enseignant_id', $user->enseignant->id);
        }

        if ($request->has('classe_id')) {
            $query->where('classe_id', $request->classe_id);
        }

        return response()->json($query->latest('date')->get());
    }

    /**
     * Saisir une nouvelle leçon
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 'enseignant' && $user->role !== 'directeur') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'matiere_id' => 'required|exists:matieres,id',
            'date' => 'required|date',
            'titre_lecon' => 'required|string|max:255',
            'contenu' => 'required|string',
            'devoirs_donnes' => 'nullable|string',
        ]);

        $enseignantId = $user->role === 'enseignant' 
            ? $user->enseignant->id 
            : $request->input('enseignant_id');

        if (!$enseignantId) {
            return response()->json(['message' => 'L\'enseignant est requis'], 422);
        }

        $entry = CahierDeTexte::create(array_merge($validated, [
            'enseignant_id' => $enseignantId
        ]));

        return response()->json($entry->load(['classe', 'matiere', 'enseignant.user']), 201);
    }

    /**
     * Voir les leçons d'une classe (pour les élèves/parents)
     */
    public function getByClasse($classeId)
    {
        $entries = CahierDeTexte::where('classe_id', $classeId)
            ->with(['matiere', 'enseignant.user'])
            ->orderBy('date', 'desc')
            ->get();

        return response()->json($entries);
    }
}
