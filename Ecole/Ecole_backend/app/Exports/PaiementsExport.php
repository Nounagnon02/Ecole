<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class PaiementsExport implements FromCollection, WithHeadings
{
    protected $paiements;

    public function __construct($paiements)
    {
        $this->paiements = $paiements;
    }

    public function collection()
    {
        return $this->paiements->map(function ($paiement) {
            return [
                $paiement->date,
                $paiement->eleve->nom . ' ' . $paiement->eleve->prenom ?? $paiement->eleve ?? '',
                $paiement->montant,
                $paiement->statut,
                $paiement->methode,
            ];
        });
    }

    public function headings(): array
    {
        return ['Date', 'Élève', 'Montant', 'Statut', 'Méthode'];
    }
}
