<?php

namespace App\Http\Controllers;

use App\Models\Devoir;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\User;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DevoirController extends Controller
{
    /**
     * Liste des devoirs pour l'enseignant connecté.
     */
    public function indexEnseignant(Request $request)
    {
        $user = $request->user();

        $devoirs = Devoir::with(['classe', 'matiere', 'eleves'])
            ->where('enseignant_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $devoirs->items(),
            'meta' => [
                'total' => $devoirs->total(),
                'page' => $devoirs->currentPage(),
                'per_page' => $devoirs->perPage(),
            ],
        ]);
    }

    /**
     * Liste des devoirs pour l'élève connecté.
     */
    public function indexEleve(Request $request)
    {
        $user = $request->user();
        $eleve = $user->eleve;

        if (!$eleve) {
            return response()->json(['success' => false, 'message' => 'Profil élève introuvable'], 404);
        }

        $devoirs = Devoir::with(['classe', 'matiere', 'enseignant'])
            ->where('classe_id', $eleve->class_id)
            ->where('publie', true)
            ->orderBy('date_limite', 'asc')
            ->get()
            ->map(function ($devoir) use ($user) {
                $pivot = $devoir->eleves()->where('eleve_id', $user->id)->first()?->pivot;
                $devoir->rendu = $pivot?->rendu ?? false;
                $devoir->note = $pivot?->note;
                $devoir->date_remise = $pivot?->date_remise;
                $devoir->reponse = $pivot?->reponse;
                unset($devoir->eleves);
                return $devoir;
            });

        return response()->json([
            'success' => true,
            'data' => $devoirs,
        ]);
    }

    /**
     * Créer un nouveau devoir (enseignant).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'classe_id' => 'required|school_exists:classes,id',
            'matiere_id' => 'nullable|school_exists:matieres,id',
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date_limite' => 'nullable|date',
            'type' => 'nullable|in:devoir,exercice,projet',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $devoir = Devoir::create([
            'enseignant_id' => $request->user()->id,
            'classe_id' => $request->classe_id,
            'matiere_id' => $request->matiere_id ?? $request->user()->enseignant?->matiere_id,
            'titre' => $request->titre,
            'description' => $request->description,
            'date_limite' => $request->date_limite,
            'type' => $request->type ?? 'devoir',
            'publie' => $request->boolean('publie', true),
            'ecole_id' => $request->user()->ecole_id,
        ]);

        // Associer automatiquement à tous les élèves de la classe
        if ($devoir->publie) {
            // whereHas('eleve') filtre la table `eleves`, dont la clé de
            // classe est `class_id`.
            $eleves = User::whereHas('eleve', function ($q) use ($devoir) {
                $q->where('class_id', $devoir->classe_id);
            })->pluck('id');

            $devoir->eleves()->syncWithoutDetaching($eleves);
        }

        return response()->json([
            'success' => true,
            'message' => 'Devoir créé avec succès',
            'data' => $devoir->load(['classe', 'matiere']),
        ], 201);
    }

    /**
     * Soumettre un devoir (élève).
     */
    public function soumettre(Request $request, $id)
    {
        $devoir = Devoir::findOrFail($id);

        if (!$devoir->publie) {
            return response()->json(['success' => false, 'message' => 'Ce devoir n\'est pas publié'], 403);
        }

        if ($devoir->date_limite && now()->greaterThan($devoir->date_limite)) {
            return response()->json(['success' => false, 'message' => 'La date limite de soumission est dépassée'], 403);
        }

        $validator = Validator::make($request->all(), [
            'reponse' => 'nullable|string|max:20000',
            // Whitelist stricte : sans `mimes`, un élève pouvait déposer un
            // .html ou .svg servi depuis l'origine de l'app — XSS stocké
            // volant la session de l'enseignant qui ouvre le devoir (audit S7).
            'fichier' => 'nullable|file|max:10240|mimes:pdf,doc,docx,odt,txt,jpg,jpeg,png,webp,zip',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $eleve = $request->user();

        $pivotData = [
            'rendu' => true,
            'date_remise' => now(),
            'reponse' => $request->reponse,
        ];

        if ($request->hasFile('fichier')) {
            // Disque privé + FileUploadService : vérification MIME côté
            // serveur via finfo + nom UUID pour éviter path traversal (audit S7).
            $path = FileUploadService::store(
                $request->file('fichier'),
                'devoirs/' . $id,
                'local',
                allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.oasis.opendocument.text', 'text/plain', 'image/jpeg', 'image/png', 'image/webp', 'application/zip'],
                maxSize: 10 * 1024 * 1024,
            );
            $pivotData['fichier'] = $path;
        }

        $devoir->eleves()->syncWithoutDetaching([$eleve->id => $pivotData]);

        return response()->json([
            'success' => true,
            'message' => 'Devoir soumis avec succès',
        ]);
    }

    /**
     * Noter un devoir (enseignant).
     */
    public function noter(Request $request, $id, $eleveId)
    {
        $devoir = Devoir::findOrFail($id);

        if ($devoir->enseignant_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
        }

        $validator = Validator::make($request->all(), [
            'note' => 'required|numeric|min:0|max:20',
            'commentaire' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $devoir->eleves()->updateExistingPivot($eleveId, [
            'note' => $request->note,
            'commentaire' => $request->commentaire,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Note enregistrée',
        ]);
    }

    /**
     * Détail d'un devoir.
     */
    public function show($id)
    {
        // `users.nom` n'existe pas — la colonne s'appelle `name`. La requête
        // échouait donc systématiquement en erreur SQL.
        $devoir = Devoir::with(['classe', 'matiere', 'enseignant', 'eleves' => function ($q) {
            $q->select('users.id', 'users.name', 'users.prenom');
        }])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $devoir,
        ]);
    }

    /**
     * Téléchargement d'une copie rendue.
     *
     * Les copies sont stockées sur le disque privé : elles ne sont accessibles
     * que par cette route, qui vérifie le demandeur (cf. audit S7).
     */
    public function downloadSubmission(Request $request, $id, $eleveId)
    {
        $devoir = Devoir::findOrFail($id);
        $user = $request->user();

        $estProprietaire  = (int) $eleveId === (int) $user->id;
        $estEncadrant     = $devoir->enseignant_id === $user->id
            || in_array($user->role, ['directeur', 'censeur', 'super-admin'], true);

        if (!$estProprietaire && !$estEncadrant) {
            return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
        }

        $pivot = $devoir->eleves()->where('users.id', $eleveId)->first()?->pivot;

        if (!$pivot?->fichier || !\Illuminate\Support\Facades\Storage::disk('local')->exists($pivot->fichier)) {
            return response()->json(['success' => false, 'message' => 'Fichier introuvable'], 404);
        }

        return \Illuminate\Support\Facades\Storage::disk('local')->download(
            $pivot->fichier,
            basename($pivot->fichier),
            ['Content-Disposition' => 'attachment']
        );
    }

    /**
     * Supprimer un devoir (enseignant propriétaire).
     */
    public function destroy($id)
    {
        $devoir = Devoir::findOrFail($id);

        if ($devoir->enseignant_id !== request()->user()->id) {
            return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
        }

        $devoir->eleves()->detach();
        $devoir->delete();

        return response()->json([
            'success' => true,
            'message' => 'Devoir supprimé',
        ]);
    }
}
