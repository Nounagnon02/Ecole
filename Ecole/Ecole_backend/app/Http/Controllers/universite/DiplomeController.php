<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Diplome;
use Illuminate\Http\Request;

class DiplomeController extends Controller
{
    public function index()
    {
        $diplomes = Diplome::with('etudiant')->get();
        return response()->json($diplomes);
    }

    public function store(Request $request)
    {
        $request->validate([
            'etudiant_id' => 'required|exists:etudiants,id',
            'intitule' => 'required|string|max:200',
            'date_delivrance' => 'required|date',
            'mention' => 'nullable|in:Passable,Assez bien,Bien,Très bien,Excellent'
        ]);

        $diplome = Diplome::create($request->all());
        return response()->json($diplome, 201);
    }

    public function show(Diplome $diplome)
    {
        return response()->json($diplome->load('etudiant'));
    }

    public function update(Request $request, Diplome $diplome)
    {
        $request->validate([
            'intitule' => 'sometimes|required|string|max:200',
            'date_delivrance' => 'sometimes|required|date',
            'mention' => 'nullable|in:Passable,Assez bien,Bien,Très bien,Excellent'
        ]);

        $diplome->update($request->all());
        return response()->json($diplome);
    }

    public function destroy(Diplome $diplome)
    {
        $diplome->delete();
        return response()->json(null, 204);
    }
}
