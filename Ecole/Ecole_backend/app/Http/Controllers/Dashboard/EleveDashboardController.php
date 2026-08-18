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

        $notes = \App\Models\Notes::where('eleve_id', $eleve->id)
            ->with('matiere')
            ->get();

        $moyenneGenerale = $notes->avg('note');
        // Le filtre année manquait : oùMonth seul additionnait le même mois sur
        // toutes les années (cf. audit P3).
        $absences = \App\Models\Absence::where('eleve_id', $eleve->id)
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->count();

        // Coefficients réels par (matière, classe, série). `matiere->coefficient`
        // n'existe pas (la colonne vit sur `coefficient_matieres`), donc l'ancien
        // code affichait toujours le repli `?? 1` (cf. audit P3).
        $coefficients = \App\Models\Coefficients::where('classe_id', $eleve->classe_id)
            ->where('serie_id', $eleve->serie_id)
            ->pluck('coefficient', 'matiere_id');

        $notesByMatiere = $notes->groupBy('matiere.nom')->map(function ($group, $nom) use ($coefficients) {
            return [
                'name' => $nom,
                'note' => round($group->avg('note'), 2),
                'coeff' => $coefficients[$group->first()->matiere_id] ?? 1,
            ];
        })->values();

        $emploiDuTemps = \App\Models\EmploiDuTemps::where('classe_id', $eleve->classe_id)
            ->with(['matiere', 'enseignant.user'])
            ->orderBy('jour')
            ->get();

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
                    'moyenne_generale' => $moyenneGenerale ? round($moyenneGenerale, 2) : null,
                    'total_notes' => $notes->count(),
                    'absences_mois' => $absences,
                ],
                'matieres' => $notesByMatiere,
                'emploi_du_temps' => $emploiDuTemps,
            ],
        ]);
    }
}
