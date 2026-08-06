<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ScopesToCaller;
use App\Models\Bulletin;
use App\Services\BulletinService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Archives des bulletins verrouillés.
 *
 * POST /bulletins/verrouiller fige le bulletin d'une classe pour une période
 * (instantané des moyennes + mention), GET /bulletins le relit dans le périmètre
 * du demandeur.
 */
class BulletinsController extends Controller
{
    use ScopesToCaller;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Bulletin::class);

        $query = Bulletin::query()
            ->when($request->filled('periode'), fn ($q) => $q->where('periode', $request->periode))
            ->when($request->filled('annee_scolaire'), fn ($q) => $q->where('annee_scolaire', $request->annee_scolaire))
            ->when($request->filled('classe_id'), fn ($q) => $q->where('classe_id', $request->classe_id))
            ->when($request->filled('eleve_id'), fn ($q) => $q->where('eleve_id', $request->eleve_id));

        $this->restrictToCallerScope($query);

        $rows = $query
            ->with(['eleve', 'classe'])
            ->orderByDesc('annee_scolaire')
            ->orderBy('periode')
            ->orderBy('rang')
            ->get();

        return response()->json(['success' => true, 'data' => $rows]);
    }

    /**
     * Verrouille le bulletin d'une classe pour une période : un enregistrement
     * `bulletins` par élève, figé à partir de l'instantané `moyennes`.
     */
    public function verrouiller(Request $request, BulletinService $service)
    {
        $this->authorize('create', Bulletin::class);

        $validated = Validator::make($request->all(), [
            'classe_id' => 'required|school_exists:classes,id',
            'periode' => 'required|in:Trimestre 1,Trimestre 2,Trimestre 3',
            'annee_scolaire' => 'nullable|string|regex:/^\d{4}-\d{4}$/',
        ])->validate();

        $bulletins = $service->archiverClasse(
            $validated['classe_id'],
            $validated['periode'],
            $validated['annee_scolaire'] ?? null
        );

        return response()->json(['success' => true, 'data' => $bulletins]);
    }
}
