<?php

namespace App\Console\Commands;

use App\Models\Ecole;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class CreateEcole extends Command
{
    protected $signature = 'ecole:create {nom} {email} {adresse}';
    protected $description = 'Créer une nouvelle école';

    public function handle()
    {
        $ecole = Ecole::create([
            'nom' => $this->argument('nom'),
            'email' => $this->argument('email'),
            'adresse' => $this->argument('adresse'),
            'slug' => Str::slug($this->argument('nom')),
        ]);

        $this->info("École créée ! ID: {$ecole->id}");
        return 0;
    }
}
