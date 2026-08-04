<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\EmploiDuTemps;
use App\Support\Roles;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The university calendar.
 *
 * A student sees their filière's sessions plus everything campus-wide; staff see
 * the whole calendar. That narrowing is for usefulness first — a student has no
 * business reading four other filières' exam timetables to find their own — and
 * it costs nothing, because a session that concerns everybody carries a NULL
 * `filiere_id` and the scope includes those explicitly.
 */
class PlanningController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = EmploiDuTemps::with([
            'matiere:id,code,intitule',
            'enseignant:id,nom,prenom',
            'filiere:id,nom',
            'semestre:id,libelle',
        ])->chronological();

        if ($filiereId = $this->studentFiliere($request)) {
            $query->forFiliere($filiereId);
        }

        // A calendar without bounds grows without bounds. The window is optional
        // so the page can ask for a month, a week or everything.
        if ($from = $request->query('date_debut')) {
            $query->whereDate('date', '>=', $from);
        }

        if ($to = $request->query('date_fin')) {
            $query->whereDate('date', '<=', $to);
        }

        foreach (['type', 'statut', 'filiere_id', 'semestre_id', 'matiere_id'] as $filter) {
            if ($value = $request->query($filter)) {
                $query->where($filter, $value);
            }
        }

        $page = $query->paginate((int) $request->input('per_page', 50));

        return response()->json([
            'success' => true,
            'data'    => $page->items(),
            'meta'    => [
                'total'    => $page->total(),
                'page'     => $page->currentPage(),
                'per_page' => $page->perPage(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $session = EmploiDuTemps::with(['matiere', 'enseignant', 'filiere', 'semestre'])
            ->findOrFail($id);

        // A student may only open a session they are concerned by. 404 rather
        // than 403 for consistency with the tenant boundary: the answer must not
        // let them enumerate another filière's calendar.
        if (($filiereId = $this->studentFiliere($request))
            && $session->filiere_id !== null
            && (int) $session->filiere_id !== (int) $filiereId) {
            abort(404);
        }

        return response()->json(['success' => true, 'data' => $session]);
    }

    public function store(Request $request): JsonResponse
    {
        $session = EmploiDuTemps::create($this->validated($request) + [
            'ecole_id' => $request->user()->ecole_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Séance planifiée',
            'data'    => $session->load(['matiere', 'enseignant', 'filiere']),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $session = EmploiDuTemps::findOrFail($id);

        $session->update($this->validated($request, partial: true));

        return response()->json([
            'success' => true,
            'message' => 'Séance mise à jour',
            'data'    => $session->load(['matiere', 'enseignant', 'filiere']),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        EmploiDuTemps::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Séance supprimée']);
    }

    /* ─── Internals ───────────────────────────────────────────────────── */

    /**
     * The filière of the signed-in student, or null when the caller is staff.
     *
     * A student whose account carries no `etudiants` row gets `null` for their
     * filière, and `forFiliere(null)` then matches only the campus-wide
     * sessions — the safe direction, and the honest one: we cannot say which
     * filière is theirs.
     */
    private function studentFiliere(Request $request): ?int
    {
        $user = $request->user();

        if ($user->role !== Roles::STUDENT) {
            return null;
        }

        return $user->etudiant?->filiere_id;
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes|required' : 'required';

        return $request->validate([
            'titre'       => $required . '|string|max:255',
            'type'        => 'nullable|in:' . implode(',', EmploiDuTemps::TYPES),
            'date'        => $required . '|date',
            'heure_debut' => $required . '|date_format:H:i',
            // A session that ends before it starts is not a typo the database
            // can catch.
            'heure_fin'   => $required . '|date_format:H:i|after:heure_debut',
            'salle'       => 'nullable|string|max:100',
            'statut'      => 'nullable|in:' . implode(',', EmploiDuTemps::STATUSES),

            // `school_exists`, not `exists`: the built-in rule runs on the raw
            // query builder and accepts another establishment's ids.
            'matiere_id'    => 'nullable|school_exists:uni_matieres,id',
            'enseignant_id' => 'nullable|school_exists:uni_enseignants,id',
            'semestre_id'   => 'nullable|school_exists:semestres,id',
            'filiere_id'    => 'nullable|school_exists:filieres,id',
        ]);
    }
}
