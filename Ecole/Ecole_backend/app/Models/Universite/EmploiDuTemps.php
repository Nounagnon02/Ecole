<?php

namespace App\Models\Universite;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A dated session on the university calendar.
 *
 * Named for parity with the scholastic `App\Models\EmploiDuTemps`, but the shape
 * differs on purpose: that one is a weekly grid keyed on a `jour` string, this
 * one is keyed on an absolute `date`. See the migration for why.
 *
 * No `ScopedToCycle`: nothing here reaches a `classes` row, so there is no cycle
 * to be confined to. `BelongsToEcole` is the boundary that applies.
 */
class EmploiDuTemps extends Model
{
    use HasFactory, BelongsToEcole;

    protected $table = 'uni_emplois_du_temps';

    /** The event types the Planning page knows how to render. */
    public const TYPES = [
        'cours', 'td', 'tp', 'examen', 'soutenance', 'conference', 'reunion', 'evenement',
    ];

    /** planifie → termine, or annule. */
    public const STATUSES = ['planifie', 'termine', 'annule'];

    protected $fillable = [
        'titre',
        'type',
        'date',
        'heure_debut',
        'heure_fin',
        'salle',
        'statut',
        'matiere_id',
        'enseignant_id',
        'semestre_id',
        'filiere_id',
        'ecole_id',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    /**
     * Defaults on the model, not only on the column: a column default is applied
     * by the insert and never reaches the in-memory instance, so the response to
     * a create would omit `type` and `statut` entirely.
     */
    protected $attributes = [
        'type'   => 'cours',
        'statut' => 'planifie',
    ];

    /**
     * The two time columns are handled by an attribute pair, not by a cast.
     *
     * The scholastic model declares `'heure_debut' => 'datetime:H:i'` on a TIME
     * column, and that is a latent bug: a `datetime` cast serialises back to the
     * model's date format, `Y-m-d H:i:s`, so writing "08:00" sends
     * "2026-08-04 08:00:00" to a TIME column. SQLite stores the string as given
     * and the tests never see it; MySQL truncates or rejects. Keeping the value a
     * plain `H:i` string means what goes in is what comes out on both drivers.
     */
    protected function heureDebut(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return $this->timeAttribute();
    }

    protected function heureFin(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return $this->timeAttribute();
    }

    private function timeAttribute(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            // MySQL hands back "08:00:00", SQLite whatever was written. The page
            // renders "08:00 - 10:00", so both are trimmed to the same shape.
            get: fn($value) => $value === null ? null : substr((string) $value, 0, 5),
            set: fn($value) => $value === null ? null : substr((string) $value, 0, 5) . ':00',
        );
    }

    public function matiere(): BelongsTo
    {
        return $this->belongsTo(Matiere::class);
    }

    public function enseignant(): BelongsTo
    {
        return $this->belongsTo(Enseignant::class);
    }

    public function semestre(): BelongsTo
    {
        return $this->belongsTo(Semestre::class);
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    /**
     * Sessions a given filière is concerned by.
     *
     * A NULL `filiere_id` means *campus-wide*, so it must be included — filtering
     * on the id alone would drop the graduation ceremony from every student's
     * calendar.
     */
    public function scopeForFiliere(Builder $query, ?int $filiereId): Builder
    {
        return $query->where(
            fn(Builder $q) => $q->whereNull('filiere_id')->orWhere('filiere_id', $filiereId)
        );
    }

    /** Chronological, earliest first — the order the calendar renders in. */
    public function scopeChronological(Builder $query): Builder
    {
        return $query->orderBy('date')->orderBy('heure_debut');
    }
}
