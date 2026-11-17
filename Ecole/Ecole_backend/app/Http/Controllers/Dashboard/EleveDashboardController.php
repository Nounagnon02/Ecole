<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class EleveDashboardController extends Controller
{
    use DashboardHelpers;

    /**
     * Dashboard Élève — données réelles
     */
    public function eleve(Request $request)
    {
        $user = $request->user();
        $eleve = $user->eleve;

        if (!$eleve) {
            return response()->json(['success' => false, 'message' => 'Profil élève non trouvé'], 404);
        }

        $totalNotes = \App\Models\Notes::where('eleve_id', $eleve->id)->count();

        // Moyennes de la dernière période notée, calculées comme au bulletin
        // (types d'évaluation ramenés sur 20, coefficients du bulletin). La
        // moyenne brute de toutes les notes de l'année, sans coefficient, ne
        // correspondait à aucun bulletin (revue du 16/11/2026).
        $moyennes = app(\App\Services\BulletinService::class)->moyennesProvisoires($eleve);

        // Le filtre année manquait : oùMonth seul additionnait le même mois sur
        // toutes les années (cf. audit P3). Les retards sont comptés à part :
        // « Absences ce mois » les incluait.
        $duMois = \App\Models\Absence::where('eleve_id', $eleve->id)
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->get(['type']);
        $retards = $duMois->where('type', 'retard')->count();

        // Jours dans l'ordre de la semaine : `orderBy('jour')` les rangeait par
        // ordre alphabétique (jeudi avant lundi).
        $rangJour = array_flip(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']);
        $emploiDuTemps = \App\Models\EmploiDuTemps::where('classe_id', $eleve->classe_id)
            ->with(['matiere', 'enseignant.user'])
            ->get()
            ->sortBy([
                fn ($a, $b) => ($rangJour[mb_strtolower($a->jour)] ?? 9) <=> ($rangJour[mb_strtolower($b->jour)] ?? 9),
                fn ($a, $b) => strcmp((string) $a->heure_debut, (string) $b->heure_debut),
            ])
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'eleve' => [
                    'id' => $eleve->id,
                    'nom' => $user->name,
                    'prenom' => $user->prenom,
                    'classe' => $eleve->classe->nom_classe ?? null,
                    'matricule' => $eleve->numero_matricule,
                ],
                'stats' => [
                    'moyenne_generale' => $moyennes['moyenne_generale'],
                    'periode' => $moyennes['periode'],
                    'total_notes' => $totalNotes,
                    'absences_mois' => $duMois->count() - $retards,
                    'retards_mois' => $retards,
                ],
                'matieres' => $moyennes['matieres'],
                'emploi_du_temps' => $emploiDuTemps,
            ],
        ]);
    }
}
