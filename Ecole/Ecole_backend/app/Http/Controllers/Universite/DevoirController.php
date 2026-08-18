<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Devoir;
use App\Models\Universite\Etudiant;
use App\Models\Universite\Matiere;
use App\Services\FileUploadService;
use App\Support\Roles;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * University assignments.
 *
 * Three readers, three sets:
 *
 *   - a lecturer sees the assignments of the subjects they teach, with the
 *     submission count the Tâches page shows;
 *   - a student sees the published assignments of their filière, each carrying
 *     their own submission;
 *   - the chancellor and deans see the whole board.
 *
 * A lecturer who is not linked to a `uni_enseignants` row sees nothing rather
 * than everything: an unresolvable identity must narrow the answer, never widen
 * it.
 */
class DevoirController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user    = $request->user();
        $student = $user->role === Roles::STUDENT ? $user->etudiant : null;

        $query = Devoir::with(['matiere:id,code,intitule,filiere_id,enseignant_id', 'auteur:id,name,prenom'])
            ->byDeadline();

        if ($user->role === Roles::STUDENT) {
            // No student record → no filière → no assignments. `forFiliere(null)`
            // would match subjects with a NULL filière, of which there are none,
            // but being explicit keeps the intent readable.
            if (!$student) {
                return $this->emptyPage('Aucun profil étudiant n\'est rattaché à ce compte.');
            }

            $query->published()->forFiliere($student->filiere_id);
        } elseif ($user->role === Roles::PROFESSOR) {
            $lecturer = $user->enseignantUniversite;

            if (!$lecturer) {
                return $this->emptyPage('Aucun profil enseignant n\'est rattaché à ce compte.');
            }

            $query->taughtBy($lecturer->id);
        }

        foreach (['type', 'statut', 'priorite', 'matiere_id'] as $filter) {
            if ($value = $request->query($filter)) {
                $query->where($filter, $value);
            }
        }

        $page = $query->paginate((int) $request->input('per_page', 20));

        $data = collect($page->items())->map(
            fn(Devoir $devoir) => $this->present($devoir, $student)
        );

        return response()->json([
            'success' => true,
            'data'    => $data->values(),
            'meta'    => [
                'total'    => $page->total(),
                'page'     => $page->currentPage(),
                'per_page' => $page->perPage(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $devoir = Devoir::with(['matiere', 'auteur:id,name,prenom'])->findOrFail($id);

        $this->authorize('view', $devoir);

        $student = $request->user()->role === Roles::STUDENT ? $request->user()->etudiant : null;

        return response()->json([
            'success' => true,
            'data'    => $this->present($devoir, $student) + [
                // Only the people who mark it get the roll of submissions.
                'soumissions' => $request->user()->can('grade', $devoir)
                    ? $devoir->etudiants()->get()->map(fn(Etudiant $e) => [
                        'etudiant_id' => $e->id,
                        'matricule'   => $e->matricule,
                        'nom'         => trim($e->prenom . ' ' . $e->nom),
                        'rendu'       => (bool) $e->pivot->rendu,
                        'note'        => $e->pivot->note,
                        'date_remise' => $e->pivot->date_remise,
                        'commentaire' => $e->pivot->commentaire,
                    ])->values()
                    : null,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Devoir::class);

        $data = $this->validated($request);

        // Ownership is derived from the subject, so a lecturer must be
        // authorised on *that* subject, not merely hold the role.
        $this->assertTeaches($request, (int) $data['matiere_id']);

        $devoir = Devoir::create($data + [
            'created_by' => $request->user()->id,
            'ecole_id'   => $request->user()->ecole_id,
        ]);

        // Enrol the filière at publication, so the submission count has a
        // denominator from the first read instead of growing as students happen
        // to open the page.
        if ($devoir->publie) {
            $this->enrolFiliere($devoir);
        }

        return response()->json([
            'success' => true,
            'message' => 'Devoir créé',
            'data'    => $devoir->load('matiere'),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $devoir = Devoir::findOrFail($id);

        $this->authorize('update', $devoir);

        $data = $this->validated($request, partial: true);

        if (isset($data['matiere_id'])) {
            $this->assertTeaches($request, (int) $data['matiere_id']);
        }

        $wasPublished = $devoir->publie;
        $devoir->update($data);

        if (!$wasPublished && $devoir->publie) {
            $this->enrolFiliere($devoir);
        }

        return response()->json([
            'success' => true,
            'message' => 'Devoir mis à jour',
            'data'    => $devoir->load('matiere'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $devoir = Devoir::findOrFail($id);

        $this->authorize('delete', $devoir);

        $devoir->etudiants()->detach();
        $devoir->delete();

        return response()->json(['success' => true, 'message' => 'Devoir supprimé']);
    }

    /**
     * A student hands in their work.
     */
    public function submit(Request $request, int $id): JsonResponse
    {
        $devoir = Devoir::findOrFail($id);

        $this->authorize('submit', $devoir);

        $student = $request->user()->etudiant;

        $data = $request->validate([
            'reponse' => 'nullable|string|max:20000',
            // A strict allow-list, as on the scholastic endpoint: without
            // `mimes` a student could upload an .html or .svg served from the
            // app's own origin — stored XSS against whoever opens the work.
            'fichier' => 'nullable|file|max:10240|mimes:pdf,doc,docx,odt,txt,jpg,jpeg,png,webp,zip',
        ]);

        $pivot = [
            'rendu'       => true,
            'date_remise' => now(),
            'reponse'     => $data['reponse'] ?? null,
        ];

        if ($request->hasFile('fichier')) {
            // Private disk + FileUploadService: server-side MIME check via
            // finfo + UUID name to prevent path traversal (audit S7).
            $pivot['fichier'] = FileUploadService::store(
                $request->file('fichier'),
                'uni-devoirs/' . $id,
                'local',
                allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.oasis.opendocument.text', 'text/plain', 'image/jpeg', 'image/png', 'image/webp', 'application/zip'],
                maxSize: 10 * 1024 * 1024,
            );
        }

        $devoir->etudiants()->syncWithoutDetaching([$student->id => $pivot]);

        return response()->json(['success' => true, 'message' => 'Devoir soumis']);
    }

    /**
     * A lecturer marks one submission.
     */
    public function grade(Request $request, int $id, int $etudiantId): JsonResponse
    {
        $devoir = Devoir::findOrFail($id);

        $this->authorize('grade', $devoir);

        $data = $request->validate([
            'note'        => 'required|numeric|min:0|max:20',
            'commentaire' => 'nullable|string|max:2000',
        ]);

        // The student must be enrolled on *this* assignment. Without the check
        // `updateExistingPivot` silently does nothing for an unrelated id and the
        // caller is told the mark was saved.
        if (!$devoir->etudiants()->whereKey($etudiantId)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cet étudiant n\'est pas concerné par ce devoir.',
            ], 404);
        }

        $devoir->etudiants()->updateExistingPivot($etudiantId, $data);

        return response()->json(['success' => true, 'message' => 'Note enregistrée']);
    }

    /**
     * Download a submitted file.
     */
    public function downloadSubmission(Request $request, int $id, int $etudiantId)
    {
        $devoir = Devoir::findOrFail($id);
        $user   = $request->user();

        $isOwner = $user->etudiant !== null && (int) $user->etudiant->id === $etudiantId;

        if (!$isOwner && !$user->can('grade', $devoir)) {
            return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
        }

        $pivot = $devoir->etudiants()->whereKey($etudiantId)->first()?->pivot;

        if (!$pivot?->fichier || !Storage::disk('local')->exists($pivot->fichier)) {
            return response()->json(['success' => false, 'message' => 'Fichier introuvable'], 404);
        }

        return Storage::disk('local')->download($pivot->fichier, basename($pivot->fichier));
    }

    /* ─── Internals ───────────────────────────────────────────────────── */

    /**
     * Shape one assignment for the Tâches page.
     *
     * `soumissions` / `total_etudiants` drive the "3/28 soumissions" line. Both
     * are counted from the pivot rather than stored, so cancelling a submission
     * or enrolling a late student cannot leave a stale figure behind.
     */
    private function present(Devoir $devoir, ?Etudiant $student): array
    {
        $enrolled = $devoir->etudiants();

        $mine = $student
            ? $devoir->etudiants()->whereKey($student->id)->first()?->pivot
            : null;

        return [
            'id'              => $devoir->id,
            'titre'           => $devoir->titre,
            'description'     => $devoir->description,
            'type'            => $devoir->type,
            'priorite'        => $devoir->priorite,
            'statut'          => $devoir->statut,
            'date_limite'     => $devoir->date_limite?->toIso8601String(),
            'publie'          => $devoir->publie,
            'matiere_id'      => $devoir->matiere_id,
            'cours'           => $devoir->matiere
                ? ['id' => $devoir->matiere->id, 'code' => $devoir->matiere->code, 'intitule' => $devoir->matiere->intitule]
                : null,
            'soumissions'     => (clone $enrolled)->wherePivot('rendu', true)->count(),
            'total_etudiants' => $enrolled->count(),
            // Present only for a student, and only about themselves.
            'ma_soumission'   => $mine ? [
                'rendu'       => (bool) $mine->rendu,
                'note'        => $mine->note,
                'date_remise' => $mine->date_remise,
                'commentaire' => $mine->commentaire,
            ] : null,
        ];
    }

    /**
     * Attach every student of the subject's filière.
     */
    private function enrolFiliere(Devoir $devoir): void
    {
        $filiereId = $devoir->matiere?->filiere_id
            ?? Matiere::whereKey($devoir->matiere_id)->value('filiere_id');

        if (!$filiereId) {
            return;
        }

        // Through the model, so the tenant scope bounds the list: `DB::table`
        // here would enrol another establishment's students.
        $students = Etudiant::where('filiere_id', $filiereId)->pluck('id');

        $devoir->etudiants()->syncWithoutDetaching($students->all());
    }

    /**
     * Refuse an assignment on a subject this lecturer does not teach.
     */
    private function assertTeaches(Request $request, int $matiereId): void
    {
        $user = $request->user();

        if ($user->role !== Roles::PROFESSOR) {
            return;
        }

        $lecturerId = $user->enseignantUniversite?->id;

        if (!$lecturerId || !Matiere::whereKey($matiereId)->where('enseignant_id', $lecturerId)->exists()) {
            abort(403, 'Vous n\'enseignez pas cette matière.');
        }
    }

    private function emptyPage(string $message): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => [],
            'meta'    => ['total' => 0, 'page' => 1, 'per_page' => 0],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes|required' : 'required';

        return $request->validate([
            // `school_exists`, not `exists`: the built-in rule bypasses the
            // tenant scope and would accept another establishment's subject.
            'matiere_id'  => $required . '|school_exists:uni_matieres,id',
            'titre'       => $required . '|string|max:255',
            'description' => 'nullable|string|max:20000',
            'type'        => 'nullable|in:' . implode(',', Devoir::TYPES),
            'priorite'    => 'nullable|in:' . implode(',', Devoir::PRIORITIES),
            'statut'      => 'nullable|in:' . implode(',', Devoir::STATUSES),
            'date_limite' => 'nullable|date',
            'publie'      => 'nullable|boolean',
        ]);
    }
}
