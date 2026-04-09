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
        $query = Eleve::with('user', 'classe');
        
        if ($classeId) {
            $query->where('class_id', $classeId);
        }

        $eleves = $query->get();
        $url = $this->exportService->exportEleves($eleves->toArray());

        return response()->json(['success' => true, 'download_url' => $url]);
    }

    /**
     * Exporter le rapport financier global
     */
    public function exportFinances()
    {
        $paiements = PaiementEleve::with('eleve.user')->get();
        $url = $this->exportService->exportFinances($paiements->toArray());

        return response()->json(['success' => true, 'download_url' => $url]);
    }
}
