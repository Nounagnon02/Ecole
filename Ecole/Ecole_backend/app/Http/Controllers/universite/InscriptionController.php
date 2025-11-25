<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Inscription;
use Illuminate\Http\Request;

class InscriptionController extends Controller
{
    public function index()
    {
        $inscriptions = Inscription::with('etudiant', 'anneeAcademique')->get();
        return response()->json($inscriptions);
    }

    public function store(Request $request)
    {
        $request->validate([
            'etudiant_id' => 'required|exists:etudiants,id',
            'annee_academique_id' => 'required|exists:annee_academiques,id',
            'date_inscription' => 'required|date',
            'montant_frais' => 'required|numeric|min:0',
            'statut' => 'required|in:En cours,Validée,Annulée'
        ]);

        $inscription = Inscription::create($request->all());
        return response()->json($inscription, 201);
    }

    public function show(Inscription $inscription)
    {
        return response()->json($inscription->load('etudiant', 'anneeAcademique'));
    }

    public function update(Request $request, Inscription $inscription)
    {
        $request->validate([
            'montant_frais' => 'sometimes|required|numeric|min:0',
            'statut' => 'sometimes|required|in:En cours,Validée,Annulée'
        ]);

        $inscription->update($request->all());
        return response()->json($inscription);
    }

    public function destroy(Inscription $inscription)
    {
        $inscription->delete();
        return response()->json(null, 204);
    }
}
