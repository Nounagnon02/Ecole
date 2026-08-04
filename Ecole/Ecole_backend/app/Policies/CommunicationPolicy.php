<?php

namespace App\Policies;

use App\Models\Communication;
use App\Models\User;
use App\Support\Roles;

/**
 * Who may write on the noticeboard.
 *
 * Reading is not gated here — every member of the establishment reads the board,
 * and *what* they read is decided by the audience rule in
 * `Communication::scopeVisibleTo`. A policy could not express that: it answers
 * yes or no per row, and the feed needs the filter inside the query.
 *
 * Publishing is confined to the offices that speak for the establishment: the
 * head (their cycle deputies included), the censeur and the secretary. A
 * teacher addresses a class through assignments and messages, both of which have
 * a recipient; a noticeboard has an audience, and handing that to everyone turns
 * it into a second, unmoderated inbox.
 */
class CommunicationPolicy
{
    /** Every signed-in member of the school reads the board. */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Communication $communication): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $this->isEditor($user);
    }

    /**
     * The author, or a head of school.
     *
     * The censeur and the secretary may publish but not rewrite a colleague's
     * notice: an announcement is signed, and letting a peer edit it under
     * somebody else's name is a small forgery. The head can, because somebody
     * has to be able to correct a notice whose author is on leave.
     */
    public function update(User $user, Communication $communication): bool
    {
        return $this->isAuthor($user, $communication)
            || Roles::isDirector($user->role)
            || $user->role === Roles::SUPER_ADMIN;
    }

    public function delete(User $user, Communication $communication): bool
    {
        return $this->update($user, $communication);
    }

    /**
     * `super-admin` is named explicitly rather than through a `Gate::before`:
     * the application registers no such hook, so a policy that omits the
     * platform role silently locks it out — which is how the cycle heads ended
     * up refused by every policy.
     */
    private function isEditor(User $user): bool
    {
        return $user->role === Roles::SUPER_ADMIN
            || Roles::satisfies($user->role, [Roles::DIRECTOR, 'censeur', 'secretaire']);
    }

    private function isAuthor(User $user, Communication $communication): bool
    {
        return $communication->auteur_id !== null
            && (int) $communication->auteur_id === (int) $user->id;
    }
}
