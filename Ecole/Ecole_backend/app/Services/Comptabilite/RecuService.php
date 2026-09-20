<?php

namespace App\Services\Comptabilite;

use App\Models\Ecole;
use App\Models\PaiementEleve;
use App\Support\Reglement;

/**
 * Génération du reçu de paiement (HTML imprimable — imprimer → PDF).
 *
 * Extrait de `ComptableController::recu()` : la mise en page n'a aucune
 * dépendance au cycle de requête HTTP, elle n'avait donc rien à faire dans
 * le contrôleur.
 */
class RecuService
{
    public function html(PaiementEleve $paiement, ?Ecole $ecole): string
    {
        // `statut` n'existe pas sur `paiements` — la colonne est
        // `statut_global`. Lire `$paiement->statut` renvoyait null : le
        // badge et le libellé étaient « En attente »/vide sur chaque reçu.
        $statutGlobal = $paiement->statut_global;
        $estPaye = $statutGlobal === PaiementEleve::PAID;
        $statutLabel = Reglement::libelle($statutGlobal);

        return '<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reçu de Paiement</title>
    <style>
        body { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 14px; color: #1f2937; max-width: 700px; margin: 40px auto; padding: 0 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 4px 0; color: #6b7280; font-size: 13px; }
        .recu-title { text-align: center; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 20px 0; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table td { padding: 6px 12px; }
        .info-table td:first-child { font-weight: 600; width: 160px; color: #6b7280; }
        .amount { font-size: 24px; font-weight: bold; text-align: center; color: #059669; margin: 20px 0; padding: 16px; background: #f0fdf4; border-radius: 8px; }
        .footer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .badge.paye { background: #d1fae5; color: #065f46; }
        .badge.en_attente { background: #fef3c7; color: #92400e; }
        @media print { body { margin: 0; padding: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>' . e($ecole?->nom ?? 'Établissement Scolaire') . '</h1>
        <p>' . e($ecole?->adresse ?? '') . ' · ' . e($ecole?->ville ?? '') . ' ' . e($ecole?->pays ?? '') . '</p>
        <p>Tél : ' . e($ecole?->telephone ?? '') . ' · Email : ' . e($ecole?->email ?? '') . '</p>
    </div>

    <div class="recu-title">Reçu de Paiement</div>

    <p style="text-align:right;font-size:13px;color:#6b7280;">N° ' . e($paiement->reference ?? 'PAY-' . $paiement->id) . '</p>

    <table class="info-table">
        <tr><td>Élève</td><td>' . e($paiement->eleve?->user?->name ?? '') . ' ' . e($paiement->eleve?->user?->prenom ?? '') . '</td></tr>
        <tr><td>Classe</td><td>' . e($paiement->eleve?->classe?->nom_classe ?? '—') . '</td></tr>
        <tr><td>Type</td><td>' . e($paiement->type_paiement ?? '—') . '</td></tr>
        <tr><td>Date</td><td>' . e($paiement->date_paiement?->format('d/m/Y') ?? '—') . '</td></tr>
        <tr><td>Mode</td><td>' . e($paiement->mode_paiement ?? '—') . '</td></tr>
        <tr><td>Statut</td><td><span class="badge ' . ($estPaye ? 'paye' : 'en_attente') . '">' . e($statutLabel) . '</span></td></tr>
    </table>

    <div class="amount">' . number_format((float) $paiement->montant, 0, ',', ' ') . ' FCFA</div>

    <div class="footer">
        <p>Reçu généré le ' . now()->format('d/m/Y à H:i') . '</p>
        <p>Ce document fait office de reçu officiel</p>
    </div>
</body>
</html>';
    }
}
