<?php

namespace App\Support;

use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Qui peut écrire à qui dans la messagerie.
 *
 * La liste des contacts renvoyait tous les utilisateurs actifs de l'école, et
 * l'envoi n'exigeait que « même école » : un parent voyait les élèves et les
 * autres parents par leur nom et pouvait leur écrire.
 *
 * Règle :
 *  - le personnel (école ou université) joint tout le monde dans l'école ;
 *  - un parent ou un élève ne joint que le personnel de l'école ;
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
            Roles::PARENT, Roles::ELEVE => self::SCHOOL_STAFF,
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

        return $roles === null ? $query : $query->whereIn('role', $roles);
    }

    /** `$user` peut-il écrire à `$recipient` ? */
    public static function canWrite(User $user, User $recipient): bool
    {
        if ($recipient->ecole_id !== $user->ecole_id || $recipient->id === $user->id) {
            return false;
        }

        $roles = self::allowedRoles($user);

        if ($roles === null || in_array($recipient->role, $roles, true)) {
            return true;
        }

        // Répondre reste possible : le destinataire a déjà écrit à cet utilisateur.
        return Message::query()
            ->where('expediteur', (string) $recipient->id)
            ->where('destinataire', (string) $user->id)
            ->exists();
    }
}
