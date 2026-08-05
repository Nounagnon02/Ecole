<?php

namespace App\Http\Controllers;

use App\Models\{CahierDeTexte, EmploiDuTemps, Eleve, User, Classes};
use App\Services\BulletinService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use App\Support\Cycles;

class EleveController extends Controller
{
    protected $bulletinService;

    public function __construct(BulletinService $bulletinService)
    {
        $this->bulletinService = $bulletinService;
    }

    /**
     * Dashboard : Bulletin de l'élève connecté
     */
    public function bulletin($periode)
    {
        $user = Auth::user();
        if (!$user || !$user->eleve) {
            return response()->json(['message' => 'Profil élève non trouvé'], 404);
        }

        $eleveId = $user->eleve->id;

        // `Cycles::is()` compare sans tenir compte de la casse. La comparaison
        // était `=== 'secondaire'` contre un `Secondaire` stocké : toujours
        // fausse, donc tout élève du secondaire recevait le bulletin
        // maternelle/primaire — un autre calcul, sans coefficients.
        // `?->` sur la classe : un élève non affecté faisait planter la route.
        if (Cycles::is($user->eleve->classe?->categorie_classe, Cycles::SECONDARY)) {
            return $this->bulletinService->bulletinSecondaire($eleveId, $periode);
        }

        return $this->bulletinService->bulletinMaternellePrimaire($eleveId, $periode);
    }

    /**
     * Liste des élèves (Admin)
     */
    public function index()
    {
        $this->authorize('viewAny', Eleve::class);

        // Paginé : la liste complète des élèves d'un établissement peut peser
        // plusieurs milliers de lignes avec leurs relations (cf. audit P3).
        $eleves = Eleve::with('user:id,name,prenom,email', 'classe:id,nom_classe', 'serie:id,nom')
            ->orderBy('id')
            ->paginate((int) request()->input('per_page', 50));

        return response()->json($eleves);
    }

    /**
     * Création d'un élève (Admin)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'prenom' => 'required|string',
            'identifiant' => 'required|string|unique:users,identifiant',
            'password' => 'required|string|min:6',
            'ecole_id' => 'required|exists:ecoles,id',
            'numero_matricule' => 'required|string|unique:eleves,numero_matricule',
            'class_id' => 'required|school_exists:classes,id',
            'serie_id' => 'nullable|school_exists:series,id',
            'email' => 'nullable|email|unique:users,email',
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                $user = User::create([
                    'name' => $validated['name'],
                    'prenom' => $validated['prenom'],
                    'identifiant' => $validated['identifiant'],
                    'password' => Hash::make($validated['password']),
                    'role' => 'eleve',
                    'ecole_id' => $validated['ecole_id'],
                    'email' => $validated['email'],
                ]);

                $eleve = Eleve::create([
                    'user_id' => $user->id,
                    'numero_matricule' => $validated['numero_matricule'],
                    'class_id' => $validated['class_id'],
                    'serie_id' => $validated['serie_id'],
                ]);

                return response()->json($eleve->load('user'), 201);
            });
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $this->clientErrorMessage($e)], 500);
        }
    }

    public function show($id)
    {
        $eleve = Eleve::with('user', 'classe', 'serie')->find($id);
        if (!$eleve) {
            return response()->json(['message' => 'Élève non trouvé'], 404);
        }
        $this->authorize('view', $eleve);
        return response()->json($eleve);
    }

    public function update(Request $request, $id)
    {
        $eleve = Eleve::findOrFail($id);
        $this->authorize('update', $eleve);
        $user = $eleve->user;

        // `email` et `numero_matricule` étaient écrits sans figurer dans le
        // validate() : format libre et doublons possibles, alors que la
        // création impose `unique:` sur les deux (cf. audit F6).
        $validated = $request->validate([
            'name'             => 'sometimes|string|max:255',
            'prenom'           => 'sometimes|string|max:255',
            'email'            => 'sometimes|nullable|email|unique:users,email,' . $user->id,
            'class_id'         => 'sometimes|school_exists:classes,id',
            'serie_id'         => 'sometimes|nullable|school_exists:series,id',
            'numero_matricule' => 'sometimes|string|max:50|unique:eleves,numero_matricule,' . $eleve->id,
        ]);

        // On n'écrit que les champs effectivement validés et présents.
        $user->update(array_intersect_key($validated, array_flip(['name', 'prenom', 'email'])));
        $eleve->update(array_intersect_key($validated, array_flip(['class_id', 'serie_id', 'numero_matricule'])));

        return response()->json($eleve->load('user'));
    }

    /**
     * Retirer un élève des effectifs — sans effacer son dossier.
     *
     * Cette méthode faisait `$eleve->delete()` puis `$user->delete()`, deux
     * suppressions dures, et 18 tables cascadaient sur `eleves.id` : un seul
     * appel effaçait notes, absences, paiements, moyennes, dossier médical,
     * vaccinations, emprunts, bourses, certificats, rendez-vous et inscriptions
     * aux examens. Le dossier d'un élève est précisément ce qu'un établissement
     * doit pouvoir relire des années plus tard, pour un certificat, un relevé ou
     * un litige.
     *
     * Même règle que pour l'établissement : on désactive, on ne supprime pas.
     * Les contraintes sont passées en RESTRICT
     * (`2026_08_05_100100_restrict_student_deletion`), donc une suppression
     * échoue désormais franchement au lieu d'obéir.
     */
    public function destroy($id)
    {
        $eleve = Eleve::findOrFail($id);
        $this->authorize('delete', $eleve);

        return $this->deactivate($eleve);
    }

