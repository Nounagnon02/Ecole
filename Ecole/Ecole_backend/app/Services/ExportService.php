<?php

namespace App\Services;

use App\Exports\ElevesExport;
use App\Exports\PaiementsExport;
use Illuminate\Support\Facades\View;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class ExportService
{
    public function bulletinPdf(array $data): \Barryvdh\DomPDF\PDF
    {
        $view = View::exists('exports.bulletin') ? 'exports.bulletin' : null;

        if ($view) {
            $html = View::make($view, $data)->render();
        } else {
            $html = $this->buildBulletinHtml($data);
        }

        return Pdf::loadHTML($html);
    }

    public function elevesExcel($eleves): \Maatwebsite\Excel\Downloads\HeadingRowExporter
    {
        return Excel::download(new ElevesExport($eleves), 'eleves.xlsx');
    }

    public function paiementsExcel($paiements): mixed
    {
        return Excel::download(new PaiementsExport($paiements), 'paiements.xlsx');
    }

    public function financesPdf(array $data): \Barryvdh\DomPDF\PDF
    {
        $totalCollected = $data['total_collected'] ?? 0;
        $totalPending = $data['total_pending'] ?? 0;
        $byClass = $data['by_class'] ?? [];

        $rows = '';
        foreach ($byClass as $row) {
            $rows .= '<tr><td>' . e($row['classe']) . '</td><td>' . e($row['collected']) . '</td><td>' . e($row['pending']) . '</td></tr>';
        }

        $html = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>'
            . 'body{font-family:sans-serif;font-size:12px;margin:30px;}'
            . 'h2{text-align:center;}table{width:100%;border-collapse:collapse;margin:20px 0;}'
            . 'th,td{border:1px solid #333;padding:8px;text-align:center;}'
            . 'th{background:#f0f0f0;}.total{font-size:14px;margin:10px 0;}'
            . '</style></head><body>'
            . '<h2>Récapitulatif Financier</h2>'
            . '<p class="total"><strong>Total encaissé :</strong> ' . e($totalCollected) . '</p>'
            . '<p class="total"><strong>Total en attente :</strong> ' . e($totalPending) . '</p>'
            . '<table><thead><tr><th>Classe</th><th>Encaissé</th><th>En attente</th></tr></thead>'
            . '<tbody>' . $rows . '</tbody></table></body></html>';

        return Pdf::loadHTML($html);
    }

    private function buildBulletinHtml(array $data): string
    {
        $eleve = $data['eleve'] ?? [];
        $classe = $data['classe'] ?? '';
        $periode = $data['periode'] ?? '';
        $matieres = $data['matieres'] ?? [];
        $mention = $data['mention'] ?? '';
        $ecole = $data['ecole'] ?? 'Nom de l\'école';

        $rows = '';
        foreach ($matieres as $m) {
            $coeff = $m['coefficient'] ?? 1;
            $note = $m['note'] ?? 0;
            $moy = round($note * $coeff / $coeff, 2);
            $rows .= '<tr><td>' . e($m['nom'] ?? '') . '</td><td>' . e($coeff) . '</td><td>' . e($note) . '</td><td>' . e($moy) . '</td></tr>';
        }

        return '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>'
            . 'body{font-family:sans-serif;font-size:12px;margin:30px;}'
            . '.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:15px;}'
            . '.header h1{font-size:20px;margin:0;}'
            . '.logo{width:80px;height:80px;margin:0 auto 10px;background:#eee;border:1px solid #ccc;display:flex;align-items:center;justify-content:center;color:#999;font-size:10px;}'
            . 'table{width:100%;border-collapse:collapse;margin-bottom:30px;}'
            . 'th,td{border:1px solid #333;padding:8px 10px;text-align:center;}'
            . 'th{background:#f0f0f0;}'
            . '.footer{margin-top:40px;text-align:right;}'
            . '.signature{border-top:1px solid #333;width:200px;display:inline-block;text-align:center;padding-top:5px;}'
            . '</style></head><body>'
            . '<div class="header"><div class="logo">Logo</div><h1>' . e($ecole) . '</h1><p>Bulletin Scolaire</p></div>'
            . '<p><strong>Élève :</strong> ' . e($eleve['nom'] ?? '') . ' ' . e($eleve['prenom'] ?? '') . '</p>'
            . '<p><strong>Classe :</strong> ' . e(is_array($classe) ? ($classe['nom'] ?? '') : $classe) . '</p>'
            . '<p><strong>Période :</strong> ' . e($periode) . '</p>'
            . '<table><thead><tr><th>Matière</th><th>Coeff</th><th>Note</th><th>Moyenne</th></tr></thead>'
            . '<tbody>' . $rows . '</tbody></table>'
            . ($mention ? '<p><strong>Mention :</strong> ' . e($mention) . '</p>' : '')
            . '<div class="footer"><div class="signature"><p>Signature</p></div></div>'
            . '</body></html>';
    }
}
