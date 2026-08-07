<?php

namespace App\Http\Controllers;

use App\Models\Eleve;
use App\Models\PaiementEleve;
use App\Services\ExportService;
use Illuminate\Http\Request;

class ExportController extends Controller
{
    protected $exportService;

    public function __construct(ExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    /**
     * Exporter la liste des élèves d'une classe
     */
    public function exportEleves(Request $request)
    {
        $classeId = $request->query('classe_id');
        $query = Eleve::with('user:id,name,prenom,email,telephone', 'classe:id,nom_classe');

        if ($classeId) {
            $query->where('classe_id', $classeId);
        }

        // Traitement par lots : `->get()` chargeait tout l'effectif en mémoire
        // d'un coup, ce qui sature le process sur les gros établissements (P3).
        $lignes = [];
        $query->chunk(500, function ($lot) use (&$lignes) {
            foreach ($lot as $eleve) {
                $lignes[] = $eleve->toArray();
            }
        });

        $url = $this->exportService->exportEleves($lignes);

        return response()->json(['success' => true, 'download_url' => $url]);
    }

    /**
     * Exporter le rapport financier — bornable par période.
     */
    public function exportFinances(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to'   => 'nullable|date|after_or_equal:date_from',
        ]);

        $query = PaiementEleve::with('eleve.user:id,name,prenom')
            ->when($request->date_from, fn($q) => $q->whereDate('date_paiement', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('date_paiement', '<=', $request->date_to));

        $lignes = [];
        $query->chunk(500, function ($lot) use (&$lignes) {
            foreach ($lot as $paiement) {
                $lignes[] = $paiement->toArray();
            }
        });

        $url = $this->exportService->exportFinances($lignes);

        return response()->json(['success' => true, 'download_url' => $url]);
    }
}
