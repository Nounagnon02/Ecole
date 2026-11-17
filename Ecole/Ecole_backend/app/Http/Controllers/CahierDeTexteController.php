<?php

namespace App\Http\Controllers;

use App\Models\CahierDeTexte;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CahierDeTexteController extends Controller
{
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

        return response()->json($query->latest('date')->paginate(50));
    }

    public function store(Request $request)
    {
        $this->authorize('create', CahierDeTexte::class);

        $validated = $request->validate([
            'classe_id' => 'required|school_exists:classes,id',
            'matiere_id' => 'required|school_exists:matieres,id',
            'date' => 'required|date',
            'titre_lecon' => 'required|string|max:255',
            'contenu' => 'required|string',
            'devoirs_donnes' => 'nullable|string',
            // `school_exists`, pas `exists` : un directeur pouvait jusqu'ici
            // attribuer la leçon à l'enseignant de n'importe quel
            // établissement — l'entrée héritait de l'école du directeur
            // (BelongsToEcole) mais pointait vers un enseignant d'une autre
            // école, un identifiant non vérifié n'ayant jamais été validé.
            'enseignant_id' => 'nullable|school_exists:enseignants,id',
        ]);

        $user = Auth::user();
        $enseignantId = $user->role === 'enseignant'
            ? $user->enseignant->id
            : ($validated['enseignant_id'] ?? null);

        if (!$enseignantId) {
            return response()->json(['message' => 'L\'enseignant est requis'], 422);
        }

        try {
            $entry = CahierDeTexte::create(array_merge($validated, [
                'enseignant_id' => $enseignantId
            ]));

            return response()->json($entry->load(['classe', 'matiere', 'enseignant.user']), 201);
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $this->clientErrorMessage($e)], 500);
        }
    }

    public function getByClasse($classeId)
    {
        $entries = CahierDeTexte::where('classe_id', $classeId)
            ->with(['matiere', 'enseignant.user'])
            ->orderBy('date', 'desc')
            ->get();

        return response()->json($entries);
    }
}
