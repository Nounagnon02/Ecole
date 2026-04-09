<?php

namespace App\Http\Controllers;

use App\Models\{Devoir, EmploiDuTemps, Eleve, User, Classes};
use App\Services\BulletinService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EleveController extends Controller
{
    protected $bulletinService;

    public function __construct(BulletinService $bulletinService)
    {
        $this->bulletinService = $bulletinService;
    }

    /**
     * Dashboard : Bulletin de l'élève connecté
     */
    public function bulletin($periode)
    {
        $user = Auth::user();
        if (!$user || !$user->eleve) {
            return response()->json(['message' => 'Profil élève non trouvé'], 404);
        }

        $eleveId = $user->eleve->id;
        
        if ($user->eleve->classe->categorie_classe === 'secondaire') {
            return $this->bulletinService->bulletinSecondaire($eleveId, $periode);
        } else {
            return $this->bulletinService->bulletinMaternellePrimaire($eleveId, $periode);
        }
    }

    /**
     * Liste des élèves (Admin)
     */
    public function index()
    {
        $eleves = Eleve::with('user', 'classe', 'serie')->get();
        return response()->json($eleves);
    }

    /**
     * Création d'un élève (Admin)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'prenom' => 'required|string',
            'identifiant' => 'required|string|unique:users,identifiant',
            'password' => 'required|string|min:6',
            'ecole_id' => 'required|exists:ecoles,id',
            'numero_matricule' => 'required|string|unique:eleves,numero_matricule',
            'class_id' => 'required|exists:classes,id',
            'serie_id' => 'nullable|exists:series,id',
            'email' => 'nullable|email|unique:users,email',
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                $user = User::create([
                    'name' => $validated['name'],
                    'prenom' => $validated['prenom'],
                    'identifiant' => $validated['identifiant'],
                    'password' => Hash::make($validated['password']),
                    'role' => 'eleve',
                    'ecole_id' => $validated['ecole_id'],
                    'email' => $validated['email'],
                ]);

                $eleve = Eleve::create([
                    'user_id' => $user->id,
                    'numero_matricule' => $validated['numero_matricule'],
                    'class_id' => $validated['class_id'],
                    'serie_id' => $validated['serie_id'],
                ]);

                return response()->json($eleve->load('user'), 201);
            });
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $eleve = Eleve::with('user', 'classe', 'serie')->find($id);
        if (!$eleve) {
            return response()->json(['message' => 'Élève non trouvé'], 404);
        }
        return response()->json($eleve);
    }

    public function update(Request $request, $id)
    {
        $eleve = Eleve::findOrFail($id);
        $user = $eleve->user;

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'prenom' => 'sometimes|string',
            'class_id' => 'sometimes|exists:classes,id',
            'serie_id' => 'sometimes|nullable|exists:series,id',
        ]);

        $user->update($request->only(['name', 'prenom', 'email']));
        $eleve->update($request->only(['class_id', 'serie_id', 'numero_matricule']));

        return response()->json($eleve->load('user'));
    }

    public function destroy($id)
    {
        $eleve = Eleve::findOrFail($id);
        $user = $eleve->user;
        
        $eleve->delete();
        $user->delete();

        return response()->json(['message' => 'Élève supprimé']);
    }

    // ... autres méthodes (getElevesByClasse, etc.) peuvent être adaptées similairement
}