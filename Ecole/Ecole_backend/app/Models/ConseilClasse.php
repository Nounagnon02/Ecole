<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use App\Traits\ScopedToCycle;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConseilClasse extends Model
{
    use HasFactory, BelongsToEcole, ScopedToCycle;

    /**
     * Un conseil de classe porte sur une classe précise.
     */
    protected static function cyclePath(): array
    {
        return ['class' => 'classe_id'];
    }


    protected $table = 'conseils_classe';

    protected $fillable = [
        'classe_id', 'date', 'trimestre', 'participants', 'decisions', 'statut', 'ecole_id'
    ];

    protected $casts = [
        'date' => 'date',
        'participants' => 'array',
        'decisions' => 'array'
    ];

    public function classe()
    {
        return $this->belongsTo(Classes::class);
    }
}