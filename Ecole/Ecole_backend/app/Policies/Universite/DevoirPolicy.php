<?php

namespace App\Policies\Universite;

use App\Models\Universite\Devoir;
use App\Models\User;
use App\Support\Roles;

/**
 * Fine-grained authorisation on a university assignment.
 *
 * `role:` on the route answers "may a professor use this endpoint at all". It
 * cannot answer "is this *their* assignment", which is the question that matters
 * — a lecturer marking another lecturer's students is exactly the kind of thing
 * a role gate lets through.
 *
 * Ownership is not a column on `uni_devoirs`. It is derived: the subject names
 * its lecturer (`uni_matieres.enseignant_id`), and the lecturer record names its
 * account (`uni_enseignants.user_id`, added alongside `etudiants.user_id`). So
 * the chain is account → lecturer → subject → assignment, and `created_by` is
 * the second route in, for the case where a dean published on a lecturer's
 * behalf.
 */
class DevoirPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->inUniversity($user);
    }

    public function view(User $user, Devoir $devoir): bool
    {
        if ($this->administers($user)) {
            return true;
        }

        if ($user->role === Roles::PROFESSOR) {
            return $this->teaches($user, $devoir);
        }

        if ($user->role === Roles::STUDENT) {
            // Unpublished means unpublished: a draft is not readable by the
            // people it will be set to.
            return $devoir->publie && $this->enrolledInFiliere($user, $devoir);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $this->administers($user) || $user->role === Roles::PROFESSOR;
    }

    public function update(User $user, Devoir $devoir): bool
    {
        return $this->administers($user) || $this->teaches($user, $devoir);
    }

    public function delete(User $user, Devoir $devoir): bool
    {
        return $this->update($user, $devoir);
    }

    /** Marking is the same authority as editing. */
    public function grade(User $user, Devoir $devoir): bool
    {
        return $this->update($user, $devoir);
    }

    /**
     * A student may hand in work for a published assignment set to their filière.
     *
     * The filière check is the whole point: without it any signed-in student
     * could submit to any assignment on the platform's university module by
     * changing the id in the URL.
     */
    public function submit(User $user, Devoir $devoir): bool
    {
        return $user->role === Roles::STUDENT
            && $devoir->publie
            && $this->enrolledInFiliere($user, $devoir);
    }

    /* ─── Internals ───────────────────────────────────────────────────── */

    private function inUniversity(User $user): bool
    {
        return in_array($user->role, [
            Roles::CHANCELLOR, Roles::DEAN, Roles::PROFESSOR, Roles::STUDENT,
            Roles::STAFF, Roles::SUPER_ADMIN,
        ], true);
    }

    private function administers(User $user): bool
    {
        return $user->role === Roles::SUPER_ADMIN
            || in_array($user->role, Roles::universityAdministration(), true);
    }

    private function teaches(User $user, Devoir $devoir): bool
    {
        if ($devoir->created_by !== null && (int) $devoir->created_by === (int) $user->id) {
            return true;
        }

        $lecturerId = $user->enseignantUniversite?->id;

        return $lecturerId !== null
            && $devoir->matiere !== null
            && (int) $devoir->matiere->enseignant_id === (int) $lecturerId;
    }

    private function enrolledInFiliere(User $user, Devoir $devoir): bool
    {
        $filiereId = $user->etudiant?->filiere_id;

        return $filiereId !== null
            && $devoir->matiere !== null
            && (int) $devoir->matiere->filiere_id === (int) $filiereId;
    }
}
