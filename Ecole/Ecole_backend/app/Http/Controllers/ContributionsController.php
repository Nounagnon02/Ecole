<?php

namespace App\Http\Controllers;
use App\Models\Contributions;
use Illuminate\Http\Request;

class ContributionsController extends Controller
{
    public function index()
    {
        $contributions = Contributions::with('classe')->get();
        return response()->json($contributions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'montant' => 'required|integer',
            'date_fin_premiere_tranche' => 'required|date',
            'montant_premiere_tranche' => 'required|integer',
            'date_fin_deuxieme_tranche' => 'required|date',
            'montant_deuxieme_tranche' => 'required|integer',
            'date_fin_troisieme_tranche' => 'required|date',
            'montant_troisieme_tranche' => 'required|integer',
            'id_classe' => 'required|exists:classes,id',
            'id_serie'=> 'required|exists:series,id',
        ]);

        $contribution = Contributions::create($validated);
        return response()->json($contribution, 201);
    }

    public function show($id)
    {
        $contribution = Contributions::with('classe')->findOrFail($id);
        return response()->json($contribution);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'montant' => 'integer',
            'date_fin_premiere_tranche' => 'date',
            'date_fin_deuxieme_tranche' => 'date',
            'date_fin_troisieme_tranche' => 'date',
            'id_classe' => 'exists:classes,id',
        ]);

        $contribution = Contributions::findOrFail($id);
        $contribution->update($validated);
        return response()->json($contribution);
    }

    public function destroy($id)
    {
        $contribution = Contributions::findOrFail($id);
        $contribution->delete();
        return response()->json(null, 204);
    }
}