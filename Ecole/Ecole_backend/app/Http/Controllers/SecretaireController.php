<?php

namespace App\Http\Controllers;

use App\Models\{Eleves, RendezVous, Certificat};
use Illuminate\Http\Request;

class SecretaireController extends Controller
{
    public function dossiersEleves()
    {
        return Eleves::with(['classe', 'parents'])->get()->map(function ($eleve) {
            $parent = $eleve->parents->first();
            return [
                'id' => $eleve->id,
                'eleve' => $eleve,
                'nom_pere' => $parent->nom ?? 'N/A',
                'nom_mere' => 'N/A', // À adapter selon votre structure
                'telephone_parent' => $parent->numero_de_telephone ?? 'N/A',
                'dossier_complet' => $this->isDossierComplet($eleve->id)
            ];
        });
    }

    public function rendezVous()
    {
        return RendezVous::with(['parent', 'eleve', 'enseignant'])->latest()->get();
    }

    public function certificats()
    {
        return Certificat::with(['eleve.classe'])->latest()->get();
    }

    public function statistiques()
    {
        return [
            'rdv_jour' => RendezVous::whereDate('date', today())->count(),
            'certificats_attente' => Certificat::where('delivre', false)->count(),
            'dossiers_incomplets' => $this->getDossiersIncomplets(),
            'visiteurs_jour' => 0 // À implémenter selon votre logique
        ];
    }

    public function storeRendezVous(Request $request)
    {
        $request->validate([
            'motif' => 'required|string',
            'parent_id' => 'required|exists:parents,id',
            'date' => 'required|date',
            'heure' => 'required|string'
        ]);

        return RendezVous::create($request->all());
    }

    public function storeCertificat(Request $request)
    {
        $request->validate([
            'type_certificat' => 'required|string',
            'eleve_id' => 'required|exists:eleves,id',
            'date_emission' => 'required|date'
        ]);

        $certificat = Certificat::create([
            ...$request->all(),
            'numero_certificat' => $this->generateNumeroCertificat()
        ]);

        return $certificat;
    }

    public function delivrerCertificat($certificatId)
    {
        $certificat = Certificat::findOrFail($certificatId);
        $certificat->update(['delivre' => true]);

        return response()->json(['message' => 'Certificat délivré']);
    }

    private function isDossierComplet($eleveId)
    {
        // Logique pour vérifier si le dossier est complet
        return rand(0, 1) == 1; // Exemple aléatoire
    }

    private function getDossiersIncomplets()
    {
        // Logique pour compter les dossiers incomplets
        return 5; // Exemple
    }

    private function generateNumeroCertificat()
    {
        return 'CERT-' . date('Y') . '-' . str_pad(Certificat::count() + 1, 4, '0', STR_PAD_LEFT);
    }
}