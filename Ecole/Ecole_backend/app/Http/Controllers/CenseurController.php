<?php

namespace App\Http\Controllers;

use App\Models\{Classes, ConseilClasse, Examen, Notes, Eleves};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CenseurController extends Controller
{
    /**
     * Statistiques générales et résultats par classe
     */
    public function resultats()
    {
        $stats = [
            'moyenne_generale' => round(Notes::avg('note'), 2) ?? 0,
            'taux_reussite' => $this->calculateTauxReussite(),
            'eleves_excellence' => $this->getElevesExcellence(),
            'eleves_difficulte' => $this->getElevesDifficulte(),
            'total_eleves' => Eleves::count(),
            'total_classes' => Classes::count()
        ];

        $resultats = Classes::with(['eleves'])
            ->get()
            ->map(function ($classe) {
                $moyenneClasse = $this->getMoyenneClasse($classe->id);
                return [
                    'id' => $classe->id,
                    'nom' => $classe->nom_classe,
                    'categorie' => $classe->categorie_classe,
                    'effectif' => $classe->eleves->count(),
                    'moyenne' => $moyenneClasse,
                    'admis' => $this->getAdmis($classe->id),
                    'echec' => $this->getEchec($classe->id),
                    'taux_reussite' => $this->getTauxReussiteClasse($classe->id)
                ];
            });

        return response()->json([
            'stats' => $stats,
            'resultats' => $resultats
        ]);
    }

    /**
     * Conseils de classe avec statistiques
     */
    public function conseilsClasse()
    {
        $conseils = ConseilClasse::with(['classe'])
            ->latest()
            ->get()
            ->map(function ($conseil) {
                return [
                    'id' => $conseil->id,
                    'classe' => $conseil->classe->nom_classe,
                    'classe_id' => $conseil->classe_id,
                    'date' => $conseil->date->format('d/m/Y'),
                    'trimestre' => $conseil->trimestre,
                    'participants' => $conseil->participants,
                    'decisions' => $conseil->decisions,
                    'statut' => $conseil->statut
                ];
            });

        return response()->json($conseils);
    }

    /**
     * Liste des examens
     */
    public function examens()
    {
        return response()->json(
            Examen::latest()
                ->get()
                ->map(function ($examen) {
                    return [
                        'id' => $examen->id,
                        'nom' => $examen->nom,
                        'type' => $examen->type,
                        'date_debut' => $examen->date_debut->format('d/m/Y'),
                        'date_fin' => $examen->date_fin->format('d/m/Y'),
                        'classes' => $examen->classes,
                        'matieres' => $examen->matieres,
                        'statut' => $examen->statut
                    ];
                })
        );
    }

    /**
     * Créer un conseil de classe
     */
    public function storeConseilClasse(Request $request)
    {
        $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'date' => 'required|date',
            'trimestre' => 'required|string',
            'participants' => 'array',
            'decisions' => 'array',
            'statut' => 'string|in:planifie,en_cours,termine'
        ]);

        $conseil = ConseilClasse::create($request->all());

        return response()->json([
            'message' => 'Conseil de classe créé avec succès',
            'conseil' => $conseil->load('classe')
        ], 201);
    }

    /**
     * Mettre à jour un conseil de classe
     */
    public function updateConseilClasse(Request $request, $id)
    {
        $conseil = ConseilClasse::findOrFail($id);

        $request->validate([
            'classe_id' => 'sometimes|exists:classes,id',
            'date' => 'sometimes|date',
            'trimestre' => 'sometimes|string',
            'participants' => 'sometimes|array',
            'decisions' => 'sometimes|array',
            'statut' => 'sometimes|string|in:planifie,en_cours,termine'
        ]);

        $conseil->update($request->all());

        return response()->json([
            'message' => 'Conseil de classe mis à jour avec succès',
            'conseil' => $conseil->load('classe')
        ]);
    }

    /**
     * Supprimer un conseil de classe
     */
    public function destroyConseilClasse($id)
    {
        $conseil = ConseilClasse::findOrFail($id);
        $conseil->delete();

        return response()->json([
            'message' => 'Conseil de classe supprimé avec succès'
        ]);
    }

    /**
     * Créer un examen
     */
    public function storeExamen(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:255',
            'type' => 'required|string',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'classes' => 'array',
            'matieres' => 'array',
            'statut' => 'string|in:planifie,en_cours,termine'
        ]);

        $examen = Examen::create($request->all());

        return response()->json([
            'message' => 'Examen créé avec succès',
            'examen' => $examen
        ], 201);
    }

    /**
     * Mettre à jour un examen
     */
    public function updateExamen(Request $request, $id)
    {
        $examen = Examen::findOrFail($id);

        $request->validate([
            'nom' => 'sometimes|string|max:255',
            'type' => 'sometimes|string',
            'date_debut' => 'sometimes|date',
            'date_fin' => 'sometimes|date|after_or_equal:date_debut',
            'classes' => 'sometimes|array',
            'matieres' => 'sometimes|array',
            'statut' => 'sometimes|string|in:planifie,en_cours,termine'
        ]);

        $examen->update($request->all());

        return response()->json([
            'message' => 'Examen mis à jour avec succès',
            'examen' => $examen
        ]);
    }

    /**
     * Supprimer un examen
     */
    public function destroyExamen($id)
    {
        $examen = Examen::findOrFail($id);
        $examen->delete();

        return response()->json([
            'message' => 'Examen supprimé avec succès'
        ]);
    }

    /**
     * Données pour les graphiques du dashboard
     */
    public function statsChart()
    {
        $classes = Classes::with(['eleves'])->get();

        $labels = $classes->pluck('nom_classe')->toArray();
        $moyennes = $classes->map(function ($classe) {
            return round($this->getMoyenneClasse($classe->id), 2);
        })->toArray();

        $effectifs = $classes->map(function ($classe) {
            return $classe->eleves->count();
        })->toArray();

        return response()->json([
            'moyennes' => [
                'labels' => $labels,
                'datasets' => [[
                    'label' => 'Moyenne par classe',
                    'data' => $moyennes,
                    'backgroundColor' => 'rgba(54, 162, 235, 0.2)',
                    'borderColor' => 'rgba(54, 162, 235, 1)',
                    'borderWidth' => 1
                ]]
            ],
            'effectifs' => [
                'labels' => $labels,
                'datasets' => [[
                    'label' => 'Effectif par classe',
                    'data' => $effectifs,
                    'backgroundColor' => 'rgba(255, 99, 132, 0.2)',
                    'borderColor' => 'rgba(255, 99, 132, 1)',
                    'borderWidth' => 1
                ]]
            ],
            'repartition_notes' => $this->getRepartitionNotes()
        ]);
    }

    /**
     * Statistiques détaillées par période
     */
    public function statsPeriode(Request $request)
    {
        $periode = $request->get('periode', 'trimestre1');

        $stats = Notes::where('periode', $periode)
            ->select(
                DB::raw('AVG(note) as moyenne'),
                DB::raw('COUNT(DISTINCT eleve_id) as total_eleves'),
                DB::raw('COUNT(*) as total_notes')
            )
            ->first();

        $repartition = Notes::where('periode', $periode)
            ->select(
                DB::raw('
                    SUM(CASE WHEN note >= 16 THEN 1 ELSE 0 END) as excellence,
                    SUM(CASE WHEN note >= 14 AND note < 16 THEN 1 ELSE 0 END) as bien,
                    SUM(CASE WHEN note >= 12 AND note < 14 THEN 1 ELSE 0 END) as assez_bien,
                    SUM(CASE WHEN note >= 10 AND note < 12 THEN 1 ELSE 0 END) as passable,
                    SUM(CASE WHEN note < 10 THEN 1 ELSE 0 END) as insuffisant
                ')
            )
            ->first();

        return response()->json([
            'periode' => $periode,
            'moyenne_generale' => round($stats->moyenne ?? 0, 2),
            'total_eleves' => $stats->total_eleves ?? 0,
            'total_notes' => $stats->total_notes ?? 0,
            'repartition' => $repartition
        ]);
    }

    /**
     * Rapport détaillé d'une classe
     */
    public function rapportClasse($classeId)
    {
        $classe = Classes::with(['eleves.note'])->findOrFail($classeId);

        $elevesStats = $classe->eleves->map(function ($eleve) {
            $notes = $eleve->note;
            return [
                'id' => $eleve->id,
                'nom' => $eleve->nom,
                'prenom' => $eleve->prenom,
                'moyenne' => round($notes->avg('note'), 2) ?? 0,
                'total_notes' => $notes->count(),
                'derniere_note' => $notes->latest('date_evaluation')->first()?->note ?? 0
            ];
        });

        return response()->json([
            'classe' => [
                'id' => $classe->id,
                'nom' => $classe->nom_classe,
                'categorie' => $classe->categorie_classe,
                'effectif' => $classe->eleves->count()
            ],
            'eleves' => $elevesStats,
            'moyenne_classe' => $this->getMoyenneClasse($classeId),
            'taux_reussite' => $this->getTauxReussiteClasse($classeId)
        ]);
    }

    /**
     * Calcul de la moyenne d'une classe
     */
    private function getMoyenneClasse($classeId)
    {
        return round(
            Notes::whereHas('eleve', function ($query) use ($classeId) {
                $query->where('class_id', $classeId);
            })->avg('note') ?? 0,
            2
        );
    }

    /**
     * Calcul du nombre d'admis dans une classe
     */
    private function getAdmis($classeId)
    {
        return Notes::whereHas('eleve', function ($query) use ($classeId) {
            $query->where('class_id', $classeId);
        })
        ->where('note', '>=', 10)
        ->distinct('eleve_id')
        ->count();
    }

    /**
     * Calcul du nombre d'échecs dans une classe
     */
    private function getEchec($classeId)
    {
        return Notes::whereHas('eleve', function ($query) use ($classeId) {
            $query->where('class_id', $classeId);
        })
        ->where('note', '<', 10)
        ->distinct('eleve_id')
        ->count();
    }

    /**
     * Calcul du taux de réussite d'une classe
     */
    private function getTauxReussiteClasse($classeId)
    {
        $totalEleves = Eleves::where('class_id', $classeId)->count();
        if ($totalEleves == 0) return 0;

        $admis = $this->getAdmis($classeId);
        return round(($admis / $totalEleves) * 100, 2);
    }

    /**
     * Calcul du taux de réussite général
     */
    private function calculateTauxReussite()
    {
        $totalEleves = Eleves::count();
        if ($totalEleves == 0) return 0;

        $elevesAdmis = Notes::where('note', '>=', 10)
            ->distinct('eleve_id')
            ->count();

        return round(($elevesAdmis / $totalEleves) * 100, 2);
    }

    /**
     * Nombre d'élèves en excellence
     */
    private function getElevesExcellence()
    {
        return Notes::where('note', '>=', 16)
            ->distinct('eleve_id')
            ->count();
    }

    /**
     * Nombre d'élèves en difficulté
     */
    private function getElevesDifficulte()
    {
        return Notes::where('note', '<', 10)
            ->distinct('eleve_id')
            ->count();
    }

    /**
     * Répartition des notes pour graphique en secteurs
     */
    private function getRepartitionNotes()
    {
        $repartition = Notes::select(
            DB::raw('
                SUM(CASE WHEN note >= 16 THEN 1 ELSE 0 END) as excellence,
                SUM(CASE WHEN note >= 14 AND note < 16 THEN 1
                ELSE 0 END) as bien,
                SUM(CASE WHEN note >= 12 AND note < 14 THEN 1 ELSE 0 END) as assez_bien,
                SUM(CASE WHEN note >= 10 AND note < 12 THEN 1 ELSE 0 END) as passable,
                SUM(CASE WHEN note < 10 THEN 1 ELSE 0 END) as insuffisant
            ')
        )->first();

        return [
            'labels' => ['Excellence (16-20)', 'Bien (14-15.9)', 'Assez Bien (12-13.9)', 'Passable (10-11.9)', 'Insuffisant (<10)'],
            'datasets' => [[
                'data' => [
                    $repartition->excellence,
                    $repartition->bien,
                    $repartition->assez_bien,
                    $repartition->passable,
                    $repartition->insuffisant
                ],
                'backgroundColor' => [
                    '#4caf50',
                    '#2196f3',
                    '#ffeb3b',
                    '#ff9800',
                    '#f44336'
                ]
            ]]
        ];
    }
}
