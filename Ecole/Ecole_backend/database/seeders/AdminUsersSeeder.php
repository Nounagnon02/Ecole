<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Ecole;
use App\Support\Roles;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUsersSeeder extends Seeder
{
    public function run()
    {
        $roles = [
            Roles::ADMIN => "admin'spassword1234567@",
            Roles::DIRECTOR => "director'spassword1234567@",
            Roles::DIRECTOR_KINDERGARTEN => "directorM'spassword1234567@",
            Roles::DIRECTOR_PRIMARY => "directorP'spassword1234567@",
            Roles::DIRECTOR_SECONDARY => "directorS'spassword1234567@",
            Roles::CENSEUR => "censeur'spassword1234567@",
            Roles::SECRETAIRE => "secretaire'spassword1234567@",
            Roles::COMPTABLE => "comptable'spassword1234567@",
            Roles::SURVEILLANT => "surveillant'spassword1234567@",
            Roles::INFIRMIER => "infirmier'spassword1234567@",
            Roles::BIBLIOTHECAIRE => "bibliothecaire'spassword1234567@",
            Roles::TEACHER => "enseignant'spassword1234567@",
        ];

        $ecoles = Ecole::all();

        foreach ($ecoles as $ecole) {
            foreach ($roles as $role => $password) {
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

        $this->command->info('Comptes admin créés pour ' . $ecoles->count() . ' écoles');
    }
}
