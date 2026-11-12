<?php

namespace App\Http\Controllers;

use App\Models\Evenement;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;

class EvenementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $events = Evenement::orderBy('date_debut', 'asc')
            ->where('date_debut', '>=', now())
            ->take(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $events,
        ]);
    }

    /** Types d'événement que le planning sait afficher. */
    public const TYPES = ['reunion', 'conseil', 'sortie', 'evenement', 'academique', 'culturel', 'administratif'];

    /**
     * Planning : les événements d'une période (par défaut du mois écoulé aux
     * six prochains mois). `index` ne rend que les dix prochains, ce qui
     * suffit au tableau de bord mais pas à un planning.
     */
    public function planning(Request $request)
    {
        $bornes = $request->validate(['du' => 'nullable|date', 'au' => 'nullable|date|after_or_equal:du']);

        return response()->json([
            'success' => true,
            'data' => Evenement::whereBetween('date_debut', [
                $bornes['du'] ?? now()->subMonth()->startOfDay(),
                isset($bornes['au']) ? Carbon::parse($bornes['au'])->endOfDay() : now()->addMonths(6)->endOfDay(),
            ])->orderBy('date_debut')->limit(500)->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titre' => 'required|string|max:255',
            'date_debut' => 'required|date',
            // Fin et type étaient ignorés : la colonne `type` gardait sa
            // valeur par défaut, et un événement sur plusieurs jours n'avait
            // pas de fin.
            'date_fin' => 'nullable|date|after_or_equal:date_debut',
            'type' => 'nullable|in:'.implode(',', self::TYPES),
            'lieu' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $event = Evenement::create([
            ...$validator->validated(),
            'created_by' => $request->user() ? $request->user()->id : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Événement créé avec succès',
            'data' => $event,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $event = Evenement::find($id);
        if (! $event) {
            return response()->json(['message' => 'Événement non trouvé'], 404);
        }

        return response()->json(['success' => true, 'data' => $event]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $event = Evenement::find($id);
        if (! $event) {
            return response()->json(['message' => 'Événement non trouvé'], 404);
        }

        $validated = $request->validate([
            'titre' => 'sometimes|string|max:255',
            'date_debut' => 'sometimes|date',
            'date_fin' => 'nullable|date|after_or_equal:'.($request->input('date_debut') ?? $event->date_debut),
            'type' => 'sometimes|in:'.implode(',', self::TYPES),
            'lieu' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:2000',
        ]);

        $event->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Événement mis à jour',
            'data' => $event,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $event = Evenement::find($id);
        if (! $event) {
            return response()->json(['message' => 'Événement non trouvé'], 404);
        }

        $event->delete();

        return response()->json([
            'success' => true,
            'message' => 'Événement supprimé',
        ]);
    }
}
