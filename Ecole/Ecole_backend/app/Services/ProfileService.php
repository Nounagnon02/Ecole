<?php

namespace App\Services;

use App\Models\User;
use App\Support\Roles;

/**
 * Profil utilisateur : sa forme publique, et sa mise à jour.
 *
 * Extrait d'`AuthController`, qui portait la connexion, la session, le
 * profil et l'inscription dans un même fichier de 525 lignes sans service
 * (cf. audit P4.4). Comportement inchangé — même payload, mêmes règles de
 * synchronisation — seul l'emplacement change.
 */
class ProfileService
{
    /**
     * Payload profil : champs du compte + données métier selon le rôle.
     *
     * Les champs de base sont partagés par toutes les surfaces. Pour un
     * enseignant (scolaire), on embarque aussi son profil `enseignants`
     * (spécialité, grade) et ses données de profil étendues — expériences et
     * matières maîtrisées (cf. audit F3).
     */
    public function payload(User $user): array
    {
        $payload = $user->only([
            'id', 'name', 'prenom', 'email', 'identifiant',
            'role', 'ecole_id', 'telephone', 'avatar', 'is_active',
            'email_verified_at', 'created_at', 'updated_at',
            // Le frontend n'avait aucun moyen de savoir si la 2FA d'un
            // compte est déjà active (le secret, lui, reste `$hidden` sur le
            // modèle) : sans ce champ, l'écran d'activation ne peut pas
            // afficher « activer » ou « désactiver » à bon escient.
            'two_factor_enabled',
        ]);

        if ($this->isTeacher($user)) {
            $enseignant = $user->enseignant;
            $payload['profil'] = $enseignant
                ? [
                    'id' => $enseignant->id,
                    'specialite' => $enseignant->specialite,
                    'grade' => $enseignant->grade,
                    'date_naissance' => $enseignant->date_naissance,
                    'lieu_naissance' => $enseignant->lieu_naissance,
                    'sexe' => $enseignant->sexe,
                    'experiences' => $enseignant->experiences()->orderByDesc('date_debut')->get([
                        'id', 'poste', 'etablissement', 'date_debut', 'date_fin', 'description',
                    ]),
                    'matieres_maitrisees' => $enseignant->matieresMaitrisees()
                        ->orderBy('matieres.nom')
                        ->get(['matieres.id', 'matieres.nom']),
                ]
                : null;
        }

        return $payload;
    }

    /**
     * Applique les champs communs, puis synchronise le profil enseignant si
     * le rôle s'y prête.
     */
    public function update(User $user, array $validated): void
    {
        $user->update(collect($validated)->only([
            'name', 'prenom', 'email', 'telephone', 'avatar',
        ])->all());

        if ($this->isTeacher($user)) {
            $this->syncTeacherProfile($user, $validated);
        }
    }

    private function isTeacher(User $user): bool
    {
        return $user->role === Roles::TEACHER || str_contains($user->role, 'enseignement');
    }

    /**
     * Synchronise le profil professionnel de l'enseignant :
     * champs de la ligne `enseignants`, expériences et matières maîtrisées.
     */
    private function syncTeacherProfile(User $user, array $validated): void
    {
        $enseignant = $user->enseignant;

        if (!$enseignant) {
            return;
        }

        if (array_key_exists('specialite', $validated) || array_key_exists('grade', $validated)) {
            $enseignant->update(collect($validated)->only(['specialite', 'grade'])->all());
        }

        // Les expériences sont remplacées en bloc : le front envoie la liste
        // complète. Une entrée portant un `id` existant est mise à jour, une
        // entrée sans `id` est créée, et toute expérience persistée absente de
        // la liste est supprimée.
        if (array_key_exists('experiences', $validated)) {
            $sentIds = [];

            foreach ($validated['experiences'] as $row) {
                if (($row['id'] ?? null) !== null) {
                    $sentIds[] = (int) $row['id'];
                    $enseignant->experiences()->whereKey($row['id'])->update([
                        'poste' => $row['poste'],
                        'etablissement' => $row['etablissement'] ?? null,
                        'date_debut' => $row['date_debut'],
                        'date_fin' => $row['date_fin'] ?? null,
                        'description' => $row['description'] ?? null,
                    ]);
                } else {
                    $experience = $enseignant->experiences()->create([
                        'poste' => $row['poste'],
                        'etablissement' => $row['etablissement'] ?? null,
                        'date_debut' => $row['date_debut'],
                        'date_fin' => $row['date_fin'] ?? null,
                        'description' => $row['description'] ?? null,
                    ]);
                    $sentIds[] = (int) $experience->id;
                }
            }

            $enseignant->experiences()
                ->whereNotIn('id', $sentIds ?: [0])
                ->delete();
        }

        if (array_key_exists('matieres_maitrisees', $validated)) {
            $enseignant->matieresMaitrisees()->sync($validated['matieres_maitrisees'] ?? []);
        }
    }
}
