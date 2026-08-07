<?php

namespace App\Http\Controllers;

use App\Models\Moyennes;
use App\Models\Notes;
use App\Models\Eleve;
use App\Models\Classes;
use App\Models\Matieres;
use App\Models\Series;
use App\Support\AnneeScolaire;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Database\QueryException;
use Smalot\PdfParser\Parser as PdfParser;
use \Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Support\Roles;
use App\Support\Cycles;

class NotesController extends Controller
{
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

    


    private function getCoefficientBySerieAndMatiere($serie, $nomMatiere)
    {
        $coefficients = [
            'Série A' => [
                'Maths' => 4,
                'PCT' => 3,
                'SVT' => 2,
                'Hist-Géo' => 2,
                'Anglais' => 2,
                'Français' => 2,
            ],
            'Série B' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série C' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série D' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série E' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série F' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série MC' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série ML' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
        ];

        return $coefficients[$serie][$nomMatiere] ?? 1;
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
     * Validation spécifique selon le type d'évaluation
     */
    private function validateNoteByType(Request $request, $excludeNoteId = null)
    {
        $query = Notes::where('eleve_id', $request->eleve_id)
                    ->where('matiere_id', $request->matiere_id)
                    ->where('type_evaluation', $request->type_evaluation)
                    ->where('periode', $request->periode);

        if ($excludeNoteId) {
            $query->where('id', '!=', $excludeNoteId);
        }

        $count = $query->count();
        $limite = $request->type_evaluation === 'Interrogation' ? 4 : 1;

        if ($count >= $limite) {
            $label = $request->type_evaluation === 'Interrogation'
                ? 'plus de 4 notes d\'interrogation'
                : "plus d'une note de {$request->type_evaluation}";
            return ['success' => false, 'message' => "Un élève ne peut avoir {$label} par matière et par période"];
        }

        return ['success' => true];
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
     * Exporter les notes en XLSX
     */
    public function export(Request $request)
    {
        $this->authorize('viewAny', Notes::class);

        $query = Notes::with(['eleve.user', 'matiere', 'classe']);

        if ($request->filled('classe_id')) {
            $query->where('classe_id', $request->classe_id);
        }
        if ($request->filled('periode')) {
            $query->where('periode', $request->periode);
        }
        if ($request->filled('matiere_id')) {
            $query->where('matiere_id', $request->matiere_id);
        }

        $notes = $query->orderBy('classe_id')->orderBy('eleve_id')->orderBy('date_evaluation')->get();

        try {
            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // En-têtes
            $headers = ['N°', 'Élève', 'Classe', 'Matière', 'Note', 'Note sur', 'Type', 'Période', 'Date', 'Observation', 'Verrouillée'];
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $sheet->getStyle($col . '1')->getFont()->setBold(true);
                $col++;
            }

            $row = 2;
            foreach ($notes as $i => $n) {
                $sheet->setCellValue('A' . $row, $i + 1);
                $sheet->setCellValue('B' . $row, ($n->eleve->user->name ?? '') . ' ' . ($n->eleve->user->prenom ?? ''));
                $sheet->setCellValue('C' . $row, $n->classe->nom_classe ?? '');
                $sheet->setCellValue('D' . $row, $n->matiere->nom ?? '');
                $sheet->setCellValue('E' . $row, (float) $n->note);
                $sheet->setCellValue('F' . $row, (float) ($n->note_sur ?? 20));
                $sheet->setCellValue('G' . $row, $n->type_evaluation);
                $sheet->setCellValue('H' . $row, $n->periode);
                $sheet->setCellValue('I' . $row, $n->date_evaluation?->format('d/m/Y'));
                $sheet->setCellValue('J' . $row, $n->observation ?? '');
                $sheet->setCellValue('K' . $row, $n->locked ? 'Oui' : 'Non');
                $row++;
            }

            // Ajuster la largeur des colonnes
            foreach (range('A', 'K') as $c) {
                $sheet->getColumnDimension($c)->setAutoSize(true);
            }

            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $filename = 'notes_export_' . now()->format('Ymd_His') . '.xlsx';
            $tempPath = storage_path('app/temp/' . $filename);
            if (!is_dir(storage_path('app/temp'))) {
                mkdir(storage_path('app/temp'), 0755, true);
            }
            $writer->save($tempPath);

            return response()->download($tempPath, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            \Illuminate\Support\Facades\Log::error('Export notes XLSX error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $this->clientErrorMessage($e, 'Erreur lors de l\'export')
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
     * Classement des élèves par moyenne pour une classe et période
     */
    public function classement($classeId, $periode)
    {
        $this->authorize('viewAny', Notes::class);

        try {
            // `Notes::query()`, pas `DB::table('notes')` : la seconde forme
            // contourne le scope `BelongsToEcole`, donc il suffisait de passer
            // l'identifiant de classe d'un autre établissement pour obtenir son
            // classement nominatif.
            $marks = Notes::query()
                ->where('classe_id', $classeId)
                ->where('periode', $periode)
                ->get(['eleve_id', 'note', 'note_sur']);

            // Moyenne ramenée sur 20 : `AVG(note)` mélangeait des notes de
            // barèmes différents, un 8/10 pesant comme un 8/20.
            $averages = $marks
                ->groupBy('eleve_id')
                ->map(fn($pupilMarks) => $pupilMarks->avg(function ($mark) {
                    $scale = (float) ($mark->note_sur ?: 20);

                    return $scale > 0 ? ((float) $mark->note / $scale) * 20 : 0.0;
                }))
                ->sortDesc();

            // Les élèves à égalité partagent leur rang, et le suivant est décalé
            // d'autant. `$index + 1` attribuait 1, 2, 3 à trois moyennes
            // identiques — et contredisait le rang calculé par BulletinService
            // pour les mêmes élèves.
            $eleves = Eleve::with('user:id,name,prenom')
                ->whereIn('id', $averages->keys())
                ->get()
                ->keyBy('id');

            $elevesAvecInfos = $averages->map(function ($moyenne, $eleveId) use ($averages, $eleves, $marks) {
                $eleve = $eleves->get($eleveId);
                $ahead = $averages->filter(fn($other) => $other > $moyenne + 0.001)->count();

                return [
                    'rang' => $ahead + 1,
                    'eleve_id' => $eleveId,
                    'nom' => $eleve?->user?->name ?? 'Inconnu',
                    'prenom' => $eleve?->user?->prenom ?? '',
                    'matricule' => $eleve?->numero_matricule ?? '',
                    'moyenne' => round((float) $moyenne, 2),
                    'total_notes' => $marks->where('eleve_id', $eleveId)->count(),
                ];
            })->values();

            $classe = Classes::find($classeId);

            return response()->json([
                'success' => true,
                'data' => [
                    'classe' => $classe?->nom_classe ?? 'Inconnue',
                    'periode' => $periode,
                    'effectif' => $elevesAvecInfos->count(),
                    'classement' => $elevesAvecInfos,
                ]
            ]);
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json([
                'success' => false,
                'message' => $this->clientErrorMessage($e, 'Erreur lors du calcul du classement')
            ], 500);
        }
    }

    /**
     * Importer des notes depuis un fichier JSON
     */


    public function import(Request $request)
    {
        try {
            Log::debug('Import notes', ['keys' => array_keys($request->all())]);
            // 1. Validation des données reçues
            $validator = Validator::make($request->all(), [
            'classe_id' => 'required|school_exists:classes,id',
            'matiere_id' => 'required|school_exists:matieres,id',
            'type_evaluation' => 'required|in:Devoir1,Devoir2,Interrogation',
            'date_evaluation' => 'required|date',
            'periode' => 'required|in:Trimestre 1,Trimestre 2,Trimestre 3',
            'notes' => 'required'
        ]);

            if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 400);
        }

            // 2. Décoder les données des notes
            $notesData = is_string($request->notes) ? json_decode($request->notes, true) : $request->notes;
        
            if (!is_array($notesData)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Format des notes invalide',
                    'recu' => $request->notes
                ], 400);
            }

            // 3. Commencer une transaction
            DB::beginTransaction();
            
            $importedCount = 0;
            $errors = [];

            // 4. Traiter chaque note
            foreach ($notesData as $noteData) {
                try {
                    // Rechercher l'élève par matricule
                    // `Eleve::where(...)`, pas `DB::table('eleves')` : hors du
                    // scope tenant, deux établissements ayant le même numéro de
                    // matricule voyaient l'import rattacher la note à l'élève de
                    // l'autre école.
                    $eleve = Eleve::where('numero_matricule', $noteData['matricule'])
                        ->where('classe_id', $request->classe_id)
                        ->first();

                    if (!$eleve) {
                        $errors[] = "Élève avec matricule {$noteData['matricule']} non trouvé";
                        continue;
                    }

                    // Créer la note
                    Notes::create([
                        'eleve_id' => $eleve->id,
                        'classe_id' => $request->classe_id,
                        'matiere_id' => $request->matiere_id,
                        'note' => $noteData['note'],
                        'note_sur' => 20,
                        'type_evaluation' => $request->type_evaluation,
                        'date_evaluation' => $request->date_evaluation,
                        'periode' => $request->periode,
                        'annee_scolaire' => $request->annee_scolaire ?? AnneeScolaire::courante(),
                        
                    ]);

                    $importedCount++;

                } catch (\Exception $e) {
                    $this->rethrowIfMeaningful($e);
                    $errors[] = "Erreur pour l'élève {$noteData['matricule']}: " . $e->getMessage();
                }
            }

            // 5. Vérifier s'il y a eu des importations
            if ($importedCount === 0) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune note n\'a pu être importée',
                    'errors' => $errors
                ], 400);
            }

            // 6. Valider la transaction
            DB::commit();

            // 7. Retourner la réponse
            return response()->json([
                'success' => true,
                'message' => "$importedCount notes ont été importées avec succès",
                'count' => $importedCount,
                'warnings' => $errors
            ]);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Erreur import notes: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => $this->clientErrorMessage($e, 'Erreur lors de l\'importation')
            ], 500);
        }
    }

    /**
     * Lister les notes d'un élève pour une période donnée
     */
    public function getNotesEleve($eleveId, $periode = null)
    {
        $eleve = Eleve::find($eleveId);
        if (!$eleve) {
            return response()->json(['success' => false, 'message' => 'Élève non trouvé'], 404);
        }
        $this->authorize('view', $eleve);

        try {
            $query = Notes::where('eleve_id', $eleveId)
                        ->with(['matiere', 'classe']);

            if ($periode) {
                $query->where('periode', $periode);
            }

            $notes = $query->orderBy('date_evaluation', 'desc')->get();

            // Grouper les notes par matière
            $notesGroupees = $notes->groupBy('matiere.nom');

            return response()->json([
                'success' => true,
                'data' => $notesGroupees
            ], 200);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des notes',
                'error' => $this->clientErrorMessage($e)
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques des notes pour un élève
     */
    public function getStatistiquesEleve($eleveId, $periode)
    {
        try {
            $eleve = Eleve::with(['notes' => function($query) use ($periode) {
                $query->where('periode', $periode)->with('matiere');
            }])->find($eleveId);

            if (!$eleve) {
                return response()->json([
                    'success' => false,
                    'message' => 'Élève non trouvé'
                ], 404);
            }

            $this->authorize('view', $eleve);

            $statistiques = [
                'eleve' => $eleve->full_name,
                'classe' => $eleve->classe->nom_classe,
                'periode' => $periode,
                'moyenne_generale' => $eleve->getMoyenneGenerale($periode),
                'nombre_matieres' => $eleve->notes->groupBy('matiere_id')->count(),
                'total_notes' => $eleve->notes->count(),
                'repartition_types' => [
                    'Devoir1' => $eleve->notes->where('type_evaluation', 'Devoir1')->count(),
                    'Devoir2' => $eleve->notes->where('type_evaluation', 'Devoir2')->count(),
                    'Interrogation' => $eleve->notes->where('type_evaluation', 'Interrogation')->count(),
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $statistiques
            ], 200);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => $this->clientErrorMessage($e)
            ], 500);
        }
    }

    /**
     * Vérifier le nombre de notes restantes pour un type d'évaluation
     */
    public function checkNotesRestantes($eleveId, $matiereId, $typeEvaluation, $periode)
    {
        $eleve = Eleve::find($eleveId);
        if (!$eleve) {
            return response()->json(['success' => false, 'message' => 'Élève non trouvé'], 404);
        }
        $this->authorize('view', $eleve);

        try {
            $nombreExistant = Notes::where('eleve_id', $eleveId)
                                ->where('matiere_id', $matiereId)
                                ->where('type_evaluation', $typeEvaluation)
                                ->where('periode', $periode)
                                ->count();

            $limiteMax = $typeEvaluation === 'Interrogation' ? 4 : 1;
            $restantes = $limiteMax - $nombreExistant;

            return response()->json([
                'success' => true,
                'data' => [
                    'type_evaluation' => $typeEvaluation,
                    'nombre_existant' => $nombreExistant,
                    'limite_max' => $limiteMax,
                    'notes_restantes' => max(0, $restantes),
                    'peut_ajouter' => $restantes > 0
                ]
            ], 200);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification',
                'error' => $this->clientErrorMessage($e)
            ], 500);
        }
    }

    private function findEleve($identifier, $classeId)
    {
        // Recherche par nom complet, prénom, nom ou numéro
        // La clé de classe est `classe_id`, et nom/prénom vivent sur `users` —
        // d'où la recherche via la relation plutôt que sur `eleves`.
        return Eleve::where('classe_id', $classeId)
            ->where(function ($query) use ($identifier) {
                $query->where('numero_matricule', $identifier)
                    ->orWhereHas('user', function ($u) use ($identifier) {
                        $u->where('name', 'LIKE', "%{$identifier}%")
                            ->orWhere('prenom', 'LIKE', "%{$identifier}%")
                            ->orWhereRaw("CONCAT(prenom, ' ', name) LIKE ?", ["%{$identifier}%"])
                            ->orWhereRaw("CONCAT(name, ' ', prenom) LIKE ?", ["%{$identifier}%"]);
                    });
            })
            ->first();
    }

    // Méthodes pour obtenir les données nécessaires aux formulaires
    public function getClasses()
    {
        $classes = Classes::select('id', 'nom', 'niveau')->orderBy('niveau')->orderBy('nom')->get();
        return response()->json($classes);
    }

    public function getMatieres()
    {
        $matieres = Matieres::select('id', 'nom', 'code')->orderBy('nom')->get();
        return response()->json($matieres);
    }

    public function getElevesByClasse($classeId)
    {
        $eleves = Eleve::with('user:id,name,prenom')
            ->where('classe_id', $classeId)
            ->get(['id', 'user_id', 'numero_matricule'])
            ->map(fn($e) => [
                'id' => $e->id,
                'nom' => $e->user->name ?? '',
                'prenom' => $e->user->prenom ?? '',
                'numero_matricule' => $e->numero_matricule,
            ])
            ->sortBy([['nom', 'asc'], ['prenom', 'asc']])
            ->values();

        return response()->json($eleves);
    }
