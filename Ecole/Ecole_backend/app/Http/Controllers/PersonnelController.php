<?php

namespace App\Http\Controllers;

use App\Models\Personnel;
use App\Models\User;
use App\Models\FichePaie;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class PersonnelController extends Controller
{
    /**
     * Liste du personnel de l'école
     */
    public function index()
    {
        return response()->json(Personnel::with('user')->get());
    }

    /**
     * Ajouter un membre du personnel
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'prenom' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'identifiant' => 'required|string|unique:users,identifiant',
            'password' => 'required|string|min:6',
            'poste' => 'required|string',
            'salaire_base' => 'required|numeric',
            'date_embauche' => 'required|date',
            'type_contrat' => 'required|in:CDI,CDD,Stage',
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                $user = User::create([
                    'name' => $validated['name'],
                    'prenom' => $validated['prenom'],
                    'email' => $validated['email'],
                    'identifiant' => $validated['identifiant'],
                    'password' => Hash::make($validated['password']),
                    'role' => 'personnel',
                    'ecole_id' => Auth::user()->ecole_id,
                ]);

                $personnel = Personnel::create([
                    'user_id' => $user->id,
                    'poste' => $validated['poste'],
                    'salaire_base' => $validated['salaire_base'],
                    'date_embauche' => $validated['date_embauche'],
                    'type_contrat' => $validated['type_contrat'],
                ]);

                return response()->json($personnel->load('user'), 201);
            });
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Générer une fiche de paie
     */
    public function genererFichePaie(Request $request, $id)
    {
        $personnel = Personnel::findOrFail($id);
        
        $validated = $request->validate([
            'periode' => 'required|string', // ex: 04-2026
            'primes' => 'nullable|numeric',
            'retenues' => 'nullable|numeric',
        ]);

        $primes = $validated['primes'] ?? 0;
        $retenues = $validated['retenues'] ?? 0;
        $salaireNet = $personnel->salaire_base + $primes - $retenues;

        $fiche = FichePaie::create([
            'user_id' => $personnel->user_id,
            'periode' => $validated['periode'],
            'salaire_brut' => $personnel->salaire_base,
            'primes' => $primes,
            'retenues' => $retenues,
            'salaire_net' => $salaireNet,
            'statut' => 'EN_ATTENTE',
        ]);

        return response()->json($fiche);
    }
}
