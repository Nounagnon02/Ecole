<?php

namespace App\Http\Controllers\Notes;

use App\Http\Controllers\Controller;
use App\Models\Notes;
use App\Models\Eleve;
use App\Models\Classes;
use App\Support\AnneeScolaire;
use App\Http\Requests\Notes\StoreNoteRequest;
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
            'data' => $query->latest('date_evaluation')->paginate(50),
        ]);
    }

    /**
     * `getNotesByEleves` et `getNotesBySession` retirées : ni routées, ni
     * appelées, ni testées. Cette seconde interrogeait au passage
     * `sessions_id`, une colonne qui n'existe pas.
     */
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


    public function store(StoreNoteRequest $request)
        {
            $this->authorize('create', Notes::class);

            try {
                DB::beginTransaction();

                // Vérifier que l'élève appartient bien à la classe
                $eleve = Eleve::find($request->eleve_id);
                if ($eleve->classe_id != $request->classe_id) {
                    DB::rollBack();
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
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Cette matière n\'est pas disponible pour la série de cet élève'
                    ], 400);
                }

                // Validation spécifique selon le type d'évaluation
                $validationResult = $this->validateNoteByType($request);
                if (!$validationResult['success']) {
                    DB::rollBack();
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

                \Cache::forget('dashboard_directeur_' . (auth()->user()->ecole_id ?? 'global'));

                return response()->json([
                    'success' => true,
                    'message' => 'Note enregistrée avec succès',
                    'data' => $note->load(['eleve', 'matiere', 'classe'])
                ], 201);

            } catch (\Exception $e) {
                // Rollback D'ABORD : `rethrowIfMeaningful` relance
                // immédiatement les exceptions « signifiantes »
                // (403/404/422/...) — les relancer avant le rollback
                // désynchronise la comptabilité de transactions de Laravel
                // de la connexion PDO réelle.
                DB::rollBack();
                $this->rethrowIfMeaningful($e);

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
        $note = Notes::find($id);
        if (!$note) {
            return response()->json([
                'success' => false,
                'message' => 'Note non trouvée'
            ], 404);
        }
        $this->authorize('update', $note);

        if ($note->locked) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de modifier une note verrouillée'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'eleve_id' => 'required|school_exists:eleves,id',
            'classe_id' => 'required|school_exists:classes,id',
            'matiere_id' => 'required|school_exists:matieres,id',
            'note' => 'required|numeric|min:0|max:20',
            'note_sur' => 'required|numeric|min:1|max:20',
            'type_evaluation' => 'required|in:Devoir1,Devoir2,Interrogation,1ère evaluation,2ème evaluation,3ème evaluation,4ème evaluation,5ème evaluation,6ème evaluation',
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

            $eleve = Eleve::find($request->eleve_id);
            if ($eleve->classe_id != $request->classe_id) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'L\'élève n\'appartient pas à cette classe'
                ], 400);
            }

            $serieHasMatiere = $eleve->serie
                ? $eleve->serie->matieres()->where('matiere_id', $request->matiere_id)->exists()
                : true;

            if (!$serieHasMatiere) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Cette matière n\'est pas disponible pour la série de cet élève'
                ], 400);
            }

            $validationResult = $this->validateNoteByType($request, $id);
            if (!$validationResult['success']) {
                DB::rollBack();
                return response()->json($validationResult, 400);
            }

            $note->update($validator->validated());

            DB::commit();

            \Cache::forget('dashboard_directeur_' . (auth()->user()->ecole_id ?? 'global'));

            return response()->json([
                'success' => true,
                'message' => 'Note mise à jour avec succès',
                'data' => $note->load(['eleve', 'matiere', 'classe'])
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            $this->rethrowIfMeaningful($e);

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

            \Cache::forget('dashboard_directeur_' . (auth()->user()->ecole_id ?? 'global'));

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

            \Cache::forget('dashboard_directeur_' . (auth()->user()->ecole_id ?? 'global'));

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

            \Cache::forget('dashboard_directeur_' . (auth()->user()->ecole_id ?? 'global'));

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
            'type_evaluation' => 'required|in:Devoir1,Devoir2,Interrogation,1ère evaluation,2ème evaluation,3ème evaluation,4ème evaluation,5ème evaluation,6ème evaluation',
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

        if (! $this->peutNoter((int) $request->classe_id, (int) $request->matiere_id)) {
            return response()->json(['success' => false, 'message' => 'Cette matière ne vous est pas affectée dans cette classe.'], 403);
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

                // La grille se réenregistre : une note déjà saisie pour cette
                // évaluation est corrigée, pas doublée. Sans cela, corriger
                // une seule note d'un devoir renvoyait toute la classe en
                // erreur « plus d'une note de Devoir1 ».
                $existante = $this->noteDeLEvaluation($request, (int) $item['eleve_id'])->first();

                if ($existante) {
                    if ($existante->locked) {
                        $errors[] = "Élève #{$item['eleve_id']} : note verrouillée, non modifiée";

                        continue;
                    }

                    $existante->update([
                        'note' => $item['note'],
                        'note_sur' => $item['note_sur'] ?? 20,
                        'date_evaluation' => $request->date_evaluation,
                        'observation' => $item['observation'] ?? $existante->observation,
                    ]);
                    $imported++;

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

            \Cache::forget('dashboard_directeur_' . (auth()->user()->ecole_id ?? 'global'));

            return response()->json([
                'success' => true,
                'message' => "$imported notes enregistrées",
                'count' => $imported,
                'warnings' => $errors,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            $this->rethrowIfMeaningful($e);

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

        $matieresAffectees = $this->matieresAffectees((int) $classeId);

        if ($matieresAffectees !== null && $matieresAffectees === []) {
            return response()->json(['success' => false, 'message' => 'Cette classe ne vous est pas affectée.'], 403);
        }

        $eleves = Eleve::with('user:id,name,prenom')
            ->where('classe_id', $classeId)
            ->where('statut', '!=', 'inactive')
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

        // Un enseignant ne voit que ses matières dans cette classe.
        if ($matieresAffectees !== null) {
            $matieres = collect($matieres)->whereIn('id', $matieresAffectees)->values();
        }

        // Notes déjà saisies pour l'évaluation demandée : la grille s'ouvre
        // sur ce qui existe, pour corriger plutôt que ressaisir.
        $notes = [];
        $requete = request();
        if ($requete->filled(['matiere_id', 'type_evaluation', 'periode'])) {
            $notes = $this->noteDeLEvaluation($requete->merge(['classe_id' => $classeId]))
                ->get(['id', 'eleve_id', 'note', 'note_sur', 'locked', 'date_evaluation'])
                ->map(fn ($n) => [
                    'id' => $n->id, 'eleve_id' => $n->eleve_id, 'note' => (float) $n->note,
                    'note_sur' => (float) $n->note_sur, 'locked' => (bool) $n->locked,
                ])->values();
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
                'notes' => $notes,
            ],
        ]);
    }

    /**
     * Les notes d'une évaluation : une par élève, matière, type et période —
     * et par date pour les interrogations, qui peuvent être plusieurs.
     */
    private function noteDeLEvaluation(Request $request, ?int $eleveId = null)
    {
        return Notes::where('classe_id', $request->classe_id)
            ->where('matiere_id', $request->matiere_id)
            ->where('type_evaluation', $request->type_evaluation)
            ->where('periode', $request->periode)
            ->when($eleveId, fn ($q) => $q->where('eleve_id', $eleveId))
            ->when(
                $request->type_evaluation === 'Interrogation' && $request->filled('date_evaluation'),
                fn ($q) => $q->whereDate('date_evaluation', $request->date_evaluation)
            );
    }

    /**
     * Matières que l'utilisateur enseigne dans cette classe, ou null s'il
     * n'est pas tenu par les affectations (direction).
     *
     * @return array<int, int>|null
     */
    private function matieresAffectees(int $classeId): ?array
    {
        $user = auth()->user();

        if (\App\Support\Roles::isDirector($user->role)) {
            return null;
        }

        $enseignantId = $user->enseignant?->id;

        if (! $enseignantId) {
            return [];
        }

        return DB::table('enseignant_matiere')
            ->where('enseignant_id', $enseignantId)->where('classe_id', $classeId)
            ->pluck('matiere_id')->map(fn ($id) => (int) $id)->unique()->values()->all();
    }

    /**
     * Un enseignant ne note que les matières qui lui sont affectées dans la
     * classe : jusqu'ici, n'importe quel enseignant pouvait noter n'importe
     * quelle classe de l'école.
     */
    private function peutNoter(int $classeId, int $matiereId): bool
    {
        $affectees = $this->matieresAffectees($classeId);

        return $affectees === null || in_array($matiereId, $affectees, true);
    }
}
