<?php

namespace App\Http\Controllers;

use App\Models\Enseignant;
use App\Models\EnseignantMatiere;
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
     * Espace Enseignant : Récupérer les notes saisies (via ses affectations)
     * GET /enseignant/notes
     *
     * Les notes sont filtrées sur les paires exactes (classe, matière) issues
     * du pivot `enseignant_matiere`. L'ancien croisement de `classes` et
     * `matieres` était un produit cartésien : un enseignant affecté à deux
     * matières dans la même classe voyait les notes des deux matières pour
     * chaque cours — et les notes de collègues partageant une classe.
     */
    public function notes()
    {
        $user = Auth::user();
        if (!$user->enseignant) {
            return response()->json(['message' => 'Profil enseignant non trouvé'], 404);
        }

        $enseignant = $user->enseignant;

        // Paires exactes (classe_id, matiere_id) — source unique de vérité.
        // `withoutGlobalScope('ecole')` : les anciennes lignes du pivot ont un
        // ecole_id null (avant l'ajout de la colonne) et l'enseignant parent
        // est déjà cloisonné par établissement.
        $pairs = EnseignantMatiere::withoutGlobalScope('ecole')
            ->where('enseignant_id', $enseignant->id)
            ->select('classe_id', 'matiere_id')
            ->distinct()
            ->get();

        $notes = Notes::with(['eleve.user', 'matiere', 'classe'])
            ->when($pairs->isNotEmpty(), function ($query) use ($pairs) {
                $query->where(function ($sub) use ($pairs) {
                    foreach ($pairs as $pair) {
                        $sub->orWhere(function ($w) use ($pair) {
                            $w->where('classe_id', $pair->classe_id)
                              ->where('matiere_id', $pair->matiere_id);
                        });
                    }
                });
            }, function ($query) {
                $query->whereRaw('1 = 0');
            })
            ->latest()
            ->take(50)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $notes,
        ]);
    }

    /**
     * Affectations d'un enseignant (classe × série × matière)
     * GET /enseignants/{id}/affectations
     */
    public function affectations($id)
    {
        $enseignant = Enseignant::find($id);
        if (!$enseignant) {
            return response()->json(['message' => 'Enseignant non trouvé'], 404);
        }

        $affectations = $this->affectationsQuery($id);

        return response()->json([
            'success' => true,
            'data' => $affectations,
        ]);
    }

    /**
     * Enregistrer les affectations d'un enseignant
     * POST /enseignants/{id}/affectations — body { affectations: [{classe_id, serie_id, matiere_id}] }
     */
    public function storeAffectations(Request $request, $id)
    {
        $enseignant = Enseignant::find($id);
        if (!$enseignant) {
            return response()->json(['message' => 'Enseignant non trouvé'], 404);
        }

        $validated = $request->validate([
            'affectations' => 'required|array|min:1',
            'affectations.*.classe_id' => 'required|school_exists:classes,id',
            'affectations.*.serie_id' => 'required|school_exists:series,id',
            'affectations.*.matiere_id' => 'required|school_exists:matieres,id',
        ]);

        $ecoleId = $enseignant->ecole_id ?: auth()->user()?->ecole_id;
        if (!$ecoleId) {
            return response()->json(['message' => 'Aucun établissement associé'], 422);
        }

        foreach ($validated['affectations'] as $item) {
            // Règle de cohérence : la matière doit être rattachée à la série
            // de cette classe (pivot serie_matieres).
            $serieAttachee = DB::table('serie_matieres')
                ->where('classe_id', $item['classe_id'])
                ->where('serie_id', $item['serie_id'])
                ->where('matiere_id', $item['matiere_id'])
                ->exists();

            if (!$serieAttachee) {
                return response()->json([
                    'success' => false,
                    'message' => "La matière sélectionnée n'est pas rattachée à la série de cette classe.",
                    'classe_id' => $item['classe_id'],
                    'serie_id' => $item['serie_id'],
                    'matiere_id' => $item['matiere_id'],
                ], 422);
            }

            // `withoutGlobalScope` : sans lui, la requête de correspondance
            // filtrerait sur ecole_id et recréerait les lignes historiques
            // (ecole_id null) au lieu de les réutiliser.
            EnseignantMatiere::withoutGlobalScope('ecole')->updateOrCreate(
                [
                    'enseignant_id' => $id,
                    'classe_id' => $item['classe_id'],
                    'serie_id' => $item['serie_id'],
                    'matiere_id' => $item['matiere_id'],
                ],
                ['ecole_id' => $ecoleId]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Affectations enregistrées',
            'data' => $this->affectationsQuery($id),
        ], 201);
    }

    /**
     * Retirer une affectation d'un enseignant
     * DELETE /enseignants/{id}/affectations/{affectationId}
     */
    public function destroyAffectation($id, $affectationId)
    {
        $enseignant = Enseignant::find($id);
        if (!$enseignant) {
            return response()->json(['message' => 'Enseignant non trouvé'], 404);
        }

        $ligne = EnseignantMatiere::withoutGlobalScope('ecole')
            ->where('enseignant_id', $id)
            ->find($affectationId);

        if (!$ligne) {
            return response()->json(['message' => 'Affectation non trouvée'], 404);
        }

        $ligne->delete();

        return response()->json([
            'success' => true,
            'message' => 'Affectation retirée',
            'data' => $this->affectationsQuery($id),
        ]);
    }

    /**
     * Liste des affectations avec libellés, tous cycles confondus.
     */
    private function affectationsQuery($id)
    {
        return EnseignantMatiere::withoutGlobalScope('ecole')
            ->where('enseignant_id', $id)
            ->with(['classe:id,nom_classe', 'matiere:id,nom', 'serie:id,nom'])
            ->orderBy('classe_id')
            ->get();
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
