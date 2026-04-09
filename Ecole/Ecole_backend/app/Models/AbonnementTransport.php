<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AbonnementTransport extends Model
{
    use HasFactory;

    protected $table = 'abonnements_transport';

    protected $fillable = [
        'eleve_id',
        'trajet_id',
        'vehicule_id',
        'date_debut',
        'date_fin',
        'statut',
        'montant_paye'
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }

    public function trajet()
    {
        return $this->belongsTo(TrajetTransport::class, 'trajet_id');
    }

    public function vehicule()
    {
        return $this->belongsTo(Vehicule::class);
    }
}
