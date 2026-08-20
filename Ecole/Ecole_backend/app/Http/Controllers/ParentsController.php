<?php

namespace App\Http\Controllers;

use App\Models\UserParent;
use App\Models\User;
use App\Models\ParentEleve;
use App\Models\ParentInvitation;
use App\Models\Eleve;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ParentsController extends Controller
{
    /**
     * Liste des parents (Admin)
     *
     * `whereHas('user')` : les profils dont le compte a été supprimé (soft
     * delete) renvoient `user` nul et sortent des listes de personnel actif.
     */
    public function index()
    {
        $this->authorize('viewAny', UserParent::class);
        return response()->json(UserParent::with('user', 'eleves.user')->whereHas('user')->paginate(50));
    }

    /**
     * Création d'un parent (Admin)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'prenom' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'identifiant' => 'required|string|unique:users,identifiant',
            'password' => 'required|string|min:6',
            'ecole_id' => 'required|exists:ecoles,id',
            'telephone' => 'nullable|string',
            'eleve_ids' => 'sometimes|array',
            'eleve_ids.*' => 'school_exists:eleves,id',
            'liens' => 'sometimes|array',
            'liens.*.eleve_id' => 'required|school_exists:eleves,id',
            'liens.*.role' => 'sometimes|nullable|in:' . implode(',', ParentEleve::ROLES),
            'liens.*.is_primary' => 'sometimes|boolean',
            'liens.*.is_guardian' => 'sometimes|boolean',
        ]);

        try {
            return DB::transaction(function () use ($validated, $request) {
                $user = User::create([
                    'name' => $validated['name'],
                    'prenom' => $validated['prenom'],
                    'email' => $validated['email'],
                    'identifiant' => $validated['identifiant'],
                    'password' => Hash::make($validated['password']),
                    'role' => 'parent',
                    'ecole_id' => $validated['ecole_id'],
                    'telephone' => $validated['telephone'],
                ]);

                $parent = UserParent::create([
                    'user_id' => $user->id,
                ]);

                if ($request->has('liens')) {
                    $parent->setEleves($request->input('liens'));
                } elseif (!empty($validated['eleve_ids'])) {
                    $parent->setEleves($validated['eleve_ids']);
                }

                \Cache::forget('dashboard_directeur_' . (auth()->user()->ecole_id ?? 'global'));

                return response()->json($parent->load('user', 'eleves.user'), 201);
            });
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $this->clientErrorMessage($e)], 500);
        }
    }

    public function show($id)
    {
        $parent = UserParent::with('user', 'eleves.user', 'eleves.classe')->find($id);
        if (!$parent) {
            return response()->json(['message' => 'Parent non trouvé'], 404);
        }
        $this->authorize('view', $parent);
        return response()->json($parent);
    }

    public function update(Request $request, $id)
    {
        $parent = UserParent::findOrFail($id);
        $this->authorize('update', $parent);

        $user = $parent->user;

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'prenom' => 'sometimes|string',
            'email' => 'sometimes|nullable|email|unique:users,email,' . $user->id,
            'telephone' => 'sometimes|string',
            'eleve_ids' => 'sometimes|array',
            'eleve_ids.*' => 'school_exists:eleves,id',
        ]);

        $user->update(array_intersect_key($validated, array_flip(['name', 'prenom', 'email', 'telephone'])));
        
        if ($request->has('liens')) {
            $parent->setEleves($request->input('liens'));
        } elseif ($request->has('eleve_ids')) {
            $parent->setEleves($request->input('eleve_ids'));
        }

        \Cache::forget('dashboard_directeur_' . (auth()->user()->ecole_id ?? 'global'));

        return response()->json($parent->load('user', 'eleves.user'));
    }

    /**
     * Lier des élèves à un parent
     */
    public function updateEleves(Request $request, $id)
    {
        $parent = UserParent::findOrFail($id);
        $request->validate([
            'eleve_ids' => 'sometimes|array',
            'eleve_ids.*' => 'school_exists:eleves,id',
            'liens' => 'sometimes|array',
            'liens.*.eleve_id' => 'required|school_exists:eleves,id',
            'liens.*.role' => 'sometimes|nullable|in:' . implode(',', ParentEleve::ROLES),
            'liens.*.is_primary' => 'sometimes|boolean',
            'liens.*.is_guardian' => 'sometimes|boolean',
        ]);

        if ($request->has('liens')) {
            $parent->setEleves($request->input('liens'));
        } elseif ($request->has('eleve_ids')) {
            $parent->setEleves($request->input('eleve_ids'));
        }

        return response()->json(['message' => 'Enfants mis à jour avec succès']);
    }

    /**
     * Liste des élèves d'un parent.
     * GET /parents/{id}/eleves
     */
    public function getElevesByParent($id)
    {
        $parent = UserParent::with('eleves.classe', 'eleves.user')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $parent->eleves,
        ]);
    }

    public function destroy($id)
    {
        $parent = UserParent::with('user')->findOrFail($id);
        $this->authorize('delete', $parent);

        $user = $parent->user;

        if ($user) {
            UserService::softDeleteUser($user);
        }

        \Cache::forget('dashboard_directeur_' . (auth()->user()->ecole_id ?? 'global'));

        return response()->json(['message' => 'Parent supprimé']);
    }

    /**
     * Invitation parent par l'école (Admin/Comptable/Secrétaire)
     * POST /api/parents/invite
     */
    public function invite(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'eleve_id' => 'required|school_exists:eleves,id',
            'role' => 'nullable|in:' . implode(',', ParentEleve::ROLES),
            'is_primary' => 'boolean',
            'is_guardian' => 'boolean',
            'expires_in_days' => 'nullable|integer|min:1|max:30',
        ]);

        $eleve = Eleve::findOrFail($validated['eleve_id']);
        $this->authorize('update', $eleve); // Vérifie que l'user peut gérer cet élève

        $expiresInDays = $validated['expires_in_days'] ?? 7;

        // Vérifier si une invitation valide existe déjà
        $existing = ParentInvitation::where('eleve_id', $validated['eleve_id'])
            ->where('email', $validated['email'])
            ->valid()
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Une invitation valide existe déjà pour cet email et cet élève',
                'data' => ['expires_at' => $existing->expires_at],
            ], 422);
        }

        $invitation = ParentInvitation::create([
            'ecole_id' => auth()->user()->ecole_id,
            'eleve_id' => $validated['eleve_id'],
            'created_by' => auth()->id(),
            'email' => $validated['email'],
            'token' => ParentInvitation::generateToken(),
            'role' => $validated['role'] ?? null,
            'is_primary' => $validated['is_primary'] ?? false,
            'is_guardian' => $validated['is_guardian'] ?? false,
            'expires_at' => now()->addDays($validated['expires_in_days'] ?? 7),
        ]);

        // Envoyer email avec lien d'acceptation
        $acceptUrl = config('app.frontend_url', 'http://localhost:5173') . "/parent/accept-invitation/{$invitation->token}";
        \Mail::to($validated['email'])->queue(new \App\Mail\ParentInvitationMail($invitation, $acceptUrl));

        \Cache::forget('dashboard_directeur_' . (auth()->user()->ecole_id ?? 'global'));

        return response()->json([
            'success' => true,
            'message' => 'Invitation envoyée',
            'data' => $invitation->load('eleve.user'),
        ], 201);
    }

    /**
     * Vérifier la validité d'un token d'invitation (public)
     * GET /api/public/parent/invitation/{token}/verify
     */
    public function verifyInvitation($token)
    {
        $invitation = ParentInvitation::where('token', $token)->first();

        if (!$invitation) {
            return response()->json([
                'success' => false,
                'message' => 'Invitation introuvable',
            ], 404);
        }

        if (!$invitation->isValid()) {
            return response()->json([
                'success' => false,
                'message' => $invitation->is_accepted
                    ? 'Cette invitation a déjà été acceptée'
                    : 'Cette invitation a expiré',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'email' => $invitation->email,
                'eleve' => $invitation->eleve->load('user', 'classe'),
                'role' => $invitation->role,
                'is_primary' => $invitation->is_primary,
                'is_guardian' => $invitation->is_guardian,
                'expires_at' => $invitation->expires_at,
            ],
        ]);
    }

    /**
     * Inscription parent via invitation (public)
     * POST /api/public/parent/accept-invitation
     */
    public function acceptInvitation(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
            'name' => 'required|string',
            'prenom' => 'required|string',
            'telephone' => 'nullable|string',
        ]);

        $invitation = ParentInvitation::where('token', $request->token)->first();

        if (!$invitation || !$invitation->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'Invitation invalide ou expirée',
            ], 422);
        }

        // Vérifier si l'email est déjà utilisé
        if (User::where('email', $invitation->email)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Un compte avec cet email existe déjà',
            ], 422);
        }

        try {
            return DB::transaction(function () use ($validated, $invitation) {
                // Créer l'utilisateur
                $user = User::create([
                    'name' => $validated['name'],
                    'prenom' => $validated['prenom'],
                    'email' => $invitation->email,
                    'identifiant' => Str::slug($validated['name'] . '-' . $validated['prenom']) . '-' . Str::random(6),
                    'password' => Hash::make($validated['password']),
                    'role' => 'parent',
                    'ecole_id' => $invitation->ecole_id,
                    'telephone' => $validated['telephone'],
                ]);

                // Créer le profil parent
                $parent = UserParent::create([
                    'user_id' => $user->id,
                ]);

                // Lier l'élève au parent via le pivot
                $parent->eleves()->attach($invitation->eleve_id, [
                    'role' => $invitation->role ?? ParentEleve::ROLE_TUTEUR,
                    'is_primary' => $invitation->is_primary,
                    'is_guardian' => $invitation->is_guardian,
                    'ecole_id' => $invitation->ecole_id,
                ]);

                // Si is_primary, définir comme contact principal
                if ($invitation->is_primary) {
                    ParentEleve::setPrimary($invitation->eleve_id, $parent->id);
                }

                // Marquer l'invitation comme acceptée
                $invitation->update([
                    'is_accepted' => true,
                    'accepted_at' => now(),
                ]);

                \Cache::forget('dashboard_directeur_' . (auth()->user()->ecole_id ?? 'global'));

                return response()->json([
                    'success' => true,
                    'message' => 'Compte créé avec succès',
                    'data' => [
                        'user' => $user->load('parent.eleves.user'),
                    ],
                ], 201);
            });
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du compte',
                'error' => $this->clientErrorMessage($e),
            ], 500);
        }
    }

    /**
     * Inscription parent sans invitation (auto-inscription)
     * POST /api/public/parent/register
     * Le parent saisit matricule élève + code secret (envoyé par l'école)
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'name' => 'required|string',
            'prenom' => 'required|string',
            'telephone' => 'nullable|string',
            'eleve_matricule' => 'required|string',
            'eleve_code' => 'required|string', // Code secret fourni par l'école
        ]);

        // Vérifier le code secret de l'élève
        $eleve = Eleve::where('numero_matricule', $request->eleve_matricule)->first();
        if (!$eleve) {
            return response()->json([
                'success' => false,
                'message' => 'Matricule élève introuvable',
            ], 404);
        }

        // Vérifier le code secret (stocké dans eleve.parent_code ou similar)
        // Pour l'instant, on accepte si le code correspond à un hash stocké
        // TODO: Implémenter un système de code secret par élève
        if (!Hash::check($request->eleve_code, $eleve->parent_code ?? '')) {
            return response()->json([
                'success' => false,
                'message' => 'Code secret invalide pour cet élève',
            ], 422);
        }

        // Vérifier qu'aucun parent n'est déjà lié comme primaire
        $existingPrimary = ParentEleve::where('eleve_id', $eleve->id)
            ->where('is_primary', true)
            ->exists();

        if ($existingPrimary) {
            return response()->json([
                'success' => false,
                'message' => 'Un parent principal est déjà enregistré pour cet élève',
            ], 422);
        }

        try {
            return DB::transaction(function () use ($validated, $eleve) {
                $user = User::create([
                    'name' => $validated['name'],
                    'prenom' => $validated['prenom'],
                    'email' => $validated['email'],
                    'identifiant' => Str::slug($validated['name'] . '-' . $validated['prenom']) . '-' . Str::random(6),
                    'password' => Hash::make($validated['password']),
                    'role' => 'parent',
                    'ecole_id' => $eleve->ecole_id,
                    'telephone' => $validated['telephone'],
                ]);

                $parent = UserParent::create([
                    'user_id' => $user->id,
                ]);

                $parent->eleves()->attach($eleve->id, [
                    'role' => ParentEleve::ROLE_TUTEUR,
                    'is_primary' => true, // Premier parent = principal
                    'is_guardian' => true,
                    'ecole_id' => $eleve->ecole_id,
                ]);

                ParentEleve::setPrimary($eleve->id, $parent->id);

                return response()->json([
                    'success' => true,
                    'message' => 'Compte parent créé avec succès',
                    'data' => [
                        'user' => $user->load('parent.eleves.user'),
                    ],
                ], 201);
            });
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du compte',
                'error' => $this->clientErrorMessage($e),
            ], 500);
        }
    }

    /**
     * Générer un code secret pour un élève (Admin/Comptable)
     * POST /api/parents/{eleveId}/generate-code
     */
    public function generateParentCode(Request $request, $eleveId)
    {
        $eleve = Eleve::findOrFail($eleveId);
        $this->authorize('update', $eleve);

        $code = Str::random(8);
        $eleve->update([
            'parent_code' => Hash::make($code),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Code secret généré',
            'data' => [
                'code' => $code, // À communiquer au parent par voie sécurisée
            ],
        ]);
    }
}