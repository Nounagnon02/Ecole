<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Matieres;
use App\Models\Eleves;
use App\Models\Classes;
use App\Models\Enseignants;

class Notes extends Model
{
    use HasFactory;

    protected $fillable = [
        'eleve_id',
        'classe_id',
        'matiere_id',
        'note',
        'note_sur',
        'type_evaluation',
        'date_evaluation',
        'periode',
        'observation',
        'created_by'
    ];

    protected $casts = [
        'date_evaluation' => 'date',
        'note' => 'decimal:2',
        'note_sur' => 'decimal:2'
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleves::class,'eleve_id');
    }


    public function classe()
    {
        return $this->belongsTo(Classes::class);
    }

    public function matiere()
    {
        return $this->belongsTo(Matieres::class);
    }

    /*public function enseignant()
    {
        return $this->belongsTo(Enseignants::class);
    }*/



}




