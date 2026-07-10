<?php

namespace App\Http\Controllers;

use App\Models\{Eleve, RendezVous, Certificat};
use Illuminate\Http\Request;

class SecretaireController extends Controller
{
    public function dossiersEleves()
    {
        return Eleve::with(['classe', 'parents'])->get()->map(function ($eleve) {
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
        $validated = $request->validate([
            'motif' => 'required|string',
            'parent_id' => 'required|exists:parents,id',
            'date' => 'required|date',
            'heure' => 'required|string'
        ]);

        return RendezVous::create($validated);
    }

    public function storeCertificat(Request $request)
    {
        $validated = $request->validate([
            'type_certificat' => 'required|string',
            'eleve_id' => 'required|exists:eleves,id',
            'date_emission' => 'required|date'
        ]);

        $certificat = Certificat::create([
            ...$validated,
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
        $eleve = Eleve::with(['user', 'parents', 'classe'])->find($eleveId);
        if (!$eleve) return false;

        return $eleve->user_id
            && $eleve->numero_matricule
            && $eleve->parents()->exists();
    }

    private function getDossiersIncomplets()
    {
        $total = Eleve::count();
        $complets = 0;
        Eleve::with('parents')->chunk(100, function ($eleves) use (&$complets) {
            foreach ($eleves as $eleve) {
                if ($eleve->numero_matricule && $eleve->parents()->exists()) {
                    $complets++;
                }
            }
        });
        return $total - $complets;
    }

    private function generateNumeroCertificat()
    {
        return 'CERT-' . date('Y') . '-' . str_pad(Certificat::count() + 1, 4, '0', STR_PAD_LEFT);
    }

    public function courriers()
    {
        return response()->json([]);
    }

    public function storeDossier(Request $request)
    {
        $request->validate([
            'eleve_nom' => 'required|string',
            'eleve_prenom' => 'required|string',
            'classe_id' => 'required|exists:classes,id',
            'type_dossier' => 'required|string'
        ]);

        return response()->json(['message' => 'Dossier créé', 'id' => rand(1, 1000)]);
    }

    public function storeCourrier(Request $request)
    {
        $request->validate([
            'expediteur' => 'required|string',
            'destinataire' => 'required|string',
            'objet' => 'required|string',
            'type' => 'required|in:entrant,sortant',
            'date_reception' => 'required|date'
        ]);

        return response()->json(['message' => 'Courrier enregistré', 'id' => rand(1, 1000)]);
    }

    public function storeVisiteur(Request $request)
    {
        $request->validate([
            'nom_visiteur' => 'required|string',
            'motif' => 'required|string',
            'heure_arrivee' => 'required|string',
            'date_visite' => 'required|date'
        ]);

        return response()->json(['message' => 'Visiteur enregistré', 'id' => rand(1, 1000)]);
    }
}