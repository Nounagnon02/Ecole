<?php
// BulletinController.php

namespace App\Http\Controllers;

use App\Models\Notes;
use App\Models\Eleves;
use App\Models\Matieres;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Classes;

class BulletinController extends Controller
{
    // Calcul de la moyenne des interrogations
    private function calculerMoyenneInterrogations($eleveId, $matiereId, $periode)
    {
        $interrogations = Notes::where([
            'eleve_id' => $eleveId,
            'matiere_id' => $matiereId,
            'periode' => $periode,
            'type_evaluation' => 'Interrogation'
        ])->get();

        if ($interrogations->isEmpty()) {
            return 0; // Retourne 0 si aucune interrogation trouvée
        }

        $somme = $interrogations->sum('note');
        return round($somme / $interrogations->count(), 2);
    }

    

    private function calculerMoyenneMatiere($eleveId, $matiereId, $periode)
    {
        try {
            $notes = Notes::where([
                'eleve_id' => $eleveId,
                'matiere_id' => $matiereId,
                'periode' => $periode
            ])->get()->groupBy('type_evaluation');

            // Add debug logging
            Log::debug("Notes for eleve $eleveId, matiere $matiereId:", [
                'notes' => $notes->toArray(),
                'count' => $notes->count()
            ]);

        // Cas Secondaire (Devoirs/Interrogations)
                if (
                    ($notes->has('Devoir1') && $notes->get('Devoir1')->count() > 0) ||
                    ($notes->has('Devoir2') && $notes->get('Devoir2')->count() > 0) ||
                    ($notes->has('Interrogation') && $notes->get('Interrogation')->count() > 0)
                ) {
                    $noteDevoir1 = ($notes->has('Devoir1') && $notes->get('Devoir1')->count() > 0)
                        ? $notes->get('Devoir1')->first()->note : 0;
                    $noteDevoir2 = ($notes->has('Devoir2') && $notes->get('Devoir2')->count() > 0)
                        ? $notes->get('Devoir2')->first()->note : 0;
                    $moyenneInterros = ($notes->has('Interrogation') && $notes->get('Interrogation')->count() > 0)
                        ? $notes->get('Interrogation')->avg('note') : 0;

                    // Calcul de la moyenne (évite la division par zéro)
                    $nb = 0;
                    if ($notes->has('Devoir1') && $notes->get('Devoir1')->count() > 0) $nb++;
                    if ($notes->has('Devoir2') && $notes->get('Devoir2')->count() > 0) $nb++;
                    if ($notes->has('Interrogation') && $notes->get('Interrogation')->count() > 0) $nb++;
                    $nb = $nb > 0 ? $nb : 1;

                    $moyenne = ($noteDevoir1 + $noteDevoir2 + $moyenneInterros) / 3;
                    return round($moyenne, 2);
                }else{
                    $noteDevoir1 =  0;
                    $noteDevoir2 = 0;
                    $moyenneInterros = 0;

                    // Calcul de la moyenne (évite la division par zéro)
                    

                    $moyenne = 0;
                    return round($moyenne, 2);
                }

                // Cas Maternelle/Primaire (évaluations)
                $evalTypes = [
                    '1ère evaluation', '2ème evaluation', '3ème evaluation',
                    '4ème evaluation', '5ème evaluation', '6ème evaluation'
                ];

                // Si toutes les évaluations sont présentes
                $allEvalPresent = true;
                $evalSums = 0;
                $evalCount = 0;
                foreach ($evalTypes as $type) {
                    if ($notes->has($type) && $notes->get($type)->count() > 0) {
                        $evalSums += $notes->get($type)->avg('note');
                        $evalCount++;
                    } else {
                        $allEvalPresent = false;
                    }
                }
                if ($evalCount > 0) {
                    $moyenneTotale = $evalSums / $evalCount;
                    Log::info("Moyenne évaluations calculée pour élève $eleveId, matière $matiereId: $moyenneTotale");
                    return round($moyenneTotale, 2);
                }

                // Si aucun cas ne correspond, retourne 0
                return 0;
        } catch (\Exception $e) {
            Log::error('Erreur calcul moyenne matière: ' . $e->getMessage());
            return 0;
        }
    }

