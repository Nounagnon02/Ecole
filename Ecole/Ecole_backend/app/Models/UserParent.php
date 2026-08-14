<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserParent extends Model
{
    use HasFactory, BelongsToEcole;

    protected $table = 'parents';

    protected $fillable = [
        'user_id',
        'profession',
        'adresse',
        'ecole_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function eleves()
    {
        return $this->belongsToMany(Eleve::class, 'eleves_parents', 'parent_id', 'eleve_id')
            ->withPivot(['role', 'is_primary', 'is_guardian'])
            ->using(ParentEleve::class);
    }

    /**
     * Remplace la liste des enfants du parent en préservant les lignes de
     * filiation déjà enrichies (role, is_primary, is_guardian).
     *
     * Chaque entrée peut être un simple `eleve_id` ou un tableau
     * `{ eleve_id, role, is_primary, is_guardian }`. Un seul parent primaire
     * est possible par élève : les précédents sont rétrogradés.
     *
     * @param array<int|array> $links
     */
    public function setEleves(array $links): void
    {
        $entries = collect($links)
            ->map(function ($link) {
                if (is_numeric($link)) {
                    return ['eleve_id' => (int) $link];
                }
                $link = (array) $link;
                $link['eleve_id'] = (int) ($link['eleve_id'] ?? $link['id'] ?? 0);
                return $link;
            });

        $ids = $entries->pluck('eleve_id')->map(fn ($v) => (int) $v)->all();
        $current = $this->eleves()->pluck('eleves.id')->map(fn ($v) => (int) $v)->all();

        $toRemove = array_values(array_diff($current, $ids));
        if ($toRemove) {
            $this->eleves()->detach($toRemove);
        }

        $toAdd = array_values(array_diff($ids, $current));
        foreach ($entries as $entry) {
            $eleveId = (int) $entry['eleve_id'];
            if (!in_array($eleveId, $toAdd, true)) {
                continue;
            }

            $this->eleves()->attach($eleveId, array_filter([
                'role'        => $entry['role'] ?? null,
                'is_guardian' => isset($entry['is_guardian'])
                    ? (bool) $entry['is_guardian']
                    : null,
            ], fn ($v) => $v !== null));
        }

        foreach ($entries as $entry) {
            $eleveId = (int) $entry['eleve_id'];

            if (in_array($eleveId, $toAdd, true)) {
                if (!empty($entry['is_primary'])) {
                    ParentEleve::setPrimary($eleveId, $this->id);
                }
                continue;
            }

            $data = [];
            if (array_key_exists('role', $entry)) {
                $data['role'] = $entry['role'];
            }
            if (array_key_exists('is_guardian', $entry)) {
                $data['is_guardian'] = (bool) $entry['is_guardian'];
            }
            if ($data !== []) {
                $this->eleves()->updateExistingPivot($eleveId, $data);
            }
            if (!empty($entry['is_primary'])) {
                ParentEleve::setPrimary($eleveId, $this->id);
            }
        }
    }
}
