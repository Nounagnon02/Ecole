<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Model;

/** Une entrée du registre du courrier (arrivée ou départ). */
class Courrier extends Model
{
    use BelongsToEcole;

    protected $fillable = ['ecole_id', 'type', 'reference', 'expediteur', 'destinataire', 'objet', 'date_reception', 'observation', 'created_by'];

    protected $casts = ['date_reception' => 'date'];
}
