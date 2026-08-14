<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\EmploiDuTemps;
use App\Models\Universite\Etudiant;
use App\Models\Universite\Matiere;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * "My courses" — the subjects the signed-in account is concerned by.
 *
 * This is the endpoint that `etudiants.user_id` was blocking. Without that
 * column there was no way from a session to an academic record, so the question
 * "which courses are mine" had no answer the server could compute; the page
 * shipped behind a disabled flag rather than guess.
 *
 * One endpoint serves two readers, because the answer differs in the *subject
 * set* and in nothing else:
 *
 *   - a student → the subjects of their filière;
 *   - a lecturer → the subjects they teach.
 *
 * Everything after that — the next session, the room, the head count, the
 * progress bar — is derived identically from the calendar, so splitting this in
 * two would duplicate all of it to vary one `where`.
 */
class MyCoursesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $student  = $user->etudiant;
        $lecturer = $student ? null : $user->enseignantUniversite;

        if (!$student && !$lecturer) {
            // 404, not 403: nothing is being refused. There is no university
            // profile attached to this account, which is the same shape of
            // answer `DevoirController::indexEleve` gives for a missing pupil
            // profile.
            return response()->json([
                'success' => false,
                'message' => 'Aucun profil universitaire n\'est rattaché à ce compte.',
            ], 404);
        }

        $subjects = Matiere::with(['enseignant:id,nom,prenom,grade', 'semestre:id,libelle', 'filiere:id,nom,niveau'])
            ->when($student, fn($q) => $q->where('filiere_id', $student->filiere_id))
            ->when($lecturer, fn($q) => $q->where('enseignant_id', $lecturer->id))
            ->orderBy('code')
            ->get();

        $sessions   = $this->sessionsFor($subjects->pluck('id')->all());
        $headCounts = $this->headCountsFor($subjects->pluck('filiere_id')->filter()->unique()->all());

        $data = $subjects->map(fn(Matiere $subject) => $this->present(
            $subject,
            $sessions->get($subject->id, collect()),
            (int) ($headCounts[$subject->filiere_id] ?? 0)
        ));

        return response()->json([
            'success' => true,
            'data'    => $data->values(),
            'meta'    => [
                'profil'      => $student ? 'etudiant' : 'enseignant',
                'etudiant_id' => $student?->id,
                'total'       => $data->count(),
            ],
        ]);
    }

    /**
     * Calendar entries for these subjects, grouped by subject.
     *
     * One query for the whole page rather than one per course: the progress bar,
     * the timetable line and the next session all read the same rows.
     */
    private function sessionsFor(array $subjectIds): Collection
    {
        if (empty($subjectIds)) {
            return collect();
        }

        return EmploiDuTemps::whereIn('matiere_id', $subjectIds)
            ->chronological()
            ->get()
            ->groupBy('matiere_id');
    }

    /**
     * How many students each filière holds.
     *
     * Through the Eloquent model, never `DB::table('etudiants')`: the raw builder
     * skips the tenant scope and would count another establishment's students
     * into this page.
     */
    private function headCountsFor(array $filiereIds): array
    {
        if (empty($filiereIds)) {
            return [];
        }

        return Etudiant::whereIn('filiere_id', $filiereIds)
            ->selectRaw('filiere_id, count(*) as aggregate')
            ->groupBy('filiere_id')
            ->pluck('aggregate', 'filiere_id')
            ->all();
    }

    /**
     * Shape one course for the page.
     *
     * `progression` and `statut` are **derived**, not stored. A stored percentage
     * is a second source of truth that drifts the moment a session is added or
     * cancelled; counting sessions already marked `termine` cannot drift, and it
     * is the same number a lecturer would compute by hand.
     */
    private function present(Matiere $subject, Collection $sessions, int $headCount): array
    {
        $scheduled = $sessions->where('statut', '!=', 'annule');
        $done      = $scheduled->where('statut', 'termine');

        $next = $scheduled
            ->where('statut', 'planifie')
            ->first(fn($session) => $session->date >= now()->startOfDay());

        $progress = $scheduled->isEmpty()
            ? 0
            : (int) round($done->count() / $scheduled->count() * 100);

        return [
            'id'             => $subject->id,
            'code'           => $subject->code,
            'intitule'       => $subject->intitule,
            'credit'         => $subject->credit,
            'semestre'       => $subject->semestre?->libelle,
            'filiere'        => $subject->filiere?->nom,
            'enseignant'     => $subject->enseignant
                ? trim($subject->enseignant->prenom . ' ' . $subject->enseignant->nom)
                : null,
            'horaire'        => $next
                ? $next->heure_debut . ' - ' . $next->heure_fin
                : '—',
            'salle'          => $next?->salle ?? '—',
            'etudiants'      => $headCount,
            'progression'    => $progress,
            'prochain_cours' => $next?->date?->format('Y-m-d'),
            // 100% only counts as finished when there was something to finish —
            // a course with no calendar yet is "en_cours", not "terminé".
            'statut'         => $scheduled->isNotEmpty() && $progress === 100 ? 'termine' : 'en_cours',
            'seances'        => $scheduled->count(),
            'seances_faites' => $done->count(),
        ];
    }
}
