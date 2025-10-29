<?php

namespace App\Http\Controllers;

use App\Models\{Paiement, Bourse};
use Illuminate\Http\Request;

class ComptableController extends Controller
{
    public function paiements()
    {
        return Paiement::with(['eleve.classe'])->latest()->get();
    }

    public function finances()
    {
        $stats = [
            'total_recettes' => Paiement::where('statut', 'payé')->sum('montant'),
            'total_depenses' => 0, // À implémenter selon votre logique
            'paiements_en_attente' => Paiement::where('statut', 'en_attente')->count(),
            'bourses_accordees' => Bourse::where('statut', 'active')->count()
        ];

        $chart = [
            'labels' => ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
            'datasets' => [[
                'data' => [120000, 150000, 180000, 140000, 160000, 200000]
            ]]
        ];

        return response()->json([
            'stats' => $stats,
            'chart' => $chart
        ]);
    }

    public function bourses()
    {
        return Bourse::with(['eleve.classe'])->latest()->get();
    }

    public function storePaiement(Request $request)
    {
        $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'montant' => 'required|numeric',
            'type_paiement' => 'required|string',
            'date_paiement' => 'required|date'
        ]);

        return Paiement::create($request->all());
    }

    public function storeBourse(Request $request)
    {
        $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'type_bourse' => 'required|string',
            'montant' => 'required|numeric',
            'pourcentage' => 'required|integer',
            'periode' => 'required|string'
        ]);

        return Bourse::create($request->all());
    }
}