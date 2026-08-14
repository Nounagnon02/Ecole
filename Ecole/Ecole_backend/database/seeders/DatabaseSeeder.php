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
        // L'ordre compte : les trois premiers créent l'établissement, les comptes
        // et la démographie ; les deux suivants s'appuient dessus.
        //
        // `CompleteDataSeeder` et `UniversiteSeeder` étaient commentés depuis
        // longtemps derrière des `@todo`. Leurs blocages réels n'étaient pas ceux
        // annoncés : le premier référençait quatre modèles au mauvais nom
        // (`Eleves`, `Enseignants`, `Parents`, `Paiement`), le second exécutait un
        // `SET FOREIGN_KEY_CHECKS=0` propre à MySQL. Aucun des deux n'était
        // « à réécrire ». Tant qu'ils dormaient, la moitié des rôles —
        // infirmier, bibliothécaire, surveillant, censeur — et tout le module
        // universitaire n'avaient aucune donnée à afficher.
        //
        // `BulletinDataSeeder` a été supprimé : c'était un sous-ensemble de
        // `DemoDataSeeder`, à ceci près qu'il peuplait `enseignant_matiere`. Cette
        // partie a été reprise dans `DemoDataSeeder::assignTeachers()`, à côté des
        // enseignants et des classes qu'elle référence.
        $this->call([
            BeninEducationSeeder::class,
            AdminUsersSeeder::class,
            DemoDataSeeder::class,
            CompleteDataSeeder::class,
            UniversiteSeeder::class,
        ]);
    }
}
