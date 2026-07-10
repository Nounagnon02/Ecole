<?php

namespace App\Http\Controllers;

use App\Models\Enseignant;
use App\Models\User;
use App\Models\Classes;
use App\Models\EmploiDuTemps;
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
            'role' => 'required|in:enseignant,enseignantM,enseignantP',
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
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $e->getMessage()], 500);
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
}
