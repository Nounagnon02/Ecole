<?php

namespace App\Http\Controllers\Notes;

use App\Http\Controllers\Controller;
use App\Models\Notes;
use App\Models\Eleve;
use App\Models\Classes;
use App\Support\Cycles;
use Illuminate\Http\Request;

class NotesStatsController extends Controller
{
    use NotesHelpers;

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
}
