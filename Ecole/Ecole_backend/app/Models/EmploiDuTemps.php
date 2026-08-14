<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use App\Traits\ScopedToCycle;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmploiDuTemps extends Model
{
    use HasFactory, BelongsToEcole, ScopedToCycle;

    /**
     * Un créneau appartient à une classe, donc à son cycle.
     */
    protected static function cyclePath(): array
    {
        return ['class' => 'classe_id'];
    }


    protected $table = 'emplois_du_temps';

    /**
     * `classe_id`, pas `class_id` : la colonne de la table est `classe_id`, si
     * bien qu'aucune création par assignation de masse ne pouvait aboutir —
     * `class_id` visait une colonne absente, et `classe_id`, hors de cette
     * liste, était silencieusement écarté. Les deux lecteurs du modèle
     * (ParentController, DashboardController) interrogent déjà `classe_id`.
     */
    protected $fillable = [
        'classe_id', 'matiere_id', 'enseignant_id', 'jour', 'heure_debut', 'heure_fin', 'salle', 'ecole_id'
    ];

    protected $casts = [
        'heure_debut' => 'datetime:H:i',
        'heure_fin' => 'datetime:H:i'
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