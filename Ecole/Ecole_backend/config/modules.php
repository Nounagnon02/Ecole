<?php

/*
|--------------------------------------------------------------------------
| Modules hors plan
|--------------------------------------------------------------------------
|
| Fonctions laissées hors du plan de correction et masquées tant qu'elles ne
| sont pas reprises. Un module coupé n'a ni écran (frontend) ni route d'API.
|
| ia : assistant IA (/api/v1/ia/*). Coupé par défaut : il appelle un
|      fournisseur externe payant et n'a pas été repris dans le plan.
|
*/

return [
    'ia' => (bool) env('MODULE_IA', false),
];
