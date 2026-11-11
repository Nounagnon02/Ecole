<?php

namespace App\Support;

use App\Models\Eleve;
use App\Models\User;
use App\Models\UserParent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Ce que l'inscription produit à la place de l'agent : matricule, mot de
 * passe provisoire, et compte du parent rattaché à l'élève.
 */
final class Inscription
{
    /** Lettres et chiffres sans 0/O, 1/I/L : le code se dicte et se recopie. */
    private const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

    /**
     * Coût bcrypt d'un mot de passe provisoire.
     *
     * Un mot de passe provisoire est tiré au hasard (10 caractères sur 31, soit
     * près de 50 bits) et doit être remplacé à la première connexion : il n'a
     * pas besoin du coût prévu pour un mot de passe choisi par une personne.
     * Au coût normal, importer 600 élèves et leurs parents prenait plusieurs
     * minutes de calcul et la requête expirait. Le mot de passe définitif,
     * lui, est haché au coût normal (PasswordChangeController).
     */
    private const COUT_PROVISOIRE = 6;

    /** Vrai pendant une simulation d'import : on contrôle, on ne hache pas. */
    public static bool $simulation = false;

    /** Empreinte d'un mot de passe produit par l'application. */
    public static function hacher(string $motDePasse): string
    {
        if (self::$simulation) {
            // Empreinte bcrypt valide de forme, qui n'ouvre aucun compte : la
            // transaction d'une simulation est toujours annulée.
            return '$2y$04$'.str_repeat('.', 53);
        }

        // Jamais au-dessus du coût configuré : le modèle refuse une empreinte
        // plus coûteuse que la sienne.
        return Hash::make($motDePasse, ['rounds' => min(self::COUT_PROVISOIRE, (int) config('hashing.bcrypt.rounds', 12))]);
    }

    public static function nouveauMatricule(): string
    {
        do {
            $matricule = 'E'.now()->format('y').self::code(6);
        } while (DB::table('eleves')->where('numero_matricule', $matricule)->exists()
            || DB::table('users')->where('identifiant', $matricule)->exists());

        return $matricule;
    }

    public static function motDePasseProvisoire(): string
    {
        return self::code(10);
    }

    /**
     * Inscrire un élève : compte, dossier, et parent s'il est fourni.
     *
     * Une seule règle pour le formulaire et pour l'import en masse. À appeler
     * dans une transaction.
     *
     * @param  array<string, mixed>  $donnees  name, prenom, classe_id, et en option
     *                                         numero_matricule, identifiant, password, serie_id, email,
     *                                         date_naissance, lieu_naissance, sexe, parent{name, prenom, telephone}
     * @return array{eleve: Eleve, acces: array{eleve: array, parent: ?array}}
     */
    public static function inscrireEleve(array $donnees, int $ecoleId): array
    {
        $matricule = ($donnees['numero_matricule'] ?? null) ?: self::nouveauMatricule();
        $motDePasse = ($donnees['password'] ?? null) ?: self::motDePasseProvisoire();

        $user = User::create([
            'name' => $donnees['name'],
            'prenom' => $donnees['prenom'],
            'identifiant' => ($donnees['identifiant'] ?? null) ?: $matricule,
            // Choisi par l'agent : coût normal. Produit ici : provisoire.
            'password' => empty($donnees['password']) ? self::hacher($motDePasse) : Hash::make($motDePasse),
            'role' => 'eleve',
            'ecole_id' => $ecoleId,
            'email' => ($donnees['email'] ?? null) ?: null,
        ]);

        // Mot de passe produit ici, donc connu de l'agent : provisoire.
        if (empty($donnees['password'])) {
            self::exigerChangement($user);
        }

        $eleve = Eleve::create([
            'user_id' => $user->id,
            'ecole_id' => $ecoleId,
            'numero_matricule' => $matricule,
            'classe_id' => $donnees['classe_id'],
            'serie_id' => $donnees['serie_id'] ?? null,
            'date_naissance' => $donnees['date_naissance'] ?? null,
            'lieu_naissance' => $donnees['lieu_naissance'] ?? null,
            'sexe' => $donnees['sexe'] ?? null,
        ]);

        return [
            'eleve' => $eleve,
            'acces' => [
                'eleve' => ['identifiant' => $user->identifiant, 'mot_de_passe_provisoire' => $motDePasse],
                'parent' => ! empty($donnees['parent']) ? self::rattacherParent($eleve, $donnees['parent'], $ecoleId) : null,
            ],
        ];
    }

    /** Identifiant de connexion tiré d'un numéro : sa forme locale à 10 chiffres. */
    public static function identifiantDepuisTelephone(string $telephone): string
    {
        return self::identifiantLibre('0'.substr((string) BeninPhone::normalize($telephone), -9));
    }

