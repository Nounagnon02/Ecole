<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsultationMedicale extends Model
{
    /**
     * Sans cette déclaration, Eloquent déduit `consultation_medicales` — au
     * singulier sur le premier mot — et la table n'existe pas. Toute requête
     * passant par ce modèle échouait, donc les consultations de l'infirmier et
     * le compteur du tableau de bord aussi.
     */
    protected $table = 'consultations_medicales';

    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'eleve_id', 'motif', 'diagnostic', 'date', 'traitement', 'urgence', 'ecole_id'
    ];

    protected $casts = [
        'date' => 'datetime',
        'urgence' => 'boolean'
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }
}