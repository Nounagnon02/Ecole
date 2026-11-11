<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToEcole;

class Payment extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'eleve_id',
        'paiement_eleve_id',
        'ecole_id',
        'transaction_id',
        'checkout_url',
        'amount',
        'currency',
        'type',
        'description',
        'periode',
        'status',
        'payment_method',
        'paid_at',
        'refund_status',
        'refund_reason',
        'refunded_at'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'refunded_at' => 'datetime'
    ];

    /**
     * Durée pendant laquelle une ouverture non confirmée compte comme « en
     * cours » : au-delà, la page de la passerelle est considérée abandonnée.
     */
    public const PENDING_WINDOW_MINUTES = 10;

    /**
     * Ouvertures que la passerelle n'a pas encore tranchées. Leur montant est
     * engagé : il ne doit pas pouvoir être payé une seconde fois.
     */
    public function scopeAwaitingGateway($query)
    {
        return $query->where('status', 'pending')
            ->whereNotNull('transaction_id')
            ->where('created_at', '>=', now()->subMinutes(self::PENDING_WINDOW_MINUTES));
    }

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }

    /**
     * L'échéance de scolarité rapprochée par ce passage de passerelle, si la
     * transaction lui est rattachée (cf. reconciliation à la confirmation).
     */
    public function paiementEleve()
    {
        return $this->belongsTo(PaiementEleve::class, 'paiement_eleve_id');
    }

    public function ecole()
    {
        return $this->belongsTo(Ecole::class);
    }

    public function history()
    {
        return $this->hasMany(PaymentHistory::class);
    }
}
