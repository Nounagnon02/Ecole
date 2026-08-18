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
        ]);

        $user = Auth::user();
        $enseignantId = $user->role === 'enseignant' 
            ? $user->enseignant->id 
            : $request->input('enseignant_id');

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

    public function update(Request $request, $id)
    {
        $cahier = CahierDeTexte::find($id);
        if (!$cahier) {
            return response()->json(['message' => 'Leçon non trouvée'], 404);
        }
        $this->authorize('update', $cahier);

        $validated = $request->validate([
            'classe_id' => 'sometimes|school_exists:classes,id',
            'matiere_id' => 'sometimes|school_exists:matieres,id',
            'date' => 'sometimes|date',
            'titre_lecon' => 'sometimes|string|max:255',
            'contenu' => 'sometimes|string',
            'devoirs_donnes' => 'nullable|string',
        ]);

        try {
            $cahier->update($validated);
            return response()->json($cahier->load(['classe', 'matiere', 'enseignant.user']));
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json(['message' => 'Erreur lors de la mise à jour', 'error' => $this->clientErrorMessage($e)], 500);
        }
    }

    public function destroy($id)
    {
        $cahier = CahierDeTexte::find($id);
        if (!$cahier) {
            return response()->json(['message' => 'Leçon non trouvée'], 404);
        }
        $this->authorize('delete', $cahier);

        try {
            $cahier->delete();
            return response()->json(['message' => 'Leçon supprimée']);
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json(['message' => 'Erreur lors de la suppression', 'error' => $this->clientErrorMessage($e)], 500);
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