    /**
     * Sortir l'élève des effectifs. Idempotent.
     */
    public function deactivate(Eleve $eleve)
    {
        $this->authorize('delete', $eleve);

        $eleve->update(['statut' => Eleve::INACTIVE]);

        // Le compte perd l'accès mais survit : le supprimer effacerait l'identité
        // de connexion et, depuis que `communications.auteur_id` est en SET NULL,
        // orphelinerait ce que la personne a publié.
        //
        // Affectation directe, pas `update()` : `is_active` n'est pas dans le
        // `$fillable` de User — délibérément, l'état d'un compte ne doit pas se
        // régler depuis une charge de requête. Un `update()` l'écartait donc en
        // silence et la désactivation ne coupait rien.
        $this->setAccountAccess($eleve, false);

        return response()->json([
            'success' => true,
            'message' => 'Élève retiré des effectifs. Son dossier reste consultable.',
            'data'    => $eleve->fresh()->load('user'),
        ]);
    }

    /**
     * Réinscrire l'élève. Idempotent.
     */
    public function activate(Eleve $eleve)
    {
        $this->authorize('update', $eleve);

        $eleve->update(['statut' => Eleve::ACTIVE]);
        $this->setAccountAccess($eleve, true);

        return response()->json([
            'success' => true,
            'message' => 'Élève réinscrit.',
            'data'    => $eleve->fresh()->load('user'),
        ]);
    }

    /**
     * Ouvrir ou fermer l'accès du compte rattaché à l'élève.
     *
     * `is_active` est hors du `$fillable` de User, donc inaccessible en
     * assignation de masse. Un élève peut par ailleurs ne pas avoir de compte —
     * l'inscription précède parfois la remise des identifiants.
     */
    private function setAccountAccess(Eleve $eleve, bool $active): void
    {
        $user = $eleve->user;

        if (!$user) {
            return;
        }

        $user->is_active = $active;
        $user->save();
    }

    /**
     * Lessons delivered to the signed-in student's class.
     *
     * The frontend called `GET /eleve/cours`, which never existed. There is no
     * "cours" table: what a student sees as their coursework is the lesson book
     * (cahier de texte) for their class — lesson title, content and homework
     * set, per subject and date.
     *
     * GET /eleves/me/cours
     */
    public function cours(Request $request)
    {
        $eleve = Auth::user()?->eleve;

        if (!$eleve) {
            return response()->json(['success' => false, 'message' => 'Profil élève non trouvé'], 404);
        }

        // `enseignants` ne porte pas de nom : l'identité est sur `users`,
        // atteinte via la relation enseignant.user.
        $lessons = CahierDeTexte::with(['matiere:id,nom', 'enseignant.user:id,name,prenom'])
            ->where('classe_id', $eleve->class_id)
            ->when($request->filled('matiere_id'), fn($q) => $q->where('matiere_id', $request->matiere_id))
            ->orderByDesc('date')
            ->paginate((int) $request->input('per_page', 50));

        $lessons->getCollection()->transform(fn($l) => [
            'id'       => $l->id,
            'titre'    => $l->titre_lecon,
            'resume'   => $l->contenu,
            'devoirs'  => $l->devoirs_donnes,
            'date'     => $l->date,
            'matiere'  => ['id' => $l->matiere_id, 'nom' => $l->matiere->nom ?? '—'],
            'enseignant' => trim(($l->enseignant->user->prenom ?? '') . ' ' . ($l->enseignant->user->name ?? '')),
            'type'     => 'cours',
        ]);

        return response()->json(['success' => true, 'data' => $lessons]);
    }
}