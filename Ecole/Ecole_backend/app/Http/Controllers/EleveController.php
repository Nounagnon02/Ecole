<?php

namespace App\Http\Controllers;

use App\Models\{EmploiDuTemps, Eleve, User, Classes};
use App\Services\BulletinService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
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
        $this->authorize('viewAny', Eleve::class);

        // Paginé : la liste complète des élèves d'un établissement peut peser
        // plusieurs milliers de lignes avec leurs relations (cf. audit P3).
        $eleves = Eleve::with('user:id,name,prenom,email', 'classe:id,nom_classe', 'serie:id,nom')
            ->orderBy('id')
            ->paginate((int) request()->input('per_page', 50));

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
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $this->messageErreur($e)], 500);
        }
    }

    public function show($id)
    {
        $eleve = Eleve::with('user', 'classe', 'serie')->find($id);
        if (!$eleve) {
            return response()->json(['message' => 'Élève non trouvé'], 404);
        }
        $this->authorize('view', $eleve);
        return response()->json($eleve);
    }

    public function update(Request $request, $id)
    {
        $eleve = Eleve::findOrFail($id);
        $this->authorize('update', $eleve);
        $user = $eleve->user;

        // `email` et `numero_matricule` étaient écrits sans figurer dans le
        // validate() : format libre et doublons possibles, alors que la
        // création impose `unique:` sur les deux (cf. audit F6).
        $validated = $request->validate([
            'name'             => 'sometimes|string|max:255',
            'prenom'           => 'sometimes|string|max:255',
            'email'            => 'sometimes|nullable|email|unique:users,email,' . $user->id,
            'class_id'         => 'sometimes|exists:classes,id',
            'serie_id'         => 'sometimes|nullable|exists:series,id',
            'numero_matricule' => 'sometimes|string|max:50|unique:eleves,numero_matricule,' . $eleve->id,
        ]);

        // On n'écrit que les champs effectivement validés et présents.
        $user->update(array_intersect_key($validated, array_flip(['name', 'prenom', 'email'])));
        $eleve->update(array_intersect_key($validated, array_flip(['class_id', 'serie_id', 'numero_matricule'])));

        return response()->json($eleve->load('user'));
    }

    public function destroy($id)
    {
        $eleve = Eleve::findOrFail($id);
        $this->authorize('delete', $eleve);
        $user = $eleve->user;

        $eleve->delete();
        $user->delete();

        return response()->json(['message' => 'Élève supprimé']);
    }

    // ... autres méthodes (getElevesByClasse, etc.) peuvent être adaptées similairement
}