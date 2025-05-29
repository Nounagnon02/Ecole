<?php

namespace App\Http\Controllers;

use Illuminate\Auth\Events\Registered;
use App\Models\Eleves;
use App\Models\Enseignants;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;




class AuthController extends Controller
{
    



protected function getRedirectRouteBasedOnRole($role)
{
    switch ($role) {
        case 'eleve':
            return '/dashboard-eleve';
        case 'directeur':
            return '/dashboard-admin';
        case 'enseignant':
            return '/dashboard-enseignant';
        
        case 'enseignantP':
            return '/dashboard-enseignantP';
        
        case 'enseignantM':
            return '/dashboard-enseignantM';
        
        case 'comptable':
            return '/dashboard-comptable';
        
        
        case 'censeur':
            return '/dashboard-censeur';
        
        case 'surveillant':
            return '/dashboard-surveillant';
        
        case 'secretaire':
            return '/dashboard-secretaire';
        
        default:
            return '/';
    }
}



public function inscription(Request $request)
{
    try {
        if ($request->role === 'eleve') {
            $validated = $request->validate([
                'role' => 'required|in:eleve',
                'nom' => 'required|string',
                'prenom' => 'required|string',
                'numero_de_telephone' => 'required|string',
                'identifiant' => 'required|unique:eleves,identifiant',
                'password1' => 'required|string|min:8',
                'classe' => 'required|string', // nom de la classe
                'serie' => 'required|string',  // nom de la série
                'numero_matricule' => 'required|string|unique:eleves',
            ]);

            // Chercher l'id de la classe et de la série
            $classe = \App\Models\Classes::where('nom_classe', $validated['classe'])->first();
            $serie = \App\Models\Series::where('nom', $validated['serie'])->first();

            if (!$classe || !$serie) {
                return response()->json(['message' => 'Classe ou série invalide'], 422);
            }

            $eleve = Eleves::create([
                'role' => $validated['role'],
                'nom_de_eleve' => $validated['nom'],
                'prenoms_eleve' => $validated['prenom'],
                'numero_de_telephone' => $validated['numero_de_telephone'],
                'identifiant' => $validated['identifiant'],
                'password1' => bcrypt($validated['password1']),
                'class_id' => $classe->id,
                'serie_id' => $serie->id,
                'numero_matricule' => $validated['numero_matricule'],
            ]);

            event(new Registered($eleve));
            Auth::login($eleve);
            return response()->json($eleve, 201);

        } elseif ($request->role === 'enseignement') {
            $validated = $request->validate([
                'role' => 'required|in:enseignement',
                'nom' => 'required|string',
                'prenom' => 'required|string',
                'email' => 'required|email|unique:enseignants,email',
                'numero_de_telephone' => 'required|string',
                'identifiant' => 'required|unique:enseignants,identifiant',
                'matiere' => 'required|string', // nom de la matière
                'classe' => 'required|string', // nom de la classe
                'password1' => 'required|string|min:8',
            ]);

            $classe = \App\Models\Classes::where('nom', $validated['classe'])->first();
            $matiere = \App\Models\Matieres::where('nom', $validated['matiere'])->first();

            if (!$classe || !$matiere) {
                return response()->json(['message' => 'Classe ou matière invalide'], 422);
            }

            $enseignant = Enseignants::create([
                'role' => $validated['role'],
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'email' => $validated['email'],
                'numero_de_telephone' => $validated['numero_de_telephone'],
                'identifiant' => $validated['identifiant'],
                'matiere_id' => $matiere->id,
                'class_id' => $classe->id,
                'password1' => bcrypt($validated['password1']),
            ]);

            event(new Registered($enseignant));
            Auth::login($enseignant);
            return response()->json($enseignant, 201);

        } elseif ($request->role === "enseignementM") {
            $validated = $request->validate([
                'role' => 'required|in:enseignementM',
                'nom' => 'required|string',
                'prenom' => 'required|string',
                'email' => 'required|email|unique:enseignants_M_P,email',
                'numero_de_telephone' => 'required|string',
                'identifiant' => 'required|unique:enseignants_M_P,identifiant',
                'classe' => 'required|string', // nom de la classe
                'password1' => 'required|string|min:8',
            ]);

            $classe = \App\Models\Classes::where('nom_classe', $validated['classe'])->first();

            if (!$classe) {
                return response()->json(['message' => 'Classe invalide'], 422);
            }

            $enseignant = \App\Models\Enseignants_Martenel_Primaire::create([
                'role' => $validated['role'],
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'email' => $validated['email'],
                'numero_de_telephone' => $validated['numero_de_telephone'],
                'identifiant' => $validated['identifiant'],
                'class_id' => $classe->id,
                'password1' => bcrypt($validated['password1']),
            ]);

            event(new Registered($enseignant));
            Auth::login($enseignant);
            return response()->json($enseignant, 201);

        } elseif ($request->role ===  "enseignementP" ) {
            $validated = $request->validate([
                'role' => 'required|in:enseignementP',
                'nom' => 'required|string',
                'prenom' => 'required|string',
                'email' => 'required|email|unique:enseignants_M_P,email',
                'numero_de_telephone' => 'required|string',
                'identifiant' => 'required|unique:enseignants_M_P,identifiant',
                'classe' => 'required|string', // nom de la classe
                'password1' => 'required|string|min:8',
            ]);

            $classe = \App\Models\Classes::where('nom_classe', $validated['classe'])->first();

            if (!$classe) {
                return response()->json(['message' => 'Classe invalide'], 422);
            }

            $enseignant = \App\Models\Enseignants_Martenel_Primaire::create([
                'role' => $validated['role'],
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'email' => $validated['email'],
                'numero_de_telephone' => $validated['numero_de_telephone'],
                'identifiant' => $validated['identifiant'],
                'class_id' => $classe->id,
                'password1' => bcrypt($validated['password1']),
            ]);

            event(new Registered($enseignant));
            Auth::login($enseignant);
            return response()->json($enseignant, 201);
        }

        return response()->json(['message' => 'Rôle non reconnu'], 400);

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'message' => 'Validation error',
            'errors' => $e->errors()
        ], 422);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Erreur lors de l\'ajout',
            'error' => $e->getMessage()
        ], 500);
    }
}
public function connexion (Request $request){
        $request->validate([
            'identifiant' => 'required',
            'password' => 'required',
        ]); 


        $identifiant = $request->identifiant;
        $eleve = Eleves::where('identifiant', $identifiant)->first();
        $utilisateur = null;

        if($request->identifiant === "directeurecoleA@gmail.cj" && $request->password === "director'spassword1234567@"){
            return response()->json([
                'role'=>'directeur',
                
                'redirect_to' => $this->getRedirectRouteBasedOnRole('directeur')
            ]);
        }elseif ($eleve && Hash::check($request->password, $eleve->password1 )){
            $token = $eleve->createToken('api-token')->plainTextToken;

            return response()->json([
                'user' => $eleve,
                'token' => $token,
                'redirect_to' => $this->getRedirectRouteBasedOnRole($eleve->role)
            ]);
        }elseif ($request->identifiant === "censeurecoleA@gmail.cj" && $request->password === "censeur'spassword1234567@"){
            return response()->json([
                'role'=>'censeur',
                'redirect_to' => $this->getRedirectRouteBasedOnRole('censeur')
            ]);
        }elseif ($request->identifiant === "secretaireecoleA@gmail.cj" && $request->password === "secretaire'spassword1234567@"){
            return response()->json([
                'role'=>'secretaire',
                'redirect_to' => $this->getRedirectRouteBasedOnRole('secretaire')
            ]);
        }elseif ($request->identifiant === "comptablecoleA@gmail.cj" && $request->password === "comptable'spassword1234567@"){
            return response()->json([
                'role'=>'comptable',
                'redirect_to' => $this->getRedirectRouteBasedOnRole('comptable')
            ]);
        }elseif ($request->identifiant === "surveillantecoleA@gmail.cj" && $request->password === "surveillant'spassword1234567@"){
            return response()->json([
                'role'=>'surveillant',
                'redirect_to' => $this->getRedirectRouteBasedOnRole('surveillant')
            ]);
        }
        
        return response()->json(['message' => 'Identifiants incorrects.'], 401);
    }

public function logout(Request $request)
{
    Auth::logout(); // Déconnexion de l'utilisateur
    session()->forget('user'); // Effacez les données de l'utilisateur de la session
    return response()->json(['message' => 'Logged out successfully'], 200);
}





}
