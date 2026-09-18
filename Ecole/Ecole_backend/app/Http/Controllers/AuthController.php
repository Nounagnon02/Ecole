<?php

namespace App\Http\Controllers;

use App\Http\Middleware\AccountLockout;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\User;
use App\Models\UserParent;
use App\Services\ProfileService;
use App\Support\Roles;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function __construct(private ProfileService $profiles)
    {
    }

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
    public function connexion(LoginRequest $request)
    {
        $login = $request->login();

        // Parenthèses explicites : sans le groupement, un `orWhere` se
        // combinerait mal avec toute condition ajoutée par la suite.
        $user = User::where(function ($q) use ($login) {
            $q->where('email', $login)->orWhere('identifiant', $login);
        })->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Identifiants incorrects'], 401);
        }

        // Connexion réussie : réinitialiser le compteur de tentatives (AUTH-9).
        AccountLockout::clearForLogin($login);

        if (!$user->is_active) {
            return response()->json(['message' => 'Votre compte est désactivé'], 403);
        }

        // Un établissement désactivé doit bloquer ses utilisateurs. Sans ce
        // contrôle, `ecoles.status` n'était lu nulle part à la connexion : la
        // désactivation était purement décorative et tout le monde continuait
        // à travailler normalement.
        if ($message = $this->schoolAccessDenied($user)) {
            return response()->json(['message' => $message], 403);
        }

        // 2FA : si activée, on émet un token temporaire AVANT vérification du
        // code TOTP. Il doit être restreint par une ability dédiée : créé sans
        // abilities explicites, un token Sanctum porte « * » et donnerait un
        // accès complet à quiconque ne détient que le mot de passe. Ce token
        // n'est bon que pour appeler l'endpoint d'échange (VerifyTwoFactor).
        if ($user->two_factor_enabled) {
            $tempToken = $user->createToken('2fa-pending', ['2fa:pending'])->plainTextToken;

            return response()->json([
                'requires_2fa' => true,
                'token' => $tempToken,
                'token_type' => 'Bearer',
                'message' => 'Vérification 2FA requise',
            ]);
        }

        $payload = [
            'user'        => $user,
            'role'        => $user->role,
            'ecole_id'    => $user->ecole_id,
            'redirect_to' => $this->getRedirectRouteBasedOnRole($user->role),
        ];

        // Client stateful (SPA sur domaine déclaré dans sanctum.stateful) :
        // session sur cookie httpOnly, aucun token exposé au JavaScript.
        if ($this->isStatefulClient($request)) {
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
     * Reason to refuse sign-in because of the user's school, or null.
     *
     * A platform super-admin has no school of their own and is never blocked
     * here — otherwise a suspended establishment would lock out the very
     * account needed to reactivate it.
     */
    private function schoolAccessDenied(User $user): ?string
    {
        if ($user->role === 'super-admin' || !$user->ecole_id) {
            return null;
        }

        // withTrashed: a soft-deleted school must not silently behave like an
        // active one just because the row is hidden from ordinary queries.
        $school = \App\Models\Ecole::withTrashed()->find($user->ecole_id);

        if (!$school || $school->trashed()) {
            return "Cet établissement n'est plus accessible. Contactez l'administrateur.";
        }

        if ($school->status !== 'active') {
            return 'Cet établissement est désactivé. Contactez l\'administrateur.';
        }

        return null;
    }

    /**
     * La requête vient-elle d'un front first-party gérant les cookies ?
     * Sanctum considère « stateful » les origines listées dans sanctum.stateful.
     */
    private function isStatefulClient(Request $request): bool
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
            'user' => $this->profiles->payload($user),
        ]);
    }

    /**
     * Mettre à jour le profil de l'utilisateur connecté.
     * PUT /api/auth/profile
     *
     * Champs communs : name, prenom, email, telephone, avatar.
     * Champs enseignant (quand le rôle l'est) : specialite, grade,
     * experiences (liste), matieres_maitrisees (ids).
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'prenom' => 'sometimes|string|max:255',
            'email' => 'sometimes|nullable|email|unique:users,email,' . $user->id,
            'telephone' => 'nullable|string|max:20',
            'avatar' => 'sometimes|nullable|string|max:3000000',
            'specialite' => 'sometimes|nullable|string|max:255',
            'grade' => 'sometimes|nullable|string|max:255',
            'experiences' => 'sometimes|array|max:25',
            'experiences.*.id' => 'nullable|integer',
            'experiences.*.poste' => 'required|string|max:255',
            'experiences.*.etablissement' => 'nullable|string|max:255',
            'experiences.*.date_debut' => 'required|date',
            'experiences.*.date_fin' => 'nullable|date|after_or_equal:experiences.*.date_debut',
            'experiences.*.description' => 'nullable|string|max:1000',
            'matieres_maitrisees' => 'sometimes|array|max:50',
            'matieres_maitrisees.*' => 'integer|exists:matieres,id',
        ]);

        $this->profiles->update($user, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour',
            'user' => $this->profiles->payload($user),
        ]);
    }

    /**
     * Inscription
 (Généralement gérée par un administrateur).
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
            'password' => ['required', 'string', Password::defaults()],
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
                    'classe_id' => 'required|school_exists:classes,id',
                    'serie_id' => 'nullable|school_exists:series,id',
                ]);
                Eleve::create([
                    'user_id' => $user->id,
                    'numero_matricule' => $profileData['numero_matricule'],
                    'classe_id' => $profileData['classe_id'],
                    'serie_id' => $profileData['serie_id'],
                ]);
            } elseif ($user->role === 'parent') {
                UserParent::create(['user_id' => $user->id]);
            } elseif (str_contains($user->role, 'enseignant')) {
                Enseignant::create(['user_id' => $user->id]);
            }

            \DB::commit();

            // Traçabilité : qui a créé cet utilisateur (audit S28).
            Log::info('Utilisateur créé', [
                'created_by' => $request->user()->id,
                'user_id'    => $user->id,
                'role'       => $user->role,
                'ecole_id'   => $user->ecole_id,
            ]);

            return response()->json(['message' => 'Utilisateur créé avec succès', 'user' => $user], 201);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            \DB::rollBack();
            return response()->json(['message' => 'Erreur lors de l\'inscription', 'error' => $this->clientErrorMessage($e)], 500);
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
     * Envoyer un email de vérification (opt-in).
     */
    public function sendVerificationEmail(Request $request)
    {
        $user = $request->user();

        if (!$user->email) {
            return response()->json(['message' => 'Aucune adresse email configurée'], 422);
        }

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email déjà vérifié']);
        }

        $token = Str::random(64);
        DB::table('email_verification_tokens')->insert([
            'email' => $user->email,
            'token' => sha1($token),
            'created_at' => now(),
        ]);

        Mail::raw("Vérifiez votre adresse email en visitant : " . url("/api/v1/auth/verify-email/{$token}"), function ($message) use ($user) {
            $message->to($user->email)
                ->subject('Vérification de votre adresse email - ' . config('app.name'));
        });

        return response()->json(['message' => 'Email de vérification envoyé']);
    }

    /**
     * Vérifier l'email via le token.
     */
    public function verifyEmail($token)
    {
        $record = DB::table('email_verification_tokens')
            ->where('token', sha1($token))
            ->first();

        if (!$record || now()->diffInMinutes($record->created_at) > 60) {
            return response()->json(['message' => 'Token invalide ou expiré'], 422);
        }

        User::where('email', $record->email)
            ->update(['email_verified_at' => now()]);

        DB::table('email_verification_tokens')
            ->where('email', $record->email)
            ->delete();

        return response()->json(['message' => 'Email vérifié avec succès']);
    }
}
