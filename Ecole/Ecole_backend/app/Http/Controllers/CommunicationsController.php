<?php

namespace App\Http\Controllers;

use App\Models\Communication;
use App\Support\Cycles;
use App\Support\Roles;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The school noticeboard.
 *
 * Reads are filtered by audience, so no caller needs to be trusted to ask for
 * the right thing: the query itself decides. Writes are gated twice — by role,
 * for the office entitled to speak for the establishment, and by cycle, so a
 * cycle head cannot address another cycle's classes.
 */
class CommunicationsController extends Controller
{
    /**
     * The feed: what is addressed to me, and in force right now.
     *
     * `?categorie=` filters, `?tout=1` lifts the validity window for the staff
     * who manage the board and need to see scheduled and lapsed notices.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Communication::with(['auteur:id,name,prenom,role', 'classe:id,nom_classe'])
            ->visibleTo($user)
            ->feedOrder();

        // Only an author-capable role may look outside the window; for everyone
        // else a scheduled notice must stay invisible until its date.
        if (!$request->boolean('tout') || !$this->mayPublish($user)) {
            $query->inForce();
        }

        if ($categorie = $request->query('categorie')) {
            $query->where('categorie', $categorie);
        }

        $page = $query->paginate((int) $request->input('per_page', 20));

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
        $communication = $this->findVisible($request, $id);

        return response()->json([
            'success' => true,
            'data'    => $communication->load(['auteur:id,name,prenom,role', 'classe:id,nom_classe']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Communication::class);

        $data = $this->validated($request);

        $communication = new Communication($data + [
            'auteur_id' => $request->user()->id,
            'ecole_id'  => $request->user()->ecole_id,
            // Default to live now: an announcement written without a schedule is
            // meant to be read, and a NULL would also sort last in the feed.
            'publie_le' => $data['publie_le'] ?? now(),
        ]);

        // Before the insert, not after: a global scope filters selects and does
        // nothing about an insert (see ScopedToCycle's docblock).
        $communication->assertWithinCycle();
        $communication->save();

        return response()->json([
            'success' => true,
            'message' => 'Communication publiée',
            'data'    => $communication->load('auteur:id,name,prenom,role'),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $communication = $this->findVisible($request, $id);

        $this->authorize('update', $communication);

        $communication->fill($this->validated($request, partial: true));
        $communication->assertWithinCycle();
        $communication->save();

        return response()->json([
            'success' => true,
            'message' => 'Communication mise à jour',
            'data'    => $communication->load('auteur:id,name,prenom,role'),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $communication = $this->findVisible($request, $id);

        $this->authorize('delete', $communication);

        $communication->delete();

        return response()->json(['success' => true, 'message' => 'Communication supprimée']);
    }

    /* ─── Internals ───────────────────────────────────────────────────── */

    /**
     * Resolve an announcement, or 404.
     *
     * Deliberately **not** `visibleTo`-filtered: an author or a head of school
     * must be able to edit a notice addressed to somebody else, and hiding it
     * from them would make the board unmanageable. Cross-school isolation comes
     * from the `BelongsToEcole` scope, which turns another school's id into a
     * 404 — the right answer there, since a 403 would confirm the row exists.
     */
    private function findVisible(Request $request, int $id): Communication
    {
        $communication = Communication::findOrFail($id);

        if (!$this->mayPublish($request->user())
            && !Communication::whereKey($id)->visibleTo($request->user())->inForce()->exists()) {
            // Not addressed to this reader, and they hold no editorial role:
            // 404, so the response does not reveal that the notice exists.
            abort(404);
        }

        return $communication;
    }

    /** Does this account hold an editorial role on the board? */
    private function mayPublish(?\App\Models\User $user): bool
    {
        return $user !== null && (
            $user->role === Roles::SUPER_ADMIN
            || Roles::satisfies($user->role, [Roles::DIRECTOR, 'censeur', 'secretaire'])
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes|required' : 'required';

        return $request->validate([
            'titre'     => $required . '|string|max:255',
            'contenu'   => $required . '|string|max:20000',
            'categorie' => 'nullable|in:' . implode(',', Communication::categories()),
            'audience'  => 'nullable|in:' . implode(',', Communication::audiences()),

            // Each target is required only for the audience it belongs to, so a
            // school-wide notice cannot arrive with a stray class id and a class
            // notice cannot arrive without one.
            'audience_cycle' => 'required_if:audience,' . Communication::AUDIENCE_CYCLE
                . '|nullable|' . Cycles::rule(),
            'audience_role'  => 'required_if:audience,' . Communication::AUDIENCE_ROLE
                . '|nullable|string|max:50',
            // `school_exists`, not `exists`: Laravel's rule runs on the raw
            // query builder and would accept another school's class id.
            'classe_id'      => 'required_if:audience,' . Communication::AUDIENCE_CLASS
                . '|nullable|school_exists:classes,id',

            'tags'      => 'nullable|array|max:10',
            'tags.*'    => 'string|max:50',
            'epingle'   => 'nullable|boolean',
            'publie_le' => 'nullable|date',
            // An expiry before publication would make the notice unreadable the
            // moment it is written.
            'expire_le' => 'nullable|date|after:publie_le',
        ]);
    }
}
