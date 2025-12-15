<?php

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Ce fichier charge les routes API de manière modulaire pour une meilleure
| organisation et maintenabilité du code.
|
| Structure des routes :
| - auth.php      : Authentification et profil utilisateur
| - dashboard.php : Tableaux de bord consolidés
| - academic.php  : Classes, matières, séries, élèves, notes
| - users.php     : Enseignants, parents, personnel
| - services.php  : Paiements, messagerie, contributions
| - universite.php: Module universitaire
|
*/

// Charger les routes modulaires
require __DIR__.'/api/auth.php';
require __DIR__.'/api/dashboard.php';
require __DIR__.'/api/academic.php';
require __DIR__.'/api/users.php';
require __DIR__.'/api/services.php';
require __DIR__.'/api/universite.php';
