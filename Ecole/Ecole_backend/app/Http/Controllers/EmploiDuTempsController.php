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
    private const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    public function index(Request $request)
    {
        $query = EmploiDuTemps::with(['classe', 'matiere', 'enseignant']);

        if ($request->has('classe_id')) {
            $query->where('classe_id', $request->classe_id);
        }

        if ($request->has('enseignant_id')) {
            $query->where('enseignant_id', $request->enseignant_id);
        }

        $emplois = $query->orderBy('jour')->orderBy('heure_debut')->paginate(50);

        return response()->json($emplois);
    }

    public function store(Request $request)
    {
        $this->authorize('create', EmploiDuTemps::class);

        $validated = $request->validate([
            'classe_id' => 'required|school_exists:classes,id',
            'matiere_id' => 'required|school_exists:matieres,id',
            'enseignant_id' => 'required|school_exists:enseignants,id',
            'jour' => 'required|in:' . implode(',', self::JOURS),
            'heure_debut' => 'required|date_format:H:i',
            'heure_fin' => 'required|date_format:H:i|after:heure_debut',
            'salle' => 'nullable|string|max:50',
        ]);

        if ($this->hasConflict($validated)) {
            return response()->json([
                'message' => 'Conflit horaire : cette classe ou cet enseignant a déjà un cours sur ce créneau',
            ], 422);
        }

        try {
            $emploi = EmploiDuTemps::create($validated);
            return response()->json(['success' => true, 'data' => $emploi->load(['classe', 'matiere', 'enseignant'])], 201);
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $this->clientErrorMessage($e)], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $emploi = EmploiDuTemps::findOrFail($id);
        $this->authorize('update', $emploi);

        $validated = $request->validate([
            'classe_id' => 'sometimes|school_exists:classes,id',
            'matiere_id' => 'sometimes|school_exists:matieres,id',
            'enseignant_id' => 'sometimes|school_exists:enseignants,id',
            'jour' => 'sometimes|in:' . implode(',', self::JOURS),
            'heure_debut' => 'sometimes|date_format:H:i',
            'heure_fin' => 'sometimes|date_format:H:i',
            'salle' => 'nullable|string|max:50',
        ]);

        $merged = array_merge($emploi->toArray(), $validated);

        if (isset($merged['heure_debut']) && isset($merged['heure_fin'])) {
            if ($merged['heure_debut'] >= $merged['heure_fin']) {
                return response()->json(['message' => 'heure_fin doit être après heure_debut'], 422);
            }
        }

        if ($this->hasConflict($merged, $emploi->id)) {
            return response()->json([
                'message' => 'Conflit horaire : cette classe ou cet enseignant a déjà un cours sur ce créneau',
            ], 422);
        }

        try {
            $emploi->update($validated);
            return response()->json(['success' => true, 'data' => $emploi->load(['classe', 'matiere', 'enseignant'])]);
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json(['message' => 'Erreur lors de la mise à jour', 'error' => $this->clientErrorMessage($e)], 500);
        }
    }

    public function destroy($id)
    {
        $emploi = EmploiDuTemps::findOrFail($id);
        $this->authorize('delete', $emploi);

        try {
            $emploi->delete();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json(['message' => 'Erreur lors de la suppression', 'error' => $this->clientErrorMessage($e)], 500);
        }
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

    private function hasConflict(array $data, ?int $exceptId = null): bool
    {
        $jour = $data['jour'] ?? null;
        $debut = $data['heure_debut'] ?? null;
        $fin = $data['heure_fin'] ?? null;

        if (!$jour || !$debut || !$fin) {
            return false;
        }

        $query = EmploiDuTemps::where('jour', $jour)
            ->where('heure_debut', '<', $fin)
            ->where('heure_fin', '>', $debut);

        if ($exceptId) {
            $query->where('id', '!=', $exceptId);
        }

        if (!empty($data['classe_id'])) {
            if ($query->clone()->where('classe_id', $data['classe_id'])->exists()) {
                return true;
            }
        }

        if (!empty($data['enseignant_id'])) {
            if ($query->clone()->where('enseignant_id', $data['enseignant_id'])->exists()) {
                return true;
            }
        }

        return false;
    }
}