    private function getCoefficientMatiere($serieId, $matiereId)
    {
        $coefficient = DB::table('serie_matieres')
            ->where('serie_id', $serieId)
            ->where('matiere_id', $matiereId)
            ->value('coefficient');
            
        // Retourne 1 si coefficient null ou 0
        return $coefficient ?: 1;
    }

    // Méthode utilitaire pour formater les données de l'élève
    private function formatEleveData($eleve, $categorie)
    {
        $data = [
            'nom' => $eleve->nom,
            'prenom' => $eleve->prenom,
            'matricule' => $eleve->numero_matricule,
            'classe' => $eleve->classe->nom_classe,
        ];

        if ($categorie !== 'Maternelle' && $categorie !== 'Primaire') {
            $data['serie'] = $eleve->serie->nom ?? 'Non défini';
        }

        if ($categorie) {
            $data['categorie'] = $categorie;
        }

        return $data;
    }


    public function getNotesDevoirs($eleveId, $matiereId, $periode)
    {
        $notes = Notes::where([
            'eleve_id' => $eleveId,
            'matiere_id' => $matiereId,
            'periode' => $periode,
            'type_evaluation' => 'Devoir1' || 'Devoir2'
        ])->get();
        if ($notes->isEmpty()) {
            return 0; // Retourne 0 si aucune note trouvée
        }
        return $notes;
    }

    //Recuper les moyennes d'interrogation , de devoir de tous les eleves

