<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Model;

class PaymentHistory extends Model
{
    use BelongsToEcole;

    protected $fillable = [
        'payment_id',
        'status',
        'note',
        'created_by',
        'ecole_id',
    ];

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
