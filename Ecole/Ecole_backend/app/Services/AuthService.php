<?php

namespace App\Services;

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\User;
use App\Models\UserParent;
use App\Support\Roles;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Logique d'authentification et de création de compte, indépendante du
 * format HTTP de la réponse — extraite d'`AuthController`, qui portait tout
 * ça en plus de la mise en forme des réponses (audit P4.4).
 */
class AuthService
{
    /**
     * Utilisateur correspondant à ces identifiants, ou `null` — sans effet de
     * bord (verrouillage de compte, session, jetons : à la charge de l'appelant).
     */
    public function attempt(string $login, string $password): ?User
    {
        // Parenthèses explicites : sans le groupement, un `orWhere` se
        // combinerait mal avec toute condition ajoutée par la suite.
        $user = User::where(function ($q) use ($login) {
            $q->where('email', $login)->orWhere('identifiant', $login);
        })->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return null;
        }

        return $user;
    }

    /**
     * Raison de refuser la connexion à cause de l'école de l'utilisateur, ou
     * `null`.
     *
     * Un super-admin n'a pas d'école propre et n'est jamais bloqué ici —
     * sinon un établissement suspendu verrouillerait le compte même qui doit
     * pouvoir le réactiver.
     */
    public function schoolAccessDenied(User $user): ?string
    {
        if ($user->role === Roles::SUPER_ADMIN || !$user->ecole_id) {
            return null;
        }

        // withTrashed : une école désactivée par suppression douce ne doit
        // pas se comporter comme une école active simplement parce que la
        // ligne est cachée des requêtes ordinaires.
        $school = Ecole::withTrashed()->find($user->ecole_id);

        if (!$school || $school->trashed()) {
            return "Cet établissement n'est plus accessible. Contactez l'administrateur.";
        }

        if ($school->status !== 'active') {
            return 'Cet établissement est désactivé. Contactez l\'administrateur.';
        }

        return null;
    }

    /** Route de redirection du tableau de bord pour un rôle donné. */
    public function redirectRouteFor(string $role): string
    {
        $routes = [
            Roles::ELEVE => '/dashboard-eleve',
            Roles::PARENT => '/dashboard-parent',
            Roles::TEACHER => '/dashboard-enseignant',
            Roles::TEACHER_KINDERGARTEN => '/dashboard-enseignant',
            Roles::TEACHER_PRIMARY => '/dashboard-enseignant',
            Roles::TEACHER_SECONDARY => '/dashboard-enseignant',
            Roles::DIRECTOR => '/dashboard-admin',
            Roles::DIRECTOR_KINDERGARTEN => '/dashboard-admin',
            Roles::DIRECTOR_PRIMARY => '/dashboard-admin',
            Roles::DIRECTOR_SECONDARY => '/dashboard-admin',
            Roles::ADMIN => '/dashboard-admin',
            Roles::COMPTABLE => '/dashboard-comptable',
            Roles::CENSEUR => '/dashboard-censeur',
            Roles::SURVEILLANT => '/dashboard-surveillant',
            Roles::SECRETAIRE => '/dashboard-secretaire',
            Roles::INFIRMIER => '/dashboard-infirmier',
            Roles::BIBLIOTHECAIRE => '/dashboard-bibliothecaire',
            Roles::CHANCELLOR => '/dashboard-universite',
            Roles::DEAN => '/dashboard-universite',
            Roles::PROFESSOR => '/dashboard-universite',
            Roles::STUDENT => '/dashboard-universite',
            Roles::STAFF => '/dashboard-universite',
        ];

        return $routes[$role] ?? '/dashboard';
    }

    /**
     * Crée le compte et, selon le rôle, son profil (élève/parent/enseignant).
     * Tout ou rien : `DB::transaction()` referme elle-même la transaction sur
     * la moindre exception, y compris une `ValidationException` — c'est ce
     * qui manquait à l'ancien `DB::beginTransaction()`/`commit()`/`rollBack()`
     * manuel et laissait une transaction ouverte sur les connexions réutilisées
     * (worker de file, connexions persistantes).
     *
     * @param  array<string, mixed>  $validated  Champs communs, déjà validés.
     * @param  array<string, mixed>|null  $profileData  Champs propres au
     *         profil élève (`numero_matricule`, `classe_id`, `serie_id`),
     *         déjà validés par l'appelant — `null` pour les autres rôles.
     */
    public function registerUser(array $validated, int $ecoleId, ?array $profileData): User
    {
        return DB::transaction(function () use ($validated, $ecoleId, $profileData) {
            $user = User::create([
                'name' => $validated['name'],
                'prenom' => $validated['prenom'],
                'role' => $validated['role'],
                // `nullable` : ces champs peuvent être absents de la requête,
                // pas seulement vides. Y accéder sans repli levait un
                // "Undefined array key" (silencieux en production, mais un
                // vrai bug) dès qu'un appelant omettait le champ plutôt que
                // d'envoyer une chaîne vide.
                'email' => $validated['email'] ?? null,
                'identifiant' => $validated['identifiant'],
                'password' => Hash::make($validated['password']),
                'ecole_id' => $ecoleId,
                'telephone' => $validated['telephone'] ?? null,
            ]);

            if ($user->role === Roles::ELEVE) {
                Eleve::create([
                    'user_id' => $user->id,
                    'numero_matricule' => $profileData['numero_matricule'],
                    'classe_id' => $profileData['classe_id'],
                    'serie_id' => $profileData['serie_id'] ?? null,
                ]);
            } elseif ($user->role === Roles::PARENT) {
                UserParent::create(['user_id' => $user->id]);
            } elseif (str_contains($user->role, 'enseignant')) {
                Enseignant::create(['user_id' => $user->id]);
            }

            return $user;
        });
    }
}