// Filtrer les notes selon les critères
public function filter(Request $request)
{
    try {
        $query = Notes::query()
            ->with(['eleve', 'classe', 'matiere']);

        if ($request->filled('classe_id')) {
            $query->where('classe_id', $request->classe_id);
        }

        if ($request->filled('serie_id')) {
            $query->whereHas('eleve', function($q) use ($request) {
                $q->where('serie_id', $request->serie_id);
            });
        }

        if ($request->filled('matiere_id')) {
            $query->where('matiere_id', $request->matiere_id);
        }

        if ($request->filled('type_evaluation')) {
            $query->where('type_evaluation', $request->type_evaluation);
        }

        if ($request->filled('periode')) {
            $query->where('periode', $request->periode);
        }

        $notes = $query->orderBy('date_evaluation', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $notes
        ]);
    } catch (\Exception $e) {
        $this->rethrowIfMeaningful($e);
        return response()->json([
            'success' => false,
            'message' => $this->clientErrorMessage($e, 'Erreur lors du filtrage des notes')
        ], 500);
    }
}


private function filterNotesByCategorie(Request $request, $categorie)
{
    try {
        $query = Notes::query()
            ->with(['eleve', 'classe', 'matiere']);

        // Filtrer par catégorie de classe (maternelle, primaire, secondaire)
        $query->whereHas('classe', function($q) use ($categorie) {
            $q->where('categorie_classe', $categorie);
        });

        if ($request->filled('classe_id')) {
            $query->where('classe_id', $request->classe_id);
        }

        if ($request->filled('serie_id')) {
            $query->whereHas('classe.series', function($q) use ($request) {
                $q->where('series.id', $request->serie_id);
            });
        }

        if ($request->filled('matiere_id')) {
            $query->where('matiere_id', $request->matiere_id);
        }

        if ($request->filled('type_evaluation')) {
            $query->where('type_evaluation', $request->type_evaluation);
        }

        if ($request->filled('periode')) {
            $query->where('periode', $request->periode);
        }

        $notes = $query->orderBy('date_evaluation', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $notes
        ]);
    } catch (\Exception $e) {
        $this->rethrowIfMeaningful($e);
        return response()->json([
            'success' => false,
            'message' => $this->clientErrorMessage($e, 'Erreur lors du filtrage des notes')
        ], 500);
    }
}

