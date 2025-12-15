<?php

namespace App\Http\Controllers;

use App\Models\Evenement;
use Illuminate\Http\Request;
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
            'data' => $events
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
            'lieu' => 'nullable|string',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $event = Evenement::create([
            ...$request->all(),
            'created_by' => $request->user() ? $request->user()->id : null
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Événement créé avec succès',
            'data' => $event
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $event = Evenement::find($id);
        if (!$event) {
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
        if (!$event) {
            return response()->json(['message' => 'Événement non trouvé'], 404);
        }

        $event->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Événement mis à jour',
            'data' => $event
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $event = Evenement::find($id);
        if (!$event) {
            return response()->json(['message' => 'Événement non trouvé'], 404);
        }

        $event->delete();

        return response()->json([
            'success' => true,
            'message' => 'Événement supprimé'
        ]);
    }
}
