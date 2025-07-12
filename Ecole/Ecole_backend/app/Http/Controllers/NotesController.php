<?php

namespace App\Http\Controllers;

use App\Models\Moyennes;
use App\Models\Notes;
use App\Models\Eleves;
use App\Models\Classes;
use App\Models\Matieres;
use App\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Database\QueryException;
use Smalot\PdfParser\Parser as PdfParser;
use \Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class NotesController extends Controller
{
    public function getNotesByEleves($eleveId)
    {
        $notes = Notes::with('eleve')
            ->where('eleves_id', $eleveId)
            ->get();

        return response()->json($notes);
    }

    public function getNotesBySession($sessionId)
    {
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

        return response()->json([
            'success' => true,
            'note' => $note
        ]);
    }


    public function store(Request $request)
        {
            // Validation des données
            $validator = Validator::make($request->all(), [
                'eleve_id' => 'required|exists:eleves,id',
                'classe_id' => 'required|exists:classes,id',
                'matiere_id' => 'required|exists:matieres,id',
                'note' => 'required|numeric|min:0|max:20',
                'note_sur' => 'required|numeric|min:1|max:20',
                'type_evaluation' => 'required|in:Devoir1,Devoir2,Interrogation,1ère evaluation,2ème evaluation,3ème evaluation,4ème evaluation,5ème evaluation,6ème evaluation',
                'date_evaluation' => 'required|date',
                'periode' => 'required|in:Semestre 1,Semestre 2',
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
                $eleve = Eleves::find($request->eleve_id);
                if ($eleve->class_id != $request->classe_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'L\'élève n\'appartient pas à cette classe'
                    ], 400);
                }

                // Vérifier que la matière existe pour la série de l'élève
                $matiere = Matieres::find($request->matiere_id);
                $serieHasMatiere = $eleve->serie->matieres()->where('matiere_id', $request->matiere_id)->exists();
                
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
                    'observation' => $request->observation,
                    
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Note enregistrée avec succès',
                    'data' => $note->load(['eleve', 'matiere', 'classe'])
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'enregistrement de la note',
                    'error' => $e->getMessage()
                ], 500);
            }
        }

    /**
     * Mettre à jour une note existante
     */
    public function update(Request $request, $id)
    {
        // Validation des données
        $validator = Validator::make($request->all(), [
            'eleve_id' => 'required|exists:eleves,id',
            'classe_id' => 'required|exists:classes,id',
            'matiere_id' => 'required|exists:matieres,id',
            'note' => 'required|numeric|min:0|max:100',
            'note_sur' => 'required|numeric|min:1|max:100',
            'type_evaluation' => 'required|in:Devoir1,Devoir2,Interrogation',
            'date_evaluation' => 'required|date',
            'periode' => 'required|in:Semestre 1,Semestre 2',
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

            // Vérifier que l'élève appartient bien à la classe
            $eleve = Eleves::find($request->eleve_id);
            if ($eleve->class_id != $request->classe_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'L\'élève n\'appartient pas à cette classe'
                ], 400);
            }

            // Vérifier que la matière existe pour la série de l'élève
            $serieHasMatiere = $eleve->serie->matieres()->where('matiere_id', $request->matiere_id)->exists();
            
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
                'observation' => $request->observation
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Note mise à jour avec succès',
                'data' => $note->load(['eleve', 'matiere', 'classe'])
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la note',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validation spécifique selon le type d'évaluation
     */
    private function validateNoteByType(Request $request, $excludeNoteId = null)
    {
        $eleveId = $request->eleve_id;
        $matiereId = $request->matiere_id;
        $typeEvaluation = $request->type_evaluation;
        $periode = $request->periode;

        $query = Notes::where('eleve_id', $eleveId)
                    ->where('matiere_id', $matiereId)
                    ->where('type_evaluation', $typeEvaluation)
                    ->where('periode', $periode);

        // Exclure la note actuelle lors de la mise à jour
        if ($excludeNoteId) {
            $query->where('id', '!=', $excludeNoteId);
        }

        $existingNotesCount = $query->count();

        switch ($typeEvaluation) {
            case 'Interrogation':
                if ($existingNotesCount >= 4) {
                    return [
                        'success' => false,
                        'message' => 'Un élève ne peut avoir plus de 4 notes d\'interrogation par matière et par période'
                    ];
                }
                break;

            case 'Devoir1':
                if ($existingNotesCount >= 1) {
                    return [
                        'success' => false,
                        'message' => "Un élève ne peut avoir qu'une seule note de {$typeEvaluation} par matière et par période"
                    ];
                }
                break;
            case '1ère evaluation':
                if ($existingNotesCount >= 1) {
                    return [
                        'success' => false,
                        'message' => "Un élève ne peut avoir qu'une seule note de {$typeEvaluation} par matière et par période"
                    ];
                }
                break;
            case '2ème evaluation':
                if ($existingNotesCount >= 1) {
                    return [
                        'success' => false,
                        'message' => "Un élève ne peut avoir qu'une seule note de {$typeEvaluation} par matière et par période"
                    ];
                }
                break;

            case '3ème evaluation':
                if ($existingNotesCount >= 1) {
                    return [
                        'success' => false,
                        'message' => "Un élève ne peut avoir qu'une seule note de {$typeEvaluation} par matière et par période"
                    ];
                }
                break;
            
            case '4ème evaluation':
                if ($existingNotesCount >= 1) {
                    return [
                        'success' => false,
                        'message' => "Un élève ne peut avoir qu'une seule note de {$typeEvaluation} par matière et par période"
                    ];
                }
                break;
            
            case '5ème evaluation':
                if ($existingNotesCount >= 1) {
                    return [
                        'success' => false,
                        'message' => "Un élève ne peut avoir qu'une seule note de {$typeEvaluation} par matière et par période"
                    ];
                }
                break;
            
            case '6ème evaluation':
                if ($existingNotesCount >= 1) {
                    return [
                        'success' => false,
                        'message' => "Un élève ne peut avoir qu'une seule note de {$typeEvaluation} par matière et par période"
                    ];
                }
                break;
            case 'Devoir2':
                if ($existingNotesCount >= 1) {
                    return [
                        'success' => false,
                        'message' => "Un élève ne peut avoir qu'une seule note de {$typeEvaluation} par matière et par période"
                    ];
                }
                break;
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

            $note->delete();

            return response()->json([
                'success' => true,
                'message' => 'Note supprimée avec succès'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la note',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Importer des notes depuis un fichier JSON
     */


    public function import(Request $request)
    {
        try {
            Log::info('Données reçues:', $request->all());
            // 1. Validation des données reçues
            $validator = Validator::make($request->all(), [
            'classe_id' => 'required|exists:classes,id',
            'matiere_id' => 'required|exists:matieres,id',
            'type_evaluation' => 'required|in:Devoir1,Devoir2,Interrogation',
            'date_evaluation' => 'required|date',
            'periode' => 'required|in:Semestre 1,Semestre 2',
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
                    $eleve = DB::table('eleves')
                        ->where('numero_matricule', $noteData['matricule'])
                        ->where('class_id', $request->classe_id)
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
                        
                    ]);

                    $importedCount++;

                } catch (\Exception $e) {
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
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Erreur import notes: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'importation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lister les notes d'un élève pour une période donnée
     */
    public function getNotesEleve($eleveId, $periode = null)
    {
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
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des notes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques des notes pour un élève
     */
    public function getStatistiquesEleve($eleveId, $periode)
    {
        try {
            $eleve = Eleves::with(['notes' => function($query) use ($periode) {
                $query->where('periode', $periode)->with('matiere');
            }])->find($eleveId);

            if (!$eleve) {
                return response()->json([
                    'success' => false,
                    'message' => 'Élève non trouvé'
                ], 404);
            }

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
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vérifier le nombre de notes restantes pour un type d'évaluation
     */
    public function checkNotesRestantes($eleveId, $matiereId, $typeEvaluation, $periode)
    {
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
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function findEleve($identifier, $classeId)
    {
        // Recherche par nom complet, prénom, nom ou numéro
        return Eleves::where('classe_id', $classeId)
            ->where(function($query) use ($identifier) {
                $query->where('nom', 'LIKE', "%{$identifier}%")
                    ->orWhere('prenom', 'LIKE', "%{$identifier}%")
                    ->orWhere('numero_eleve', $identifier)
                    ->orWhereRaw("CONCAT(prenom, ' ', nom) LIKE ?", ["%{$identifier}%"])
                    ->orWhereRaw("CONCAT(nom, ' ', prenom) LIKE ?", ["%{$identifier}%"]);
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
        $eleves = Eleves::where('classe_id', $classeId)
            ->select('id', 'nom', 'prenom', 'numero_eleve')
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get();
        
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
            $query->whereHas('classe', function($q) use ($request) {
                $q->whereHas('series', function($q) use ($request) {
                    $q->where('series.id', $request->serie_id);
                });
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
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors du filtrage des notes: ' . $e->getMessage()
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
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors du filtrage des notes: ' . $e->getMessage()
        ], 500);
    }
}

// Pour la maternelle
public function filterMaternelle(Request $request)
{
    return $this->filterNotesByCategorie($request, 'maternelle');
}

// Pour le primaire
public function filterPrimaire(Request $request)
{
    return $this->filterNotesByCategorie($request, 'primaire');
}

// Pour le secondaire
public function filterSecondaire(Request $request)
{
    return $this->filterNotesByCategorie($request, 'secondaire');
}

public function repartitionNotesMaternelle()
{
    // Regroupe les notes du secondaire par tranche
    $data = [
        ['name' => '0-5', 'value' => DB::table('notes')->join('classes', 'notes.classe_id', '=', 'classes.id')->where('categorie_classe','maternelle')->where('note', '>=', 0)->where('note', '<=', 5)->count()],
        ['name' => '6-10', 'value' => DB::table('notes')->join('classes', 'notes.classe_id', '=', 'classes.id')->where('categorie_classe','maternelle')->where('note', '>=', 6)->where('note', '<=', 10)->count()],
        ['name' => '11-15', 'value' => DB::table('notes')->join('classes', 'notes.classe_id', '=', 'classes.id')->where('categorie_classe','maternelle')->where('note', '>=', 11)->where('note', '<=', 15)->count()],
        ['name' => '16-20', 'value' => DB::table('notes')->join('classes', 'notes.classe_id', '=', 'classes.id')->where('categorie_classe','maternelle')->where('note', '>=', 16)->where('note', '<=', 20)->count()],
    ];

    return response()->json($data);
}
public function repartitionNotesPrimaire()
{
    // Regroupe les notes du secondaire par tranche
    $data = [
        ['name' => '0-5', 'value' => DB::table('notes')->join('classes', 'notes.classe_id', '=', 'classes.id')->where('categorie_classe','primaire')->where('note', '>=', 0)->where('note', '<=', 5)->count()],
        ['name' => '6-10', 'value' => DB::table('notes')->join('classes', 'notes.classe_id', '=', 'classes.id')->where('categorie_classe','primaire')->where('note', '>=', 6)->where('note', '<=', 10)->count()],
        ['name' => '11-15', 'value' => DB::table('notes')->join('classes', 'notes.classe_id', '=', 'classes.id')->where('categorie_classe','primaire')->where('note', '>=', 11)->where('note', '<=', 15)->count()],
        ['name' => '16-20', 'value' => DB::table('notes')->join('classes', 'notes.classe_id', '=', 'classes.id')->where('categorie_classe','primaire')->where('note', '>=', 16)->where('note', '<=', 20)->count()],
    ];

    return response()->json($data);
}
public function repartitionNotesSecondaire()
{
    // Regroupe les notes du secondaire par tranche
    $data = [
        ['name' => '0-5', 'value' => DB::table('notes')->join('classes', 'notes.classe_id', '=', 'classes.id')->where('categorie_classe','secondaire')->where('note', '>=', 0)->where('note', '<=', 5)->count()],
        ['name' => '6-10', 'value' => DB::table('notes')->join('classes', 'notes.classe_id', '=', 'classes.id')->where('categorie_classe','secondaire')->where('note', '>=', 6)->where('note', '<=', 10)->count()],
        ['name' => '11-15', 'value' => DB::table('notes')->join('classes', 'notes.classe_id', '=', 'classes.id')->where('categorie_classe','secondaire')->where('note', '>=', 11)->where('note', '<=', 15)->count()],
        ['name' => '16-20', 'value' => DB::table('notes')->join('classes', 'notes.classe_id', '=', 'classes.id')->where('categorie_classe','secondaire')->where('note', '>=', 16)->where('note', '<=', 20)->count()],
    ];

    return response()->json($data);
}

public function repartitionNotes()
{
    // Regroupe les notes du secondaire par tranche
    $data = [
        ['name' => '0-5', 'value' => DB::table('notes')->join('classes', 'notes.classe_id', '=', 'classes.id')->where('note', '>=', 0)->where('note', '<=', 5)->count()],
        ['name' => '6-10', 'value' => DB::table('notes')->join('classes', 'notes.classe_id', '=', 'classes.id')->where('note', '>=', 6)->where('note', '<=', 10)->count()],
        ['name' => '11-15', 'value' => DB::table('notes')->join('classes', 'notes.classe_id', '=', 'classes.id')->where('note', '>=', 11)->where('note', '<=', 15)->count()],
        ['name' => '16-20', 'value' => DB::table('notes')->join('classes', 'notes.classe_id', '=', 'classes.id')->where('note', '>=', 16)->where('note', '<=', 20)->count()],
    ];

    return response()->json($data);
}

}

