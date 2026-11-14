<?php

namespace App\Services\Comptabilite;

use App\Models\Ecole;
use App\Models\PaiementEleve;
use App\Models\TransactionPaiement;
use App\Support\Reglement;

/**
 * Génération des reçus (HTML imprimable — imprimer → PDF).
 *
 * Deux documents distincts (audit du 14/11, N-02) :
 * - le reçu d'un **versement** : la somme remise ce jour-là, son mode, et la
 *   situation de l'échéance juste après ;
 * - la **situation d'une échéance** : total dû, déjà payé, reste. Elle
 *   affichait le total comme montant payé et la date d'échéance comme date
 *   de paiement, ce qui rendait faux tout reçu de paiement partiel.
 */
class RecuService
{
    private const MODES = [
        'ESPECES' => 'Espèces',
        'CHEQUE' => 'Chèque',
        'VIREMENT' => 'Virement',
        'MOBILE_MONEY' => 'Mobile money',
    ];

    public function html(PaiementEleve $paiement, ?Ecole $ecole): string
    {
        // `statut` n'existe pas sur `paiements` — la colonne est
        // `statut_global`.
        $statutGlobal = $paiement->statut_global;
        $estPaye = $statutGlobal === PaiementEleve::PAID;
        $titre = $estPaye ? 'Reçu de paiement' : 'Situation de paiement';

        $lignes = $this->lignesEleve($paiement)
            .$this->ligne('Échéance', $paiement->date_paiement?->format('d/m/Y') ?? '—')
            .'<tr><td>Statut</td><td><span class="badge '.($estPaye ? 'paye' : 'en_attente').'">'.e(Reglement::libelle($statutGlobal)).'</span></td></tr>';

        return $this->page(
            $ecole ?? $paiement->ecole,
            $titre,
            $paiement->reference ?? 'PAY-'.$paiement->id,
            $lignes,
            '',
            $this->situation((float) $paiement->montant_total, (float) $paiement->montant_paye)
        );
    }

    public function versementHtml(TransactionPaiement $versement, ?Ecole $ecole): string
    {
        $echeance = $versement->paiementEleve;

        // Ce qui était payé juste après ce versement : le payé actuel moins
        // les versements approuvés enregistrés depuis. Un reçu réimprimé plus
        // tard dit donc toujours la même chose.
        $versesDepuis = (float) TransactionPaiement::where('id_paiement_eleve', $echeance->id)
            ->where('id', '>', $versement->id)
            ->where('statut', TransactionPaiement::APPROUVE)
            ->sum('montant_paye');
        $payeApres = max(0, (float) $echeance->montant_paye - $versesDepuis);

        $mode = $versement->methode_paiement;
        $lignes = $this->lignesEleve($echeance)
            .$this->ligne('Date d’encaissement', $versement->date_paiement?->format('d/m/Y') ?? $versement->created_at?->format('d/m/Y') ?? '—')
            .$this->ligne('Mode', self::MODES[$mode] ?? ($mode ?: '—'));

        $montant = '<p class="amount-label">Montant reçu</p><div class="amount">'.$this->fcfa((float) $versement->montant_paye).'</div>';

        return $this->page(
            $ecole ?? $echeance->ecole,
            'Reçu de versement',
            $versement->reference_transaction ?? 'VER-'.$versement->id,
            $lignes,
            $montant,
            $this->situation((float) $echeance->montant_total, $payeApres)
        );
    }

    private function lignesEleve(PaiementEleve $paiement): string
    {
        return $this->ligne('Élève', trim(($paiement->eleve?->user?->name ?? '').' '.($paiement->eleve?->user?->prenom ?? '')) ?: '—')
            .$this->ligne('Classe', $paiement->eleve?->classe?->nom_classe ?? '—')
            .$this->ligne('Objet', $paiement->type_paiement ?? '—');
    }

    private function situation(float $total, float $paye): string
    {
        return '<table class="info-table situation">'
            .$this->ligne('Total dû', $this->fcfa($total))
            .$this->ligne('Déjà payé', $this->fcfa($paye))
            .$this->ligne('Reste à payer', $this->fcfa(max(0, $total - $paye)))
            .'</table>';
    }

    private function ligne(string $libelle, string $valeur): string
    {
        return '<tr><td>'.e($libelle).'</td><td>'.e($valeur).'</td></tr>';
    }

    private function fcfa(float $montant): string
    {
        return number_format($montant, 0, ',', ' ').' FCFA';
    }

    private function page(?Ecole $ecole, string $titre, string $numero, string $lignes, string $montant, string $situation): string
    {
        // Le numéro est dans `phone` (`telephone` n'existe pas : « Tél : »
        // restait vide) ; les coordonnées vides ne s'affichent plus.
        $adresse = implode(' · ', array_filter([$ecole?->adresse, trim(($ecole?->ville ?? '').' '.($ecole?->pays ?? ''))]));
        $contact = implode(' · ', array_filter([
            $ecole?->phone ? 'Tél : '.$ecole->phone : null,
            $ecole?->email ? 'Email : '.$ecole->email : null,
        ]));

        return '<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>'.e($titre).' '.e($numero).'</title>
    <style>
        body { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 14px; color: #1f2937; max-width: 700px; margin: 40px auto; padding: 0 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 4px 0; color: #4b5563; font-size: 13px; }
        .recu-title { text-align: center; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 20px 0; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table td { padding: 6px 12px; }
        .info-table td:first-child { font-weight: 600; width: 180px; color: #4b5563; }
        .situation { border-top: 1px solid #e5e7eb; }
        .amount-label { text-align: center; margin: 20px 0 0; color: #4b5563; font-weight: 600; }
        .amount { font-size: 24px; font-weight: bold; text-align: center; color: #047857; margin: 8px 0 20px; padding: 16px; background: #f0fdf4; border-radius: 8px; }
        .footer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .badge.paye { background: #d1fae5; color: #065f46; }
        .badge.en_attente { background: #fef3c7; color: #92400e; }
        @media print { body { margin: 0; padding: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>'.e($ecole?->nom ?? 'Établissement scolaire').'</h1>
        '.($adresse !== '' ? '<p>'.e($adresse).'</p>' : '').'
        '.($contact !== '' ? '<p>'.e($contact).'</p>' : '').'
    </div>

    <div class="recu-title">'.e($titre).'</div>

    <p style="text-align:right;font-size:13px;color:#4b5563;">N° '.e($numero).'</p>

    <table class="info-table">'.$lignes.'</table>
    '.$montant.'
    '.$situation.'

    <div class="footer">
        <p>Document généré le '.now()->format('d/m/Y à H:i').'</p>
    </div>
</body>
</html>';
    }
}
