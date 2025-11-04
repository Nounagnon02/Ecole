<?php

namespace Database\Seeders;

use App\Models\Ecole;
use Illuminate\Database\Seeder;

class EcoleSeeder extends Seeder
{
    public function run(): void
    {
        Ecole::create([
            'nom' => 'École Primaire Les Palmiers',
            'email' => 'contact@palmiers.edu',
            'adresse' => '123 Avenue de la République',
            'phone' => '+225 01 02 03 04 05',
            'ville' => 'Abidjan',
            'pays' => 'Côte d\'Ivoire',
            'slug' => 'palmiers',
            'status' => 'active'
        ]);

        Ecole::create([
            'nom' => 'Collège Moderne Excellence',
            'email' => 'info@excellence.edu',
            'adresse' => '456 Boulevard Latrille',
            'phone' => '+225 06 07 08 09 10',
            'ville' => 'Bouaké',
            'pays' => 'Côte d\'Ivoire',
            'slug' => 'excellence',
            'status' => 'active'
        ]);
    }
}
