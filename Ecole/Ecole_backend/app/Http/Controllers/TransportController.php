<?php

namespace App\Http\Controllers;

use App\Models\{Vehicule, TrajetTransport, AbonnementTransport};
use Illuminate\Http\Request;

class TransportController extends Controller
{
    /**
     * Liste des véhicules
     */
    public function listVehicules()
    {
        return response()->json(Vehicule::all());
    }

    /**
     * Liste des trajets disponibles
     */
    public function listTrajets()
    {
        return response()->json(TrajetTransport::all());
    }

    /**
     * Voir les abonnements actifs (Admin)
     */
    public function indexAbonnements()
    {
        return response()->json(
            AbonnementTransport::with(['eleve.user', 'trajet', 'vehicule'])->latest()->get()
        );
    }

    /**
     * Créer un nouvel abonnement
     */
    public function storeAbonnement(Request $request)
    {
        $validated = $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'trajet_id' => 'required|exists:trajets_transport,id',
            'vehicule_id' => 'nullable|exists:vehicules,id',
            'date_debut' => 'required|date',
            'date_fin' => 'nullable|date|after:date_debut',
        ]);

        $abonnement = AbonnementTransport::create(array_merge($validated, [
            'statut' => 'actif',
            'montant_paye' => 0
        ]));

        return response()->json($abonnement->load(['eleve.user', 'trajet']), 201);
    }

    /**
     * Enregistrer un paiement de transport (Séparé du global)
     */
    public function payerTransport(Request $request, $id)
    {
        $abonnement = AbonnementTransport::findOrFail($id);
        
        $validated = $request->validate([
            'montant' => 'required|numeric|min:0',
        ]);

        $abonnement->increment('montant_paye', $validated['montant']);

        return response()->json([
            'message' => 'Paiement de transport enregistré',
            'nouveau_solde' => $abonnement->montant_paye
        ]);
    }
}
