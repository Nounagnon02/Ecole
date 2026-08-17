<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ElevesExport implements FromCollection, WithHeadings
{
    protected $eleves;

    public function __construct($eleves)
    {
        $this->eleves = $eleves;
    }

    public function collection()
    {
        return $this->eleves->map(function ($eleve) {
            return [
                $eleve->nom,
                $eleve->prenom,
                $eleve->matricule,
                $eleve->classe->nom ?? $eleve->classe ?? '',
                $eleve->sexe,
                $eleve->statut,
            ];
        });
    }

    public function headings(): array
    {
        return ['Nom', 'Prénom', 'Matricule', 'Classe', 'Sexe', 'Statut'];
    }
}
