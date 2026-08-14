<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Archive immuable du bulletin d'un élève pour une période d'une année scolaire.
 *
 * Créée au verrouillage du bulletin, elle ne se recalcule jamais : la moyenne,
 * le rang, la mention et le détail par matière (`data`) sont figés le jour de
 * l'archivage, même si les notes bougent ensuite.
 */
class Bulletin extends Model
{
    use BelongsToEcole, HasFactory;

    protected $fillable = [
        'eleve_id',
        'classe_id',
        'periode',
        'annee_scolaire',
        'moyenne_generale',
        'rang',
        'total_eleves',
        'mention',
        'data',
        'appreciation',
        'pdf_path',
        'publie',
        'publie_le',
        'created_by',
        'ecole_id',
    ];

    protected $casts = [
        'moyenne_generale' => 'decimal:2',
        'rang' => 'integer',
        'total_eleves' => 'integer',
        'data' => 'array',
        'publie' => 'boolean',
        'publie_le' => 'datetime',
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }

    public function classe()
    {
        return $this->belongsTo(Classes::class);
    }
}
