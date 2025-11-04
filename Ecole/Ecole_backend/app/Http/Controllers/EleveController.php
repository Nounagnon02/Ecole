<?php

namespace App\Http\Controllers;

use App\Models\{Devoir, EmploiDuTemps};
use App\Services\BulletinService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Eleve;
use App\Models\Classes;

class EleveController extends Controller
{
    protected $bulletinService;

    public function __construct(BulletinService $bulletinService)
    {
        $this->bulletinService = $bulletinService;
    }

    public function bulletin($periode)
    {
        $eleveId = auth()->id();
        $eleve = auth()->user();
        
        if ($eleve->classe->categorie_classe === 'secondaire') {
            return $this->bulletinService->bulletinSecondaire($eleveId, $periode);
        } else {
            return $this->bulletinService->bulletinMaternellePrimaire($eleveId, $periode);
        }
    }

    public function devoirs()
    {
        $eleve = auth()->user();
        $devoirs = Devoir::where('classe_id', $eleve->classe_id)
            ->with(['matiere', 'enseignant'])
            ->latest()
            ->get()
            ->map(function ($devoir) {
                return [
                    'id' => $devoir->id,
                    'titre' => $devoir->titre,
                    'description' => $devoir->description,
                    'matiere' => $devoir->matiere->nom,
                    'date_limite' => $devoir->date_limite,
                    'rendu' => false
                ];
            });
        
        return response()->json($devoirs);
    }

    public function emploiDuTemps()
    {
        $eleve = auth()->user();
        $emploi = EmploiDuTemps::where('classe_id', $eleve->classe_id)
            ->with(['matiere', 'enseignant'])
            ->get()
            ->map(function ($cours) {
                return [
                    'id' => $cours->id,
                    'jour' => $cours->jour,
                    'heure_debut' => $cours->heure_debut,
                    'heure_fin' => $cours->heure_fin,
                    'matiere' => $cours->matiere->nom,
                    'enseignant' => $cours->enseignant->nom . ' ' . $cours->enseignant->prenom,
                    'salle' => $cours->salle
                ];
            });
        
        return response()->json($emploi);
    }
    
    public function index(){
            // Récupère les sessions avec leurs matières associées
        $sessions = Eleve::all();

        //verifier si la collection est vide , si oui retourner un tableau vide
        if ($sessions->isEmpty()) {
            return response()->json([]);
        }


        return response()->json($sessions);
        }
    public function getByMatricule($matricule)
    {
        $candidat = Eleve::where('numero_matricule', $matricule)->first();
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

            $eleve= Eleve::create($request->all());
            return response()->json($eleve,201);
    }

        // Affiche d'un eleve spécifique
        public function show($id)
        {
            $eleve = Eleve::find($id);

            if (!$eleve) {
                return response()->json(['message' => 'Candidat non trouvé'], 404);
            }

            return response()->json($eleve, 200);
        }

        // Met à jour d'un eleve spécifique
        public function update(Request $request, $id)
        {
            $eleve = Eleve::find($id);

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
            $eleve = Eleve::find($id);

            if (!$eleve) {
                return response()->json(['message' => 'Candidat non trouvé'], 404);
            }

            $eleve->delete();
            return response()->json(['message' => 'Candidat supprimé'], 200);
        }

