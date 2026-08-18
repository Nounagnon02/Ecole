<?php

namespace App\Http\Controllers\Bulletin;

use App\Models\Notes;
use App\Models\Eleve;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

trait BulletinCalculation
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

    private function calculateRank($eleveId, $classeId,$serieId, $periode)
    {
        try {
            $eleves = Eleve::where('classe_id', $classeId)->where('serie_id',$serieId)->get();
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
    }

    // Rang par matière pour un élève dans une classe et une période
    private function calculateRankMatiere($eleveId, $matiereId, $classeId,$serieId, $periode)
    {
        try {
            $eleves = \App\Models\Eleve::where('classe_id', $classeId)->where('serie_id', $serieId)->get();
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
            $this->rethrowIfMeaningful($e);
            return [
                'position' => null,
                'total_eleves' => 0
            ];
        }
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
}