    public function GenerateFile(Request $request)
    {
        try {
            Log::info('GenerateFile request received', $request->all());

            $classe_id = $request->query('classe_id');
            $serie_id = $request->query('serie_id');
            $matiere_id = $request->query('matiere_id');
            $periode = $request->query('periode');
            $categorie_id = $request->query('categorie_id');

            $query = Eleves::query();

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

            Log::info('Executing query: ' . $query->toSql(), $query->getBindings());

            $eleves = $query->get();
            
            Log::info('Found ' . $eleves->count() . ' eleves.');

            $data = [];
            foreach ($eleves as $eleve) {
                $moyenneInterrogations = $this->calculerMoyenneInterrogations($eleve->id, $matiere_id, $periode);
                $moyenneDevoirs = $this->getNotesDevoirs($eleve->id, $matiere_id, $periode);
                $data[] = [
                    'eleve_id' => $eleve->id,
                    'nom' => $eleve->nom,
                    'prenom' => $eleve->prenom,
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
            $periode = $request->get('periode', 'Semestre 1');
            
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
            if (!Eleves::where('id', $eleveId)->exists()) {
                throw new \Exception("Élève avec ID $eleveId non trouvé");
            }
            Log::info("Élève trouvé, chargement des matières et coefficients");
            // Charger l'élève avec ses relations, incluant les matières et coefficients
            // Utiliser with pour charger les relations nécessaires
            Log::info("Chargement des matières pour l'élève ID: $eleveId");
            
            $eleve = Eleves::with([
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
                'classe_id' => $eleve->class_id,
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
                        $rangEval = $this->calculateRankEvaluation($eleveId, $matiere->id, $eleve->class_id, $periode, $type);
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
                        'rang' => $this->calculateRank($eleveId, $eleve->class_id,$eleve->serie_id, $periode),
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
                        $rangEval = $this->calculateRankEvaluation($eleveId, $matiere->id, $eleve->class_id, $periode, $type);
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
                        'rang' => $this->calculateRank($eleveId, $eleve->class_id,$eleve->serie_id, $periode),
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
                $rangMatiere = $this->calculateRankMatiere($eleveId, $matiere->id, $eleve->class_id,$eleve->serie_id, $periode);

                
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
            $rangGeneral = $this->calculateRank($eleveId, $eleve->class_id,$eleve->serie_id, $periode);

            /*return response()->json([
                'success' => true,
                'data' => [
                    'eleve' => [
                        'nom' => $eleve->nom,
                        'prenom' => $eleve->prenom,
                        'matricule' => $eleve->numero_matricule,
                        'classe' => $eleve->classe->nom_classe,
                        'serie' => $eleve->serie->nom
                    ],
                    'rang' => $this->calculateRank($eleveId,$eleve->classe_id,$periode),
                    'periode' => $periode,
                    'moyennes_par_matiere' => $moyennesParMatiere,
                    'moyenne_generale' => $moyenneGenerale,
                    'debug_info' => [
                        'total_matieres' => count($moyennesParMatiere),
                        'total_coefficients' => $totalCoefficients
                    ]
                ]
            ]);*/

            return response()->json([
                'success' => true,
                'data' => [
                    'eleve' => [
                        'nom' => $eleve->nom,
                        'prenom' => $eleve->prenom,
                        'matricule' => $eleve->numero_matricule,
                        'classe' => $eleve->classe->nom_classe,
                        'serie' => $eleve->serie->nom,
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
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur génération bulletin: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du bulletin: ' . $e->getMessage()
            ], 500);
        }
    }

    

    // Rang général pour toutes les evaluations d'un élève dans une classe et une période
    private function calculateRankEvaluation1($eleveId, $classeId, $periode, $type, $matieres)
    {
        try {
            // Récupérer tous les élèves de la classe
            $eleves = Eleves::where('class_id', $classeId)->get();
            
            $moyennes = [];
            
            foreach ($eleves as $eleve) {
                $moyenneEleve = 0;
                foreach ($matieres as $matiere) {
                    $moyenneEleve += $this->getNote($eleve->id, $matiere->id, $periode, $type);
                }
                if ($moyenneEleve > 0) { // Seulement si l'élève a des notes
                    $moyennes[] = [
                        'id' => $eleve->id,
                        'moyenne' => round($moyenneEleve / count($matieres), 2)
                    ];
                }
            }
            
            // Trier par moyenne décroissante
            usort($moyennes, function($a, $b) {
                return $b['moyenne'] <=> $a['moyenne'];
            });
            
            // Trouver la position de l'élève
            $position = null;
            foreach ($moyennes as $index => $item) {
                if ($item['id'] == $eleveId) {
                    $position = $index + 1;
                    break;
                }
            }
            
            return [
                'position' => $position,
                'total_eleves' => count($moyennes)
            ];
        } catch (\Exception $e) {
            Log::error('Erreur calcul rang général: ' . $e->getMessage());
            return [
                'position' => null,
                'total_eleves' => 0
            ];
        }
    }

    // Fonction pour obtenir une note spécifique
    private function getNote($eleveId, $matiereId, $periode, $typeEvaluation)
    {
        $note = Notes::where([
            'eleve_id' => $eleveId,
            'matiere_id' => $matiereId,
            'periode' => $periode,
            'type_evaluation' => $typeEvaluation
        ])->first();

        $result = $note ? $note->note : 0;
        Log::info("Note $typeEvaluation pour élève $eleveId, matière $matiereId: $result");
        
        return $result;
    }

    // Calcul de la moyenne générale pour un élève
    private function calculerMoyenneGenerale($eleveId, $periode)
    {
        $eleve = Eleves::with(['serie.matieres'])->find($eleveId);
        if (!$eleve) return 0;

        $matieres = $eleve->serie->matieres;
        $moyenneGenerale = 0;
        $totalCoefficients = 0;

        foreach ($matieres as $matiere) {
            $moyenne = $this->calculerMoyenneMatiere($eleveId, $matiere->id, $periode);
            $coefficient = $this->getCoefficientMatiere($eleve->serie->id, $matiere->id);
            $moyenneGenerale += ($moyenne * $coefficient);
            $totalCoefficients += $coefficient;
        }

        return $totalCoefficients > 0 ? round($moyenneGenerale / $totalCoefficients, 2) : 0;
    }

    // Calcul du rang
    /*private function calculateRank($eleveId, $classeId, $periode)
    {
        try {
            // Récupérer tous les élèves de la classe
            $eleves = Eleves::where('class_id', $classeId)->get();
            
            $moyennes = [];
            
            foreach ($eleves as $eleve) {
                $moyenneEleve = $this->calculerMoyenneGenerale($eleve->id, $periode);
                if ($moyenneEleve > 0) { // Seulement si l'élève a des notes
                    $moyennes[] = [
                        'id' => $eleve->id,
                        'moyenne' => $moyenneEleve
                    ];
                }
            }
            
            // Trier par moyenne décroissante
            usort($moyennes, function($a, $b) {
                return $b['moyenne'] <=> $a['moyenne'];
            });
            
            // Trouver la position de l'élève
            $position = null;
            foreach ($moyennes as $index => $item) {
                if ($item['id'] == $eleveId) {
                    $position = $index + 1;
                    break;
                }
            }
            
            return [
                'position' => $position,
                'total_eleves' => count($moyennes)
            ];
        } catch (\Exception $e) {
            Log::error('Erreur calcul rang: ' . $e->getMessage());
            return [
                'position' => null,
                'total_eleves' => 0
            ];
        }
    }*/

    private function calculateRank($eleveId, $classeId,$serieId, $periode)
    {
        try {
            $eleves = Eleves::where('class_id', $classeId)->where('serie_id',$serieId)->get();
            $moyennes = [];
            
            foreach ($eleves as $eleve) {
                $moyenneEleve = $this->calculerMoyenneGenerale($eleve->id, $periode);
                // Include all students, even those with 0 average
                $moyennes[] = [
                    'id' => $eleve->id,
                    'moyenne' => $moyenneEleve
                ];
            }
            
            // Sort by descending average
            usort($moyennes, function($a, $b) {
                return $b['moyenne'] <=> $a['moyenne'];
            });
            
            // Find position
            $position = null;
            foreach ($moyennes as $index => $item) {
                if ($item['id'] == $eleveId) {
                    $position = $index + 1;
                    break;
                }
            }
            
            return [
                'position' => $position,
                'total_eleves' => count($moyennes)
            ];
        } catch (\Exception $e) {
            Log::error('Erreur calcul rang: ' . $e->getMessage());
            return [
                'position' => null,
                'total_eleves' => 0
            ];
        }
    }



    private function calculateRankEvaluation($eleveId, $classeId, $periode)
    {
        try {
            // Récupérer tous les élèves de la classe
            $eleves = Eleves::where('class_id', $classeId)->get();
            
            $moyennes = [];
            
            foreach ($eleves as $eleve) {
                $moyenneEleve = $this->calculerMoyenneGenerale($eleve->id, $periode);
                if ($moyenneEleve > 0) { // Seulement si l'élève a des notes
                    $moyennes[] = [
                        'id' => $eleve->id,
                        'moyenne' => $moyenneEleve
                    ];
                }
            }
            
            // Trier par moyenne décroissante
            usort($moyennes, function($a, $b) {
                return $b['moyenne'] <=> $a['moyenne'];
            });
            
            // Trouver la position de l'élève
            $position = null;
            foreach ($moyennes as $index => $item) {
                if ($item['id'] == $eleveId) {
                    $position = $index + 1;
                    break;
                }
            }
            
            return [
                'position' => $position,
                'total_eleves' => count($moyennes)
            ];
        } catch (\Exception $e) {
            Log::error('Erreur calcul rang: ' . $e->getMessage());
            return [
                'position' => null,
                'total_eleves' => 0
            ];
        }
    }


    
    // Rang par matière pour un élève dans une classe et une période
    private function calculateRankMatiere($eleveId, $matiereId, $classeId,$serieId, $periode)
    {
        try {
            $eleves = \App\Models\Eleves::where('class_id', $classeId)->where('serie_id', $serieId)->get();
            $moyennes = [];
    
            foreach ($eleves as $eleve) {
                $moyenne = $this->calculerMoyenneMatiere($eleve->id, $matiereId, $periode);
                if ($moyenne > 0) {
                    $moyennes[] = [
                        'id' => $eleve->id,
                        'moyenne' => $moyenne
                    ];
                }
            }
    
            usort($moyennes, function($a, $b) {
                return $b['moyenne'] <=> $a['moyenne'];
            });
    
            $position = null;
            foreach ($moyennes as $index => $item) {
                if ($item['id'] == $eleveId) {
                    $position = $index + 1;
                    break;
                }
            }
    
            return [
                'position' => $position,
                'total_eleves' => count($moyennes)
            ];
        } catch (\Exception $e) {
            return [
                'position' => null,
                'total_eleves' => 0
            ];
        }
    }
    // Méthode pour débugger les données d'un élève
    public function debugEleve($eleveId, Request $request)
    {
        $periode = $request->get('periode', 'Semestre 1');
        
        // Récupérer toutes les notes de l'élève
        $notes = Notes::where('eleve_id', $eleveId)
                    ->where('periode', $periode)
                    ->with(['matiere'])
                    ->get();
        
        // Récupérer les informations de l'élève
        $eleve = Eleves::with(['classe', 'serie.matieres'])->find($eleveId);
        
        return response()->json([
            'eleve' => $eleve,
            'notes' => $notes,
            'periode' => $periode,
            'total_notes' => $notes->count()
        ]);
    }
}