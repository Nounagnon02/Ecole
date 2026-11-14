<?php

namespace App\Support;

use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Qui peut écrire à qui dans la messagerie.
 *
 * La liste des contacts renvoyait tous les utilisateurs actifs de l'école, et
 * l'envoi n'exigeait que « même école » : un parent voyait les élèves et les
 * autres parents par leur nom et pouvait leur écrire.
 *
 * Règle :
 *  - le personnel (école ou université) joint tout le monde dans l'école ;
 *  - un parent joint l'administration de l'école et les enseignants de ses
 *    enfants, pas les autres enseignants (règle décidée le 14/11/2026) ;
 *  - un élève joint le personnel de l'école ;
 *  - un étudiant ne joint que le personnel de l'université ;
 *  - chacun peut toujours répondre à quelqu'un qui lui a déjà écrit.
 *
 * La même règle sert à lister les contacts et à valider l'envoi : masquer un
 * contact dans l'interface sans refuser l'envoi ne protégerait rien.
 */
final class MessagingContacts
{
    /** Personnel que les familles peuvent joindre. L'administration de la plateforme n'en fait pas partie. */
    private const SCHOOL_STAFF = [
        Roles::DIRECTOR, Roles::DIRECTOR_KINDERGARTEN, Roles::DIRECTOR_PRIMARY, Roles::DIRECTOR_SECONDARY,
        Roles::CENSEUR, Roles::SECRETAIRE, Roles::COMPTABLE, Roles::SURVEILLANT, Roles::INFIRMIER,
        Roles::BIBLIOTHECAIRE, Roles::TEACHER, Roles::TEACHER_SECONDARY, Roles::TEACHER_KINDERGARTEN,
        Roles::TEACHER_PRIMARY,
    ];

    /** Administration de l'école : tout le personnel sauf les enseignants. */
    private const ADMINISTRATION = [
        Roles::DIRECTOR, Roles::DIRECTOR_KINDERGARTEN, Roles::DIRECTOR_PRIMARY, Roles::DIRECTOR_SECONDARY,
        Roles::CENSEUR, Roles::SECRETAIRE, Roles::COMPTABLE, Roles::SURVEILLANT, Roles::INFIRMIER,
        Roles::BIBLIOTHECAIRE,
    ];

    private const UNIVERSITY_STAFF = [Roles::CHANCELLOR, Roles::DEAN, Roles::PROFESSOR, Roles::STAFF];

    /**
     * Rôles que `$user` peut contacter de sa propre initiative, ou null s'il
     * n'y a pas de restriction (personnel).
     *
     * @return list<string>|null
     */
    public static function allowedRoles(User $user): ?array
    {
        return match ($user->role) {
            Roles::PARENT => self::ADMINISTRATION,
            Roles::ELEVE => self::SCHOOL_STAFF,
            Roles::STUDENT => self::UNIVERSITY_STAFF,
            default => null,
        };
    }

    /** Contacts proposés à `$user` : même école, actifs, selon la règle ci-dessus. */
    public static function query(User $user): Builder
    {
        $query = User::query()
            ->where('ecole_id', $user->ecole_id)
            ->where('is_active', true)
            ->where('id', '!=', $user->id);

        $roles = self::allowedRoles($user);

        if ($roles === null) {
            return $query;
        }

        $enseignants = self::enseignantsDesEnfants($user);

        return $query->where(fn (Builder $q) => $q->whereIn('role', $roles)->orWhereIn('id', $enseignants));
    }

    /**
     * Comptes des enseignants des enfants d'un parent : affectés par matière
     * à leur classe (collège, lycée) ou maîtres de leur classe (maternelle,
     * primaire). Vide pour tout autre rôle.
     *
     * @return list<int>
     */
    public static function enseignantsDesEnfants(User $user): array
    {
        if ($user->role !== Roles::PARENT) {
            return [];
        }

        $classes = $user->parent?->eleves()->pluck('eleves.classe_id')->filter()->unique()->all() ?? [];

        if ($classes === []) {
            return [];
        }

        $parMatiere = DB::table('enseignant_matiere')
            ->join('enseignants', 'enseignants.id', '=', 'enseignant_matiere.enseignant_id')
            ->whereIn('enseignant_matiere.classe_id', $classes)
            ->where('enseignants.ecole_id', $user->ecole_id)
            ->pluck('enseignants.user_id');

        $maitres = DB::table('enseignants_maternelle_primaire')
            ->whereIn('classe_id', $classes)
            ->where('ecole_id', $user->ecole_id)
            ->pluck('user_id');

        return $parMatiere->merge($maitres)->filter()->map(fn ($id) => (int) $id)->unique()->values()->all();
    }

    /** `$user` peut-il écrire à `$recipient` ? */
    public static function canWrite(User $user, User $recipient): bool
    {
        if ($recipient->ecole_id !== $user->ecole_id || $recipient->id === $user->id) {
            return false;
        }

        $roles = self::allowedRoles($user);

        if ($roles === null || in_array($recipient->role, $roles, true)
            || in_array((int) $recipient->id, self::enseignantsDesEnfants($user), true)) {
            return true;
        }

        // Répondre reste possible : le destinataire a déjà écrit à cet utilisateur.
        return Message::query()
            ->where('expediteur', (string) $recipient->id)
            ->where('destinataire', (string) $user->id)
            ->exists();
    }
}
