<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Etudiant;
use App\Models\Universite\Matiere;
use App\Models\Universite\Note;
use App\Support\Roles;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Notes universitaires.
 *
 * Le recteur et le doyen voient et corrigent les notes de l'établissement ;
 * le professeur, celles des UE qu'il enseigne et rien d'autre. Constaté le
 * 16/11/2026 : la liste renvoyait à tout professeur les notes de tous les
 * étudiants, un professeur pouvait noter une UE qui n'est pas la sienne, et
 * la validation cherchait l'UE dans `matieres` (secondaire) au lieu de
 * `uni_matieres`.
 */
class NoteController extends Controller
{
    private const TYPES = ['CC', 'TP', 'Examen'];

    public function index(Request $request): JsonResponse
    {
        $query = Note::with('etudiant', 'matiere')->latest('date_evaluation')->latest('id');

        if ($enseignant = $this->professeur($request)) {
            $query->whereHas('matiere', fn ($q) => $q->where('enseignant_id', $enseignant->id));
        }

        foreach (['matiere_id', 'etudiant_id', 'type'] as $filtre) {
            if ($valeur = $request->query($filtre)) {
                $query->where($filtre, $valeur);
            }
        }

        return response()->json($query->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'etudiant_id' => 'required|integer|school_exists:etudiants,id',
            'matiere_id' => 'required|integer|school_exists:uni_matieres,id',
            'note' => 'required|numeric|min:0|max:20',
            'type' => 'required|in:' . implode(',', self::TYPES),
            'date_evaluation' => 'required|date',
        ]);

        $matiere = $this->matiereAutorisee($request, (int) $validated['matiere_id']);
        $this->exigerFiliere($matiere, [(int) $validated['etudiant_id']]);

        $note = Note::create($validated);

        return response()->json($note, 201);
    }

    public function show(Request $request, Note $note): JsonResponse
    {
        $this->matiereAutorisee($request, $note->matiere_id);

        return response()->json($note->load('etudiant', 'matiere'));
    }

    public function update(Request $request, Note $note): JsonResponse
    {
        $this->matiereAutorisee($request, $note->matiere_id);

        $validated = $request->validate([
            'note' => 'sometimes|required|numeric|min:0|max:20',
            'type' => 'sometimes|required|in:' . implode(',', self::TYPES),
            'date_evaluation' => 'sometimes|required|date',
        ]);

        $note->update($validated);

        return response()->json($note);
    }

    public function destroy(Request $request, Note $note): JsonResponse
    {
        $this->matiereAutorisee($request, $note->matiere_id);

        $note->delete();

        return response()->json(null, 204);
    }

    /**
     * Grille d'une évaluation (UE, type, date) : étudiants de la filière de
     * l'UE et notes déjà saisies pour cette évaluation.
     */
    public function grille(Request $request, int $matiere): JsonResponse
    {
        $ue = $this->matiereAutorisee($request, $matiere);

        $donnees = $request->validate([
            'type' => 'required|in:' . implode(',', self::TYPES),
            'date' => 'required|date_format:Y-m-d',
        ]);

        $etudiants = Etudiant::where('filiere_id', $ue->filiere_id)
            ->orderBy('nom')->orderBy('prenom')
            ->get(['id', 'matricule', 'nom', 'prenom']);

        $notes = Note::where('matiere_id', $ue->id)
            ->where('type', $donnees['type'])
            ->whereDate('date_evaluation', $donnees['date'])
            ->orderBy('etudiant_id')
            ->get(['etudiant_id', 'note'])
            ->map(fn (Note $n) => ['etudiant_id' => $n->etudiant_id, 'note' => (float) $n->note])
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'matiere' => $ue->only(['id', 'code', 'intitule', 'credit']),
                'etudiants' => $etudiants,
                'notes' => $notes,
            ],
        ]);
    }

    /**
     * Enregistre une grille en un envoi. Une note déjà saisie pour la même
     * évaluation (étudiant, UE, type, date) est remplacée, jamais doublée ;
     * une ligne sans note est ignorée. Un étudiant hors de la filière de l'UE
     * fait refuser tout le lot : rien n'est enregistré à moitié.
     */
    public function lot(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'matiere_id' => 'required|integer|school_exists:uni_matieres,id',
            'type' => 'required|in:' . implode(',', self::TYPES),
            'date_evaluation' => 'required|date_format:Y-m-d',
            'notes' => 'required|array|max:1000',
            'notes.*.etudiant_id' => 'required|integer|distinct',
            'notes.*.note' => 'nullable|numeric|min:0|max:20',
        ]);

        $ue = $this->matiereAutorisee($request, (int) $donnees['matiere_id']);
        $saisies = collect($donnees['notes'])->filter(fn ($n) => ($n['note'] ?? null) !== null)->values();
        $this->exigerFiliere($ue, $saisies->pluck('etudiant_id')->map(fn ($id) => (int) $id)->all());

        DB::transaction(function () use ($saisies, $ue, $donnees) {
            foreach ($saisies as $saisie) {
                $existante = Note::where('etudiant_id', $saisie['etudiant_id'])
                    ->where('matiere_id', $ue->id)
                    ->where('type', $donnees['type'])
                    ->whereDate('date_evaluation', $donnees['date_evaluation'])
                    ->first();

                if ($existante) {
                    $existante->update(['note' => $saisie['note']]);
                } else {
                    Note::create([
                        'etudiant_id' => $saisie['etudiant_id'],
                        'matiere_id' => $ue->id,
                        'type' => $donnees['type'],
                        'note' => $saisie['note'],
                        'date_evaluation' => $donnees['date_evaluation'],
                    ]);
                }
            }
        });

        return response()->json(['success' => true, 'enregistrees' => $saisies->count()]);
    }

    /** Profil enseignant du compte s'il est professeur, null pour la direction. */
    private function professeur(Request $request)
    {
        if ($request->user()->role !== Roles::PROFESSOR) {
            return null;
        }

        return $request->user()->enseignantUniversite
            ?? abort(403, 'Aucun profil enseignant n’est rattaché à ce compte.');
    }

    /** L'UE, si le compte peut la noter (403 pour l'UE d'un collègue). */
    private function matiereAutorisee(Request $request, int $id): Matiere
    {
        $ue = Matiere::findOrFail($id);
        $enseignant = $this->professeur($request);

        if ($enseignant && (int) $ue->enseignant_id !== (int) $enseignant->id) {
            abort(403, 'Vous n’enseignez pas cette UE.');
        }

        return $ue;
    }

    /** @param int[] $etudiantIds */
    private function exigerFiliere(Matiere $ue, array $etudiantIds): void
    {
        $dansLaFiliere = Etudiant::whereIn('id', $etudiantIds)->where('filiere_id', $ue->filiere_id)->count();

        if ($dansLaFiliere !== count(array_unique($etudiantIds))) {
            throw ValidationException::withMessages([
                'etudiant_id' => 'Un ou plusieurs étudiants ne sont pas inscrits dans la filière de cette UE.',
            ]);
        }
    }
}
