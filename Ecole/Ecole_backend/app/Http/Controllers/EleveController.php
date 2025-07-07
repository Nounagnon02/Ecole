<?php

namespace App\Http\Controllers;

use App\Models\Candidats;
use App\Models\Eleves;
use App\Models\Moyennes;
use App\Models\Notes;
use Illuminate\Http\Request;
use PhpParser\Node\Stmt\Else_;
use Illuminate\Support\Facades\DB;

class EleveController extends Controller
{
    
    public function index(){
        // Récupère les sessions avec leurs matières associées
    $sessions = Eleves::all();

    return response()->json($sessions);
    }
public function getByMatricule($matricule)
{
    $candidat = Eleves::where('numero_matricule', $matricule)->first();
    return response()->json($candidat);
}

    



    public function store(Request $request){
        $request->validate([
            'nom'=>'required|string',
            'prenom'=>'required|string',
            'email'=>'unique:candidats,email',
            'serie'=>'string|required',
            'numero_matricule'=>'string|required'
            
        ]);

        $eleve= Eleves::create($request->all());
        return response()->json($eleve,201);
    }

     // Affiche d'un eleve spécifique
    public function show($id)
    {
        $eleve = Eleves::find($id);

        if (!$eleve) {
            return response()->json(['message' => 'Candidat non trouvé'], 404);
        }

        return response()->json($eleve, 200);
    }

     // Met à jour d'un eleve spécifique
    public function update(Request $request, $id)
    {
        $eleve = Eleves::find($id);

        if (!$eleve) {
            return response()->json(['message' => 'Candidat non trouvé'], 404);
        }

        $validatedData = $request->validate([
            'nom'=>'string|required',
            'prenom'=>'string|required',
            'email'=>'string|required',
            'serie'=>'string|required',
            'numero_matricule'=>'string|required'

        ]);

        $eleve->update($validatedData);

        return response()->json($eleve, 200);
    }

     // Supprime un eleve  spécifique
    public function destroy($id)
    {
        $eleve = Eleves::find($id);

        if (!$eleve) {
            return response()->json(['message' => 'Candidat non trouvé'], 404);
        }

        $eleve->delete();
        return response()->json(['message' => 'Candidat supprimé'], 200);
    }

