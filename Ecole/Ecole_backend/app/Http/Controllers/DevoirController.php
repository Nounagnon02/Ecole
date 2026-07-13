<?php

namespace App\Http\Controllers;

use App\Models\Devoir;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DevoirController extends Controller
{
    /**
     * Liste des devoirs pour l'enseignant connecté.
     */
    public function indexEnseignant(Request $request)
    {
        $user = $request->user();

        $devoirs = Devoir::with(['classe', 'matiere', 'eleves'])
            ->where('enseignant_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $devoirs->items(),
            'meta' => [
                'total' => $devoirs->total(),
                'page' => $devoirs->currentPage(),
                'per_page' => $devoirs->perPage(),
            ],
        ]);
    }

    /**
     * Liste des devoirs pour l'élève connecté.
     */
    public function indexEleve(Request $request)
    {
        $user = $request->user();
        $eleve = $user->eleve;

        if (!$eleve) {
            return response()->json(['success' => false, 'message' => 'Profil élève introuvable'], 404);
        }

        $devoirs = Devoir::with(['classe', 'matiere', 'enseignant'])
            ->where('classe_id', $eleve->classe_id)
            ->where('publie', true)
            ->orderBy('date_limite', 'asc')
            ->get()
            ->map(function ($devoir) use ($user) {
                $pivot = $devoir->eleves()->where('eleve_id', $user->id)->first()?->pivot;
                $devoir->rendu = $pivot?->rendu ?? false;
                $devoir->note = $pivot?->note;
                $devoir->date_remise = $pivot?->date_remise;
                $devoir->reponse = $pivot?->reponse;
                unset($devoir->eleves);
                return $devoir;
            });

        return response()->json([
            'success' => true,
            'data' => $devoirs,
        ]);
    }

    /**
     * Créer un nouveau devoir (enseignant).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'classe_id' => 'required|exists:classes,id',
            'matiere_id' => 'nullable|exists:matieres,id',
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date_limite' => 'nullable|date',
            'type' => 'nullable|in:devoir,exercice,projet',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $devoir = Devoir::create([
            'enseignant_id' => $request->user()->id,
            'classe_id' => $request->classe_id,
            'matiere_id' => $request->matiere_id ?? $request->user()->enseignant?->matiere_id,
            'titre' => $request->titre,
            'description' => $request->description,
            'date_limite' => $request->date_limite,
            'type' => $request->type ?? 'devoir',
            'publie' => $request->boolean('publie', true),
            'ecole_id' => $request->user()->ecole_id,
        ]);

        // Associer automatiquement à tous les élèves de la classe
        if ($devoir->publie) {
            $eleves = User::whereHas('eleve', function ($q) use ($devoir) {
                $q->where('classe_id', $devoir->classe_id);
            })->pluck('id');

            $devoir->eleves()->syncWithoutDetaching($eleves);
        }

        return response()->json([
            'success' => true,
            'message' => 'Devoir créé avec succès',
            'data' => $devoir->load(['classe', 'matiere']),
        ], 201);
    }

    /**
     * Soumettre un devoir (élève).
     */
    public function soumettre(Request $request, $id)
    {
        $devoir = Devoir::findOrFail($id);

        if (!$devoir->publie) {
            return response()->json(['success' => false, 'message' => 'Ce devoir n\'est pas publié'], 403);
        }

        $validator = Validator::make($request->all(), [
            'reponse' => 'nullable|string',
            'fichier' => 'nullable|file|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $eleve = $request->user();

        $pivotData = [
            'rendu' => true,
            'date_remise' => now(),
            'reponse' => $request->reponse,
        ];

        if ($request->hasFile('fichier')) {
            $path = $request->file('fichier')->store('devoirs/' . $id, 'public');
            $pivotData['fichier'] = $path;
        }

        $devoir->eleves()->syncWithoutDetaching([$eleve->id => $pivotData]);

        return response()->json([
            'success' => true,
            'message' => 'Devoir soumis avec succès',
        ]);
    }

    /**
     * Noter un devoir (enseignant).
     */
    public function noter(Request $request, $id, $eleveId)
    {
        $devoir = Devoir::findOrFail($id);

        if ($devoir->enseignant_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'note' => 'required|numeric|min:0|max:20',
            'commentaire' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $devoir->eleves()->updateExistingPivot($eleveId, [
            'note' => $request->note,
            'commentaire' => $request->commentaire,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Note enregistrée',
        ]);
    }

    /**
     * Détail d'un devoir.
     */
    public function show($id)
    {
        $devoir = Devoir::with(['classe', 'matiere', 'enseignant', 'eleves' => function ($q) {
            $q->select('users.id', 'users.nom', 'users.prenom');
        }])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $devoir,
        ]);
    }

    /**
     * Supprimer un devoir (enseignant propriétaire).
     */
    public function destroy($id)
    {
        $devoir = Devoir::findOrFail($id);

        if ($devoir->enseignant_id !== request()->user()->id) {
            return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
        }

        $devoir->eleves()->detach();
        $devoir->delete();

        return response()->json([
            'success' => true,
            'message' => 'Devoir supprimé',
        ]);
    }
}
