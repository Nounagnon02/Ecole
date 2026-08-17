<?php

namespace App\Http\Controllers\Notes;

use App\Http\Controllers\Controller;
use App\Models\Notes;
use App\Models\Eleve;
use App\Models\Classes;
use App\Support\AnneeScolaire;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class NotesCrudController extends Controller
{
    use NotesHelpers;

    /**
     * Liste des notes — filtre optionnel par élève
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Notes::class);

        $eleveId = $request->route('eleveId') ?? $request->query('eleve_id');

        if ($eleveId) {
            $eleve = Eleve::find($eleveId);
            if (!$eleve) {
                return response()->json(['success' => false, 'message' => 'Élève non trouvé'], 404);
            }
            $this->authorize('view', $eleve); // IDOR: vérifie l'accès à l'élève
        }

        $query = Notes::with(['eleve.user', 'matiere', 'classe']);

        if ($eleveId) {
            $query->where('eleve_id', $eleveId);
        }

        if ($request->filled('periode')) {
            $query->where('periode', $request->periode);
        }

        if ($request->filled('classe_id')) {
            $query->where('classe_id', $request->classe_id);
        }

        return response()->json([
            'success' => true,
            'data' => $query->latest('date_evaluation')->get(),
        ]);
    }

    public function getNotesByEleves($eleveId)
    {
        $eleve = Eleve::find($eleveId);
        if (!$eleve) {
            return response()->json(['success' => false, 'message' => 'Élève non trouvé'], 404);
        }
        $this->authorize('view', $eleve);

        $notes = Notes::with('eleve')
            ->where('eleve_id', $eleveId)
            ->get();

        return response()->json($notes);
    }

    public function getNotesBySession($sessionId)
    {
        $this->authorize('viewAny', Notes::class);

        $notes = Notes::with('eleve')
            ->where('sessions_id', $sessionId)
            ->get();

        return response()->json($notes);
    }

    public function show($id)
    {
        $note = Notes::with(['eleve', 'classe', 'matiere', 'enseignant'])->find($id);

        if (!$note) {
            return response()->json([
                'success' => false,
                'message' => 'Note non trouvée'
            ], 404);
        }

        $this->authorize('view', $note);

        return response()->json([
            'success' => true,
            'note' => $note
        ]);
    }


    public function store(Request $request)
        {
            $this->authorize('create', Notes::class);

            // Validation des données
            $validator = Validator::make($request->all(), [
                'eleve_id' => 'required|school_exists:eleves,id',
                'classe_id' => 'required|school_exists:classes,id',
                'matiere_id' => 'required|school_exists:matieres,id',
                'note' => 'required|numeric|min:0|max:20',
                'note_sur' => 'required|numeric|min:1|max:20',
                'type_evaluation' => 'required|in:Devoir1,Devoir2,Interrogation,1ère evaluation,2ème evaluation,3ème evaluation,4ème evaluation,5ème evaluation,6ème evaluation',
                'date_evaluation' => 'required|date',
                'periode' => 'required|in:Trimestre 1,Trimestre 2,Trimestre 3',
                'annee_scolaire' => 'nullable|string|regex:/^\d{4}-\d{4}$/',
                'observation' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            try {
                DB::beginTransaction();

                // Vérifier que l'élève appartient bien à la classe
                $eleve = Eleve::find($request->eleve_id);
                if ($eleve->classe_id != $request->classe_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'L\'élève n\'appartient pas à cette classe'
                    ], 400);
                }

                // Vérifier que la matière existe pour la série de l'élève
                $serieHasMatiere = $eleve->serie
                    ? $eleve->serie->matieres()->where('matiere_id', $request->matiere_id)->exists()
                    : true;
                
                if (!$serieHasMatiere) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cette matière n\'est pas disponible pour la série de cet élève'
                    ], 400);
                }

                // Validation spécifique selon le type d'évaluation
                $validationResult = $this->validateNoteByType($request);
                if (!$validationResult['success']) {
                    return response()->json($validationResult, 400);
                }

                // Créer la note
                $note = Notes::create([
                    'eleve_id' => $request->eleve_id,
                    'classe_id' => $request->classe_id,
                    'matiere_id' => $request->matiere_id,
                    'note' => $request->note,
                    'note_sur' => $request->note_sur,
                    'type_evaluation' => $request->type_evaluation,
                    'date_evaluation' => $request->date_evaluation,
                    'periode' => $request->periode,
                    'annee_scolaire' => $request->annee_scolaire ?? AnneeScolaire::courante(),
                    'observation' => $request->observation,
                    
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Note enregistrée avec succès',
                    'data' => $note->load(['eleve', 'matiere', 'classe'])
                ], 201);

            } catch (\Exception $e) {
                $this->rethrowIfMeaningful($e);
                DB::rollBack();
                
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'enregistrement de la note',
                    'error' => $this->clientErrorMessage($e)
                ], 500);
            }
        }

    /**
     * Mettre à jour une note existante
     */
    public function update(Request $request, $id)
    {
        // Vérifier que la note n'est pas verrouillée
        $note = Notes::find($id);
        if ($note && $note->locked) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de modifier une note verrouillée'
            ], 403);
        }

        // Validation des données
        $validator = Validator::make($request->all(), [
            'eleve_id' => 'required|school_exists:eleves,id',
            'classe_id' => 'required|school_exists:classes,id',
            'matiere_id' => 'required|school_exists:matieres,id',
            'note' => 'required|numeric|min:0|max:100',
            'note_sur' => 'required|numeric|min:1|max:100',
            'type_evaluation' => 'required|in:Devoir1,Devoir2,Interrogation',
            'date_evaluation' => 'required|date',
            'periode' => 'required|in:Trimestre 1,Trimestre 2,Trimestre 3',
            'observation' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Trouver la note à modifier
            $note = Notes::find($id);
            if (!$note) {
                return response()->json([
                    'success' => false,
                    'message' => 'Note non trouvée'
                ], 404);
            }

            $this->authorize('update', $note);

            // Vérifier que l'élève appartient bien à la classe
            $eleve = Eleve::find($request->eleve_id);
            if ($eleve->classe_id != $request->classe_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'L\'élève n\'appartient pas à cette classe'
                ], 400);
            }

            // Vérifier que la matière existe pour la série de l'élève
            $serieHasMatiere = $eleve->serie
                ? $eleve->serie->matieres()->where('matiere_id', $request->matiere_id)->exists()
                : true;

            if (!$serieHasMatiere) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette matière n\'est pas disponible pour la série de cet élève'
                ], 400);
            }

            // Validation spécifique selon le type d'évaluation (en excluant la note actuelle)
            $validationResult = $this->validateNoteByType($request, $id);
            if (!$validationResult['success']) {
                return response()->json($validationResult, 400);
            }

            // Mettre à jour la note
            $note->update([
                'eleve_id' => $request->eleve_id,
                'classe_id' => $request->classe_id,
                'matiere_id' => $request->matiere_id,
                'note' => $request->note,
                'note_sur' => $request->note_sur,
                'type_evaluation' => $request->type_evaluation,
                'date_evaluation' => $request->date_evaluation,
                'periode' => $request->periode,
                'annee_scolaire' => $request->annee_scolaire ?? $note->annee_scolaire ?? AnneeScolaire::courante(),
                'observation' => $request->observation
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Note mise à jour avec succès',
                'data' => $note->load(['eleve', 'matiere', 'classe'])
            ], 200);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la note',
                'error' => $this->clientErrorMessage($e)
            ], 500);
        }
    }

    /**
     * Supprimer une note
     */
    public function destroy($id)
    {
        try {
            $note = Notes::find($id);

            if (!$note) {
                return response()->json([
                    'success' => false,
                    'message' => 'Note non trouvée'
                ], 404);
            }

            $this->authorize('delete', $note);

            // Empêcher la suppression d'une note verrouillée
            if ($note->locked) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer une note verrouillée'
                ], 403);
            }

            $note->delete();

            return response()->json([
                'success' => true,
                'message' => 'Note supprimée avec succès'
            ], 200);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la note',
                'error' => $this->clientErrorMessage($e)
            ], 500);
        }
    }

    /**
     * Verrouiller une note (empêche modification)
     */
    public function lock($id)
    {
        try {
            $note = Notes::findOrFail($id);
            $this->authorize('update', $note);

            $note->update(['locked' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Note verrouillée'
            ]);
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json([
                'success' => false,
                'message' => $this->clientErrorMessage($e, 'Erreur')
            ], 500);
        }
    }

    /**
     * Déverrouiller une note
     */
    public function unlock($id)
    {
        try {
            $note = Notes::findOrFail($id);
            $this->authorize('update', $note);

            $note->update(['locked' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Note déverrouillée'
            ]);
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json([
                'success' => false,
                'message' => $this->clientErrorMessage($e, 'Erreur')
            ], 500);
        }
    }

    /**
     * Saisie groupée : enregistre les notes de toute une classe en un appel.
     *
     * POST /notes/bulk
     * Body : { "classe_id": 3, "matiere_id": 5, "type_evaluation": "Devoir1",
     *          "date_evaluation": "2026-01-15", "periode": "Trimestre 1",
     *          "notes": [{ "eleve_id": 10, "note": 14, "observation": null }, ...] }
     */
    public function bulkStore(Request $request)
    {
        $this->authorize('create', Notes::class);

        $validator = Validator::make($request->all(), [
            'classe_id' => 'required|school_exists:classes,id',
            'matiere_id' => 'required|school_exists:matieres,id',
            'type_evaluation' => 'required|in:Devoir1,Devoir2,Interrogation',
            'date_evaluation' => 'required|date',
            'periode' => 'required|in:Trimestre 1,Trimestre 2,Trimestre 3',
            'notes' => 'required|array|min:1',
            'notes.*.eleve_id' => 'required|school_exists:eleves,id',
            'notes.*.note' => 'required|numeric|min:0|max:20',
            'notes.*.note_sur' => 'nullable|numeric|min:1|max:20',
            'notes.*.observation' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            $imported = 0;
            $errors = [];

            foreach ($request->notes as $item) {
                $eleve = Eleve::find($item['eleve_id']);

                if (!$eleve || $eleve->classe_id != $request->classe_id) {
                    $errors[] = "Élève #{$item['eleve_id']} absent de cette classe";
                    continue;
                }

                $serieHasMatiere = $eleve->serie
                    ? $eleve->serie->matieres()->where('matiere_id', $request->matiere_id)->exists()
                    : true;

                if (!$serieHasMatiere) {
                    $errors[] = "Élève #{$item['eleve_id']} : matière absente de sa série";
                    continue;
                }

                $check = $this->validateNoteByType(
                    $request->merge([
                        'eleve_id' => $item['eleve_id'],
                        'note' => $item['note'],
                    ]),
                );

                if (!$check['success']) {
                    $errors[] = "Élève #{$item['eleve_id']} : {$check['message']}";
                    continue;
                }

                Notes::create([
                    'eleve_id' => $item['eleve_id'],
                    'classe_id' => $request->classe_id,
                    'matiere_id' => $request->matiere_id,
                    'note' => $item['note'],
                    'note_sur' => $item['note_sur'] ?? 20,
                    'type_evaluation' => $request->type_evaluation,
                    'date_evaluation' => $request->date_evaluation,
                    'periode' => $request->periode,
                    'annee_scolaire' => $request->annee_scolaire ?? AnneeScolaire::courante(),
                    'observation' => $item['observation'] ?? null,
                ]);

                $imported++;
            }

            if ($imported === 0) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune note n\'a pu être enregistrée',
                    'errors' => $errors,
                ], 400);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "$imported notes enregistrées",
                'count' => $imported,
                'warnings' => $errors,
            ], 201);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $this->clientErrorMessage($e, 'Erreur lors de la saisie groupée'),
            ], 500);
        }
    }

    /**
     * Données prêtes à remplir une grille de notes pour une classe :
     * élèves de la classe + matières (avec coefficients) de ses séries.
     *
     * GET /notes/grille/{classeId}
     */
    public function grilleSaisie($classeId)
    {
        $this->authorize('viewAny', Notes::class);

        $classe = Classes::find($classeId);
        if (!$classe) {
            return response()->json(['success' => false, 'message' => 'Classe non trouvée'], 404);
        }

        $eleves = Eleve::with('user:id,name,prenom')
            ->where('classe_id', $classeId)
            ->orderBy('numero_matricule')
            ->get(['id', 'user_id', 'numero_matricule'])
            ->map(fn($e) => [
                'id' => $e->id,
                'nom' => $e->user->name ?? '',
                'prenom' => $e->user->prenom ?? '',
                'matricule' => $e->numero_matricule,
            ])
            ->values();

        // Matières de la classe via ses séries (coefficients du pivot), sinon
        // via la liaison directe classe <-> matière.
        $matieres = $classe->series()
            ->with(['matieres' => fn($q) => $q->select('matieres.id', 'matieres.nom')->withPivot('coefficient')])
            ->get()
            ->flatMap(fn($serie) => $serie->matieres->map(fn($m) => [
                'id' => $m->id,
                'nom' => $m->nom,
                'coefficient' => $m->pivot->coefficient,
            ]))
            ->unique('id')
            ->values();

        if ($matieres->isEmpty()) {
            $matieres = $classe->matieres()->get(['matieres.id', 'matieres.nom'])
                ->map(fn($m) => ['id' => $m->id, 'nom' => $m->nom, 'coefficient' => null]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'classe' => [
                    'id' => $classe->id,
                    'nom_classe' => $classe->nom_classe,
                    'categorie_classe' => $classe->categorie_classe,
                ],
                'eleves' => $eleves,
                'matieres' => $matieres,
            ],
        ]);
    }
}
