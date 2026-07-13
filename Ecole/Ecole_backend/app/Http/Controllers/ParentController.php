<?php

namespace App\Http\Controllers;

use App\Models\Notes;
use App\Models\Eleve;
use App\Models\Message;
use App\Models\RendezVous;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * ParentController — Espace parent connecté
 *
 * Endpoints pour le dashboard parent :
 * - enfants()      → liste des enfants du parent connecté
 * - bulletins()    → bulletins récents de tous les enfants
 * - bulletinDetail() → bulletin détaillé pour un enfant + période
 */
class ParentController extends Controller
{
    /**
     * Récupère la liste des enfants du parent connecté.
     * GET /parent/enfants
     */
    public function enfants()
    {
        $user = Auth::user();
        $parent = $user->parent;

        if (!$parent) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $enfants = $parent->eleves()->with([
            'user',
            'classe',
            'notes.matiere',
        ])->get();

        $data = $enfants->map(function ($eleve) {
            $notes = $eleve->notes;
            $moyenne = $notes->avg('note');

            $absencesCount = 0;
            if (class_exists(\App\Models\Absence::class)) {
                $absencesCount = \App\Models\Absence::where('eleve_id', $eleve->id)->count();
            }

            return [
                'id'                => $eleve->id,
                'nom'               => $eleve->user?->name ?? 'N/A',
                'prenom'            => $eleve->user?->prenom ?? '',
                'matricule'         => $eleve->numero_matricule ?? $eleve->matricule ?? 'N/A',
                'classe'            => $eleve->classe ? [
                    'id'  => $eleve->classe->id,
                    'nom' => $eleve->classe->nom_classe ?? $eleve->classe->nom ?? 'N/A',
                ] : null,
                'moyenne_generale'  => $moyenne ? round($moyenne, 2) : null,
                'absences_count'    => $absencesCount,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    /**
     * Récupère les bulletins récents de tous les enfants du parent.
     * GET /parent/bulletins
     */
    public function bulletins()
    {
        $user = Auth::user();
        $parent = $user->parent;

        if (!$parent) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $enfants = $parent->eleves()->with(['user', 'classe'])->get();
        $bulletins = [];

        foreach ($enfants as $eleve) {
            $notes = Notes::where('eleve_id', $eleve->id)
                ->with('matiere')
                ->get();

            $moyenneGenerale = $notes->avg('note');
            $periodes = $notes->pluck('periode')->unique()->filter();

            foreach ($periodes as $periode) {
                $notesPeriode = $notes->where('periode', $periode);
                $moyennePeriode = $notesPeriode->avg('note');

                $bulletins[] = [
                    'enfant_id'        => $eleve->id,
                    'enfant_nom'       => ($eleve->user?->name ?? '') . ' ' . ($eleve->user?->prenom ?? ''),
                    'classe'           => $eleve->classe?->nom_classe ?? $eleve->classe?->nom ?? 'N/A',
                    'periode'          => $periode,
                    'moyenne_generale' => $moyennePeriode ? round($moyennePeriode, 2) : 0,
                    'rang'             => [
                        'position'    => null,
                        'total_eleves' => null,
                    ],
                ];
            }

            if ($periodes->isEmpty()) {
                $bulletins[] = [
                    'enfant_id'        => $eleve->id,
                    'enfant_nom'       => ($eleve->user?->name ?? '') . ' ' . ($eleve->user?->prenom ?? ''),
                    'classe'           => $eleve->classe?->nom_classe ?? $eleve->classe?->nom ?? 'N/A',
                    'periode'          => 'En cours',
                    'moyenne_generale' => $moyenneGenerale ? round($moyenneGenerale, 2) : 0,
                    'rang'             => [
                        'position'    => null,
                        'total_eleves' => null,
                    ],
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data'    => $bulletins,
        ]);
    }

    /**
     * Bulletin détaillé pour un enfant + période.
     * GET /parent/bulletin/{enfantId}/{periode}
     */
    public function bulletinDetail($enfantId, $periode)
    {
        $user = Auth::user();
        $parent = $user->parent;

        if (!$parent) {
            return response()->json(['message' => 'Parent non trouvé'], 404);
        }

        $eleve = $parent->eleves()->with(['user', 'classe'])->find($enfantId);

        if (!$eleve) {
            return response()->json(['message' => 'Enfant non trouvé'], 404);
        }

        $notes = Notes::where('eleve_id', $eleve->id)
            ->where('periode', $periode)
            ->with('matiere')
            ->get();

        $moyenneGenerale = $notes->avg('note');

        $moyennesParMatiere = $notes->groupBy('matiere_id')->map(function ($notesMatiere) {
            $premiere = $notesMatiere->first();
            return [
                'matiere'     => $premiere->matiere?->nom_matiere ?? $premiere->matiere?->nom ?? 'N/A',
                'moyenne'     => round($notesMatiere->avg('note'), 2),
                'coefficient' => $premiere->matiere?->coefficient ?? 1,
                'rang'        => [
                    'position'     => null,
                    'total_eleves' => null,
                ],
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'eleve' => [
                    'nom'      => $eleve->user?->name ?? '',
                    'prenom'   => $eleve->user?->prenom ?? '',
                    'matricule' => $eleve->numero_matricule ?? $eleve->matricule ?? 'N/A',
                    'classe'   => [
                        'nom' => $eleve->classe?->nom_classe ?? $eleve->classe?->nom ?? 'N/A',
                    ],
                ],
                'periode'             => $periode,
                'moyenne_generale'    => $moyenneGenerale ? round($moyenneGenerale, 2) : 0,
                'rang'                => [
                    'position'     => null,
                    'total_eleves' => null,
                ],
                'appreciation'        => 'Bulletin généré automatiquement',
                'moyennes_par_matiere' => $moyennesParMatiere,
            ],
        ]);
    }

    /**
     * Messages destinés au parent connecté.
     * GET /parent/messages
     */
    public function messages()
    {
        $user = Auth::user();
        $parent = $user->parent;

        if (!$parent) {
            return response()->json(['success' => true, 'data' => []]);
        }

        // Filtrer les messages dont le destinataire est le parent (par nom ou email)
        $messages = Message::where('destinataire', $user->name)
            ->orWhere('destinataire', $user->email)
            ->orWhere('destinataire', $user->identifiant ?? '')
            ->latest()
            ->take(50)
            ->get()
            ->map(function ($msg) {
                return [
                    'id'         => $msg->id,
                    'sujet'      => $msg->sujet,
                    'contenu'    => $msg->contenu,
                    'expediteur' => $msg->expediteur,
                    'lu'         => $msg->lu,
                    'created_at' => $msg->created_at?->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $messages,
        ]);
    }

    /**
     * Rendez-vous du parent connecté.
     * GET /parent/rendez-vous
     */
    public function rendezVous()
    {
        $user = Auth::user();
        $parent = $user->parent;

        if (!$parent) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $rdvs = RendezVous::where('parent_id', $parent->id)
            ->with(['enseignant.user', 'eleve.user'])
            ->latest('date')
            ->get()
            ->map(function ($rdv) {
                return [
                    'id'          => $rdv->id,
                    'motif'       => $rdv->motif,
                    'date'        => $rdv->date?->toIso8601String(),
                    'heure'       => $rdv->heure,
                    'statut'      => $rdv->statut,
                    'enseignant'  => $rdv->enseignant?->user?->name ?? 'N/A',
                    'eleve_nom'   => $rdv->eleve?->user?->name ?? 'N/A',
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $rdvs,
        ]);
    }
}