// Pour la maternelle
public function filterMaternelle(Request $request)
{
    return $this->filterNotesByCategorie($request, Cycles::KINDERGARTEN);
}

// Pour le primaire
public function filterPrimaire(Request $request)
{
    return $this->filterNotesByCategorie($request, Cycles::PRIMARY);
}

// Pour le secondaire
public function filterSecondaire(Request $request)
{
    return $this->filterNotesByCategorie($request, Cycles::SECONDARY);
}

/**
     * Mark distribution by band, for a cycle or for the whole school.
     *
     * Rewritten from four near-identical methods that between them issued 16
     * `DB::table('notes')` queries. Three defects, all in the same few lines:
     *
     *   - `DB::table()` sidesteps the `BelongsToEcole` global scope, so every
     *     count aggregated the marks of *every* school on the platform into one
     *     establishment's chart;
     *   - the bands ignored `note_sur`, so a 5/10 — half marks — was counted in
     *     the 0-5 band alongside a 5/20;
     *   - the bands were `0-5`, `6-10`, `11-15`, `16-20` on a `decimal(5,2)`
     *     column, so a 5.5 belonged to none of them and vanished from the
     *     chart. They are contiguous now, each half-open except the last.
     *
     * Four counts became one pass over one query.
     */
    private function markDistribution(?string $cycle = null): array
    {
        $query = Notes::query();

        if ($cycle !== null) {
            $query->whereHas('classe', fn($q) => $q->where('categorie_classe', $cycle));
        }

        $this->restrictToCallerScope($query);

        $bands = [
            ['name' => '0-5',   'from' => 0.0,  'to' => 5.0],
            ['name' => '5-10',  'from' => 5.0,  'to' => 10.0],
            ['name' => '10-15', 'from' => 10.0, 'to' => 15.0],
            ['name' => '15-20', 'from' => 15.0, 'to' => 20.0],
        ];

        $counts = array_fill(0, count($bands), 0);

        foreach ($query->get(['note', 'note_sur']) as $mark) {
            $scale = (float) ($mark->note_sur ?: 20);
            $onTwenty = $scale > 0 ? ((float) $mark->note / $scale) * 20 : 0.0;

            foreach ($bands as $i => $band) {
                $isLast = $i === count($bands) - 1;

                if ($onTwenty >= $band['from'] && ($isLast ? $onTwenty <= $band['to'] : $onTwenty < $band['to'])) {
                    $counts[$i]++;
                    break;
                }
            }
        }

        return collect($bands)
            ->map(fn($band, $i) => ['name' => $band['name'], 'value' => $counts[$i]])
            ->all();
    }

    public function repartitionNotesMaternelle()
    {
        return response()->json($this->markDistribution(Cycles::KINDERGARTEN));
    }

    public function repartitionNotesPrimaire()
    {
        return response()->json($this->markDistribution(Cycles::PRIMARY));
    }

    public function repartitionNotesSecondaire()
    {
        return response()->json($this->markDistribution(Cycles::SECONDARY));
    }

    public function repartitionNotes()
    {
        return response()->json($this->markDistribution());
    }


    /**
     * Headline grade statistics for the caller's scope.
     *
     * The frontend called `GET /notes/stats`, which did not exist, so the
     * grades dashboard rendered empty tiles.
     *
     * A student sees their own figures, a parent their children's, and staff
     * the whole school. The tenant scope bounds everything to one school.
     */
    public function stats(Request $request)
    {
        $this->authorize('viewAny', Notes::class);

        $query = Notes::query()
            ->when($request->filled('periode'), fn($q) => $q->where('periode', $request->periode))
            ->when($request->filled('classe_id'), fn($q) => $q->where('classe_id', $request->classe_id));

        $this->restrictToCallerScope($query);

        // Ramené sur 20 : `note_sur` est saisissable, un 8/10 vaut 16/20.
        $notes = $query->get(['note', 'note_sur']);
        $normalized = $notes->map(function ($n) {
            $scale = (float) ($n->note_sur ?: 20);

            return $scale > 0 ? ((float) $n->note / $scale) * 20 : 0.0;
        });

        return response()->json([
            'success' => true,
            'data' => [
                'total_notes' => $normalized->count(),
                'moyenne'     => $normalized->isEmpty() ? 0 : round($normalized->avg(), 2),
                'note_min'    => $normalized->isEmpty() ? 0 : round($normalized->min(), 2),
                'note_max'    => $normalized->isEmpty() ? 0 : round($normalized->max(), 2),
                'repartition' => [
                    'insuffisant' => $normalized->filter(fn($v) => $v < 10)->count(),
                    'passable'    => $normalized->filter(fn($v) => $v >= 10 && $v < 12)->count(),
                    'bien'        => $normalized->filter(fn($v) => $v >= 12 && $v < 16)->count(),
                    'tres_bien'   => $normalized->filter(fn($v) => $v >= 16)->count(),
                ],
            ],
        ]);
    }

    /**
     * Per-subject averages for the caller's scope.
     *
     * GET /notes/moyennes-par-matiere
     */
    public function moyennesParMatiere(Request $request)
    {
        $this->authorize('viewAny', Notes::class);

        $query = Notes::with('matiere:id,nom')
            ->when($request->filled('periode'), fn($q) => $q->where('periode', $request->periode))
            ->when($request->filled('classe_id'), fn($q) => $q->where('classe_id', $request->classe_id));

        $this->restrictToCallerScope($query);

        $rows = $query->get()
            ->groupBy('matiere_id')
            ->map(function ($group) {
                $normalized = $group->map(function ($n) {
                    $scale = (float) ($n->note_sur ?: 20);

                    return $scale > 0 ? ((float) $n->note / $scale) * 20 : 0.0;
                });

                return [
                    'matiere_id' => $group->first()->matiere_id,
                    'matiere'    => $group->first()->matiere->nom ?? '—',
                    'moyenne'    => round($normalized->avg(), 2),
                    'nb_notes'   => $group->count(),
                ];
            })
            ->sortByDesc('moyenne')
            ->values();

        return response()->json(['success' => true, 'data' => $rows]);
    }

    /**
     * Narrow a grades query to what the caller is allowed to read.
     *
     * Whitelist, so an unexpected role gets nothing rather than everything.
     */
    private function restrictToCallerScope($query): void
    {
        $user = auth()->user();
        $staff = Roles::expand([
            Roles::DIRECTOR, Roles::TEACHER, 'censeur', 'secretaire', Roles::SUPER_ADMIN,
        ]);

        if (in_array($user?->role, $staff, true)) {
            return; // périmètre de l'école, déjà borné par le scope tenant
        }

        if ($user?->role === 'eleve' && $user->eleve) {
            $query->where('eleve_id', $user->eleve->id);

            return;
        }

        if ($user?->role === 'parent' && $user->parent) {
            $query->whereIn('eleve_id', $user->parent->eleves()->pluck('eleves.id'));

            return;
        }

        $query->whereRaw('1 = 0');
    }
}
