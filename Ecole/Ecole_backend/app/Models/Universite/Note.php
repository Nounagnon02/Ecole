<?php

namespace App\Models\Universite;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Note extends Model
{
    use HasFactory, BelongsToEcole;
    protected $table = 'uni_notes';

    protected $fillable = [
        'etudiant_id',
        'matiere_id',
        'note',
        'type',
        'date_evaluation',
        'ecole_id',
    ];

    protected $casts = [
        'note' => 'decimal:2',
        'date_evaluation' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function etudiant()
    {
        return $this->belongsTo(Etudiant::class);
    }

    public function matiere()
    {
        return $this->belongsTo(Matiere::class);
    }
}
