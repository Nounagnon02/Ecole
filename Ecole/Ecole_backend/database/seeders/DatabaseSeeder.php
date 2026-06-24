<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->call([
            BeninEducationSeeder::class,
            AdminUsersSeeder::class,
            DemoDataSeeder::class,
            // BulletinDataSeeder::class,  // @todo réécrire pour correspondre au schéma normalisé (users + FK)
            // CompleteDataSeeder::class,  // @todo adapter au schéma des migrations actuelles
            // UniversiteSeeder::class,   // @todo modèles manquants sous App\Models\Universite\
        ]);
    }
}
