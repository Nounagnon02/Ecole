<?php

namespace App\Services\Import;

use App\Models\Classes;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\User;
use App\Support\BeninPhone;
use App\Support\Inscription;
use App\Support\Roles;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Inscription en masse depuis un fichier CSV : élèves (avec leur parent),
 * parents, enseignants et personnel, dans un seul fichier.
 *
 * Tout ou rien : si une seule ligne est refusée, rien n'est créé et chaque
 * refus est rendu avec son numéro de ligne. Une école qui importe trois cents
 * élèves ne doit pas se retrouver avec la moitié du fichier en base et
 * l'autre à ressaisir. `$simulation` joue le fichier sans rien garder.
 *
 * L'ancien import (`ImportService::importEleves`) donnait à chaque élève un
 * mot de passe aléatoire que personne ne voyait, créait une classe à chaque
 * faute de frappe et ne connaissait pas les parents.
 */
final class ComptesImport
{
    /** Chaque compte coûte un hachage de mot de passe : au-delà, la requête expire. */
    public const MAX_LIGNES = 200;

    public const COLONNES = [
        'role', 'nom', 'prenom', 'telephone', 'email', 'classe', 'matricule',
        'sexe', 'date_naissance', 'parent_nom', 'parent_prenom', 'parent_telephone',
    ];

    /**
     * @return array{success: bool, simulation: bool, total: int, crees: array<string, int>, erreurs: array<int, array{ligne: int, message: string}>, acces: array<int, array<string, ?string>>}
     */
    public function importer(string $contenu, User $agent, bool $simulation = false): array
    {
        $erreurs = [];
        $lignes = $this->lire($contenu, $erreurs);
        $resultat = ['success' => false, 'simulation' => $simulation, 'total' => count($lignes), 'crees' => [], 'erreurs' => $erreurs, 'acces' => []];

        if ($erreurs !== [] || $lignes === []) {
            if ($lignes === [] && $erreurs === []) {
                $resultat['erreurs'][] = ['ligne' => 1, 'message' => 'Le fichier ne contient aucune ligne à importer.'];
            }

            return $resultat;
        }

        $ecoleId = (int) $agent->ecole_id;
        $classes = Classes::where('ecole_id', $ecoleId)->get(['id', 'nom_classe'])
            ->keyBy(fn (Classes $classe) => $this->cle($classe->nom_classe));
        $peutCreerPersonnel = Roles::satisfies($agent->role, [Roles::DIRECTOR]);
        $vus = ['matricule' => [], 'email' => [], 'telephone' => []];
        $crees = [];
        $acces = [];

        DB::beginTransaction();

        try {
            foreach ($lignes as $numero => $ligne) {
                $message = $this->controler($ligne, $classes, $peutCreerPersonnel, $vus);

                if ($message !== null) {
                    $erreurs[] = ['ligne' => $numero, 'message' => $message];

                    continue;
                }

                // Une ligne refusée plus haut condamne déjà le fichier : inutile
                // d'écrire les suivantes, on ne fait plus que les contrôler.
                if ($erreurs !== []) {
                    continue;
                }

                foreach ($this->creer($ligne, $classes, $ecoleId, $simulation) as $compte) {
                    $acces[] = $compte + ['ligne' => $numero];
                    $crees[$compte['role']] = ($crees[$compte['role']] ?? 0) + (int) $compte['nouveau'];
                }
            }

            if ($erreurs !== [] || $simulation) {
                DB::rollBack();
            } else {
                DB::commit();
            }
        } catch (\Throwable $e) {
            DB::rollBack();

            throw $e;
        }

        return [
            'success' => $erreurs === [],
            'simulation' => $simulation,
            'total' => count($lignes),
            'crees' => $erreurs === [] ? array_filter($crees) : [],
            'erreurs' => $erreurs,
            // Les mots de passe provisoires ne sortent que d'un import réel.
            'acces' => $erreurs === [] && ! $simulation ? array_values(array_filter($acces, fn ($compte) => $compte['nouveau'])) : [],
        ];
    }

