<?php

namespace App\Http\Controllers;

use Illuminate\Auth\Events\Registered;
use App\Models\Eleves;
use App\Models\Enseignants;
use App\Models\Parents;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Database\QueryException;
use Smalot\PdfParser\Parser as PdfParser;




class AuthController extends Controller
{
    




protected function getRedirectRouteBasedOnRole($role)
{
    $routes = [
        'eleve' => '/dashboard-eleve',
        'parent' => '/dashboard-parent',
        'enseignement' => '/dashboard-enseignant',
        'enseignementM' => '/dashboard-enseignantM',
        'enseignementP' => '/dashboard-enseignantP',
        'directeur' => '/dashboard-admin',
        'directeurM' => '/dashboard-maternelle',
        'directeurP' => '/dashboard-primaire',
        'directeurS' => '/dashboard-secondaire',
        'censeur' => '/dashboard-censeur',
        'secretaire' => '/dashboard-secretaire',
        'comptable' => '/dashboard-comptable',
        'surveillant' => '/dashboard-surveillant'
    ];

    return $routes[$role] ?? '/';
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
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'numero_de_telephone' => $validated['numero_de_telephone'],
                'identifiant' => $validated['identifiant'],
                'password1' => bcrypt($validated['password1']),
                'numero_matricule' => $validated['numero_matricule'],
                'class_id' => $classe->id,
                'serie_id' => $serie->id,
            ]);

            event(new Registered($eleve));
            return response()->json([
                'message' => 'Inscription réussie ! Veuillez vous connecter.',
                'redirect_to' => '/connexion'
            ], 201);

        }elseif ($request->role === 'parent') {
            $validated = $request->validate([
                'role' => 'required|in:parent',
                'nom' => 'required|string',
                'prenom' => 'required|string',
                'email' => 'required|email|unique:parents,email',
                'numero_de_telephone' => 'required|string',
                'identifiant' => 'required|unique:parents,identifiant',
                'password1' => 'required|string|min:8',
            ]);


            $parent = Parents::create([
                'role' => $validated['role'],
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'email' => $validated['email'],
                'numero_de_telephone' => $validated['numero_de_telephone'],
                'identifiant' => $validated['identifiant'],
                'password1' => bcrypt($validated['password1']),
            ]);

            event(new Registered($parent));
            return response()->json([
                'message' => 'Inscription réussie ! Veuillez vous connecter.',
                'redirect_to' => '/connexion'
            ], 201);

        }elseif ($request->role === 'enseignement') {
            $validated = $request->validate([
                'role' => 'required|in:enseignement',
                'nom' => 'required|string',
                'prenom' => 'required|string',
                'email' => 'required|email|unique:enseignants,email',
                'numero_de_telephone' => 'required|string',
                'identifiant' => 'required|unique:enseignants,identifiant',
                'matiere' => 'required|string',
                'classe' => 'required|string',
                'password1' => 'required|string|min:8',
            ]);

            $classe = \App\Models\Classes::where('nom_classe', $validated['classe'])->firstOrFail();
            $matiere = \App\Models\Matieres::where('nom', $validated['matiere'])->firstOrFail();

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
            return response()->json([
                'message' => 'Inscription réussie ! Veuillez vous connecter.',
                'redirect_to' => '/connexion'
            ], 201);

        } elseif (in_array($request->role, ['enseignementM', 'enseignementP'])) {
            $validated = $request->validate([
                'role' => 'required|in:enseignementM,enseignementP',
                'nom' => 'required|string',
                'prenom' => 'required|string',
                'email' => 'required|email|unique:enseignants_martenel_primaire,email',
                'numero_de_telephone' => 'required|string',
                'identifiant' => 'required|unique:enseignants_martenel_primaire,identifiant',
                'classe' => 'required|string',
                'password1' => 'required|string|min:8',
            ]);

            $classe = \App\Models\Classes::where('nom_classe', $validated['classe'])->firstOrFail();

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
            return response()->json([
                'message' => 'Inscription réussie ! Veuillez vous connecter.',
                'redirect_to' => '/connexion'
            ], 201);
        }

        return response()->json(['message' => 'Rôle non reconnu'], 400);

    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json([
            'message' => 'Classe ou matière non trouvée',
            'error' => $e->getMessage()
        ], 422);
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'message' => 'Erreur de validation',
            'errors' => $e->errors()
        ], 422);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Erreur lors de l\'inscription',
            'error' => $e->getMessage()
        ], 500);
    }
}


