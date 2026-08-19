<?php

namespace App\Http\Controllers\Bulletin;

use App\Http\Controllers\Controller;
use App\Models\Notes;
use App\Models\Eleve;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BulletinController extends Controller
{
    use BulletinCalculation;

    public function GenerateFile(Request $request)
    {
        try {
            Log::debug('GenerateFile', ['keys' => array_keys($request->all())]);

            $classe_id = $request->query('classe_id');
            $serie_id = $request->query('serie_id');
            $matiere_id = $request->query('matiere_id');
            $periode = $request->query('periode');
            $categorie_id = $request->query('categorie_id');

            $query = Eleve::with('user:id,name,prenom');

            if ($classe_id) {
                $query->where('class_id', $classe_id);
            }
            if ($serie_id) {
                $query->where('serie_id', $serie_id);
            }
            
            if ($categorie_id) {
                $query->whereHas('classe', function($q) use ($categorie_id) {
                    $q->where('categorie_classe', $categorie_id);
                });
            }


            $eleves = $query->get();
            

            $data = [];
            foreach ($eleves as $eleve) {
                $moyenneInterrogations = $this->calculerMoyenneInterrogations($eleve->id, $matiere_id, $periode);
                $moyenneDevoirs = $this->getNotesDevoirs($eleve->id, $matiere_id, $periode);
                $data[] = [
                    'eleve_id' => $eleve->id,
                    'nom' => $eleve->user->name ?? '',
                    'prenom' => $eleve->user->prenom ?? '',
                    'numero_matricule' => $eleve->numero_matricule,
                    'moyenne_interrogations' => $moyenneInterrogations,
                    'Devoirs' => $moyenneDevoirs,
                    'periode' => $periode
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            Log::error('Error in GenerateFile: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'An internal server error occurred.'
            ], 500);
        }
    }

    public function getBulletin($eleveId, Request $request)
    {
        try {
            // Validation de la période
            $periode = $request->get('periode', 'Trimestre 1');
            
            // Récupérer l'élève avec ses relations de base
            if (!$eleveId) {
                throw new \Exception("ID de l'élève manquant");
            }
            if (!is_numeric($eleveId)) {
                throw new \Exception("ID de l'élève invalide");
            }
            if ($eleveId <= 0) {
                throw new \Exception("ID de l'élève doit être supérieur à 0");
            }
            Log::info("Récupération du bulletin pour l'élève ID: $eleveId, période: $periode");
            // Récupérer l'élève avec ses relations
            // Utiliser with pour charger les relations nécessaires
            Log::info("Chargement des données pour l'élève ID: $eleveId");
            if (!Eleve::where('id', $eleveId)->exists()) {
                throw new \Exception("Élève avec ID $eleveId non trouvé");
            }
            Log::info("Élève trouvé, chargement des matières et coefficients");
            // Charger l'élève avec ses relations, incluant les matières et coefficients
            // Utiliser with pour charger les relations nécessaires
            Log::info("Chargement des matières pour l'élève ID: $eleveId");
            
            $eleve = Eleve::with([
                'user:id,name,prenom',
                'classe',
                'serie.matieres' => function($query) {
                    $query->select([
                        'matieres.*',
                        'serie_matieres.coefficient'
                    ]);
                }
            ])->findOrFail($eleveId);

            // Debug des matières trouvées
            Log::info("Matières pour l'élève {$eleveId}:", [
                'classe_id' => $eleve->classe_id,
                'serie_id' => $eleve->serie->id,
                'matieres' => $eleve->serie->matieres->map(function($m) {
                    return [
                        'id' => $m->id,
                        'nom' => $m->nom,
                        'coefficient' => $m->pivot->coefficient,
                        'classe_id' => $m->pivot->classe_id
                    ];
                })->toArray()
            ]);

            // Clé de cache basée sur l'élève, la période et l'année scolaire
            $anneeScolaire = now()->year;
            $cacheKey = "bulletin_{$eleveId}_{$periode}_{$anneeScolaire}";

            $result = Cache::remember($cacheKey, 300, function () use ($eleve, $eleveId, $periode) {
                // Récupérer la catégorie de la classe
                $categorie = $eleve->classe->categorie_classe ?? '';

                // --- Bloc d'adaptation selon la catégorie ---
                if ($categorie === 'maternelle') {
                    
                    $evaluations = [];
                    $types = ['1ère évaluation','2ème évaluation','3ème évaluation','4ème évaluation','5ème évaluation'];
                    foreach ($eleve->serie->matieres as $matiere) {
                        $evals = [];
                        foreach ($types as $type) {
                            $note = $this->getNote($eleveId, $matiere->id, $periode, $type);
                            $moye = $this->calculerMoyenneMatiere($eleveId, $matiere->id, $periode);
                            // Rang par matière pour cette évaluation
                            $rangEval = $this->calculateRankEvaluation($eleveId, $matiere->id, $eleve->classe_id, $periode, $type);
                            // Rang général pour cette évaluation (toutes matières confondues)
                            //$rangGeneralEval = $this->calculateRankGeneralEvaluation($eleveId, $eleve->classe_id, $periode, $type, $eleve->serie->matieres);

                            $evals[] = [
                                'type' => $type,
                                'note' => $note,
                                'rang' => $rangEval,
                                //'rang_general' => $rangGeneralEval
                            ];
                        }
                        $evaluations[] = [
                            'matiere' => $matiere->nom,
                            'evaluations' => $evals
                        ];
                    }
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'eleve' => $this->formatEleveData($eleve, $categorie),
                            'periode' => $periode,
                            'evaluations' => $evaluations,
                            'rang' => $this->calculateRank($eleveId, $eleve->classe_id,$eleve->serie_id, $periode),
                        ]
                    ]);
                }


                // Fin bloc maternelle

                // Bloc Primaire 
                if ($categorie === 'primaire') {
                    
                    $evaluations = [];
                    $types = ['1ère évaluation','2ème évaluation','3ème évaluation','4ème évaluation','5ème évaluation'];
                    foreach ($eleve->serie->matieres as $matiere) {
                        $evals = [];
                        foreach ($types as $type) {
                            $note = $this->getNote($eleveId, $matiere->id, $periode, $type);
                            $moye = $this->calculerMoyenneMatiere($eleveId, $matiere->id, $periode);
                            // Rang par matière pour cette évaluation
                            $rangEval = $this->calculateRankEvaluation($eleveId, $matiere->id, $eleve->classe_id, $periode, $type);
                            // Rang général pour cette évaluation (toutes matières confondues)
                            //$rangGeneralEval = $this->calculateRankGeneralEvaluation($eleveId, $eleve->classe_id, $periode, $type, $eleve->serie->matieres);

                            $evals[] = [
                                'type' => $type,
                                'note' => $note,
                                'rang' => $rangEval,
                                //'rang_general' => $rangGeneralEval
                            ];
                        }
                        $evaluations[] = [
                            'matiere' => $matiere->nom,
                            'evaluations' => $evals
                        ];
                    }
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'eleve' => $this->formatEleveData($eleve, $categorie),
                            'periode' => $periode,
                            'evaluations' => $evaluations,
                            'rang' => $this->calculateRank($eleveId, $eleve->classe_id,$eleve->serie_id, $periode),
                        ]
                    ]);
                }
                //  Fin bloc primaire 
                // Calcul des moyennes
                $moyennesParMatiere = [];
                $moyenneGenerale = 0;
                $totalCoefficients = 0;
                $rangsParMatiere = [];

                foreach ($eleve->serie->matieres as $matiere) {
                    $moyenne = $this->calculerMoyenneMatiere($eleveId, $matiere->id, $periode);
                    
                    // Utiliser le coefficient spécifique à la classe
                    $coefficient = $matiere->pivot->coefficient;
                    $rangMatiere = $this->calculateRankMatiere($eleveId, $matiere->id, $eleve->classe_id,$eleve->serie_id, $periode);

                    
                    $moyennesParMatiere[] = [
                        'matiere' => $matiere->nom,
                        'coefficient' => $coefficient,
                        'moyenne' => $moyenne,
                        'moyenne_ponderee' => round($moyenne * $coefficient, 2),
                        'details' => [
                            'moyenne_interrogations' => $this->calculerMoyenneInterrogations($eleveId, $matiere->id, $periode),
                            'devoir1' => $this->getNote($eleveId, $matiere->id, $periode, 'Devoir1'),
                            'devoir2' => $this->getNote($eleveId, $matiere->id, $periode, 'Devoir2')
                        ],
                        'rang' => $rangMatiere
                    ];
                    
                    $moyenneGenerale += ($moyenne * $coefficient);
                    $totalCoefficients += $coefficient;
                }

                

                // Calcul de la moyenne générale
                $moyenneGenerale = $totalCoefficients > 0 ? round($moyenneGenerale / $totalCoefficients, 2) : 0;
                // Calcul du rang général
                $rangGeneral = $this->calculateRank($eleveId, $eleve->classe_id,$eleve->serie_id, $periode);

                return [
                    'eleve' => [
                        'nom' => $eleve->user->name ?? '',
                        'prenom' => $eleve->user->prenom ?? '',
                        'matricule' => $eleve->numero_matricule,
                        'classe' => $eleve->classe->nom_classe ?? '',
                        // Null-safe : maternelle et primaire n'ont pas de série.
                        'serie' => $eleve->serie->nom ?? null,
                        'categorie' => $categorie // Add category to response
                    ],
                    'rang' => $rangGeneral,
                    'periode' => $periode,
                    'moyennes_par_matiere' => $moyennesParMatiere,
                    'moyenne_generale' => $moyenneGenerale,
                    'debug_info' => [
                        'total_matieres' => count($moyennesParMatiere),
                        'total_coefficients' => $totalCoefficients,
                        //'calculation_details' => $calculationDetails // Add any specific calculation details
                    ]
                ];
            });

            // Si le cache retourne déjà une réponse (maternelle/primaire), la renvoyer directement
            if ($result instanceof \Illuminate\Http\JsonResponse) {
                return $result;
            }

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            Log::error("Erreur génération bulletin: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $this->clientErrorMessage($e, 'Erreur lors de la génération du bulletin')
            ], 500);
        }
    }

    // Méthode pour débugger les données d'un élève
    public function debugEleve($eleveId, Request $request)
    {
        $periode = $request->get('periode', 'Trimestre 1');
        
        // Récupérer toutes les notes de l'élève
        $notes = Notes::where('eleve_id', $eleveId)
                    ->where('periode', $periode)
                    ->with(['matiere'])
                    ->get();
        
        // Récupérer les informations de l'élève
        $eleve = Eleve::with(['classe', 'serie.matieres'])->find($eleveId);
        
        return response()->json([
            'eleve' => $eleve,
            'notes' => $notes,
            'periode' => $periode,
            'total_notes' => $notes->count()
        ]);
    }
}
