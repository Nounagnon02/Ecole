<?php

namespace App\Http\Controllers;

use App\Models\Certificat;
use App\Models\Courrier;
use App\Models\Eleve;
use App\Models\RendezVous;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class SecretaireController extends Controller
{
    public function dossiersEleves()
    {
        // Le nom et le téléphone du parent vivent sur `users` : lus sur
        // `parents`, ils valaient toujours « N/A ».
        $paginator = Eleve::with(['classe', 'user:id,name,prenom', 'parents.user:id,name,prenom,telephone'])->paginate(50);
        $items = $paginator->getCollection()->map(function ($eleve) {
            $parent = $eleve->parents->sortByDesc(fn ($p) => $p->pivot->is_primary)->first();

            return [
                'id' => $eleve->id,
                'eleve' => $eleve,
                'nom_parent' => $parent ? trim(($parent->user?->name ?? '').' '.($parent->user?->prenom ?? '')) : null,
                'telephone_parent' => $parent?->user?->telephone,
                'dossier_complet' => (bool) ($eleve->user_id && $eleve->numero_matricule && $eleve->parents->isNotEmpty()),
            ];
        });

        return new LengthAwarePaginator(
            $items,
            $paginator->total(),
            $paginator->perPage(),
            $paginator->currentPage(),
            ['path' => request()->url()]
        );
    }

    public function rendezVous()
    {
        return RendezVous::with(['parent', 'eleve', 'enseignant'])->latest()->paginate(50);
    }

    public function certificats()
    {
        return Certificat::with(['eleve.classe', 'eleve.user:id,name,prenom'])->latest()->paginate(50);
    }

    public function statistiques()
    {
        return [
            'rdv_jour' => RendezVous::whereDate('date', today())->count(),
            'certificats_attente' => Certificat::where('delivre', false)->count(),
            'dossiers_incomplets' => $this->getDossiersIncomplets(),
            'visiteurs_jour' => 0, // À implémenter selon votre logique
        ];
    }

    public function storeRendezVous(Request $request)
    {
        $validated = $request->validate([
            'motif' => 'required|string',
            'parent_id' => 'required|school_exists:parents,id',
            'date' => 'required|date',
            'heure' => 'required|string',
        ]);

        return RendezVous::create($validated);
    }

    public function storeCertificat(Request $request)
    {
        $validated = $request->validate([
            'type_certificat' => 'required|string',
            'eleve_id' => 'required|school_exists:eleves,id',
            'date_emission' => 'required|date',
        ]);

        $certificat = Certificat::create([
            ...$validated,
            'numero_certificat' => $this->generateNumeroCertificat(),
        ]);

        return response()->json($certificat->load(['eleve.classe', 'eleve.user:id,name,prenom']), 201);
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
        if (! $eleve) {
            return false;
        }

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
        return 'CERT-'.date('Y').'-'.str_pad(Certificat::count() + 1, 4, '0', STR_PAD_LEFT);
    }

    public function courriers(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => Courrier::query()
                ->when($request->filled('type'), fn ($q) => $q->where('type', $request->type))
                ->orderByDesc('date_reception')->orderByDesc('id')
                ->limit(500)->get(),
        ]);
    }

    public function storeDossier(Request $request)
    {
        $request->validate([
            'eleve_nom' => 'required|string',
            'eleve_prenom' => 'required|string',
            'classe_id' => 'required|school_exists:classes,id',
            'type_dossier' => 'required|string',
        ]);

        return response()->json(['message' => 'Fonctionnalité en cours de développement'], 501);
    }

    public function storeCourrier(Request $request)
    {
        $donnees = $request->validate([
            'expediteur' => 'required|string|max:255',
            'destinataire' => 'required|string|max:255',
            'objet' => 'required|string|max:255',
            'type' => 'required|in:entrant,sortant',
            'date_reception' => 'required|date|before_or_equal:today',
            'observation' => 'nullable|string|max:2000',
        ]);

        // Numéro d'ordre du registre, par année : A-2026-0001 à l'arrivée,
        // D-2026-0001 au départ.
        $prefixe = ($donnees['type'] === 'entrant' ? 'A' : 'D').'-'.now()->year.'-';
        $dernier = Courrier::where('reference', 'like', $prefixe.'%')->lockForUpdate()->max('reference');
        $numero = $dernier ? ((int) substr($dernier, strlen($prefixe))) + 1 : 1;

        $courrier = Courrier::create($donnees + [
            'reference' => $prefixe.str_pad((string) $numero, 4, '0', STR_PAD_LEFT),
            'created_by' => auth()->id(),
        ]);

        return response()->json(['success' => true, 'data' => $courrier], 201);
    }

    public function storeVisiteur(Request $request)
    {
        $request->validate([
            'nom_visiteur' => 'required|string',
            'motif' => 'required|string',
            'heure_arrivee' => 'required|string',
            'date_visite' => 'required|date',
        ]);

        return response()->json(['message' => 'Fonctionnalité en cours de développement'], 501);
    }
}
