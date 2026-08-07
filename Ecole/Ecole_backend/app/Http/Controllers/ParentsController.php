<?php

namespace App\Http\Controllers;

use App\Models\UserParent;
use App\Models\User;
use App\Models\ParentEleve;
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
            // Comme dans store() et updateEleves() : sans cette règle, un admin
            // liait n'importe quel élève (d'une autre école) à ce parent — le
            // lien de filiation traverse les établissements.
            'eleve_ids.*' => 'school_exists:eleves,id',
        ]);

        $user->update($request->only(['name', 'prenom', 'email', 'telephone']));
        
        if ($request->has('liens')) {
            $parent->setEleves($request->input('liens'));
        } elseif ($request->has('eleve_ids')) {
            $parent->setEleves($request->input('eleve_ids'));
        }

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
        $parent = UserParent::findOrFail($id);
        $user = $parent->user;
        
        $parent->delete();
        $user->delete();

        return response()->json(['message' => 'Parent supprimé']);
    }
}