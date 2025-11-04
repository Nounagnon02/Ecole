<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateAdminUser extends Command
{
    protected $signature = 'user:create {email} {password} {role} {ecole_id} {--nom=Admin} {--prenom=User}';
    protected $description = 'Créer un compte administrateur';

    public function handle()
    {
        $user = User::create([
            'name' => $this->option('nom') . ' ' . $this->option('prenom'),
            'email' => $this->argument('email'),
            'password' => Hash::make($this->argument('password')),
            'role' => $this->argument('role'),
            'ecole_id' => $this->argument('ecole_id'),
        ]);

        $this->info("Utilisateur créé ! ID: {$user->id}, Email: {$user->email}, Rôle: {$user->role}");
        return 0;
    }
}
