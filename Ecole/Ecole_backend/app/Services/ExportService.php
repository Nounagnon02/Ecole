<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Illuminate\Support\Facades\Storage;

class ExportService
{
    /**
     * Exporte une liste d'élèves en Excel
     */
    public function exportEleves(array $eleves, string $fileName = 'eleves.xlsx')
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Entêtes
        $sheet->setCellValue('A1', 'Matricule');
        $sheet->setCellValue('B1', 'Nom');
        $sheet->setCellValue('C1', 'Prénom');
        $sheet->setCellValue('D1', 'Classe');

        $row = 2;
        foreach ($eleves as $eleve) {
            $sheet->setCellValue('A' . $row, $eleve->numero_matricule);
            $sheet->setCellValue('B' . $row, $eleve->user->name);
            $sheet->setCellValue('C' . $row, $eleve->user->prenom);
            $sheet->setCellValue('D' . $row, $eleve->classe->nom_classe ?? 'N/A');
            $row++;
        }

        $writer = new Xlsx($spreadsheet);
        $path = 'exports/' . $fileName;
        
        if (!Storage::disk('public')->exists('exports')) {
            Storage::disk('public')->makeDirectory('exports');
        }

        $writer->save(storage_path('app/public/' . $path));
        
        return asset('storage/' . $path);
    }

    /**
     * Exporte un rapport financier
     */
    public function exportFinances(array $paiements, string $fileName = 'rapport_financier.xlsx')
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        $sheet->setCellValue('A1', 'Date');
        $sheet->setCellValue('B1', 'Élève');
        $sheet->setCellValue('C1', 'Montant');
        $sheet->setCellValue('D1', 'Statut');

        $row = 2;
        foreach ($paiements as $p) {
            $sheet->setCellValue('A' . $row, $p->created_at->format('d/m/Y'));
            $sheet->setCellValue('B' . $row, $p->eleve->user->name . ' ' . $p->eleve->user->prenom);
            $sheet->setCellValue('C' . $row, $p->montant_total_paye);
            $sheet->setCellValue('D' . $row, $p->statut_global);
            $row++;
        }

        $writer = new Xlsx($spreadsheet);
        $path = 'exports/' . $fileName;
        $writer->save(storage_path('app/public/' . $path));
        
        return asset('storage/' . $path);
    }
}
