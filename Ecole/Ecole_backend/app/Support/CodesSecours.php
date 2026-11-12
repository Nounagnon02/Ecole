<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Codes de secours de la double authentification : huit codes à usage unique,
 * remis une seule fois à l'activation, conservés hachés.
 */
final class CodesSecours
{
    private const NOMBRE = 8;

    private const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

    /** Générer de nouveaux codes (les anciens cessent de valoir) et les rendre en clair, une fois. */
    public static function regenerer(User $user): array
    {
        $codes = [];
        for ($i = 0; $i < self::NOMBRE; $i++) {
            $brut = '';
            for ($j = 0; $j < 8; $j++) {
                $brut .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
            }
            $codes[] = substr($brut, 0, 4).'-'.substr($brut, 4);
        }

        DB::transaction(function () use ($user, $codes) {
            self::effacer($user);
            DB::table('codes_secours_2fa')->insert(array_map(fn ($c) => [
                'user_id' => $user->id, 'hachage' => Hash::make($c), 'created_at' => now(), 'updated_at' => now(),
            ], $codes));
        });

        return $codes;
    }

    /** Consommer un code : vrai s'il était valide, et il ne vaudra plus. */
    public static function consommer(User $user, string $saisi): bool
    {
        $saisi = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $saisi));
        if (strlen($saisi) !== 8) {
            return false;
        }
        $saisi = substr($saisi, 0, 4).'-'.substr($saisi, 4);
        foreach (DB::table('codes_secours_2fa')->where('user_id', $user->id)->get(['id', 'hachage']) as $ligne) {
            if (Hash::check($saisi, $ligne->hachage)) {
                DB::table('codes_secours_2fa')->where('id', $ligne->id)->delete();

                return true;
            }
        }

        return false;
    }

    public static function restants(User $user): int
    {
        return DB::table('codes_secours_2fa')->where('user_id', $user->id)->count();
    }

    public static function effacer(User $user): void
    {
        DB::table('codes_secours_2fa')->where('user_id', $user->id)->delete();
    }
}
