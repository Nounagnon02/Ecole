<?php

namespace App\Models\Universite;

use App\Models\User;
use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * A university assignment.
 *
 * Named for parity with the scholastic `App\Models\Devoir`, from which it differs
 * in its anchor: a school assignment is given to a class, a university one to a
 * subject, and the audience follows from the subject's filière. See the
 * migration.
 *
 * No `ScopedToCycle`: the anchor is `uni_matieres`, which reaches no `classes`
 * row and therefore no cycle.
 */
class Devoir extends Model
{
    use HasFactory, BelongsToEcole;

    protected $table = 'uni_devoirs';

    public const TYPES      = ['devoir', 'projet', 'examen', 'exercice', 'rapport'];
    public const PRIORITIES = ['haute', 'moyenne', 'basse'];

    /**
     * `a_faire` without the accent: the frontend's own filter compares this
     * value verbatim, and a stored `à_faire` would only ever match a request
     * that spelled the accent identically after transport encoding.
     */
    public const STATUSES = ['a_faire', 'en_cours', 'termine'];

    protected $fillable = [
        'matiere_id',
        'created_by',
        'titre',
        'description',
        'type',
        'priorite',
        'statut',
        'date_limite',
        'publie',
        'ecole_id',
    ];

    protected $casts = [
        'date_limite' => 'datetime',
        'publie'      => 'boolean',
    ];

    /**
     * Defaults on the model, not only on the column.
     *
     * A database default is applied by the *insert* and never reaches the
     * in-memory instance, so `Devoir::create([...])->publie` was null right
     * after a successful create with `publie` left out — and the branch that
     * enrols the filière, guarded by exactly that, silently did nothing. The
     * assignment was published with no students attached to it. Declaring the
     * defaults here makes the object agree with the row it just wrote.
     */
    protected $attributes = [
        'type'     => 'devoir',
        'priorite' => 'moyenne',
        'statut'   => 'en_cours',
        'publie'   => true,
    ];

    public function matiere(): BelongsTo
    {
        return $this->belongsTo(Matiere::class);
    }

    /** The account that published it. */
    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Submissions, one row per student who was set the assignment.
     *
     * Pointed at `etudiants`, not `users`: a mark is an academic fact and must
     * outlive the login account.
     */
    public function etudiants(): BelongsToMany
    {
        return $this->belongsToMany(Etudiant::class, 'uni_devoir_etudiant', 'devoir_id', 'etudiant_id')
            ->withPivot(['rendu', 'note', 'reponse', 'fichier', 'date_remise', 'commentaire'])
            ->withTimestamps();
    }

    /** Published assignments only — a draft is invisible to students. */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('publie', true);
    }

    /**
     * Assignments set to a given filière, through their subject.
     *
     * `whereHas` rather than a join, so the subquery carries `uni_matieres`'
     * own tenant scope: a join would have to repeat the `ecole_id` clause by
     * hand, and forgetting it is how cross-school leaks happen.
     */
    public function scopeForFiliere(Builder $query, ?int $filiereId): Builder
    {
        return $query->whereHas('matiere', fn($q) => $q->where('filiere_id', $filiereId));
    }

    /** Assignments whose subject is taught by a given lecturer. */
    public function scopeTaughtBy(Builder $query, int $lecturerId): Builder
    {
        return $query->whereHas('matiere', fn($q) => $q->where('enseignant_id', $lecturerId));
    }

    /** Soonest deadline first; undated assignments last. */
    public function scopeByDeadline(Builder $query): Builder
    {
        return $query->orderByRaw('date_limite is null')->orderBy('date_limite');
    }
}
