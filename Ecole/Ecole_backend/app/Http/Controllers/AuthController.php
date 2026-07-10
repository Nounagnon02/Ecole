<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    /**
     * Authentification unifiée (session via Sanctum SPA).
     */
    public function connexion(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        // Chercher par email ou par identifiant
        $user = User::where('email', $request->email)
                    ->orWhere('identifiant', $request->email)
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Identifiants incorrects'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Votre compte est désactivé'], 403);
        }

        // Authentification par session (httpOnly cookie)
        Auth::login($user);

        return response()->json([
            'user' => $user,
            'role' => $user->role,
            'ecole_id' => $user->ecole_id,
            'redirect_to' => $this->getRedirectRouteBasedOnRole($user->role)
        ]);
    }

    /**
     * Récupérer le profil de l'utilisateur connecté via Sanctum.
     */
    public function getProfile(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        return response()->json([
            'success' => true,
            'user' => $user->only([
                'id', 'name', 'prenom', 'email', 'identifiant',
                'role', 'ecole_id', 'telephone', 'is_active',
                'email_verified_at', 'created_at', 'updated_at',
            ]),
        ]);
    }

    /**
     * Inscription (Généralement gérée par un administrateur).
     */
    public function inscription(Request $request)
    {
        // Seul un admin ou directeur peut inscrire des gens dans le système réel
        // Mais pour la flexibilité initiale, on laisse ouvert ou on check le user connecté
        
        $validated = $request->validate([
            'name' => 'required|string',
            'prenom' => 'required|string',
            'role' => 'required|string',
            'email' => 'nullable|email|unique:users,email',
            'identifiant' => 'required|string|unique:users,identifiant',
            'password' => 'required|string|min:6',
            'ecole_id' => 'required|exists:ecoles,id',
            'telephone' => 'nullable|string',
        ]);

        try {
            \DB::beginTransaction();

            $user = User::create([
                'name' => $validated['name'],
                'prenom' => $validated['prenom'],
                'role' => $validated['role'],
                'email' => $validated['email'],
                'identifiant' => $validated['identifiant'],
                'password' => Hash::make($validated['password']),
                'ecole_id' => $validated['ecole_id'],
                'telephone' => $validated['telephone'],
            ]);

            // Création du profil selon le rôle
            if ($user->role === 'eleve') {
                $profileData = $request->validate([
                    'numero_matricule' => 'required|string|unique:eleves',
                    'class_id' => 'required|exists:classes,id',
                    'serie_id' => 'nullable|exists:series,id',
                ]);
                Eleve::create([
                    'user_id' => $user->id,
                    'numero_matricule' => $profileData['numero_matricule'],
                    'class_id' => $profileData['class_id'],
                    'serie_id' => $profileData['serie_id'],
                ]);
            } elseif ($user->role === 'parent') {
                UserParent::create(['user_id' => $user->id]);
            } elseif (str_contains($user->role, 'enseignant')) {
                Enseignant::create(['user_id' => $user->id]);
            }

            \DB::commit();

            return response()->json(['message' => 'Utilisateur créé avec succès', 'user' => $user], 201);

        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json(['message' => 'Erreur lors de l\'inscription', 'error' => $e->getMessage()], 500);
        }
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Déconnecté avec succès'], 200);
    }

    /**
     * Sélection d'école après login multi-écoles.
     * Le frontend envoie ecole_id après que l'utilisateur a choisi.
     * On ré-authentifie la session avec l'école choisie.
     */
    public function selectSchool(Request $request)
    {
        $request->validate([
            'ecole_id' => 'required|exists:ecoles,id',
        ]);

        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        // Vérifier que l'utilisateur appartient bien à cette école
        if ($user->ecole_id && $user->ecole_id != $request->ecole_id) {
            return response()->json(['message' => 'Accès refusé à cet établissement'], 403);
        }

        // Mettre à jour l'école en session
        session(['ecole_id' => $request->ecole_id]);

        return response()->json([
            'user' => $user,
            'role' => $user->role,
            'ecole_id' => $request->ecole_id,
            'redirect_to' => $this->getRedirectRouteBasedOnRole($user->role),
        ]);
    }

    protected function getRedirectRouteBasedOnRole($role)
    {
        $routes = [
            'eleve' => '/dashboard-eleve',
            'parent' => '/dashboard-parent',
            'enseignant' => '/dashboard-enseignant',
            'directeur' => '/dashboard-admin',
            'admin' => '/dashboard-admin',
            'comptable' => '/dashboard-comptable',
        ];

        return $routes[$role] ?? '/dashboard';
    }
}
