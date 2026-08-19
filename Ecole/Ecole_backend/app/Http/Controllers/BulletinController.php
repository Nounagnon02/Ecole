<?php
// BulletinController.php

namespace App\Http\Controllers;

use App\Models\Notes;
use App\Models\Eleve;
use App\Models\Matieres;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Classes;

class BulletinController extends Controller
{
    /** @var \Illuminate\Support\Collection|null Cache of all notes for a class+period (keyed by eleve_id then matiere_id). */
    private ?\Illuminate\Support\Collection $_cachedNotes = null;

    /**
     * Load ALL notes for a given class, period, and annee_scolaire in ONE query.
     * Results are cached per instance so repeated calls during rank computation
     * do not hit the database again.
     *
     * @return \Illuminate\Support\Collection  notes grouped by eleve_id → matiere_id
     */
    private function loadAllNotesForClass($classeId, $periode, $anneeScolaire = null): \Illuminate\Support\Collection
    {
        if ($this->_cachedNotes !== null) {
            return $this->_cachedNotes;
        }

        $query = Notes::where('classe_id', $classeId)
            ->where('periode', $periode)
            ->with('matiere');

        if ($anneeScolaire) {
            $query->where('annee_scolaire', $anneeScolaire);
        }

        $this->_cachedNotes = $query->get()->groupBy('eleve_id')->map(
            fn($notesEleve) => $notesEleve->groupBy('matiere_id')
        );

        return $this->_cachedNotes;
    }

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

