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
     * Rattacher l'élève au parent joignable à ce numéro, en créant son compte
     * s'il n'existe pas dans l'école. Le numéro, au format local à 10
     * chiffres, lui sert d'identifiant de connexion.
     *
     * @param  array{name: string, prenom?: ?string, telephone: string}  $donnees
     * @return array{identifiant: ?string, mot_de_passe_provisoire: ?string, nouveau: bool}
     */
    public static function rattacherParent(Eleve $eleve, array $donnees, int $ecoleId): array
    {
        $telephone = BeninPhone::normalize($donnees['telephone']);
        $motDePasse = null;

        // Les numéros déjà en base peuvent être à l'ancien format : on compare
        // les formes normalisées, pas les chaînes.
        $compte = User::where('role', 'parent')
            ->where('ecole_id', $ecoleId)
            ->whereNotNull('telephone')
            ->get()
            ->first(fn (User $user) => BeninPhone::normalize($user->telephone) === $telephone);

        if (! $compte) {
            $motDePasse = self::motDePasseProvisoire();
            $compte = User::create([
                'name' => $donnees['name'],
                'prenom' => $donnees['prenom'] ?? null,
                'identifiant' => self::identifiantLibre('0'.substr($telephone, -9)),
                'telephone' => $telephone,
                'password' => Hash::make($motDePasse),
                'role' => 'parent',
                'ecole_id' => $ecoleId,
            ]);
            self::exigerChangement($compte);
        }

        $parent = UserParent::firstOrCreate(['user_id' => $compte->id], ['ecole_id' => $ecoleId]);

        if (! $parent->eleves()->where('eleves.id', $eleve->id)->exists()) {
            $parent->eleves()->attach($eleve->id, [
                'ecole_id' => $ecoleId,
                'is_primary' => ! $eleve->parents()->exists(),
            ]);
        }

        return [
            'identifiant' => $compte->identifiant,
            'mot_de_passe_provisoire' => $motDePasse,
            'nouveau' => $motDePasse !== null,
        ];
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
