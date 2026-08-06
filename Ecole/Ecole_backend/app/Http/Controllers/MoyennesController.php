<?php

namespace App\Http\Controllers;

use App\Models\Moyennes;
use App\Services\BulletinService;
use App\Support\Roles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MoyennesController extends Controller
{
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
        ])->validate();

        $rows = $service->recalculerClasseMoyennes($validated['classe_id'], $validated['periode']);

        return response()->json(['success' => true, 'data' => $rows]);
    }

    /**
     * Restreindre la lecture de l'instantané à ce que le demandeur peut voir.
     */
    private function restrictToCallerScope($query): void
    {
        $user = auth()->user();
        $staff = Roles::expand([
            Roles::DIRECTOR, Roles::TEACHER, 'censeur', 'secretaire', Roles::SUPER_ADMIN,
        ]);

        if (in_array($user?->role, $staff, true)) {
            return; // périmètre de l'école, déjà borné par le scope tenant
        }

        if ($user?->role === 'eleve' && $user->eleve) {
            $query->where('eleve_id', $user->eleve->id);

            return;
        }

        if ($user?->role === 'parent' && $user->parent) {
            $query->whereIn('eleve_id', $user->parent->eleves()->pluck('eleves.id'));

            return;
        }

        $query->whereRaw('1 = 0');
    }
}
