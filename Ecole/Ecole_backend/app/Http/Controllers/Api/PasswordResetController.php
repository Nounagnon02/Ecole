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
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

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
            $user = User::where('email', $request->email)->first();

            $frontendUrl = config('app.frontend_url') ?? config('app.url');
            $resetUrl = "{$frontendUrl}/reset-password?token={$token}&email={$request->email}";

            $user->notify(new ResetPasswordNotification($resetUrl));

            return response()->json([
                'message' => 'Un email de réinitialisation a été envoyé.',
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur envoi email réinitialisation: '.$e->getMessage());

            return response()->json([
                'message' => 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.',
            ], 500);
        }
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
        $user->save();

        // Supprimer le token utilisé
        DB::table('password_resets')->where('email', $request->email)->delete();

        return response()->json([
            'message' => 'Mot de passe réinitialisé avec succès.',
        ]);
    }
}
