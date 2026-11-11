<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Changement du mot de passe par son titulaire.
 *
 * La page Paramètres appelait déjà `POST /auth/change-password`, qui
 * n'existait pas. C'est aussi par ici que se remplace un mot de passe
 * provisoire, ce qui lève la restriction du compte.
 */
class PasswordChangeController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed|different:current_password',
        ], [
            'password.different' => 'Le nouveau mot de passe doit être différent de l’ancien.',
        ]);

        if (! Hash::check($request->input('current_password'), $user->password)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect.',
                'errors' => ['current_password' => ['Le mot de passe actuel est incorrect.']],
            ], 422);
        }

        $user->forceFill([
            'password' => Hash::make($request->input('password')),
            'password_change_required' => false,
        ])->save();

        return response()->json(['success' => true, 'message' => 'Mot de passe mis à jour.']);
    }
}
