<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    /**
     * Générer un secret TOTP et afficher le QR code pour l'activation.
     */
    public function showSetup(Request $request)
    {
        $user = $request->user();
        $google2fa = new Google2FA();

        if ($user->two_factor_enabled) {
            return response()->json(['message' => 'La 2FA est déjà activée'], 422);
        }

        $secret = $google2fa->generateSecretKey();
        $qrCodeUrl = $google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        $user->two_factor_secret = encrypt($secret);
        $user->save();

        return response()->json([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
        ]);
    }

    /**
     * Vérifier un code TOTP pour activer la 2FA.
     */
    public function verify(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();
        $google2fa = new Google2FA();

        if (!$user->two_factor_secret) {
            return response()->json(['message' => 'Veuillez d\'abord initialiser la 2FA'], 422);
        }

        $secret = decrypt($user->two_factor_secret);
        $valid = $google2fa->verifyKey($secret, $request->code, 1);

        if (!$valid) {
            return response()->json(['message' => 'Code invalide'], 422);
        }

        $user->two_factor_enabled = true;
        $user->two_factor_verified_at = now();
        $user->save();

        // Client stateful : marquer la session comme validée pour le
        // middleware VerifyTwoFactor (les clients à token passent par les
        // abilities Sanctum).
        if ($request->hasSession()) {
            $request->session()->put('two_factor_verified', true);
        }

        return response()->json(['message' => '2FA activée avec succès']);
    }

    /**
     * Désactiver la 2FA (nécessite un code valide).
     */
    public function disable(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();
        $google2fa = new Google2FA();

        if (!$user->two_factor_enabled) {
            return response()->json(['message' => 'La 2FA n\'est pas activée'], 422);
        }

        $secret = decrypt($user->two_factor_secret);
        $valid = $google2fa->verifyKey($secret, $request->code, 1);

        if (!$valid) {
            return response()->json(['message' => 'Code invalide'], 422);
        }

        $user->two_factor_enabled = false;
        $user->two_factor_secret = null;
        $user->two_factor_verified_at = null;
        $user->save();

        return response()->json(['message' => '2FA désactivée']);
    }

    /**
     * Vérifier un code TOTP après login (si 2FA activée).
     * Révoque le token temporaire et émet le vrai token.
     */
    public function verifyLogin(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = Auth::user();

        if (!$user || !$user->two_factor_enabled) {
            return response()->json(['message' => 'Non autorisé'], 401);
        }

        $google2fa = new Google2FA();
        $secret = decrypt($user->two_factor_secret);
        $valid = $google2fa->verifyKey($secret, $request->code, 1);

        if (!$valid) {
            return response()->json(['message' => 'Code 2FA invalide'], 422);
        }

        // Révoquer le token temporaire 2FA
        $request->user()->currentAccessToken()->delete();

        $user->two_factor_verified_at = now();
        $user->save();

        // Client stateful (SPA) : authentifier la session, exactement comme
        // AuthController::connexion() le fait pour la connexion primaire.
        // Sans ceci, aucune session cookie n'était jamais établie pour un
        // compte 2FA — `api-client.js` est en auth par cookie pure (jamais
        // d'en-tête Authorization), donc le jeton Bearer renvoyé plus bas
        // n'était jamais réutilisé par le SPA : chaque requête suivante
        // répondait 401, alors même que le code TOTP venait d'être validé.
        // Se marquer seulement `session()->put('two_factor_verified', true)`
        // (l'ancien comportement) ne suffit pas sans `Auth::login()` : rien
        // n'associe la session à un utilisateur.
        if (\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::fromFrontend($request)) {
            // `Auth::guard('web')`, pas le bare `Auth::login()` : cette route
            // exige `auth:sanctum` pour authentifier le jeton en attente, ce
            // qui a déjà résolu/mis en cache le garde Sanctum (un
            // `RequestGuard`, sans méthode `login()`) comme garde courant.
            // `AuthController::connexion()` peut se permettre `Auth::login()`
            // nu parce que sa route n'exige aucun garde au préalable.
            Auth::guard('web')->login($user);
            $request->session()?->regenerate();
        }

        if ($request->hasSession()) {
            $request->session()->put('two_factor_verified', true);
        }

        // Émettre le vrai token (client mobile / natif)
        $device = 'auth-token';
        $token = $user->createToken($device)->plainTextToken;

        return response()->json([
            'message' => 'Authentification réussie',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
            'role' => $user->role,
            'ecole_id' => $user->ecole_id,
        ]);
    }
}
