<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Etudiant;
use Illuminate\Http\Request;

class EtudiantController extends Controller
{
    public function index()
    {
        $etudiants = Etudiant::with('filiere')->get();
        return response()->json($etudiants);
    }

    public function store(Request $request)
    {
        $request->validate([
            'matricule' => 'required|string|unique:etudiants',
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'date_naissance' => 'required|date',
            'lieu_naissance' => 'nullable|string',
            'sexe' => 'required|in:M,F',
            'telephone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'adresse' => 'nullable|string',
            'annee_entree' => 'required|integer',
            'filiere_id' => 'required|exists:filieres,id'
        ]);

        $etudiant = Etudiant::create($request->all());
        return response()->json($etudiant, 201);
    }

    public function show(Etudiant $etudiant)
    {
        return response()->json($etudiant->load('filiere', 'inscriptions', 'notes', 'paiements'));
    }

    public function update(Request $request, Etudiant $etudiant)
    {
        $request->validate([
            'matricule' => 'sometimes|required|string|unique:etudiants,matricule,' . $etudiant->id,
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
            'date_naissance' => 'sometimes|required|date',
            'sexe' => 'sometimes|required|in:M,F',
            'filiere_id' => 'sometimes|required|exists:filieres,id'
        ]);

        $etudiant->update($request->all());
        return response()->json($etudiant);
    }

    public function destroy(Etudiant $etudiant)
    {
        $etudiant->delete();
        return response()->json(null, 204);
    }
}
