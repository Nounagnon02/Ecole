<?php

namespace App\Http\Controllers;

use App\Models\Absence;
use App\Models\Eleve;
use App\Models\EmploiDuTemps;
use App\Models\Message;
use App\Models\Notes;
use App\Models\PaiementEleve;
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
 *
 * Les quatre sous-ressources par enfant (notes, absences, emploi du temps,
 * paiements) étaient appelées par le frontend sans exister côté API — la page
 * « Mes enfants » affichait donc toujours des listes vides.
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

        $rangsParClasse = $enfants->pluck('classe_id')
            ->filter()
            ->unique()
            ->mapWithKeys(fn ($classeId) => [$classeId => Eleve::classRanks($classeId)]);

        $data = $enfants->map(function ($eleve) use ($rangsParClasse) {
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
                'rang'              => $rangsParClasse[$eleve->classe_id][$eleve->id] ?? null,
                'absences_count'    => $absencesCount,
                // Filiation enrichie (point B) : chaque enfant est lié via un
                // pivot `ParentEleve` qui porte role, is_primary, is_guardian.
                'role'              => $eleve->pivot?->role ?? null,
                'is_primary'        => (bool) ($eleve->pivot?->is_primary ?? false),
                'is_guardian'       => (bool) ($eleve->pivot?->is_guardian ?? false),
                'filiation'         => [
                    'role'        => $eleve->pivot?->role ?? null,
                    'is_primary'  => (bool) ($eleve->pivot?->is_primary ?? false),
                    'is_guardian' => (bool) ($eleve->pivot?->is_guardian ?? false),
                ],
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

        $enfants = $parent->eleves()->with(['user:id,name,prenom', 'classe'])->get();

        // Une seule requête pour les notes de tous les enfants, au lieu d'une
        // par enfant dans la boucle (cf. audit P4).
        $notesParEleve = Notes::whereIn('eleve_id', $enfants->pluck('id'))
            ->with('matiere:id,nom')
            ->get()
            ->groupBy('eleve_id');

        $bulletins = [];

        foreach ($enfants as $eleve) {
            $notes = $notesParEleve->get($eleve->id) ?? collect();

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

    /**
     * Resolve a child of the signed-in parent, or refuse.
     *
     * Every per-child endpoint goes through here: without it a parent could
     * read another family's data simply by changing the id in the URL.
     */
    private function ownChildOrFail(int $childId): Eleve
    {
        $parent = Auth::user()?->parent;

        if (!$parent) {
            abort(404, 'Profil parent introuvable');
        }

        $child = $parent->eleves()
            ->with('user:id,name,prenom')
            ->where('eleves.id', $childId)
            ->first();

        if (!$child) {
            // 404 rather than 403: confirming the child exists would leak it.
            abort(404, 'Enfant introuvable');
        }

        return $child;
    }

    /**
     * Grades of one child, most recent first.
     * GET /parent/enfants/{enfantId}/notes
     */
    public function enfantNotes(Request $request, int $enfantId)
    {
        $child = $this->ownChildOrFail($enfantId);

        $notes = Notes::with('matiere:id,nom')
            ->where('eleve_id', $child->id)
            ->when($request->filled('periode'), fn($q) => $q->where('periode', $request->periode))
            ->orderByDesc('date_evaluation')
            ->get()
            ->map(fn($n) => [
                'id'              => $n->id,
                'matiere'         => $n->matiere->nom ?? '—',
                'note'            => (float) $n->note,
                'note_sur'        => (float) ($n->note_sur ?: 20),
                'type_evaluation' => $n->type_evaluation,
                'periode'         => $n->periode,
                'date'            => $n->date_evaluation,
                'observation'     => $n->observation,
            ]);

        return response()->json(['success' => true, 'data' => $notes]);
    }

    /**
     * Absences of one child.
     * GET /parent/enfants/{enfantId}/absences
     */
    public function enfantAbsences(int $enfantId)
    {
        $child = $this->ownChildOrFail($enfantId);

        $absences = Absence::where('eleve_id', $child->id)
            ->orderByDesc('date')
            ->get()
            ->map(fn($a) => [
                'id'        => $a->id,
                'date'      => $a->date,
                'type'      => $a->type,
                'motif'     => $a->motif,
                'justifiee' => (bool) $a->justifiee,
            ]);

        return response()->json([
            'success' => true,
            'data'    => $absences,
            'meta'    => [
                'total'        => $absences->count(),
                'justifiees'   => $absences->where('justifiee', true)->count(),
                'injustifiees' => $absences->where('justifiee', false)->count(),
            ],
        ]);
    }

    /**
     * Timetable of one child, derived from their class.
     * GET /parent/enfants/{enfantId}/emploi-du-temps
     */
    public function enfantEmploiDuTemps(int $enfantId)
    {
        $child = $this->ownChildOrFail($enfantId);

        $slots = EmploiDuTemps::where('classe_id', $child->classe_id)
            ->orderBy('jour')
            ->orderBy('heure_debut')
            ->get();

        return response()->json(['success' => true, 'data' => $slots]);
    }

    /**
     * Payment history and balance of one child.
     * GET /parent/enfants/{enfantId}/paiements
     */
    public function enfantPaiements(int $enfantId)
    {
        $child = $this->ownChildOrFail($enfantId);

        $paiements = PaiementEleve::where('eleve_id', $child->id)
            ->orderByDesc('date_paiement')
            ->get();

        $due  = (float) $paiements->sum('montant_total');
        $paid = (float) $paiements->sum('montant_paye');

        return response()->json([
            'success' => true,
            'data'    => $paiements->map(fn($p) => [
                'id'            => $p->id,
                'montant'       => (float) $p->montant,
                'montant_paye'  => (float) $p->montant_paye,
                'mode_paiement' => $p->mode_paiement,
                'date'          => $p->date_paiement,
                'statut'        => $p->statut_global,
            ]),
            'meta' => [
                'total_du'    => $due,
                'total_paye'  => $paid,
                'solde'       => round($due - $paid, 2),
            ],
        ]);
    }
}
