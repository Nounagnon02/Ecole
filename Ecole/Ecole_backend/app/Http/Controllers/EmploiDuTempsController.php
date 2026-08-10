<?php

namespace App\Http\Controllers;

use App\Models\EmploiDuTemps;
use App\Models\Classes;
use App\Models\Matieres;
use App\Models\Enseignant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class EmploiDuTempsController extends Controller
{
    public function index(Request $request)
    {
        $query = EmploiDuTemps::with(['classe', 'matiere', 'enseignant']);

        if ($request->has('classe_id')) {
            $query->where('classe_id', $request->classe_id);
        }

        if ($request->has('enseignant_id')) {
            $query->where('enseignant_id', $request->enseignant_id);
        }

        $emplois = $query->orderBy('jour')->orderBy('heure_debut')->get();

        return response()->json(['success' => true, 'data' => $emplois]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'classe_id' => 'required|school_exists:classes,id',
            'matiere_id' => 'required|school_exists:matieres,id',
            'enseignant_id' => 'required|string',
            'jour' => 'required|string',
            'heure_debut' => 'required',
            'heure_fin' => 'required',
            'salle' => 'nullable|string',
        ]);

        $emploi = EmploiDuTemps::create($validated);

        return response()->json(['success' => true, 'data' => $emploi->load(['classe', 'matiere', 'enseignant'])], 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'classe_id' => 'school_exists:classes,id',
            'matiere_id' => 'school_exists:matieres,id',
            'enseignant_id' => 'string',
            'jour' => 'string',
            'heure_debut' => 'string',
            'heure_fin' => 'string',
            'salle' => 'nullable|string',
        ]);

        $emploi = EmploiDuTemps::findOrFail($id);
        $emploi->update($validated);

        return response()->json(['success' => true, 'data' => $emploi->load(['classe', 'matiere', 'enseignant'])]);
    }

    public function destroy($id)
    {
        EmploiDuTemps::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    public function getByClasse($classeId)
    {
        $emplois = EmploiDuTemps::with(['matiere', 'enseignant.user'])
            ->where('classe_id', $classeId)
            ->orderBy('jour')
            ->orderBy('heure_debut')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $emplois->map(function ($emploi) {
                return [
                    'id' => $emploi->id,
                    'jour' => $emploi->jour,
                    'heure_debut' => $emploi->heure_debut,
                    'heure_fin' => $emploi->heure_fin,
                    'matiere' => $emploi->matiere?->nom,
                    'professeur' => $emploi->enseignant?->user
                        ? trim(($emploi->enseignant->user->name ?? '') . ' ' . ($emploi->enseignant->user->prenom ?? ''))
                        : null,
                    'salle' => $emploi->salle,
                ];
            }),
        ]);
    }
}