        //Recuperer les Eleve par classe
        public function getEleveByClasse(){
            $Eleve = Eleve::with(['classe', 'serie'])
                ->orderBy('class_id')
                ->get();
            if ($Eleve->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun élève trouvé'
                ], 404);
            }else{
                return response()->json([
                    'success' => true,
                    'data' => $Eleve
                ], 200);
            }
        }

        //Recuperer les Eleve par classe de la maternelle
        public function getElevesByClasseMaternelle(){
            $Eleve = Eleve::with(['classe', 'serie'])
                ->whereHas('classe', function($query) {
                    $query->where('categorie_classe', 'maternelle');
                })
                ->orderBy('class_id')
                ->get();
            
            // Vérifier si la collection est vide et retourner un tableau vide si c'est le cas
            if ($Eleve->isEmpty()) {
            return response()->json([]);
        
            }else{
                return response()->json([
                    'success' => true,
                    'data' => $Eleve
                ], 200);
            }
        }

        //Recuperer les Eleve par classe du primaire
        public function getElevesByClassePrimaire(){
            $Eleve = Eleve::with(['classe', 'serie'])
                ->whereHas('classe', function($query) {
                    $query->where('categorie_classe', 'primaire');
                })
                ->orderBy('class_id')
                ->get();
            if ($Eleve->isEmpty()) {
            return response()->json([]);
        
            }else{
                return response()->json([
                    'success' => true,
                    'data' => $Eleve
                ], 200);
            }
        }

        //Recuperer les Eleve par classe du secondaire
        public function getElevesByClasseSecondaire(){
            $Eleve = Eleve::with(['classe'])
                ->whereHas('classe', function($query) {
                    $query->where('categorie_classe', 'secondaire');
                })
                ->orderBy('class_id')
                ->get();
            if ($Eleve->isEmpty()) {
            return response()->json([]);
        
            }else{
                return response()->json([   
                    'success' => true,
                    'data' => $Eleve
                ], 200);
            }
        }

        //filtrer les élèves par classe et par série
        public function filterEleve(Request $request){
            $request->validate([
                'classe_id' => 'required|integer',
                'serie_id' => 'required|integer',
            ]);

            try {
                $Eleve = Eleve::with(['classe', 'serie'])
                    ->where('classe_id', $request->classe_id)
                    ->where('serie_id', $request->serie_id)
                    ->get();

                if ($Eleve->isEmpty()) {
                    return response()->json([]);
            
                }

                return response()->json([
                    'success' => true,
                    'data' => $Eleve
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
                $Eleve = Eleve::all();
                
                return response()->json([
                    'success' => true,
                    'data' => $Eleve
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la récupération des élèves: ' . $e->getMessage()
                ], 500);
            }
        }

        //Recuperer les Eleve de la maternelle
        public function getElevesMaternelle()
        {
            try {
                // Récupérer les élèves de la maternelle avec leurs relations
                $Eleve = Eleve::with(['classe'])
                    ->whereHas('classe', function($query) {
                        $query->whereIn('nom_classe', [
                            'Maternelle 1', 'Maternelle 2',
                        ])->where('categorie_classe', 'maternelle');
                        
                    })
                    ->orderBy('class_id')
                    ->get();
                
                if ($Eleve->isEmpty()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Aucun élève de la maternelle trouvé'
                    ], 404);
                }

                // Formatter les données
                $EleveFormated = $Eleve->map(function($eleve) {
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
                $EleveByClasse = $EleveFormated->groupBy('classe.nom_classe');
                    
                return response()->json([
                    'success' => true,
                    'data' => [
                        'total_Eleve' => $Eleve->count(),
                        'par_classe' => $EleveByClasse
                    ]
                ], 200);

            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la récupération des élèves de la maternelle: ' . $e->getMessage()
                ], 500);
            }
        }

        

        //Recuperer les Eleve du primaire
        public function getElevesPrimaire()
        {
            try {
                // Récupérer les élèves du primaire avec leurs relations
                $Eleve = Eleve::with(['classe'])
                    ->whereHas('classe', function($query) {
                        $query->whereIn('nom_classe', [
                            'CI', 'CP', 
                            'CE1', 'CE2',
                            'CM1', 'CM2'
                        ]);
                    })
                    ->orderBy('class_id')
                    ->get();
                
                
                if ($Eleve->isEmpty()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Aucun élève du primaire trouvé'
                    ], 404);
                }

                // Formatter les données
                $EleveFormated = $Eleve->map(function($eleve) {
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
                $EleveByClasse = $EleveFormated->groupBy('classe.nom_classe');
                    
                return response()->json([
                    'success' => true,
                    'data' => [
                        'total_Eleve' => $Eleve->count(),
                        'par_classe' => $EleveByClasse
                    ]
                ], 200);

            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la récupération des élèves du primaire: ' . $e->getMessage()
                ], 500);
            }
        }

        //Recuperer les Eleve du secondaire

        public function getElevesSecondaire()
            {
                try {
                    // Récupérer les élèves du secondaire avec leurs relations
                    $Eleve = Eleve::with(['classe'])
                        ->whereHas('classe', function($query) {
                            $query->where('categorie_classe', 'secondaire')->orWhereIn('nom_classe', [
                                '6ème', '5ème', 
                                '4ème', '3ème',
                                '2nde', '1ère', 
                                'Terminale','Tle','Terminale A',
                            ]);
                        })
                        ->orderBy('class_id')
                        ->get();
                    
                    if ($Eleve->isEmpty()) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Aucun élève du secondaire trouvé'
                        ], 404);
                    }

                    // Formatter les données
                    $EleveFormated = $Eleve->map(function($eleve) {
                        return [
                            'id' => $eleve->id,
                            'matricule' => $eleve->numero_matricule,
                            'nom' => $eleve->nom,
                            'prenom' => $eleve->prenom,
                            'classe' => [
                                'id' => $eleve->classe->id,
                                'nom' => $eleve->classe->nom_classe
                            ],
                            /*'serie' => [
                                'id' => $eleve->serie->id,
                                'nom' => $eleve->serie->nom
                            ],*/
                            //'date_naissance' => $eleve->date_naissance,
                            //'sexe' => $eleve->sexe,
                            //'email' => $eleve->email,
                            'contact_parent' => $eleve->numero_telephone,
                        ];
                    });

                    // Grouper par classe
                    $EleveByClasse = $EleveFormated->groupBy('classe.nom_classe');
                        
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'total_Eleve' => $Eleve->count(),
                            'par_classe' => $EleveByClasse
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
        $ecoleId = session('ecole_id');
        $data = DB::table('eleves')
            ->join('classes', 'eleves.class_id', '=', 'classes.id')
            ->where('eleves.ecole_id', $ecoleId)
            ->where('categorie_classe','maternelle')
            ->selectRaw("DATE_FORMAT(eleves.created_at, '%M') as name, COUNT(*) as students")
            ->groupBy(DB::raw("DATE_FORMAT(eleves.created_at, '%M')"))
            ->orderBy(DB::raw("MIN(eleves.created_at)"))
            ->get();

        return response()->json($data);
    }

        public function evolutionEffectifsPrimaire()
    {
        $ecoleId = session('ecole_id');
        $data = DB::table('eleves')
            ->join('classes', 'eleves.class_id', '=', 'classes.id')
            ->where('eleves.ecole_id', $ecoleId)
            ->where('categorie_classe','primaire')
            ->selectRaw("DATE_FORMAT(eleves.created_at, '%M') as name, COUNT(*) as students")
            ->groupBy(DB::raw("DATE_FORMAT(eleves.created_at, '%M')"))
            ->orderBy(DB::raw("MIN(eleves.created_at)"))
            ->get();

        return response()->json($data);
    }

        public function evolutionEffectifsSecondaire()
    {
        $ecoleId = session('ecole_id');
        $data = DB::table('eleves')
            ->join('classes', 'eleves.class_id', '=', 'classes.id')
            ->where('eleves.ecole_id', $ecoleId)
            ->where('categorie_classe','secondaire')
            ->selectRaw("DATE_FORMAT(eleves.created_at, '%M') as name, COUNT(*) as students")
            ->groupBy(DB::raw("DATE_FORMAT(eleves.created_at, '%M')"))
            ->orderBy(DB::raw("MIN(eleves.created_at)"))
            ->get();

        return response()->json($data);
    }

    public function evolutionEffectifs()
    {
        $ecoleId = session('ecole_id');
        $data = DB::table('eleves')
            ->join('classes', 'eleves.class_id', '=', 'classes.id')
            ->where('eleves.ecole_id', $ecoleId)
            ->selectRaw("DATE_FORMAT(eleves.created_at, '%M') as name, COUNT(*) as students")
            ->groupBy(DB::raw("DATE_FORMAT(eleves.created_at, '%M')"))
            ->orderBy(DB::raw("MIN(eleves.created_at)"))
            ->get();

        return response()->json($data);
    }
}