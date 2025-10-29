<?php

namespace App\Http\Controllers;

use App\Models\{ConsultationMedicale, DossierMedical, Vaccination};
use Illuminate\Http\Request;

class InfirmierController extends Controller
{
    public function consultations()
    {
        return ConsultationMedicale::with(['eleve.classe'])->latest()->get();
    }

    public function dossiersMedicaux()
    {
        return DossierMedical::with(['eleve.classe'])->get();
    }

    public function vaccinations()
    {
        return Vaccination::with(['eleve.classe'])->latest()->get();
    }

    public function statistiques()
    {
        return [
            'consultations_mois' => ConsultationMedicale::whereMonth('date', now()->month)->count(),
            'urgences_mois' => ConsultationMedicale::where('urgence', true)->whereMonth('date', now()->month)->count(),
            'vaccinations_mois' => Vaccination::whereMonth('date_vaccination', now()->month)->count(),
            'eleves_suivis' => DossierMedical::count()
        ];
    }

    public function storeConsultation(Request $request)
    {
        $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'motif' => 'required|string',
            'diagnostic' => 'required|string',
            'date' => 'required|date',
            'urgence' => 'boolean'
        ]);

        return ConsultationMedicale::create($request->all());
    }

    public function storeDossierMedical(Request $request)
    {
        $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'contact_urgence' => 'required|string'
        ]);

        return DossierMedical::create($request->all());
    }

    public function storeVaccination(Request $request)
    {
        $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'nom_vaccin' => 'required|string',
            'date_vaccination' => 'required|date',
            'numero_lot' => 'required|string'
        ]);

        return Vaccination::create($request->all());
    }
}