<?php

namespace Database\Seeders;

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
        $password = Str::random(16);

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
                User::firstOrCreate(
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
            }
        }

        $this->command->info('Comptes admin créés pour ' . $ecoles->count() . ' écoles (mot de passe aléatoire généré)');
    }
}
