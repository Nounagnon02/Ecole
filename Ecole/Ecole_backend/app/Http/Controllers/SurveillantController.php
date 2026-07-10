<?php

namespace App\Http\Controllers;

use App\Models\{Absence, Incident, Sanction, Eleve};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SurveillantController extends Controller
{
    public function absences()
    {
        return Absence::with(['eleve.classe'])->latest()->get();
    }

    public function incidents()
    {
        return Incident::latest()->get();
    }

    public function sanctions()
    {
        return Sanction::with(['eleve.classe'])->latest()->get();
    }

    public function storeAbsence(Request $request)
    {
        $validated = $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'date' => 'required|date',
            'type' => 'required|in:absence,retard',
            'motif' => 'nullable|string'
        ]);

        return Absence::create($validated);
    }

    public function storeIncident(Request $request)
    {
        $validated = $request->validate([
            'description' => 'required|string',
            'date' => 'required|date',
            'gravite' => 'required|in:faible,moyenne,grave'
        ]);

        return Incident::create($validated);
    }

    public function storeSanction(Request $request)
    {
        $validated = $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'type_sanction' => 'required|string',
            'motif' => 'required|string',
            'date' => 'required|date',
            'duree' => 'nullable|integer'
        ]);

        return Sanction::create($validated);
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