<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Ecole;
use App\Rules\BeninPhoneNumber;
use App\Services\Import\ComptesImport;
use App\Services\UserService;
use App\Support\Roles;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * AdminController — Gestion administrateur centralisée
 *
 * Permet au Super Admin de gérer l'ensemble des utilisateurs,
 * écoles, et configurations de la plateforme multi-tenant.
 */
class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (!auth()->user()?->isAdmin()) {
                return response()->json(['error' => 'Forbidden'], 403);
            }
            return $next($request);
        });
    }

    /**
     * Comptes que l'utilisateur connecté peut voir et gérer.
     *
     * `User` échappe au filtre par école (BelongsToEcole l'exclut) : sans
     * cette borne, un administrateur d'école listait, désactivait ou
     * supprimait les comptes de toutes les écoles, super-administrateur
     * compris (audit du 14/11, BUG-023). Le super-administrateur garde la
     * vue de toute la plateforme.
     */
    private function comptes(): Builder
    {
        $moi = auth()->user();

        if ($moi->role === Roles::SUPER_ADMIN) {
            return User::query();
        }

        return User::query()
            ->where('ecole_id', $moi->ecole_id ?? 0)
            ->where('role', '!=', Roles::SUPER_ADMIN);
    }

    /** Un compte géré, ou 404 s'il est hors de portée (comme s'il n'existait pas). */
    private function compte($id): User
    {
        return $this->comptes()->with('ecole:id,nom')->findOrFail($id);
    }

    /**
     * Liste paginée des utilisateurs : toute la plateforme pour le
     * super-administrateur, son école pour un administrateur d'école.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function utilisateurs(Request $request)
    {
        $perPage = $request->input('per_page', 20);
        $role = $request->input('role');
        $search = $request->input('search');
        $ecoleId = $request->input('ecole_id');
        $active = $request->input('active');

        $query = $this->comptes()->with('ecole:id,nom')
            ->orderBy('created_at', 'desc');

        // Filtre par rôle
        if ($role) {
            $query->where('role', $role);
        }

        // Filtre par école : utile au seul super-administrateur, les autres
        // sont déjà bornés à la leur.
        if ($ecoleId && auth()->user()->role === Roles::SUPER_ADMIN) {
            $query->where('ecole_id', $ecoleId);
        }

        // Filtre par statut
        if ($active !== null) {
            $query->where('is_active', filter_var($active, FILTER_VALIDATE_BOOLEAN));
        }

        // Recherche textuelle
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('telephone', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate($perPage);

        // Transformer pour le mobile (nom → nom, is_active → active)
        $transformed = collect($users->items())->map(function ($user) {
            return [
                'id'        => $user->id,
                'nom'       => $user->name,
                'prenom'    => $user->prenom,
                'email'     => $user->email,
                'telephone' => $user->telephone,
                'role'      => $user->role,
                'active'     => $user->is_active,
                'ecole'     => $user->ecole ? ['id' => $user->ecole->id, 'nom' => $user->ecole->nom] : null,
                'created_at' => $user->created_at?->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $transformed,
            'meta'    => [
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
                'per_page'     => $users->perPage(),
                'total'        => $users->total(),
            ],
        ]);
    }

    /**
     * Détails d'un utilisateur spécifique.
     */
    public function show($id)
    {
        $user = $this->compte($id);

        return response()->json([
            'success' => true,
            'data'    => [
                'id'        => $user->id,
                'nom'       => $user->name,
                'prenom'    => $user->prenom,
                'email'     => $user->email,
                'telephone' => $user->telephone,
                'role'      => $user->role,
                'active'     => $user->is_active,
                'ecole'     => $user->ecole ? ['id' => $user->ecole->id, 'nom' => $user->ecole->nom] : null,
                'created_at' => $user->created_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Créer un compte du personnel dans l'école de l'administrateur
     * (BUG-023). Même contrôle que la création par la direction : rôle
     * reconnu, numéro béninois, adresse unique ; ni administrateur, ni
     * super-administrateur, ni élève ou parent (ils passent par
     * l'inscription). Les accès sont rendus une seule fois, à transmettre.
     */
    public function store(Request $request, ComptesImport $import)
    {
        if (! auth()->user()->ecole_id) {
            return response()->json(['success' => false, 'message' => 'Un compte se crée dans une école : ouvrez celle-ci d’abord.'], 422);
        }

        $donnees = $request->validate([
            'role' => 'required|string|not_in:eleve,parent,admin,super-admin',
            'nom' => 'required|string|max:255',
            'prenom' => 'nullable|string|max:255',
            'telephone' => ['required', 'string', new BeninPhoneNumber],
            'email' => 'nullable|email',
        ]);

        $resultat = $import->creerCompte($donnees, $request->user());

        if ($resultat['erreur'] !== null) {
            return response()->json(['message' => $resultat['erreur'], 'errors' => ['compte' => [$resultat['erreur']]]], 422);
        }

        return response()->json(['success' => true, 'acces' => $resultat['acces']], 201);
    }

    /**
     * Activer/Désactiver un utilisateur.
     */
    public function toggleStatus($id)
    {
        $user = $this->compte($id);

        if ($user->is(auth()->user())) {
            return response()->json(['success' => false, 'message' => 'Vous ne pouvez pas désactiver votre propre compte.'], 422);
        }

        DB::transaction(function () use ($user) {
            $user->is_active = ! $user->is_active;
            $user->save();

            // Un compte désactivé restait connecté : ses jetons et ses
            // sessions en cours sont fermés.
            if (! $user->is_active) {
                $user->tokens()->delete();
                DB::table('sessions')->where('user_id', $user->id)->delete();
            }
        });

        return response()->json([
            'success' => true,
            'message' => $user->is_active ? 'Utilisateur activé' : 'Utilisateur désactivé',
            'data'    => ['active' => $user->is_active],
        ]);
    }

    /**
     * Supprimer un utilisateur.
     *
     * Suppression douce (`deleted_at`) : le compte est privé d'accès et
     * disparaît des listes, mais ses profils et son historique sont conservés
     * (les FK `users.*` étant en cascade, une suppression dure effaçait tout).
     */
    public function destroy($id)
    {
        $user = $this->compte($id);

        if ($user->is(auth()->user())) {
            return response()->json(['success' => false, 'message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 422);
        }

        UserService::softDeleteUser($user);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur supprimé avec succès',
        ]);
    }
}
