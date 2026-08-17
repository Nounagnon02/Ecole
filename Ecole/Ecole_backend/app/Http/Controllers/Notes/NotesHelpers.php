<?php

namespace App\Http\Controllers\Notes;

use App\Models\Notes;
use App\Models\Eleve;
use App\Support\Roles;
use Illuminate\Http\Request;

trait NotesHelpers
{
    private function getCoefficientBySerieAndMatiere($serie, $nomMatiere)
    {
        $coefficients = [
            'Série A' => [
                'Maths' => 4,
                'PCT' => 3,
                'SVT' => 2,
                'Hist-Géo' => 2,
                'Anglais' => 2,
                'Français' => 2,
            ],
            'Série B' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série C' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série D' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série E' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série F' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série MC' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série ML' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
        ];

        return $coefficients[$serie][$nomMatiere] ?? 1;
    }

    /**
     * Validation spécifique selon le type d'évaluation
     */
    private function validateNoteByType(Request $request, $excludeNoteId = null)
    {
        $query = Notes::where('eleve_id', $request->eleve_id)
                    ->where('matiere_id', $request->matiere_id)
                    ->where('type_evaluation', $request->type_evaluation)
                    ->where('periode', $request->periode);

        if ($excludeNoteId) {
            $query->where('id', '!=', $excludeNoteId);
        }

        $count = $query->count();
        $limite = $request->type_evaluation === 'Interrogation' ? 4 : 1;

        if ($count >= $limite) {
            $label = $request->type_evaluation === 'Interrogation'
                ? 'plus de 4 notes d\'interrogation'
                : "plus d'une note de {$request->type_evaluation}";
            return ['success' => false, 'message' => "Un élève ne peut avoir {$label} par matière et par période"];
        }

        return ['success' => true];
    }

    private function findEleve($identifier, $classeId)
    {
        // Recherche par nom complet, prénom, nom ou numéro
        // La clé de classe est `classe_id`, et nom/prénom vivent sur `users` —
        // d'où la recherche via la relation plutôt que sur `eleves`.
        return Eleve::where('classe_id', $classeId)
            ->where(function ($query) use ($identifier) {
                $query->where('numero_matricule', $identifier)
                    ->orWhereHas('user', function ($u) use ($identifier) {
                        $u->where('name', 'LIKE', "%{$identifier}%")
                            ->orWhere('prenom', 'LIKE', "%{$identifier}%")
                            ->orWhereRaw("CONCAT(prenom, ' ', name) LIKE ?", ["%{$identifier}%"])
                            ->orWhereRaw("CONCAT(name, ' ', prenom) LIKE ?", ["%{$identifier}%"]);
                    });
            })
            ->first();
    }

    /**
     * Narrow a grades query to what the caller is allowed to read.
     *
     * Whitelist, so an unexpected role gets nothing rather than everything.
     */
    private function restrictToCallerScope($query): void
    {
        $user = auth()->user();
        $staff = Roles::expand([
            Roles::DIRECTOR, Roles::TEACHER, 'censeur', 'secretaire', Roles::SUPER_ADMIN,
        ]);

        if (in_array($user?->role, $staff, true)) {
            return; // périmètre de l'école, déjà borné par le scope tenant
        }

        if ($user?->role === 'eleve' && $user->eleve) {
            $query->where('eleve_id', $user->eleve->id);

            return;
        }

        if ($user?->role === 'parent' && $user->parent) {
            $query->whereIn('eleve_id', $user->parent->eleves()->pluck('eleves.id'));

            return;
        }

        $query->whereRaw('1 = 0');
    }
}