    /**
     * Découper le fichier en lignes indexées par leur numéro dans le fichier.
     *
     * @param  array<int, array{ligne: int, message: string}>  $erreurs
     * @return array<int, array<string, string>>
     */
    private function lire(string $contenu, array &$erreurs): array
    {
        $contenu = preg_replace('/^\xEF\xBB\xBF/', '', $contenu);

        if (! mb_check_encoding($contenu, 'UTF-8')) {
            // Un tableur réglé en français enregistre souvent en Windows-1252.
            $contenu = mb_convert_encoding($contenu, 'UTF-8', 'Windows-1252');
        }

        $brutes = preg_split('/\r\n|\r|\n/', trim($contenu));
        $separateur = substr_count($brutes[0] ?? '', ';') >= substr_count($brutes[0] ?? '', ',') ? ';' : ',';
        $entetes = array_map(fn ($entete) => $this->cle($entete), str_getcsv($brutes[0] ?? '', $separateur));

        foreach (['role', 'nom'] as $requise) {
            if (! in_array($requise, $entetes, true)) {
                $erreurs[] = ['ligne' => 1, 'message' => "Colonne « {$requise} » absente de la première ligne. Colonnes attendues : ".implode(', ', self::COLONNES).'.'];
            }
        }

        if ($erreurs !== []) {
            return [];
        }

        $lignes = [];

        foreach (array_slice($brutes, 1, null, true) as $index => $brute) {
            if (trim(str_replace([$separateur, '"'], '', $brute)) === '') {
                continue;
            }

            $cellules = array_map('trim', str_getcsv($brute, $separateur));
            $ligne = [];

            foreach ($entetes as $position => $entete) {
                if (in_array($entete, self::COLONNES, true)) {
                    $ligne[$entete] = $cellules[$position] ?? '';
                }
            }

            $lignes[$index + 1] = $ligne + array_fill_keys(self::COLONNES, '');
        }

        if (count($lignes) > self::MAX_LIGNES) {
            $erreurs[] = ['ligne' => 1, 'message' => 'Le fichier compte '.count($lignes).' lignes ; la limite est de '.self::MAX_LIGNES.' par fichier. Découpez-le.'];

            return [];
        }

        return $lignes;
    }

    /** Motif de refus de la ligne, ou null. Mémorise ce qui doit rester unique dans le fichier. */
    private function controler(array $ligne, $classes, bool $peutCreerPersonnel, array &$vus): ?string
    {
        $role = $this->role($ligne['role']);

        if ($role === null) {
            return "Rôle « {$ligne['role']} » inconnu. Rôles acceptés : eleve, parent, enseignant, secretaire, comptable, surveillant, censeur, infirmier, bibliothecaire, directeur.";
        }

        if ($ligne['nom'] === '') {
            return 'Le nom est obligatoire.';
        }

        if ($ligne['email'] !== '') {
            if (! filter_var($ligne['email'], FILTER_VALIDATE_EMAIL)) {
                return "Adresse e-mail « {$ligne['email']} » invalide.";
            }

            if (isset($vus['email'][strtolower($ligne['email'])]) || User::withoutGlobalScopes()->where('email', $ligne['email'])->exists()) {
                return "L'adresse e-mail « {$ligne['email']} » est déjà utilisée.";
            }

            $vus['email'][strtolower($ligne['email'])] = true;
        }

        if ($role === Roles::ELEVE) {
            if ($ligne['prenom'] === '') {
                return "Le prénom de l'élève est obligatoire.";
            }

            if ($ligne['classe'] === '') {
                return "La classe de l'élève est obligatoire.";
            }

            if (! $classes->has($this->cle($ligne['classe']))) {
                return "Classe « {$ligne['classe']} » introuvable dans l'école. Classes connues : ".$classes->pluck('nom_classe')->implode(', ').'.';
            }

            if ($ligne['matricule'] !== '') {
                if (isset($vus['matricule'][$ligne['matricule']]) || Eleve::withoutGlobalScopes()->where('numero_matricule', $ligne['matricule'])->exists()
                    || User::withoutGlobalScopes()->where('identifiant', $ligne['matricule'])->exists()) {
                    return "Le matricule « {$ligne['matricule']} » est déjà utilisé.";
                }

                $vus['matricule'][$ligne['matricule']] = true;
            }

            if ($ligne['sexe'] !== '' && ! in_array(strtoupper($ligne['sexe']), ['M', 'F'], true)) {
                return 'Le sexe se note M ou F.';
            }

            if ($ligne['date_naissance'] !== '' && $this->date($ligne['date_naissance']) === null) {
                return "Date de naissance « {$ligne['date_naissance']} » illisible. Format attendu : JJ/MM/AAAA.";
            }

            if ($ligne['parent_telephone'] !== '' || $ligne['parent_nom'] !== '') {
                if ($ligne['parent_nom'] === '') {
                    return 'Le nom du parent est obligatoire quand son téléphone est indiqué.';
                }

                if (! BeninPhone::isValid($ligne['parent_telephone'])) {
                    return "Téléphone du parent « {$ligne['parent_telephone']} » invalide : 10 chiffres, en commençant par 01.";
                }
            }

            return null;
        }

        // Parent, enseignant, personnel : le téléphone sert d'identifiant.
        if (! BeninPhone::isValid($ligne['telephone'])) {
            return "Téléphone « {$ligne['telephone']} » invalide : 10 chiffres, en commençant par 01.";
        }

        $telephone = BeninPhone::normalize($ligne['telephone']);

        if (isset($vus['telephone'][$telephone])) {
            return "Le téléphone « {$ligne['telephone']} » figure deux fois dans le fichier.";
        }

        $vus['telephone'][$telephone] = true;

        if ($role !== Roles::PARENT) {
            if (! $peutCreerPersonnel) {
                return 'Seule la direction peut créer un compte du personnel.';
            }

            if (User::withoutGlobalScopes()->where('identifiant', '0'.substr($telephone, -9))->exists()) {
                return "Un compte existe déjà pour le téléphone « {$ligne['telephone']} ».";
            }
        } elseif ($ligne['matricule'] !== '' && ! Eleve::where('numero_matricule', $ligne['matricule'])->exists()
            && ! isset($vus['matricule'][$ligne['matricule']])) {
            return "Aucun élève de matricule « {$ligne['matricule']} » : placez l'élève avant son parent dans le fichier.";
        }

        return null;
    }

