<?php

namespace App\Http\Controllers;

use App\Models\Emprunt;
use App\Models\Livre;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BibliothecaireController extends Controller
{
    /**
     * Le catalogue, avec les exemplaires encore en rayon : `disponible`
     * passait à faux dès le premier emprunt, même pour un titre possédé en
     * plusieurs exemplaires.
     */
    public function livres()
    {
        return Livre::withCount(['emprunts as emprunts_en_cours' => fn ($q) => $q->whereNull('date_retour_effective')])
            ->latest()->get()
            ->map(fn ($livre) => $livre->setAttribute('exemplaires_disponibles', max(0, (int) $livre->nombre_exemplaires - (int) $livre->emprunts_en_cours)));
    }

    public function emprunts()
    {
        return Emprunt::with(['livre', 'eleve.classe', 'eleve.user:id,name,prenom'])->latest()->get();
    }

    public function reservations()
    {
        return Reservation::with(['livre', 'eleve.classe', 'eleve.user:id,name,prenom'])->latest()->get();
    }

    public function statistiques()
    {
        $totalPenalites = Emprunt::whereNotNull('date_retour_prevue')
            ->get(['id', 'date_retour_effective', 'date_retour_prevue'])
            ->sum(fn ($e) => $e->penalite);

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
        // `unique:livres` portait sur toute la plateforme : l'ISBN d'un livre
        // d'une école interdisait le même livre à toutes les autres.
        $validated = $request->validate([
            'titre' => 'required|string|max:255',
            'auteur' => 'required|string|max:255',
            'isbn' => ['required', 'string', 'max:20', Rule::unique('livres')->where('ecole_id', auth()->user()->ecole_id)->whereNull('deleted_at')],
            'categorie' => 'required|string|max:100',
            'annee_publication' => 'required|integer|min:1450|max:'.now()->year,
            'nombre_exemplaires' => 'nullable|integer|min:1|max:1000',
        ]);
        $validated['nombre_exemplaires'] ??= 1;
        $validated['disponible'] = true;

        return Livre::create($validated);
    }

    public function storeEmprunt(Request $request)
    {
        $validated = $request->validate([
            'livre_id' => 'required|school_exists:livres,id',
            'eleve_id' => 'required|school_exists:eleves,id',
            'date_emprunt' => 'required|date|before_or_equal:today',
            'date_retour_prevue' => 'required|date|after_or_equal:date_emprunt',
        ]);

        // Sous verrou : deux prêts simultanés du dernier exemplaire ne
        // doivent pas passer tous les deux.
        return DB::transaction(function () use ($validated) {
            $livre = Livre::lockForUpdate()->findOrFail($validated['livre_id']);
            $enCours = Emprunt::where('livre_id', $livre->id)->whereNull('date_retour_effective')->count();

            if ($enCours >= (int) $livre->nombre_exemplaires) {
                return response()->json(['message' => 'Aucun exemplaire de ce livre n’est disponible : tous sont prêtés.'], 422);
            }

            $emprunt = Emprunt::create($validated);
            $livre->update(['disponible' => $enCours + 1 < (int) $livre->nombre_exemplaires]);

            return response()->json($emprunt->load(['livre', 'eleve.user:id,name,prenom']), 201);
        });
    }

    public function retournerLivre($empruntId)
    {
        return DB::transaction(function () use ($empruntId) {
            $emprunt = Emprunt::lockForUpdate()->findOrFail($empruntId);

            // Un retour enregistré deux fois rendait un exemplaire de trop.
            if ($emprunt->date_retour_effective) {
                return response()->json(['message' => 'Ce livre est déjà retourné.'], 422);
            }

            $emprunt->update(['date_retour_effective' => now()]);
            $emprunt->livre?->update(['disponible' => true]);

            return response()->json(['message' => 'Livre retourné avec succès']);
        });
    }

    public function storeReservation(Request $request)
    {
        $validated = $request->validate([
            'livre_id' => 'required|school_exists:livres,id',
            'eleve_id' => 'required|school_exists:eleves,id',
            'date_reservation' => 'required|date',
            'date_limite' => 'required|date',
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
