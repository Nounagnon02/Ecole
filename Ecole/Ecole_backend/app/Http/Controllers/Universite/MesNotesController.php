<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Matiere;
use App\Models\Universite\Note;
use App\Support\ReleveLmd;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Relevé de notes de l'étudiant connecté (décision du 16/11/2026).
 *
 * L'étudiant n'avait aucun moyen de voir ses notes : `universite/notes` est
 * réservé à ceux qui notent. Le relevé couvre toutes les UE de sa filière,
 * notées ou non, et reste provisoire jusqu'à la délibération du jury.
 */
class MesNotesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $etudiant = $request->user()->etudiant;

        if (! $etudiant) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun dossier étudiant n’est rattaché à ce compte. Adressez-vous à la scolarité.',
            ], 404);
        }

        $ues = Matiere::with(['semestre:id,libelle', 'enseignant:id,nom,prenom'])
            ->where('filiere_id', $etudiant->filiere_id)
            ->get();

        $notes = Note::where('etudiant_id', $etudiant->id)
            ->whereIn('matiere_id', $ues->pluck('id'))
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'etudiant' => [
                    'matricule' => $etudiant->matricule,
                    'nom' => trim($etudiant->prenom . ' ' . $etudiant->nom),
                    'filiere' => $etudiant->filiere?->nom,
                    'niveau' => $etudiant->filiere?->niveau,
                ],
                'semestres' => ReleveLmd::selonConfiguration()->calculer($ues, $notes),
                'regles' => [
                    'poids_examen' => (float) config('universite.poids_examen'),
                    'seuil_validation' => (int) config('universite.seuil_validation'),
                ],
                // Les résultats officiels (compensation, rattrapage) sortent de
                // la délibération du jury, pas de ce calcul.
                'provisoire' => true,
            ],
        ]);
    }
}
