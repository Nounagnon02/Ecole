<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    /**
     * Envoie un email de réinitialisation de mot de passe.
     * POST /api/auth/forgot-password
     */
    public function sendResetLink(Request $request)
    {
        // Pas de règle `exists:` : elle transformait l'endpoint en oracle
        // d'énumération de comptes (422 si inconnu, 200 sinon). La réponse est
        // désormais identique dans les deux cas (cf. audit S14).
        $request->validate([
            'email' => 'required|email',
        ]);

        $reponseGenerique = response()->json([
            'message' => 'Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé.',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return $reponseGenerique;
        }

        $token = Str::random(60);

        // Stocker le token
        DB::table('password_resets')->updateOrInsert(
            ['email' => $request->email],
            [
                'email' => $request->email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        // Envoyer l'email
        try {
            $frontendUrl = config('app.frontend_url') ?? config('app.url');
            $resetUrl = "{$frontendUrl}/reset-password?token={$token}&email=" . urlencode($request->email);

            $user->notify(new ResetPasswordNotification($resetUrl));
        } catch (\Exception $e) {
            // On journalise sans révéler au client que le compte existe.
            Log::error('Erreur envoi email réinitialisation: '.$e->getMessage());
        }

        return $reponseGenerique;
    }

    /**
     * Réinitialise le mot de passe avec le token.
     * POST /api/auth/reset-password
     */
    public function reset(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        // Vérifier le token
        $record = DB::table('password_resets')
            ->where('email', $request->email)
            ->first();

        if (!$record || !Hash::check($request->token, $record->token)) {
            return response()->json([
                'message' => 'Token de réinitialisation invalide ou expiré.',
            ], 400);
        }

        // Vérifier l'expiration (1 heure)
        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_resets')->where('email', $request->email)->delete();

            return response()->json([
                'message' => 'Le token de réinitialisation a expiré. Veuillez refaire une demande.',
            ], 400);
        }

        // Mettre à jour le mot de passe
        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->setRememberToken(Str::random(60));
        $user->save();

        // Révoquer les accès existants : sans cela, un attaquant déjà connecté
        // conservait sa session après le changement de mot de passe (S18).
        $user->tokens()->delete();

        if (config('session.driver') === 'database' && \Illuminate\Support\Facades\Schema::hasTable('sessions')) {
            DB::table('sessions')->where('user_id', $user->id)->delete();
        }

        // Supprimer le token utilisé
        DB::table('password_resets')->where('email', $request->email)->delete();

        return response()->json([
            'message' => 'Mot de passe réinitialisé avec succès.',
        ]);
    }
}
