<?php

namespace App\Http\Controllers;

use App\Models\UserParent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ParentsController extends Controller
{
    /**
     * Liste des parents (Admin)
     */
    public function index()
    {
        return response()->json(UserParent::with('user', 'eleves.user')->get());
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
            'eleve_ids.*' => 'exists:eleves,id',
        ]);

        try {
            return DB::transaction(function () use ($validated) {
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

                if (!empty($validated['eleve_ids'])) {
                    $parent->eleves()->sync($validated['eleve_ids']);
                }

                return response()->json($parent->load('user', 'eleves.user'), 201);
            });
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $parent = UserParent::with('user', 'eleves.user', 'eleves.classe')->find($id);
        if (!$parent) {
            return response()->json(['message' => 'Parent non trouvé'], 404);
        }
        return response()->json($parent);
    }

    public function update(Request $request, $id)
    {
        $parent = UserParent::findOrFail($id);
        $user = $parent->user;

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'prenom' => 'sometimes|string',
            'telephone' => 'sometimes|string',
            'eleve_ids' => 'sometimes|array',
        ]);

        $user->update($request->only(['name', 'prenom', 'email', 'telephone']));
        
        if ($request->has('eleve_ids')) {
            $parent->eleves()->sync($request->eleve_ids);
        }

        return response()->json($parent->load('user', 'eleves.user'));
    }

    /**
     * Lier des élèves à un parent
     */
    public function updateEleves(Request $request, $id)
    {
        $parent = UserParent::findOrFail($id);
        $request->validate(['eleve_ids' => 'required|array', 'eleve_ids.*' => 'exists:eleves,id']);
        
        $parent->eleves()->sync($request->eleve_ids);
        
        return response()->json(['message' => 'Enfants mis à jour avec succès']);
    }

    public function destroy($id)
    {
        $parent = UserParent::findOrFail($id);
        $user = $parent->user;
        
        $parent->delete();
        $user->delete();

        return response()->json(['message' => 'Parent supprimé']);
    }
}