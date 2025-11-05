<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToEcole;

class Payment extends Model
{
    use BelongsToEcole;

    protected $fillable = [
        'eleve_id',
        'ecole_id',
        'transaction_id',
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

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
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