    /**
     * Rattacher l'élève au parent joignable à ce numéro, en créant son compte
     * s'il n'existe pas dans l'école. Le numéro, au format local à 10
     * chiffres, lui sert d'identifiant de connexion.
     *
     * @param  array{name: string, prenom?: ?string, telephone: string}  $donnees
     * @return array{identifiant: ?string, mot_de_passe_provisoire: ?string, nouveau: bool}
     */
    public static function rattacherParent(Eleve $eleve, array $donnees, int $ecoleId): array
    {
        $acces = self::compteParent($donnees, $ecoleId);
        $parent = UserParent::where('user_id', $acces['user_id'])->firstOrFail();

        if (! $parent->eleves()->where('eleves.id', $eleve->id)->exists()) {
            $parent->eleves()->attach($eleve->id, [
                'ecole_id' => $ecoleId,
                'is_primary' => ! $eleve->parents()->exists(),
            ]);
        }

        return $acces;
    }

    /**
     * Le compte du parent joignable à ce numéro dans l'école, créé au besoin.
     *
     * @param  array{name: string, prenom?: ?string, telephone: string}  $donnees
     * @return array{identifiant: ?string, mot_de_passe_provisoire: ?string, nouveau: bool, user_id: int}
     */
    public static function compteParent(array $donnees, int $ecoleId): array
    {
        $telephone = BeninPhone::normalize($donnees['telephone']);
        $motDePasse = null;

        $compte = self::parentConnu($telephone, $ecoleId);

        if (! $compte) {
            $motDePasse = self::motDePasseProvisoire();
            $compte = User::create([
                'name' => $donnees['name'],
                'prenom' => $donnees['prenom'] ?? null,
                'identifiant' => self::identifiantDepuisTelephone($telephone),
                'telephone' => $telephone,
                'password' => self::hacher($motDePasse),
                'role' => 'parent',
                'ecole_id' => $ecoleId,
            ]);
            self::exigerChangement($compte);

            if (isset(self::$parentsParTelephone[$ecoleId])) {
                self::$parentsParTelephone[$ecoleId][$telephone] = $compte->id;
            }
        }

        UserParent::firstOrCreate(['user_id' => $compte->id], ['ecole_id' => $ecoleId]);

        return [
            'identifiant' => $compte->identifiant,
            'mot_de_passe_provisoire' => $motDePasse,
            'nouveau' => $motDePasse !== null,
            'user_id' => $compte->id,
        ];
    }

    /**
     * Index « téléphone normalisé → compte parent » par école, tenu le temps
     * d'un import. Sans lui, chaque ligne relisait tous les parents de l'école
     * pour comparer les numéros : sur 600 lignes, l'essentiel du temps.
     * Null hors import : on relit alors la base à chaque appel.
     *
     * @var array<int, array<string, int>>|null
     */
    private static ?array $parentsParTelephone = null;

    /** Ouvrir ou fermer l'index des parents (à fermer dans un `finally`). */
    public static function indexerParents(bool $actif): void
    {
        self::$parentsParTelephone = $actif ? [] : null;
    }

    /**
     * Le compte parent de l'école joignable à ce numéro normalisé, s'il existe.
     * Les numéros en base peuvent être à l'ancien format : on compare les
     * formes normalisées, pas les chaînes.
     */
    private static function parentConnu(string $telephone, int $ecoleId): ?User
    {
        $normalises = fn () => User::where('role', 'parent')->where('ecole_id', $ecoleId)->whereNotNull('telephone')
            ->get(['id', 'telephone'])
            ->mapWithKeys(fn (User $user) => [(string) BeninPhone::normalize($user->telephone) => $user->id])
            ->all();

        if (self::$parentsParTelephone === null) {
            $id = $normalises()[$telephone] ?? null;
        } else {
            self::$parentsParTelephone[$ecoleId] ??= $normalises();
            $id = self::$parentsParTelephone[$ecoleId][$telephone] ?? null;
        }

        return $id ? User::find($id) : null;
    }

    /**
     * Marquer le mot de passe du compte comme provisoire : son titulaire devra
     * le remplacer à la première connexion.
     */
    public static function exigerChangement(User $compte): void
    {
        $compte->forceFill(['password_change_required' => true])->save();
    }

    /** `users.identifiant` est unique sur toute la plateforme, pas par école. */
    private static function identifiantLibre(string $souhaite): string
    {
        $identifiant = $souhaite;

        for ($suffixe = 2; DB::table('users')->where('identifiant', $identifiant)->exists(); $suffixe++) {
            $identifiant = $souhaite.'-'.$suffixe;
        }

        return $identifiant;
    }

    private static function code(int $longueur): string
    {
        $code = '';

        for ($i = 0; $i < $longueur; $i++) {
            $code .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
        }

        return $code;
    }
}
