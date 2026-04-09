<?php

namespace App\Http\Controllers;

use App\Services\ImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImportController extends Controller
{
    protected $importService;

    public function __construct(ImportService $importService)
    {
        $this->importService = $importService;
    }

    /**
     * Importer des élèves en masse
     * POST /api/imports/eleves
     */
    public function importEleves(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv'
        ]);

        $file = $request->file('file');
        $ecoleId = Auth::user()->ecole_id;

        $results = $this->importService->importEleves($file->getRealPath(), $ecoleId);

        return response()->json([
            'message' => 'Importation terminée',
            'details' => $results
        ]);
    }
}