public function connexion(Request $request)
{
    $request->validate([
        'identifiant' => 'required',
        'password' => 'required',
    ]);

    $identifiant = $request->identifiant;
    $password = $request->password;

    // Vérification pour l'élève
    $eleve = Eleves::where('identifiant', $identifiant)->first();
    if ($eleve && Hash::check($request->password, $eleve->password1)) {
        $token = $eleve->createToken('api-token')->plainTextToken;
        return response()->json([
            'user' => $eleve,
            'token' => $token,
            'role' => 'eleve',
            'redirect_to' => $this->getRedirectRouteBasedOnRole('eleve')
        ]);
    }

    // Vérification pour le parent
    $parent = Parents::where('identifiant', $identifiant)->first();
    if ($parent && Hash::check($request->password, $parent->password1)) {
        $token = $parent->createToken('api-token')->plainTextToken;
        return response()->json([
            'user' => $parent,
            'token' => $token,
            'role' => 'parent',
            'redirect_to' => $this->getRedirectRouteBasedOnRole('parent')
        ]);
    }

    // Vérification pour l'enseignant secondaire
    $enseignant = Enseignants::where('identifiant', $identifiant)->first();
    if ($enseignant && Hash::check($request->password, $enseignant->password1)) {
        $token = $enseignant->createToken('api-token')->plainTextToken;
        return response()->json([
            'user' => $enseignant,
            'token' => $token,
            'role' => 'enseignement',
            'redirect_to' => $this->getRedirectRouteBasedOnRole('enseignement')
        ]);
    }

    // Vérification pour les enseignants maternelle/primaire
    $enseignantMP = \App\Models\Enseignants_Martenel_Primaire::where('identifiant', $identifiant)->first();
    if ($enseignantMP && Hash::check($request->password, $enseignantMP->password1)) {
        $token = $enseignantMP->createToken('api-token')->plainTextToken;
        return response()->json([
            'user' => $enseignantMP,
            'token' => $token,
            'role' => $enseignantMP->role, // 'enseignementM' ou 'enseignementP'
            'redirect_to' => $this->getRedirectRouteBasedOnRole($enseignantMP->role)
        ]);
    }

    // Vérification des comptes spéciaux
    $specialAccounts = [
        "directeurecoleA@gmail.cj" => [
            'password' => "director'spassword1234567@",
            'role' => 'directeur',
            'nom' => 'Directeur',
            'prenom' => 'École'
        ],
        "directeurMecoleA@gmail.cj" => [
            'password' => "directorM'spassword1234567@",
            'role' => 'directeurM',
            'nom' => 'Directeur',
            'prenom' => 'École'
        ],
        "directeurPecoleA@gmail.cj" => [
            'password' => "directorP'spassword1234567@",
            'role' => 'directeurP',
            'nom' => 'Directeur',
            'prenom' => 'École'
        ],
        "directeurSecoleA@gmail.cj" => [
            'password' => "directorS'spassword1234567@",
            'role' => 'directeurS',
            'nom' => 'Directeur',
            'prenom' => 'École'
        ],
        "censeurecoleA@gmail.cj" => [
            'password' => "censeur'spassword1234567@",
            'role' => 'censeur',
            'nom' => 'Censeur',
            'prenom' => 'École'
        ],
        "secretaireecoleA@gmail.cj" => [
            'password' => "secretaire'spassword1234567@",
            'role' => 'secretaire',
            'nom' => 'Secrétaire',
            'prenom' => 'École'
        ],
        "comptablecoleA@gmail.cj" => [
            'password' => "comptable'spassword1234567@",
            'role' => 'comptable',
            'nom' => 'Comptable',
            'prenom' => 'École'
        ],
        "surveillantecoleA@gmail.cj" => [
            'password' => "surveillant'spassword1234567@",
            'role' => 'surveillant',
            'nom' => 'Surveillant',
            'prenom' => 'École'
        ]
    ];

    if (isset($specialAccounts[$identifiant])) {
        $account = $specialAccounts[$identifiant];
        if ($password === $account['password']) {
            // Créer un token pour les comptes spéciaux
            $user = new User([
                'identifiant' => $identifiant,
                'nom' => $account['nom'],
                'prenom' => $account['prenom'],
                'role' => $account['role']
            ]);
            
            return response()->json([
                'user' => [
                    'identifiant' => $identifiant,
                    'nom' => $account['nom'],
                    'prenom' => $account['prenom'],
                    'role' => $account['role']
                ],
                'role' => $account['role'],
                'redirect_to' => $this->getRedirectRouteBasedOnRole($account['role'])
            ]);
        }
    }

    return response()->json([
        'message' => 'Identifiants incorrects'
    ], 401);
}


public function logout(Request $request)
{
    Auth::logout(); // Déconnexion de l'utilisateur
    session()->forget('user'); // Effacez les données de l'utilisateur de la session
    return response()->json(['message' => 'Logged out successfully'], 200);
}

private function processExcelFile($file)
    {
        $spreadsheet = IOFactory::load($file->getPathname());
        $worksheet = $spreadsheet->getActiveSheet();
        $data = [];

        $highestRow = $worksheet->getHighestRow();
        
        for ($row = 2; $row <= $highestRow; $row++) {
            $eleve = $worksheet->getCell('A' . $row)->getValue();
            $note = $worksheet->getCell('B' . $row)->getValue();
            $noteSur = $worksheet->getCell('C' . $row)->getValue();
            $commentaire = $worksheet->getCell('D' . $row)->getValue();

            if ($eleve && $note !== null) {
                $data[] = [
                    'eleve' => trim($eleve),
                    'note' => floatval($note),
                    'note_sur' => $noteSur ? floatval($noteSur) : 20,
                    'commentaire' => $commentaire ? trim($commentaire) : null
                ];
            }
        }

        return $data;
    }

    private function processPdfFile($file)
    {
        $parser = new PdfParser();
        $pdf = $parser->parseFile($file->getPathname());
        $text = $pdf->getText();
        
        // Logique simple pour extraire les notes du PDF
        // À adapter selon le format de vos PDFs
        $lines = explode("\n", $text);
        $data = [];

        foreach ($lines as $line) {
            // Exemple de regex pour extraire nom et note
            if (preg_match('/^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?/', trim($line), $matches)) {
                $data[] = [
                    'eleve' => trim($matches[1]),
                    'note' => floatval($matches[2]),
                    'note_sur' => isset($matches[3]) ? floatval($matches[3]) : 20,
                    'commentaire' => null
                ];
            }
        }

        return $data;
    }





}
