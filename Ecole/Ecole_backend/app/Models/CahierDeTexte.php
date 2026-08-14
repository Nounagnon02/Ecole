<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use App\Traits\ScopedToCycle;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CahierDeTexte extends Model
{
    use HasFactory, BelongsToEcole, ScopedToCycle;

    /**
     * Le cahier de textes suit la progression d'une classe.
     */
    protected static function cyclePath(): array
    {
        return ['class' => 'classe_id'];
    }

    protected $fillable = [
        'classe_id',
        'matiere_id',
        'enseignant_id',
        'date',
        'titre_lecon',
        'contenu',
        'devoirs_donnes',
        'ecole_id',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function classe()
    {
        return $this->belongsTo(Classes::class);
    }

    public function matiere()
    {
        return $this->belongsTo(Matieres::class);
    }

    public function enseignant()
    {
        return $this->belongsTo(Enseignant::class);
    }
}
