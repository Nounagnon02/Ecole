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
        'enseignant_id',
        'note',
        'note_sur',
        'type_evaluation',
        'commentaire',
        'date_evaluation',
        'periode'
    ];

    protected $casts = [
        'date_evaluation' => 'date',
        'note' => 'decimal:2',
        'note_sur' => 'decimal:2'
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleves::class);
    }

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
        return $this->belongsTo(Enseignants::class);
    }

    // Calcul de la note sur 20
    public function getNotesSur20Attribute()
    {
        return ($this->note / $this->note_sur) * 20;
    }

    // Scope pour filtrer par période
    public function scopePeriode($query, $periode)
    {
        return $query->where('periode', $periode);
    }

    // Scope pour filtrer par classe
    public function scopeClasse($query, $classeId)
    {
        return $query->where('classe_id', $classeId);
    }

    // Scope pour filtrer par matière
    public function scopeMatiere($query, $matiereId)
    {
        return $query->where('matiere_id', $matiereId);
    }

// Scope pour filtrer par élève
    public function scopeEleve($query, $eleveId)
    {
        return $query->where('eleve_id', $eleveId);
    }

    // Scope pour filtrer par enseignant
    public function scopeEnseignant($query, $enseignantId)
    {
        return $query->where('enseignant_id', $enseignantId);
    }

        // Ajout de nouvelles méthodes utiles
    public function calculMoyenneParPeriode($eleveId, $matiereId, $periode)
    {
        return $this->where('eleve_id', $eleveId)
                    ->where('matiere_id', $matiereId)
                    ->where('periode', $periode)
                    ->avg('note');
    }

    // Méthode pour vérifier si une note est valide
    public function estValide()
    {
        return $this->note >= 0 && $this->note <= $this->note_sur;
    }

    // Scope pour filtrer par date
    public function scopeEntreDates($query, $debut, $fin)
    {
        return $query->whereBetween('date_evaluation', [$debut, $fin]);
    }

    // Scope pour les notes au-dessus d'une moyenne
    public function scopeAuDessusDe($query, $moyenne)
    {
        return $query->whereRaw('(note / note_sur) * 20 >= ?', [$moyenne]);
    }

    // Accesseur pour obtenir le statut de la note
    public function getStatutAttribute()
    {
        $noteSur20 = $this->getNotesSur20Attribute();
        if ($noteSur20 >= 16) return 'Très bien';
        if ($noteSur20 >= 14) return 'Bien';
        if ($noteSur20 >= 12) return 'Assez bien';
        if ($noteSur20 >= 10) return 'Passable';
        return 'Insuffisant';
    }

}




