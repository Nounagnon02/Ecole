<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Ecole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * AdminController — Gestion administrateur centralisée
 *
 * Permet au Super Admin de gérer l'ensemble des utilisateurs,
 * écoles, et configurations de la plateforme multi-tenant.
 */
class AdminController extends Controller
{
    /**
     * Liste paginée de tous les utilisateurs (tous rôles, toutes écoles).
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
        $actif = $request->input('actif');

        $query = User::with('ecole:id,nom')
            ->orderBy('created_at', 'desc');

        // Filtre par rôle
        if ($role) {
            $query->where('role', $role);
        }

        // Filtre par école
        if ($ecoleId) {
            $query->where('ecole_id', $ecoleId);
        }

        // Filtre par statut
        if ($actif !== null) {
            $query->where('is_active', filter_var($actif, FILTER_VALIDATE_BOOLEAN));
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

        // Transformer pour le mobile (nom → nom, is_active → actif)
        $transformed = collect($users->items())->map(function ($user) {
            return [
                'id'        => $user->id,
                'nom'       => $user->name,
                'prenom'    => $user->prenom,
                'email'     => $user->email,
                'telephone' => $user->telephone,
                'role'      => $user->role,
                'actif'     => $user->is_active,
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
        $user = User::with('ecole:id,nom')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => [
                'id'        => $user->id,
                'nom'       => $user->name,
                'prenom'    => $user->prenom,
                'email'     => $user->email,
                'telephone' => $user->telephone,
                'role'      => $user->role,
                'actif'     => $user->is_active,
                'ecole'     => $user->ecole ? ['id' => $user->ecole->id, 'nom' => $user->ecole->nom] : null,
                'created_at' => $user->created_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Activer/Désactiver un utilisateur.
     */
    public function toggleStatus($id)
    {
        $user = User::findOrFail($id);
        $user->is_active = !$user->is_active;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => $user->is_active ? 'Utilisateur activé' : 'Utilisateur désactivé',
            'data'    => ['actif' => $user->is_active],
        ]);
    }

    /**
     * Supprimer un utilisateur.
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur supprimé avec succès',
        ]);
    }
}
