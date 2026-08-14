<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ScopesToCaller;
use App\Models\Moyennes;
use App\Services\BulletinService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MoyennesController extends Controller
{
    use ScopesToCaller;

    /**
     * Instantané des moyennes/rangs archivés, pour le périmètre du demandeur.
     *
     * Le périmètre est celui des notes : la direction et les enseignants voient
     * l'école entière (bornée par le scope tenant), l'élève se voit lui-même,
     * le parent voit ses enfants. Un rôle inattendu ne reçoit rien.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Moyennes::class);

        $query = Moyennes::query()
            ->when($request->filled('periode'), fn ($q) => $q->where('periode', $request->periode))
            ->when($request->filled('classe_id'), fn ($q) => $q->where('classe_id', $request->classe_id))
            ->when($request->filled('eleve_id'), fn ($q) => $q->where('eleve_id', $request->eleve_id));

        $this->restrictToCallerScope($query);

        $rows = $query
            ->with(['eleve', 'matiere'])
            ->orderBy('eleve_id')
            ->get();

        return response()->json(['success' => true, 'data' => $rows]);
    }

    /**
     * Recalcule et archive l'instantané d'une classe pour une période
     * (verrouillage du bulletin).
     */
    public function recalculer(Request $request, BulletinService $service)
    {
        $this->authorize('create', Moyennes::class);

        $validated = Validator::make($request->all(), [
            'classe_id' => 'required|school_exists:classes,id',
            'periode' => 'required|in:Trimestre 1,Trimestre 2,Trimestre 3',
            'annee_scolaire' => 'nullable|string|regex:/^\d{4}-\d{4}$/',
        ])->validate();

        $rows = $service->recalculerClasseMoyennes(
            $validated['classe_id'],
            $validated['periode'],
            $validated['annee_scolaire'] ?? null
        );

        return response()->json(['success' => true, 'data' => $rows]);
    }
}
