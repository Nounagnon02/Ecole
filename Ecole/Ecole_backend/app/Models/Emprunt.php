<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Emprunt extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'livre_id', 'eleve_id', 'date_emprunt', 'date_retour_prevue', 'date_retour_effective', 'ecole_id'
    ];

    protected $appends = ['penalite', 'jours_retard'];

    protected $casts = [
        'date_emprunt' => 'date',
        'date_retour_prevue' => 'date',
        'date_retour_effective' => 'date'
    ];

    public function livre()
    {
        return $this->belongsTo(Livre::class);
    }

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }

    /**
     * Calculer la pénalité en fonction des jours de retard
     * Taux : 100 FCFA par jour de retard
     */
    public function getPenaliteAttribute()
    {
        if ($this->date_retour_effective) {
            // Retourné : pénalité calculée jusqu'à la date effective
            $retour = $this->date_retour_effective;
        } else {
            // Non retourné : pénalité calculée jusqu'à aujourd'hui
            $retour = now();
        }

        if (!$this->date_retour_prevue || $retour <= $this->date_retour_prevue) {
            return 0;
        }

        $joursRetard = (int) $this->date_retour_prevue->diffInDays($retour);
        return min($joursRetard * 100, 10000); // max 10 000 FCFA
    }

    /**
     * Nombre de jours de retard
     */
    public function getJoursRetardAttribute()
    {
        if (!$this->date_retour_prevue) return 0;

        $retour = $this->date_retour_effective ?? now();
        if ($retour <= $this->date_retour_prevue) return 0;

        return (int) $this->date_retour_prevue->diffInDays($retour);
    }
}