    //Recuperer les eleves par classe
    public function getElevesByClasse(){
        $eleves = Eleves::with(['classe', 'serie'])
            ->orderBy('classe_id')
            ->get();
        if ($eleves->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun élève trouvé'
            ], 404);
        }else{
            return response()->json([
                'success' => true,
                'data' => $eleves
            ], 200);
        }
    }

    //Recuperer les eleves par classe de la maternelle
    public function getElevesByClasseMaternelle(){
        $eleves = Eleves::with(['classe', 'serie'])
            ->whereHas('classe', function($query) {
                $query->whereIn('nom_classe', [
                    'Maternelle 1', 'Maternelle 2',
                ])->where('categorie_classe', 'maternelle');
            })
            ->orderBy('class_id')
            ->get();
        
        if ($eleves->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun élève de la maternelle trouvé'
            ], 404);
        }else{
            return response()->json([
                'success' => true,
                'data' => $eleves
            ], 200);
        }
    }

    //Recuperer les eleves par classe du primaire
    public function getElevesByClassePrimaire(){
        $eleves = Eleves::with(['classe', 'serie'])
            ->whereHas('classe', function($query) {
                $query->whereIn('nom_classe', [
                    'CI', 'CP', 
                    'CE1', 'CE2',
                    'CM1', 'CM2'
                ]);
            })
            ->orderBy('class_id')
            ->get();
        if ($eleves->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun élève du primaire trouvé'
            ], 404);
        }else{
            return response()->json([
                'success' => true,
                'data' => $eleves
            ], 200);
        }
    }

    //Recuperer les eleves par classe du secondaire
    public function getElevesByClasseSecondaire(){
        $eleves = Eleves::with(['classe', 'serie'])
            ->whereHas('classe', function($query) {
                $query->whereIn('nom_classe', [
                    '6ème', '5ème', 
                    '4ème', '3ème',
                    '2nde', '1ère',
                    'Tle'
                ]);
            })
            ->orderBy('class_id')
            ->get();
        if ($eleves->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun élève du secondaire trouvé'
            ], 404);
        }else{
            return response()->json([   
                'success' => true,
                'data' => $eleves
            ], 200);
        }
    }

    //filtrer les élèves par classe et par série
    public function filterEleves(Request $request){
        $request->validate([
            'classe_id' => 'required|integer',
            'serie_id' => 'required|integer',
        ]);

        try {
            $eleves = Eleves::with(['classe', 'serie'])
                ->where('classe_id', $request->classe_id)
                ->where('serie_id', $request->serie_id)
                ->get();

            if ($eleves->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun élève trouvé pour cette classe et série'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $eleves
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des élèves: ' . $e->getMessage()
            ], 500);
        }
    }
    //Récupérer tous les élèves
    public function getEleves()
    {
        try {
            $eleves = Eleves::all();
            
            return response()->json([
                'success' => true,
                'data' => $eleves
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des élèves: ' . $e->getMessage()
            ], 500);
        }
    }

    //Recuperer les eleves de la maternelle
    public function getElevesMaternelle()
    {
        try {
            // Récupérer les élèves de la maternelle avec leurs relations
            $eleves = Eleves::with(['classe', 'serie'])
                ->whereHas('classe', function($query) {
                    $query->whereIn('nom_classe', [
                        'Maternelle 1', 'Maternelle 2',
                    ])->where('categorie_classe', 'maternelle');
                    
                })
                ->orderBy('class_id')
                ->get();
            
            if ($eleves->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun élève de la maternelle trouvé'
                ], 404);
            }

            // Formatter les données
            $elevesFormated = $eleves->map(function($eleve) {
                return [
                    'id' => $eleve->id,
                    'matricule' => $eleve->numero_matricule,
                    'nom' => $eleve->nom,
                    'prenom' => $eleve->prenom,
                    'classe' =>$eleve->classe->nom_classe, /*[
                        'id' => $eleve->classe->id,
                        'nom' => $eleve->classe->nom_classe
                    ],*/
                    'classe_id' => $eleve->classe->id,  
                    'serie' => $eleve->serie->nom, /*[
                        'id' => $eleve->serie->id,
                        'nom' => $eleve->serie->nom
                    ],*/
                    'serie_id' => $eleve->serie->id,
                    //'date_naissance' => $eleve->date_naissance,
                    //'sexe' => $eleve->sexe,
                    //'email' => $eleve->email,
                    'contact_parent' => $eleve->numero_telephone,
                ];
            });

            // Grouper par classe
            $elevesByClasse = $elevesFormated->groupBy('classe.nom_classe');
                
            return response()->json([
                'success' => true,
                'data' => [
                    'total_eleves' => $eleves->count(),
                    'par_classe' => $elevesByClasse
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des élèves de la maternelle: ' . $e->getMessage()
            ], 500);
        }
    }

    

    //Recuperer les eleves du primaire
    public function getElevesPrimaire()
    {
        try {
            // Récupérer les élèves du primaire avec leurs relations
            $eleves = Eleves::with(['classe', 'serie'])
                ->whereHas('classe', function($query) {
                    $query->whereIn('nom_classe', [
                        'CI', 'CP', 
                        'CE1', 'CE2',
                        'CM1', 'CM2'
                    ]);
                })
                ->orderBy('class_id')
                ->get();
            
            
            if ($eleves->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun élève du primaire trouvé'
                ], 404);
            }

            // Formatter les données
            $elevesFormated = $eleves->map(function($eleve) {
                return [
                    'id' => $eleve->id,
                    'matricule' => $eleve->numero_matricule,
                    'nom' => $eleve->nom,
                    'prenom' => $eleve->prenom,
                    'classe' => [
                        'id' => $eleve->classe->id,
                        'nom' => $eleve->classe->nom_classe
                    ],
                    'serie' => [
                        'id' => $eleve->serie->id,
                        'nom' => $eleve->serie->nom
                    ],
                    //'date_naissance' => $eleve->date_naissance,
                    //'sexe' => $eleve->sexe,
                    //'email' => $eleve->email,
                    'contact_parent' => $eleve->numero_telephone,
                ];
            });

            // Grouper par classe
            $elevesByClasse = $elevesFormated->groupBy('classe.nom_classe');
                
            return response()->json([
                'success' => true,
                'data' => [
                    'total_eleves' => $eleves->count(),
                    'par_classe' => $elevesByClasse
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des élèves du primaire: ' . $e->getMessage()
            ], 500);
        }
    }

    //Recuperer les eleves du secondaire
    public function getElevesSecondaire()
        {
            try {
                // Récupérer les élèves du secondaire avec leurs relations
                $eleves = Eleves::with(['classe', 'serie'])
                    ->whereHas('classe', function($query) {
                        $query->whereIn('nom_classe', [
                            '6ème', '5ème', 
                            '4ème', '3ème',
                            '2nde', '1ère', 
                            'Terminale','Tle'
                        ]);
                    })
                    ->orderBy('class_id')
                    ->get();
                
                if ($eleves->isEmpty()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Aucun élève du secondaire trouvé'
                    ], 404);
                }

                // Formatter les données
                $elevesFormated = $eleves->map(function($eleve) {
                    return [
                        'id' => $eleve->id,
                        'matricule' => $eleve->numero_matricule,
                        'nom' => $eleve->nom,
                        'prenom' => $eleve->prenom,
                        'classe' => [
                            'id' => $eleve->classe->id,
                            'nom' => $eleve->classe->nom_classe
                        ],
                        'serie' => [
                            'id' => $eleve->serie->id,
                            'nom' => $eleve->serie->nom
                        ],
                        //'date_naissance' => $eleve->date_naissance,
                        //'sexe' => $eleve->sexe,
                        //'email' => $eleve->email,
                        'contact_parent' => $eleve->numero_telephone,
                    ];
                });

                // Grouper par classe
                $elevesByClasse = $elevesFormated->groupBy('classe.nom_classe');
                    
                return response()->json([
                    'success' => true,
                    'data' => [
                        'total_eleves' => $eleves->count(),
                        'par_classe' => $elevesByClasse
                    ]
                ], 200);

            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la récupération des élèves du secondaire: ' . $e->getMessage()
                ], 500);
            }
    }
    public function evolutionEffectifsMaternelle()
{
    // Regroupe les élèves du secondaire par mois d'inscription
    $data = DB::table('eleves')
        ->join('Classes', 'eleves.class_id', '=', 'classes.id')
        ->where('categorie_classe','maternelle')
        ->selectRaw("DATE_FORMAT(eleves.created_at, '%M') as name, COUNT(*) as students")
        ->groupBy(DB::raw("DATE_FORMAT(eleves.created_at, '%M')"))
        ->orderBy(DB::raw("MIN(eleves.created_at)"))
        ->get();

    return response()->json($data);
}

    public function evolutionEffectifsPrimaire()
{
    // Regroupe les élèves du secondaire par mois d'inscription
    $data = DB::table('eleves')
        ->join('Classes', 'eleves.class_id', '=', 'classes.id')
        ->where('categorie_classe','primaire')
        ->selectRaw("DATE_FORMAT(eleves.created_at, '%M') as name, COUNT(*) as students")
        ->groupBy(DB::raw("DATE_FORMAT(eleves.created_at, '%M')"))
        ->orderBy(DB::raw("MIN(eleves.created_at)"))
        ->get();

    return response()->json($data);
}

    public function evolutionEffectifsSecondaire()
{
    // Regroupe les élèves du secondaire par mois d'inscription
    $data = DB::table('eleves')
        ->join('Classes', 'eleves.class_id', '=', 'classes.id')
        ->where('categorie_classe','secondaire')
        ->selectRaw("DATE_FORMAT(eleves.created_at, '%M') as name, COUNT(*) as students")
        ->groupBy(DB::raw("DATE_FORMAT(eleves.created_at, '%M')"))
        ->orderBy(DB::raw("MIN(eleves.created_at)"))
        ->get();

    return response()->json($data);
}
    public function evolutionEffectifs()
{
    // Regroupe les élèves du secondaire par mois d'inscription
    $data = DB::table('eleves')
        ->join('Classes', 'eleves.class_id', '=', 'classes.id')
        ->selectRaw("DATE_FORMAT(eleves.created_at, '%M') as name, COUNT(*) as students")
        ->groupBy(DB::raw("DATE_FORMAT(eleves.created_at, '%M')"))
        ->orderBy(DB::raw("MIN(eleves.created_at)"))
        ->get();

    return response()->json($data);
}

}