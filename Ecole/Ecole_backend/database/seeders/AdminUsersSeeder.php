<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Ecole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUsersSeeder extends Seeder
{
    public function run()
    {
        $roles = [
            'directeur' => "director'spassword1234567@",
            'directeurM' => "directorM'spassword1234567@",
            'directeurP' => "directorP'spassword1234567@",
            'directeurS' => "directorS'spassword1234567@",
            'censeur' => "censeur'spassword1234567@",
            'secretaire' => "secretaire'spassword1234567@",
            'comptable' => "comptable'spassword1234567@",
            'surveillant' => "surveillant'spassword1234567@",
        ];

        $ecoles = Ecole::all();

        foreach ($ecoles as $ecole) {
            foreach ($roles as $role => $password) {
                User::create([
                    'name' => ucfirst($role) . ' ' . $ecole->nom,
                    'email' => $role . 'ecole' . $ecole->id . '@gmail.cj',
                    'password' => Hash::make($password),
                    'role' => $role,
                    'ecole_id' => $ecole->id,
                ]);
            }
        }

        $this->command->info('Comptes admin créés pour ' . $ecoles->count() . ' écoles');
    }
}