    /**
     * Créer le ou les comptes de la ligne.
     *
     * @return array<int, array{role: string, nom: string, identifiant: ?string, mot_de_passe_provisoire: ?string, nouveau: bool}>
     */
    private function creer(array $ligne, $classes, int $ecoleId, bool $simulation): array
    {
        $role = $this->role($ligne['role']);
        $nom = trim($ligne['nom'].' '.$ligne['prenom']);

        if ($role === Roles::ELEVE) {
            $inscription = Inscription::inscrireEleve([
                'name' => $ligne['nom'],
                'prenom' => $ligne['prenom'],
                'classe_id' => $classes[$this->cle($ligne['classe'])]->id,
                'numero_matricule' => $ligne['matricule'],
                'email' => $ligne['email'],
                'sexe' => $ligne['sexe'] !== '' ? strtoupper($ligne['sexe']) : null,
                'date_naissance' => $this->date($ligne['date_naissance']),
                'parent' => $ligne['parent_telephone'] !== '' ? [
                    'name' => $ligne['parent_nom'], 'prenom' => $ligne['parent_prenom'] ?: null, 'telephone' => $ligne['parent_telephone'],
                ] : null,
                // En simulation, on ne paie pas le hachage d'un vrai mot de passe.
                'password' => $simulation ? 'simulation-'.Str::random(8) : null,
            ], $ecoleId);

            $comptes = [['role' => Roles::ELEVE, 'nom' => $nom, 'nouveau' => true] + $inscription['acces']['eleve']];

            if ($inscription['acces']['parent']) {
                $comptes[] = ['role' => Roles::PARENT, 'nom' => trim($ligne['parent_nom'].' '.$ligne['parent_prenom'])] + $inscription['acces']['parent'];
            }

            return $comptes;
        }

        if ($role === Roles::PARENT) {
            $eleve = $ligne['matricule'] !== '' ? Eleve::where('numero_matricule', $ligne['matricule'])->first() : null;
            $donnees = ['name' => $ligne['nom'], 'prenom' => $ligne['prenom'] ?: null, 'telephone' => $ligne['telephone']];

            return [['role' => Roles::PARENT, 'nom' => $nom] + ($eleve
                ? Inscription::rattacherParent($eleve, $donnees, $ecoleId)
                : Inscription::compteParent($donnees, $ecoleId))];
        }

        $motDePasse = Inscription::motDePasseProvisoire();
        $compte = User::create([
            'name' => $ligne['nom'],
            'prenom' => $ligne['prenom'] ?: null,
            'identifiant' => Inscription::identifiantDepuisTelephone($ligne['telephone']),
            'telephone' => BeninPhone::normalize($ligne['telephone']),
            'email' => $ligne['email'] ?: null,
            'password' => Hash::make($simulation ? 'simulation' : $motDePasse),
            'role' => $role,
            'ecole_id' => $ecoleId,
        ]);
        Inscription::exigerChangement($compte);

        if (in_array($role, Roles::teachers(), true)) {
            Enseignant::create(['user_id' => $compte->id, 'ecole_id' => $ecoleId]);
        }

        return [['role' => $role, 'nom' => $nom, 'identifiant' => $compte->identifiant, 'mot_de_passe_provisoire' => $motDePasse, 'nouveau' => true]];
    }

    /** Rôle reconnu, écrit comme l'application l'attend, ou null. */
    private function role(string $saisi): ?string
    {
        $cle = $this->cle($saisi);
        $alias = ['eleve' => Roles::ELEVE, 'parent' => Roles::PARENT, 'tuteur' => Roles::PARENT, 'professeur' => Roles::TEACHER];

        if (isset($alias[$cle])) {
            return $alias[$cle];
        }

        foreach (array_diff(Roles::provisionable(), [Roles::ADMIN]) as $role) {
            if ($this->cle($role) === $cle) {
                return $role;
            }
        }

        return null;
    }

    private function date(string $saisie): ?string
    {
        if ($saisie === '') {
            return null;
        }

        foreach (['d/m/Y', 'Y-m-d', 'd-m-Y'] as $format) {
            try {
                $date = Carbon::createFromFormat('!'.$format, $saisie);
            } catch (\Throwable) {
                continue;
            }

            if ($date && $date->format($format) === $saisie && $date->isPast()) {
                return $date->toDateString();
            }
        }

        return null;
    }

    /** Comparaison sans casse, accents ni espaces : « Rôle », « 6 ème » et « 6ème » se valent. */
    private function cle(?string $texte): string
    {
        return preg_replace('/[^a-z0-9_]/', '', strtolower(Str::ascii(trim((string) $texte))));
    }
}
