<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Diplome;
use Illuminate\Http\Request;

class DiplomeController extends Controller
{
    public function index()
    {
        $diplomes = Diplome::with('etudiant')->paginate(15);
        return response()->json($diplomes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'etudiant_id' => 'required|exists:etudiants,id',
            'intitule' => 'required|string|max:200',
            'date_delivrance' => 'required|date',
            'mention' => 'nullable|in:Passable,Assez bien,Bien,Très bien,Excellent'
        ]);

        $diplome = Diplome::create($validated);
        return response()->json($diplome, 201);
    }

    public function show(Diplome $diplome)
    {
        return response()->json($diplome->load('etudiant'));
    }

    public function update(Request $request, Diplome $diplome)
    {
        $validated = $request->validate([
            'intitule' => 'sometimes|required|string|max:200',
            'date_delivrance' => 'sometimes|required|date',
            'mention' => 'nullable|in:Passable,Assez bien,Bien,Très bien,Excellent'
        ]);

        $diplome->update($validated);
        return response()->json($diplome);
    }

    public function destroy(Diplome $diplome)
    {
        $diplome->delete();
        return response()->json(null, 204);
    }
}
