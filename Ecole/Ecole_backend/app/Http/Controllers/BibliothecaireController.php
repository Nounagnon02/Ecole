<?php

namespace App\Http\Controllers;

use App\Models\{Livre, Emprunt, Reservation};
use Illuminate\Http\Request;

class BibliothecaireController extends Controller
{
    public function livres()
    {
        return Livre::latest()->get();
    }

    public function emprunts()
    {
        return Emprunt::with(['livre', 'eleve.classe', 'eleve.user'])->latest()->get();
    }

    public function reservations()
    {
        return Reservation::with(['livre', 'eleve.classe'])->latest()->get();
    }

    public function statistiques()
    {
        $totalPenalites = Emprunt::whereNotNull('date_retour_prevue')
            ->get(['id', 'date_retour_effective', 'date_retour_prevue'])
            ->sum(fn($e) => $e->penalite);

        return [
            'total_livres' => Livre::count(),
            'emprunts_actifs' => Emprunt::whereNull('date_retour_effective')->count(),
            'reservations_attente' => Reservation::where('statut', 'en_attente')->count(),
            'retards' => Emprunt::whereNull('date_retour_effective')
                ->where('date_retour_prevue', '<', now())
                ->count(),
            'total_penalites' => $totalPenalites,
        ];
    }

    public function storeLivre(Request $request)
    {
        $validated = $request->validate([
            'titre' => 'required|string',
            'auteur' => 'required|string',
            'isbn' => 'required|string|unique:livres',
            'categorie' => 'required|string',
            'annee_publication' => 'required|integer'
        ]);

        return Livre::create($validated);
    }

    public function storeEmprunt(Request $request)
    {
        $validated = $request->validate([
            'livre_id' => 'required|exists:livres,id',
            'eleve_id' => 'required|exists:eleves,id',
            'date_emprunt' => 'required|date',
            'date_retour_prevue' => 'required|date'
        ]);

        // Marquer le livre comme non disponible
        Livre::find($request->livre_id)->update(['disponible' => false]);

        return Emprunt::create($validated);
    }

    public function retournerLivre($empruntId)
    {
        $emprunt = Emprunt::findOrFail($empruntId);
        $emprunt->update(['date_retour_effective' => now()]);
        
        // Marquer le livre comme disponible
        $emprunt->livre->update(['disponible' => true]);

        return response()->json(['message' => 'Livre retourné avec succès']);
    }

    public function storeReservation(Request $request)
    {
        $validated = $request->validate([
            'livre_id' => 'required|exists:livres,id',
            'eleve_id' => 'required|exists:eleves,id',
            'date_reservation' => 'required|date',
            'date_limite' => 'required|date'
        ]);

        return Reservation::create($validated);
    }

    public function confirmerReservation($reservationId)
    {
        $reservation = Reservation::findOrFail($reservationId);
        $reservation->update(['statut' => 'confirmée']);

        return response()->json(['message' => 'Réservation confirmée']);
    }
}