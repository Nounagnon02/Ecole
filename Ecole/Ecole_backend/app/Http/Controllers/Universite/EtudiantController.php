<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Etudiant;
use Illuminate\Http\Request;

class EtudiantController extends Controller
{
    public function index()
    {
        $etudiants = Etudiant::with('filiere')->paginate(15);
        return response()->json($etudiants);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'matricule' => 'required|string|unique:etudiants',
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'date_naissance' => 'required|date',
            'lieu_naissance' => 'nullable|string',
            'sexe' => 'required|in:M,F',
            'telephone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'adresse' => 'nullable|string',
            'annee_entree' => 'required|integer',
            'filiere_id' => 'required|school_exists:filieres,id'
        ]);

        $etudiant = Etudiant::create($validated);
        return response()->json($etudiant, 201);
    }

    public function show(Etudiant $etudiant)
    {
        return response()->json($etudiant->load('filiere', 'inscriptions', 'notes', 'paiements'));
    }

    public function update(Request $request, Etudiant $etudiant)
    {
        $validated = $request->validate([
            'matricule' => 'sometimes|required|string|unique:etudiants,matricule,' . $etudiant->id,
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
            'date_naissance' => 'sometimes|required|date',
            'sexe' => 'sometimes|required|in:M,F',
            'filiere_id' => 'sometimes|required|school_exists:filieres,id'
        ]);

        $etudiant->update($validated);
        return response()->json($etudiant);
    }

    /**
     * Retirer un étudiant des effectifs — sans effacer son dossier.
     *
     * `delete()` était une suppression dure et quatre tables cascadaient sur
     * `etudiants.id` : diplômes, inscriptions, notes et paiements disparaissaient
     * avec la fiche. Même règle que pour l'élève et pour l'établissement : on
     * désactive.
     */
    public function destroy(Etudiant $etudiant)
    {
        return $this->deactivate($etudiant);
    }

    /** Sortir l'étudiant des effectifs. Idempotent. */
    public function deactivate(Etudiant $etudiant)
    {
        $etudiant->update(['statut' => Etudiant::INACTIVE]);
        $this->setAccountAccess($etudiant, false);

        return response()->json([
            'success' => true,
            'message' => 'Étudiant retiré des effectifs. Son dossier reste consultable.',
            'data'    => $etudiant->fresh(),
        ]);
    }

    /** Réinscrire l'étudiant. Idempotent. */
    public function activate(Etudiant $etudiant)
    {
        $etudiant->update(['statut' => Etudiant::ACTIVE]);
        $this->setAccountAccess($etudiant, true);

        return response()->json([
            'success' => true,
            'message' => 'Étudiant réinscrit.',
            'data'    => $etudiant->fresh(),
        ]);
    }

    /**
     * Ouvrir ou fermer l'accès du compte rattaché à l'étudiant.
     *
     * Affectation directe : `is_active` est hors du `$fillable` de User, si bien
     * qu'un `update()` l'écarterait en silence. Le compte est nullable — une
     * inscription au bureau du registraire précède la remise des identifiants.
     */
    private function setAccountAccess(Etudiant $etudiant, bool $active): void
    {
        $user = $etudiant->user;

        if (!$user) {
            return;
        }

        $user->is_active = $active;
        $user->save();
    }
}
