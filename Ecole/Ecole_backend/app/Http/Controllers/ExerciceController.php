<?php

namespace App\Http\Controllers;

use App\Models\Exercice;
use App\Models\Classes;
use Illuminate\Http\Request;

class ExerciceController extends Controller
{
    public function index(Request $request)
    {
        $enseignantId = $request->query('enseignant_id');
        
        $query = Exercice::with(['classe:id,nom_classe', 'enseignant.user:id,name,prenom'])
            ->orderByDesc('date_limite');
        
        if ($enseignantId) {
            $query->where('enseignant_id', $enseignantId);
        }
        
        $exercices = $query->paginate((int) $request->input('per_page', 50));
        
        return response()->json(['success' => true, 'data' => $exercices]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'classe_id' => 'required|school_exists:classes,id',
            'enseignant_id' => 'required|exists:enseignants,id',
            'titre' => 'required|string|max:255',
            'description' => 'required|string',
            'date_limite' => 'required|date',
        ]);

        $validated['ecole_id'] = auth()->user()?->ecole_id;

        $exercice = Exercice::create($validated);

        return response()->json(['success' => true, 'data' => $exercice->load('classe', 'enseignant.user')], 201);
    }

    public function show($id)
    {
        $exercice = Exercice::with('classe', 'enseignant.user')->findOrFail($id);

        return response()->json(['success' => true, 'data' => $exercice]);
    }

    public function update(Request $request, $id)
    {
        $exercice = Exercice::findOrFail($id);

        $validated = $request->validate([
            'titre' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'date_limite' => 'sometimes|date',
        ]);

        $exercice->update($validated);

        return response()->json(['success' => true, 'data' => $exercice]);
    }

    public function destroy($id)
    {
        $exercice = Exercice::findOrFail($id);
        $exercice->delete();

        return response()->json(['success' => true]);
    }
}