        // Ramené sur 20 comme partout ailleurs : la moyenne brute traitait
        // un 8/10 comme un 8/20.
        return round($this->normalizeToTwenty($interrogations), 2);
    }

    

    /**
     * Moyenne d'un lot de notes, ramenée sur 20.
     *
     * `note_sur` est saisissable par l'enseignant (défaut 20) : une note de
     * 8/10 doit compter pour 16/20, pas 8/20. BulletinService normalisait déjà
     * ainsi ; ce contrôleur ne le faisait pas, et les deux chemins de calcul
     * donnaient donc des moyennes différentes pour le même élève.
     *
     * @param  \Illuminate\Support\Collection  $notes
     */
    private function normalizeToTwenty($notes): float
    {
        $valeurs = $notes
            ->map(function ($n) {
                $bareme = (float) ($n->note_sur ?: 20);

                return $bareme > 0 ? ((float) $n->note / $bareme) * 20 : 0.0;
            })
            ->filter(fn($v) => $v !== null);

        return $valeurs->isEmpty() ? 0.0 : (float) $valeurs->avg();
    }

    private function calculerMoyenneMatiere($eleveId, $matiereId, $periode)
    {
        try {
            $notes = Notes::where([
                'eleve_id' => $eleveId,
                'matiere_id' => $matiereId,
                'periode' => $periode
            ])->get()->groupBy('type_evaluation');

            // ── Cas Secondaire : Devoir1 / Devoir2 / Interrogations ──────────
            //
            // La moyenne se fait sur les évaluations RÉELLEMENT présentes.
            // L'ancien code divisait par 3 en dur (la variable `$nb` était
            // calculée puis ignorée) : un élève noté seulement sur Devoir1 à
            // 15/20 obtenait 5/20 (cf. audit F3).
            $composantes = [];

            foreach (['Devoir1', 'Devoir2'] as $type) {
                if ($notes->has($type)) {
                    $composantes[] = $this->normalizeToTwenty($notes->get($type)->take(1));
                }
            }

            if ($notes->has('Interrogation')) {
                $composantes[] = $this->normalizeToTwenty($notes->get('Interrogation'));
            }

            if (!empty($composantes)) {
                return round(array_sum($composantes) / count($composantes), 2);
            }

            // ── Cas Maternelle/Primaire : évaluations numérotées ─────────────
            //
            // Ce bloc était inaccessible : les deux branches du if/else
            // précédent retournaient, donc les moyennes maternelle/primaire
            // valaient toujours 0 (cf. audit F3).
            $evalTypes = [
                '1ère evaluation', '2ème evaluation', '3ème evaluation',
                '4ème evaluation', '5ème evaluation', '6ème evaluation',
            ];

            $evalMoyennes = [];
            foreach ($evalTypes as $type) {
                if ($notes->has($type)) {
                    $evalMoyennes[] = $this->normalizeToTwenty($notes->get($type));
                }
            }

            if (!empty($evalMoyennes)) {
                return round(array_sum($evalMoyennes) / count($evalMoyennes), 2);
            }

            // Aucune note pour cette matière sur cette période.
            return 0;
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
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
        // `eleves` ne porte pas de colonne nom/prenom — l'identité est sur
        // la relation `user`. Ces deux champs renvoyaient null.
        $data = [
            'nom' => $eleve->user->name ?? '',
            'prenom' => $eleve->user->prenom ?? '',
            'matricule' => $eleve->numero_matricule,
            'classe' => $eleve->classe->nom_classe ?? '',
        ];

        if ($categorie !== 'Maternelle' && $categorie !== 'Primaire') {
            $data['serie'] = $eleve->serie->nom ?? 'Non défini';
        }

        if ($categorie) {
            $data['categorie'] = $categorie;
        }

        return $data;
    }


    /**
     * Compute a student's general average from pre-loaded cached notes.
     * Avoids N+1 queries that `calculerMoyenneGenerale` would cause.
     */
    private function calculerMoyenneGeneraleFromCache($eleve, $notesEleve, $periode): float
    {
        if (!$eleve->serie || !$eleve->serie->matieres) {
            return 0;
        }

        $moyenneGenerale = 0;
        $totalCoefficients = 0;

        foreach ($eleve->serie->matieres as $matiere) {
            $notesMat = $notesEleve->get($matiere->id, collect());
            $moyenne = $this->calculerMoyenneMatiereFromNotes($notesMat);
            $coefficient = $this->getCoefficientMatiere($eleve->serie->id, $matiere->id);
            $moyenneGenerale += ($moyenne * $coefficient);
            $totalCoefficients += $coefficient;
        }

        return $totalCoefficients > 0 ? round($moyenneGenerale / $totalCoefficients, 2) : 0;
    }

    /**
     * Compute a subject average from a pre-loaded collection of notes.
     * Replaces per-student per-subject DB queries in rank calculation.
     */
    private function calculerMoyenneMatiereFromNotes($notes): float
    {
        if ($notes->isEmpty()) {
            return 0;
        }

        $grouped = $notes->groupBy('type_evaluation');

        $composantes = [];
        foreach (['Devoir1', 'Devoir2'] as $type) {
            if ($grouped->has($type)) {
                $composantes[] = $this->normalizeToTwenty($grouped->get($type)->take(1));
            }
        }
        if ($grouped->has('Interrogation')) {
            $composantes[] = $this->normalizeToTwenty($grouped->get('Interrogation'));
        }
        if (!empty($composantes)) {
            return round(array_sum($composantes) / count($composantes), 2);
        }

        $evalTypes = [
            '1ère evaluation', '2ème evaluation', '3ème evaluation',
            '4ème evaluation', '5ème evaluation', '6ème evaluation',
        ];
        $evalMoyennes = [];
        foreach ($evalTypes as $type) {
            if ($grouped->has($type)) {
                $evalMoyennes[] = $this->normalizeToTwenty($grouped->get($type));
            }
        }

        return !empty($evalMoyennes) ? round(array_sum($evalMoyennes) / count($evalMoyennes), 2) : 0;
    }

    public function getNotesDevoirs($eleveId, $matiereId, $periode)
    {
        // `'Devoir1' || 'Devoir2'` s'évaluait en booléen `true` : la requête
        // filtrait donc sur `type_evaluation = 1` et ne renvoyait jamais de
        // devoir. Il faut un whereIn.
        $notes = Notes::where([
            'eleve_id' => $eleveId,
            'matiere_id' => $matiereId,
            'periode' => $periode,
        ])
            ->whereIn('type_evaluation', ['Devoir1', 'Devoir2'])
            ->get();

        return $notes->isEmpty() ? 0 : $notes;
    }

    //Recuper les moyennes d'interrogation , de devoir de tous les eleves

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
                ]
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

    

    // Rang général pour toutes les evaluations d'un élève dans une classe et une période
    private function calculateRankEvaluation1($eleveId, $classeId, $periode, $type, $matieres)
    {
        try {
            // Récupérer tous les élèves de la classe
            $eleves = Eleve::where('classe_id', $classeId)->get();
            
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
            $this->rethrowIfMeaningful($e);
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
        $eleve = Eleve::with(['serie.matieres'])->find($eleveId);
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
            $eleves = Eleve::where('classe_id', $classeId)->get();
            
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
            $this->rethrowIfMeaningful($e);
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
            $allNotesByEleve = $this->loadAllNotesForClass($classeId, $periode);

            $eleves = Eleve::with('serie.matieres')
                ->where('classe_id', $classeId)
                ->where('serie_id', $serieId)
                ->get();

            $moyennes = [];

            foreach ($eleves as $eleve) {
                $notesEleve = $allNotesByEleve->get($eleve->id, collect());
                $moyenneEleve = $this->calculerMoyenneGeneraleFromCache($eleve, $notesEleve, $periode);
                $moyennes[] = [
                    'id' => $eleve->id,
                    'moyenne' => $moyenneEleve
                ];
            }

            usort($moyennes, fn($a, $b) => $b['moyenne'] <=> $a['moyenne']);

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
            $this->rethrowIfMeaningful($e);
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
            $allNotesByEleve = $this->loadAllNotesForClass($classeId, $periode);

            $eleves = Eleve::with('serie.matieres')
                ->where('classe_id', $classeId)
                ->get();

            $moyennes = [];

            foreach ($eleves as $eleve) {
                $notesEleve = $allNotesByEleve->get($eleve->id, collect());
                $moyenneEleve = $this->calculerMoyenneGeneraleFromCache($eleve, $notesEleve, $periode);
                if ($moyenneEleve > 0) {
                    $moyennes[] = [
                        'id' => $eleve->id,
                        'moyenne' => $moyenneEleve
                    ];
                }
            }

            usort($moyennes, fn($a, $b) => $b['moyenne'] <=> $a['moyenne']);

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
            $this->rethrowIfMeaningful($e);
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
            $allNotesByEleve = $this->loadAllNotesForClass($classeId, $periode);

            $eleves = Eleve::with('user:id,name,prenom')
                ->where('classe_id', $classeId)
                ->where('serie_id', $serieId)
                ->get();
            $moyennes = [];

            foreach ($eleves as $eleve) {
                $notesMat = ($allNotesByEleve->get($eleve->id, collect()))->get($matiereId, collect());
                $moyenne = $this->calculerMoyenneMatiereFromNotes($notesMat);
                if ($moyenne > 0) {
                    $moyennes[] = [
                        'id' => $eleve->id,
                        'moyenne' => $moyenne
                    ];
                }
            }

            usort($moyennes, fn($a, $b) => $b['moyenne'] <=> $a['moyenne']);

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
            $this->rethrowIfMeaningful($e);
            return [
                'position' => null,
                'total_eleves' => 0
            ];
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