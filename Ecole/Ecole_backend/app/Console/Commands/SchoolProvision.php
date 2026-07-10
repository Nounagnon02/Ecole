<?php

namespace App\Console\Commands;

use App\Models\Ecole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SchoolProvision extends Command
{
    protected $signature = 'school:provision
        {nom : Nom de l\'établissement}
        {email : Email de contact de l\'école}
        {adresse : Adresse physique}
        {--password= : Mot de passe commun pour tous les comptes (défaut: password1234)}
        {--prefix= : Préfixe pour les emails des comptes (défaut: slug de l\'école)}
        {--no-seed : Ne pas créer les comptes utilisateurs}';

    protected $description = 'Provisionner une école complète avec tous ses comptes utilisateurs';

    public function handle()
    {
        // ─── 1. Créer l'école ─────────────────────────────────────────
        $slug = Str::slug($this->argument('nom'));
        $prefix = $this->option('prefix') ?? $slug;

        $ecole = Ecole::create([
            'nom'     => $this->argument('nom'),
            'email'   => $this->argument('email'),
            'adresse' => $this->argument('adresse'),
            'slug'    => $slug,
            'status'  => 'active',
        ]);

        $this->info("✅ École créée : {$ecole->nom} (ID: {$ecole->id})");
        $this->newLine();

        if ($this->option('no-seed')) {
            $this->info("Commande --no-seed détectée, aucun compte utilisateur créé.");
            return 0;
        }

        // ─── 2. Créer les comptes utilisateurs ────────────────────────
        $password = $this->option('password') ?? 'password1234';
        $comptes = [
            ['role' => 'directeur',    'label' => 'Directeur Général'],
            ['role' => 'directeurM',   'label' => 'Directeur Maternelle'],
            ['role' => 'directeurP',   'label' => 'Directeur Primaire'],
            ['role' => 'directeurS',   'label' => 'Directeur Secondaire'],
            ['role' => 'censeur',      'label' => 'Censeur'],
            ['role' => 'secretaire',   'label' => 'Secrétaire'],
            ['role' => 'comptable',    'label' => 'Comptable'],
            ['role' => 'surveillant',  'label' => 'Surveillant'],
            ['role' => 'infirmier',    'label' => 'Infirmier'],
            ['role' => 'bibliothecaire', 'label' => 'Bibliothécaire'],
        ];

        $created = [];
        foreach ($comptes as $c) {
            $user = User::create([
                'name'        => $c['label'] . ' - ' . $ecole->nom,
                'prenom'      => $c['label'],
                'email'       => "{$c['role']}.{$prefix}@ecole.bj",
                'identifiant' => "{$c['role']}_{$prefix}",
                'password'    => Hash::make($password),
                'role'        => $c['role'],
                'ecole_id'    => $ecole->id,
                'is_active'   => true,
            ]);
            $created[] = [
                'Rôle'      => $c['label'],
                'Email'     => $user->email,
                'Identifiant' => $user->identifiant,
            ];
        }

        // ─── 3. Afficher le récapitulatif ─────────────────────────────
        $this->info("✅ {$ecole->nom} — {$ecole->email}");
        $this->info("   Adresse : {$ecole->adresse}");
        $this->newLine();

        $this->table(
            ['Rôle', 'Email', 'Identifiant'],
            $created
        );

        $this->newLine();
        $this->info("🔑 Mot de passe commun : {$password}");
        $this->warn("   Changez les mots de passe après la première connexion.");
        $this->newLine();
        $this->info("🌐 URL de connexion : http://localhost:3000/connexion");

        return 0;
    }
}
