<?php

namespace App\Http\Controllers;

use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\User;
use App\Models\UserParent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    /**
     * Authentification unifiée.
     *
     * Deux modes de sortie selon le client :
     *  - SPA web / desktop : session Sanctum sur cookie httpOnly ;
     *  - mobile & clients non-stateful : token Sanctum porté en Bearer.
     *
     * Le second mode n'existait pas — `createToken()` n'était appelé nulle
     * part —, si bien que l'application mobile n'obtenait jamais de token et
     * recevait 401 sur toutes les routes protégées (cf. audit F2).
     */
    public function connexion(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
            'device_name' => 'nullable|string|max:255',
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

        $payload = [
            'user'        => $user,
            'role'        => $user->role,
            'ecole_id'    => $user->ecole_id,
            'redirect_to' => $this->getRedirectRouteBasedOnRole($user->role),
        ];

        // Client stateful (SPA sur domaine déclaré dans sanctum.stateful) :
        // session sur cookie httpOnly, aucun token exposé au JavaScript.
        if ($this->estClientStateful($request)) {
            Auth::login($user);
            $request->session()?->regenerate();

            // Compte plateforme sans école propre : le front affiche le
            // sélecteur d'établissement (écran déjà présent dans LoginForm,
            // mais que le backend n'alimentait jamais — cf. audit F5).
            if (!$user->ecole_id && $user->role === 'super-admin') {
                $payload['schools'] = \App\Models\Ecole::where('status', 'active')
                    ->orderBy('nom')
                    ->get(['id', 'nom as name']);
                $payload['requires_school'] = true;
            }

            return response()->json($payload);
        }

        // Client mobile / natif : token Bearer.
        $device = $request->input('device_name', 'mobile');
        $payload['token'] = $user->createToken($device)->plainTextToken;
        $payload['token_type'] = 'Bearer';

        return response()->json($payload);
    }

    /**
     * La requête vient-elle d'un front first-party gérant les cookies ?
     * Sanctum considère « stateful » les origines listées dans sanctum.stateful.
     */
    private function estClientStateful(Request $request): bool
    {
        return \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::fromFrontend($request);
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
            return response()->json(['message' => 'Erreur lors de l\'inscription', 'error' => $this->messageErreur($e)], 500);
        }
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        // Client mobile : révoquer le token porteur utilisé pour cet appel.
        // Sans cela, le token restait valide jusqu'à son expiration (24 h).
        $token = $user?->currentAccessToken();
        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }

        // Client SPA : détruire la session.
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Déconnecté avec succès'], 200);
    }

    /**
     * Sélection d'école après login multi-écoles.
     *
     * Seul un compte plateforme (sans `ecole_id` propre) a un choix à faire.
     * Auparavant, un utilisateur dont `ecole_id` était null pouvait désigner
     * n'importe quel établissement (cf. audit F5).
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

        if ($user->ecole_id) {
            // Compte rattaché : la seule école acceptable est la sienne.
            if ((int) $user->ecole_id !== (int) $request->ecole_id) {
                return response()->json(['message' => 'Accès refusé à cet établissement'], 403);
            }
        } elseif ($user->role !== 'super-admin') {
            // Compte sans école et non plateforme : rien à choisir.
            return response()->json(['message' => 'Aucun établissement associé à ce compte'], 403);
        }

        // Mettre à jour l'école en session
        session(['ecole_id' => (int) $request->ecole_id]);

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
