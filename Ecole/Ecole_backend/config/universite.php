<?php

/*
|--------------------------------------------------------------------------
| Règles de notation universitaires (système LMD)
|--------------------------------------------------------------------------
|
| Communes aux universités béninoises : notes sur 20, UE validée à 10/20,
| moyenne de semestre pondérée par les crédits des UE.
|
| Propre à chaque établissement : la part de l'examen face au contrôle
| continu (CC et TP), fixée par le règlement pédagogique ou les modalités de
| contrôle de la faculté. 60 % par défaut ; à aligner sur le règlement de
| l'établissement. La compensation entre UE n'est pas calculée ici : elle
| relève de la délibération du jury, et le relevé affiché reste provisoire.
|
*/

return [
    'poids_examen' => (float) env('UNIVERSITE_POIDS_EXAMEN', 0.6),

    'seuil_validation' => 10,
];
