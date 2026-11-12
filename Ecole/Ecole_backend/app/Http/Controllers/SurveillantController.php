<?php

namespace App\Http\Controllers;

use App\Models\Absence;
use App\Models\Classes;
use App\Models\Eleve;
use App\Models\Incident;
use App\Models\Sanction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SurveillantController extends Controller
{
    /**
     * Absences et retards, filtrables par jour et par classe. Sans filtre, les
     * 500 plus récents : la liste complète d'une année grossissait sans fin.
     */
    public function absences(Request $request)
    {
        return Absence::with(['eleve.classe', 'eleve.user:id,name,prenom'])
            ->when($request->filled('date'), fn ($q) => $q->whereDate('date', $request->date))
            ->when($request->filled('classe_id'), fn ($q) => $q->whereHas('eleve', fn ($e) => $e->where('classe_id', $request->classe_id)))
            ->latest('date')->latest('id')
            ->limit(500)
            ->get();
    }

    /**
     * Feuille d'appel d'une classe pour un jour : chaque élève inscrit, avec
     * son statut déjà relevé (présent par défaut).
     */
    public function feuilleAppel(Request $request, $classeId)
    {
        $request->validate(['date' => 'nullable|date']);
        $date = $request->input('date', now()->toDateString());
        $classe = Classes::findOrFail($classeId);

        $releves = Absence::whereDate('date', $date)
            ->whereIn('eleve_id', Eleve::where('classe_id', $classe->id)->pluck('id'))
            ->get()->keyBy('eleve_id');

        return response()->json([
            'success' => true,
            'data' => [
                'classe' => ['id' => $classe->id, 'nom_classe' => $classe->nom_classe],
                'date' => $date,
                'eleves' => Eleve::with('user:id,name,prenom')
                    ->where('classe_id', $classe->id)->where('statut', '!=', 'inactive')
                    ->orderBy('numero_matricule')->get()
                    ->map(fn ($e) => [
                        'id' => $e->id,
                        'nom' => $e->user?->name,
                        'prenom' => $e->user?->prenom,
                        'matricule' => $e->numero_matricule,
                        // `absences.type` vaut « absence » ou « retard » ; l'appel parle
                        // de présent, absent, retard.
                        'statut' => $releves->has($e->id) ? ($releves[$e->id]->type === 'retard' ? 'retard' : 'absent') : 'present',
                        'motif' => $releves->get($e->id)?->motif,
                        'justifiee' => (bool) $releves->get($e->id)?->justifiee,
                    ])->values(),
            ],
        ]);
    }

    /**
     * Enregistrer l'appel d'une classe. Rejouable : le même appel renvoyé
     * deux fois (double clic, renvoi après coupure) ne crée rien de plus, et
     * un élève repassé « présent » perd l'absence notée par erreur.
     */
    public function enregistrerAppel(Request $request)
    {
        $donnees = $request->validate([
            'classe_id' => 'required|school_exists:classes,id',
            'date' => 'required|date|before_or_equal:today',
            'eleves' => 'required|array|min:1',
            'eleves.*.eleve_id' => 'required|integer',
            'eleves.*.statut' => 'required|in:present,absent,retard',
            'eleves.*.motif' => 'nullable|string|max:255',
        ]);

        $ids = Eleve::where('classe_id', $donnees['classe_id'])->pluck('id')->all();
        $etrangers = collect($donnees['eleves'])->pluck('eleve_id')->diff($ids);
        if ($etrangers->isNotEmpty()) {
            return response()->json(['success' => false, 'message' => 'Un ou plusieurs élèves ne sont pas dans cette classe.'], 422);
        }

        $compte = ['present' => 0, 'absent' => 0, 'retard' => 0];

        DB::transaction(function () use ($donnees, &$compte) {
            foreach ($donnees['eleves'] as $ligne) {
                $compte[$ligne['statut']]++;
                $existante = Absence::where('eleve_id', $ligne['eleve_id'])->whereDate('date', $donnees['date'])->first();

                if ($ligne['statut'] === 'present') {
                    $existante?->delete();

                    continue;
                }

                $type = $ligne['statut'] === 'retard' ? 'retard' : 'absence';

                if ($existante) {
                    $existante->update(['type' => $type, 'motif' => $ligne['motif'] ?? $existante->motif]);
                } else {
                    Absence::create(['eleve_id' => $ligne['eleve_id'], 'date' => $donnees['date'], 'type' => $type, 'motif' => $ligne['motif'] ?? null]);
                }
            }
        });

        \Cache::forget('dashboard_directeur_'.(auth()->user()->ecole_id ?? 'global'));

        return response()->json(['success' => true, 'data' => $compte]);
    }

    /** Justifier (ou non) une absence, avec son motif. */
    public function justifierAbsence(Request $request, $id)
    {
        $donnees = $request->validate(['justifiee' => 'required|boolean', 'motif' => 'nullable|string|max:255']);
        $absence = Absence::findOrFail($id);
        $absence->update($donnees);

        return response()->json(['success' => true, 'data' => $absence->fresh()]);
    }

    /** Faire avancer un incident : ouvert → en cours → résolu. */
    public function majIncident(Request $request, $id)
    {
        $donnees = $request->validate(['statut' => 'required|in:ouvert,en_cours,resolu']);
        $incident = Incident::findOrFail($id);
        $incident->update($donnees);

        return response()->json(['success' => true, 'data' => $incident->fresh()]);
    }

    /** Lever ou clore une sanction. */
    public function majSanction(Request $request, $id)
    {
        $donnees = $request->validate(['statut' => 'required|in:active,levee,terminee']);
        $sanction = Sanction::findOrFail($id);
        $sanction->update($donnees);

        return response()->json(['success' => true, 'data' => $sanction->fresh()->load('eleve.user:id,name,prenom')]);
    }

    public function incidents()
    {
        return Incident::latest()->get();
    }

    public function sanctions()
    {
        return Sanction::with(['eleve.classe', 'eleve.user:id,name,prenom'])->latest()->get();
    }

    public function storeAbsence(Request $request)
    {
        $validated = $request->validate([
            'eleve_id' => 'required|school_exists:eleves,id',
            'date' => 'required|date',
            'type' => 'required|in:absence,retard',
            'motif' => 'nullable|string',
        ]);

        $absence = Absence::create($validated);

        \Cache::forget('dashboard_directeur_'.(auth()->user()->ecole_id ?? 'global'));

        return $absence;
    }

    public function storeIncident(Request $request)
    {
        $validated = $request->validate([
            'description' => 'required|string',
            'date' => 'required|date|before_or_equal:today',
            'gravite' => 'required|in:faible,moyenne,grave',
        ]);

        $incident = Incident::create($validated);

        \Cache::forget('dashboard_directeur_'.(auth()->user()->ecole_id ?? 'global'));

        return $incident;
    }

    public function storeSanction(Request $request)
    {
        $validated = $request->validate([
            'eleve_id' => 'required|school_exists:eleves,id',
            'type_sanction' => 'required|string',
            'motif' => 'required|string',
            'date' => 'required|date',
            'duree' => 'nullable|integer',
        ]);

        $sanction = Sanction::create($validated);

        return response()->json($sanction->load('eleve.user:id,name,prenom'), 201);
    }

    /**
     * Statistiques disciplinaires (tendances, alertes)
     */
    public function statistiques()
    {
        // Incidents par mois (12 derniers mois)
        $incidentsParMois = Incident::select(
            DB::raw("DATE_FORMAT(date, '%Y-%m') as mois"),
            DB::raw('COUNT(*) as total')
        )
            ->where('date', '>=', now()->subMonths(12))
            ->groupBy('mois')
            ->orderBy('mois')
            ->pluck('total', 'mois');

        // Répartition par gravité
        $parGravite = Incident::select('gravite', DB::raw('COUNT(*) as total'))
            ->groupBy('gravite')
            ->pluck('total', 'gravite');

        // Évolution des incidents (mois courant vs mois précédent)
        $moisCourant = Incident::whereMonth('date', now()->month)->whereYear('date', now()->year)->count();
        $moisPrecedent = Incident::whereMonth('date', now()->subMonth()->month)->whereYear('date', now()->subMonth()->year)->count();
        $evolution = $moisPrecedent > 0 ? round((($moisCourant - $moisPrecedent) / $moisPrecedent) * 100, 1) : 0;

        // Alertes automatiques
        $alertes = [];

        // Hausse des incidents graves
        $gravesRecents = Incident::where('gravite', 'grave')
            ->where('date', '>=', now()->subMonth())->count();
        $gravesAvant = Incident::where('gravite', 'grave')
            ->whereBetween('date', [now()->subMonths(2), now()->subMonths(1)])->count();
        if ($gravesRecents > 0 && $gravesRecents > $gravesAvant * 1.5) {
            $alertes[] = [
                'type' => 'danger',
                'message' => "Hausse des incidents graves : {$gravesRecents} ce mois (vs {$gravesAvant} le mois précédent)",
            ];
        }

        // Élève le plus sanctionné
        $eleveFrequente = Sanction::select('eleve_id', DB::raw('COUNT(*) as total'))
            ->where('date', '>=', now()->subMonths(3))
            ->groupBy('eleve_id')
            ->orderByDesc('total')
            ->first();
        if ($eleveFrequente && $eleveFrequente->total >= 2) {
            $eleve = Eleve::with('user')->find($eleveFrequente->eleve_id);
            if ($eleve && $eleve->user) {
                $alertes[] = [
                    'type' => 'warning',
                    'message' => "{$eleve->user->name} {$eleve->user->prenom} a {$eleveFrequente->total} sanctions en 3 mois",
                ];
            }
        }

        // Absentéisme élevé (élève avec +5 absences dans le mois)
        $absencesEleves = Absence::select('eleve_id', DB::raw('COUNT(*) as total'))
            ->where('date', '>=', now()->subMonth())
            ->groupBy('eleve_id')
            ->having('total', '>=', 5)
            ->count();
        if ($absencesEleves > 0) {
            $alertes[] = [
                'type' => 'info',
                'message' => "{$absencesEleves} élève(s) avec 5+ absences ce mois",
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_incidents' => Incident::count(),
                'total_sanctions' => Sanction::count(),
                'total_absences' => Absence::count(),
                'evolution' => $evolution,
                'mois_courant' => $moisCourant,
                'mois_precedent' => $moisPrecedent,
                'par_gravite' => [
                    'faible' => (int) ($parGravite['faible'] ?? 0),
                    'moyenne' => (int) ($parGravite['moyenne'] ?? 0),
                    'grave' => (int) ($parGravite['grave'] ?? 0),
                ],
                'incidents_par_mois' => $incidentsParMois,
                'alertes' => $alertes,
            ],
        ]);
    }
}
