<?php

namespace App\Http\Controllers;

use App\Models\Personnel;
use App\Models\User;
use App\Models\FichePaie;
use App\Http\Requests\Personnel\StorePersonnelRequest;
use App\Http\Requests\Personnel\GenererFichePaieRequest;
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
     * Ajouter un membre du personnel
     */
    public function store(StorePersonnelRequest $request)
    {
        $validated = $request->validated();

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
     * Générer une fiche de paie
     */
    public function genererFichePaie(GenererFichePaieRequest $request, $id)
    {
        $personnel = Personnel::findOrFail($id);
        $this->authorize('update', $personnel);

        $validated = $request->validated();

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
