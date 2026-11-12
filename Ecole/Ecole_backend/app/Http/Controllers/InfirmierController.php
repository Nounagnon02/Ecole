<?php

namespace App\Http\Controllers;

use App\Models\ConsultationMedicale;
use App\Models\DossierMedical;
use App\Models\Vaccination;
use Illuminate\Http\Request;

class InfirmierController extends Controller
{
    public function consultations()
    {
        return ConsultationMedicale::with(['eleve.classe', 'eleve.user:id,name,prenom'])->latest()->paginate(50);
    }

    public function dossiersMedicaux()
    {
        return DossierMedical::with(['eleve.classe', 'eleve.user:id,name,prenom'])->latest()->paginate(50);
    }

    public function vaccinations()
    {
        return Vaccination::with(['eleve.classe', 'eleve.user:id,name,prenom'])->latest()->paginate(50);
    }

    public function statistiques()
    {
        return [
            'consultations_mois' => ConsultationMedicale::whereMonth('date', now()->month)->count(),
            'urgences_mois' => ConsultationMedicale::where('urgence', true)->whereMonth('date', now()->month)->count(),
            'vaccinations_mois' => Vaccination::whereMonth('date_vaccination', now()->month)->count(),
            'eleves_suivis' => DossierMedical::count(),
        ];
    }

    public function storeConsultation(Request $request)
    {
        // Le traitement donné n'était pas validé, donc jamais enregistré.
        $validated = $request->validate([
            'eleve_id' => 'required|school_exists:eleves,id',
            'motif' => 'required|string|max:255',
            'diagnostic' => 'required|string|max:1000',
            'traitement' => 'nullable|string|max:1000',
            'date' => 'required|date|before_or_equal:today',
            'urgence' => 'boolean',
        ]);

        return response()->json(ConsultationMedicale::create($validated)->load('eleve.user:id,name,prenom'), 201);
    }

    public function storeDossierMedical(Request $request)
    {
        // Seul le contact d'urgence était lu : groupe sanguin, allergies,
        // maladies chroniques et aptitudes étaient perdus. Un élève n'a qu'un
        // dossier : l'enregistrer de nouveau le met à jour.
        $validated = $request->validate([
            'eleve_id' => 'required|school_exists:eleves,id',
            'contact_urgence' => 'required|string|max:255',
            'groupe_sanguin' => 'nullable|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'allergies' => 'nullable|string|max:1000',
            'maladies_chroniques' => 'nullable|string|max:1000',
            'vaccins_a_jour' => 'boolean',
            'aptitude_sport' => 'boolean',
        ]);

        $dossier = DossierMedical::updateOrCreate(['eleve_id' => $validated['eleve_id']], $validated);

        return response()->json($dossier->load('eleve.user:id,name,prenom'), $dossier->wasRecentlyCreated ? 201 : 200);
    }

    public function storeVaccination(Request $request)
    {
        $validated = $request->validate([
            'eleve_id' => 'required|school_exists:eleves,id',
            'nom_vaccin' => 'required|string|max:255',
            'date_vaccination' => 'required|date|before_or_equal:today',
            'numero_lot' => 'required|string|max:100',
            'date_rappel' => 'nullable|date|after:date_vaccination',
            'effets_secondaires' => 'boolean',
        ]);

        return response()->json(Vaccination::create($validated)->load('eleve.user:id,name,prenom'), 201);
    }
}
