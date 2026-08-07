<?php

namespace App\Http\Controllers;

use App\Models\Enseignant;
use App\Models\User;
use App\Models\Classes;
use App\Models\EmploiDuTemps;
use App\Models\Notes;
use App\Support\Roles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EnseignantController extends Controller
{
    /**
     * Liste des enseignants (Admin)
     */
    public function index()
    {
        return response()->json(Enseignant::with('user')->get());
    }

    /**
     * Création d'un enseignant (Admin)
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
            'role' => 'required|in:' . implode(',', Roles::teachers()),
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                $user = User::create([
                    'name' => $validated['name'],
                    'prenom' => $validated['prenom'],
                    'email' => $validated['email'],
                    'identifiant' => $validated['identifiant'],
                    'password' => Hash::make($validated['password']),
                    'role' => $validated['role'],
                    'ecole_id' => $validated['ecole_id'],
                ]);

                $enseignant = Enseignant::create([
                    'user_id' => $user->id,
                ]);

                return response()->json($enseignant->load('user'), 201);
            });
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $this->clientErrorMessage($e)], 500);
        }
    }

    public function show($id)
    {
        $enseignant = Enseignant::with('user', 'matieres', 'classes')->find($id);
        if (!$enseignant) {
            return response()->json(['message' => 'Enseignant non trouvé'], 404);
        }
        return response()->json($enseignant);
    }

    /**
     * Espace Enseignant : Récupérer ses classes
     */
    public function classes()
    {
        $user = Auth::user();
        if (!$user->enseignant) {
            return response()->json(['message' => 'Profil enseignant non trouvé'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user->enseignant->classes()->with('eleve.user')->get()
        ]);
    }

    /**
     * Espace Enseignant : Récupérer son emploi du temps
     */
    public function getEmploiTemps()
    {
        $user = Auth::user();
        if (!$user->enseignant) {
            return response()->json(['message' => 'Profil enseignant non trouvé'], 404);
        }

        $emploi = EmploiDuTemps::where('enseignant_id', $user->enseignant->id)
            ->with(['classe', 'matiere'])
            ->orderBy('jour')
            ->get();

        return response()->json(['success' => true, 'data' => $emploi]);
    }

    /**
     * Espace Enseignant : Récupérer les notes saisies (via ses classes/matières)
     * GET /enseignant/notes
     */
    public function notes()
    {
        $user = Auth::user();
        if (!$user->enseignant) {
            return response()->json(['message' => 'Profil enseignant non trouvé'], 404);
        }

        $enseignant = $user->enseignant;
        $classeIds = $enseignant->classes()->pluck('classes.id');
        $matiereIds = $enseignant->matieres()->pluck('matieres.id');

        $notes = Notes::with(['eleve.user', 'matiere', 'classe'])
            ->whereIn('classe_id', $classeIds)
            ->whereIn('matiere_id', $matiereIds)
            ->latest()
            ->take(50)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $notes,
        ]);
    }

    /**
     * Mettre à jour un enseignant (Admin / Directeur)
     * PUT /enseignants/update/{id}
     */
    public function update(Request $request, $id)
    {
        $enseignant = Enseignant::with('user')->findOrFail($id);
        $user = $enseignant->user;

        $validated = $request->validate([
            'name'    => 'sometimes|string|max:255',
            'prenom'  => 'sometimes|string|max:255',
            'email'   => 'sometimes|nullable|email|unique:users,email,' . $user->id,
            'role'    => 'sometimes|in:' . implode(',', Roles::teachers()),
        ]);

        $user->update(array_intersect_key($validated, array_flip(['name', 'prenom', 'email', 'role'])));

        return response()->json($enseignant->fresh()->load('user'));
    }

    /**
     * Supprimer un enseignant (Admin / Directeur)
     * DELETE /enseignants/delete/{id}
     */
    public function destroy($id)
    {
        $enseignant = Enseignant::with('user')->findOrFail($id);
        $user = $enseignant->user;

        $enseignant->delete();
        if ($user) {
            $user->delete();
        }

        return response()->json(['message' => 'Enseignant supprimé'], 200);
    }
}
