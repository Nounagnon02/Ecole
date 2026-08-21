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
        $this->authorize('viewAny', Personnel::class);
        return response()->json(Personnel::with('user')->paginate(50));
    }

    /**
     * Détail d'un membre du personnel
     */
    public function show($id)
    {
        $personnel = Personnel::with('user')->findOrFail($id);
        $this->authorize('view', $personnel);
        return response()->json($personnel);
    }

    /**
     * Ajouter un membre du personnel
     */
    public function store(Request $request)
    {
        $this->authorize('create', Personnel::class);

        $validated = $request->validate([
            'name' => 'required|string',
            'prenom' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'identifiant' => 'required|string|unique:users,identifiant',
            'password' => 'required|string|min:8',
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

                \Cache::forget('dashboard_directeur_' . (auth()->user()->ecole_id ?? 'global'));

                return response()->json($personnel->load('user'), 201);
            });
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $this->clientErrorMessage($e)], 500);
        }
    }

    /**
     * Modifier un membre du personnel
     */
    public function update(Request $request, $id)
    {
        $personnel = Personnel::findOrFail($id);
        $this->authorize('update', $personnel);

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'prenom' => 'sometimes|string',
            'email' => 'sometimes|email|unique:users,email,' . $personnel->user_id,
            'poste' => 'sometimes|string',
            'salaire_base' => 'sometimes|numeric',
            'date_embauche' => 'sometimes|date',
            'type_contrat' => 'sometimes|in:CDI,CDD,Stage',
        ]);

        try {
            DB::transaction(function () use ($personnel, $validated) {
                $userFields = array_intersect_key($validated, array_flip(['name', 'prenom', 'email']));
                if ($userFields) {
                    $personnel->user->update($userFields);
                }

                $personnelFields = array_intersect_key($validated, array_flip(['poste', 'salaire_base', 'date_embauche', 'type_contrat']));
                if ($personnelFields) {
                    $personnel->update($personnelFields);
                }
            });

            return response()->json($personnel->load('user'));
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json(['message' => 'Erreur lors de la mise à jour', 'error' => $this->clientErrorMessage($e)], 500);
        }
    }

    /**
     * Désactiver un membre du personnel
     */
    public function destroy($id)
    {
        $personnel = Personnel::with('user')->findOrFail($id);
        $this->authorize('delete', $personnel);

        try {
            $user = $personnel->user;
            if ($user) {
                $user->is_active = false;
                $user->save();
                $user->tokens()->delete();
                DB::table('sessions')->where('user_id', $user->id)->delete();
            }

            return response()->json(['message' => 'Personnel désactivé']);
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json(['message' => 'Erreur lors de la désactivation', 'error' => $this->clientErrorMessage($e)], 500);
        }
    }

    /**
     * Générer une fiche de paie
     */
    public function genererFichePaie(Request $request, $id)
    {
        $personnel = Personnel::findOrFail($id);
        $this->authorize('update', $personnel);

        $validated = $request->validate([
            'periode' => 'required|string',
            'primes' => 'nullable|numeric',
            'retenues' => 'nullable|numeric',
        ]);

        $exists = FichePaie::where('user_id', $personnel->user_id)
            ->where('periode', $validated['periode'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Une fiche de paie existe déjà pour cette période'], 422);
        }

        try {
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
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json(['message' => 'Erreur lors de la génération', 'error' => $this->clientErrorMessage($e)], 500);
        }
    }
}
