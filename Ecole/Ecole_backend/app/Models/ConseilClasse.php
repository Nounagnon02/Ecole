<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConseilClasse extends Model
{
    use HasFactory;

    protected $table = 'conseils_classe';

    protected $fillable = [
        'classe_id', 'date', 'trimestre', 'participants', 'decisions', 'statut'
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