<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Paiement;
use Illuminate\Http\Request;

class PaiementController extends Controller
{
    public function index()
    {
        $paiements = Paiement::with('etudiant')->get();
        return response()->json($paiements);
    }

    public function store(Request $request)
    {
        $request->validate([
            'etudiant_id' => 'required|exists:etudiants,id',
            'montant' => 'required|numeric|min:0',
            'date_paiement' => 'required|date',
            'motif' => 'required|string|max:200'
        ]);

        $paiement = Paiement::create($request->all());
        return response()->json($paiement, 201);
    }

    public function show(Paiement $paiement)
    {
        return response()->json($paiement->load('etudiant'));
    }

    public function update(Request $request, Paiement $paiement)
    {
        $request->validate([
            'montant' => 'sometimes|required|numeric|min:0',
            'date_paiement' => 'sometimes|required|date',
            'motif' => 'sometimes|required|string|max:200'
        ]);

        $paiement->update($request->all());
        return response()->json($paiement);
    }

    public function destroy(Paiement $paiement)
    {
        $paiement->delete();
        return response()->json(null, 204);
    }
}
