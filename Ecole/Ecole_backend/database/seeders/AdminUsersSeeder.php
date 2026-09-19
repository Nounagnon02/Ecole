<?php

namespace Database\Seeders;

use App\Models\Enseignant;
use App\Models\User;
use App\Models\Ecole;
use App\Support\Roles;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class AdminUsersSeeder extends Seeder
{
    public function run()
    {
        $password = 'password';

        $roles = [
            Roles::ADMIN,
            Roles::DIRECTOR,
            Roles::DIRECTOR_KINDERGARTEN,
            Roles::DIRECTOR_PRIMARY,
            Roles::DIRECTOR_SECONDARY,
            Roles::CENSEUR,
            Roles::SECRETAIRE,
            Roles::COMPTABLE,
            Roles::SURVEILLANT,
            Roles::INFIRMIER,
            Roles::BIBLIOTHECAIRE,
            Roles::TEACHER,
        ];

        $ecoles = Ecole::all();

        foreach ($ecoles as $ecole) {
            foreach ($roles as $role) {
                $user = User::firstOrCreate(
                    ['identifiant' => $role . '_ecole' . $ecole->id],
                    [
                        'name'        => ucfirst($role) . ' ' . $ecole->nom,
                        'prenom'      => ucfirst($role),
                        'email'       => $role . 'ecole' . $ecole->id . '@gmail.cj',
                        'password'    => Hash::make($password),
                        'role'        => $role,
                        'ecole_id'    => $ecole->id,
                        'is_active'   => true,
                    ]
                );

                // `role` seul ne donne pas de profil : les endpoints « espace
                // enseignant » (EnseignantController::notes/classes, …) lisent
                // $user->enseignant et répondent 404 en son absence. Le compte
                // de démonstration `enseignant_ecole{id}` n'avait donc jamais
                // accès à son propre espace. `withoutGlobalScope('ecole')` :
                // sans contexte authentifié, le scope de BelongsToEcole
                // résoudrait `null` et referait un nouveau profil à chaque
                // exécution du seeder.
                if ($role === Roles::TEACHER) {
                    Enseignant::withoutGlobalScope('ecole')->firstOrCreate(
                        ['user_id' => $user->id],
                        ['ecole_id' => $ecole->id]
                    );
                }
            }
        }

        $this->command->info('Comptes admin créés pour ' . $ecoles->count() . ' écoles (mot de passe aléatoire généré)');
    }
}
