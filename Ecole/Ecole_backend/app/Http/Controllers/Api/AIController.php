<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * AIController — Points d'entrée API pour l'assistant IA EduPilot
 *
 * Routes préfixées par /api/v1/ia/
 * Toutes les routes nécessitent une authentification Sanctum
 * et sont limitées en débit (20 req/min, configuré dans RouteServiceProvider).
 */
class AIController extends Controller
{
    public function __construct(
        protected AIService $ai
    ) {}

    /**
     * Chat général avec l'IA (utilisé par l'assistant flottant)
     */
    public function chat(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
            'contexte' => 'nullable|string|max:500',
            'mode' => 'nullable|in:tuteur,assistant,conseiller,general',
        ]);

        $systemPrompts = [
            'tuteur' => "Tu es un tuteur IA patient et pédagogue. Guide l'élève vers la compréhension.",
            'assistant' => "Tu es un assistant pédagogique pour enseignants. Aide à préparer les cours et à analyser les résultats.",
            'conseiller' => "Tu es un conseiller pédagogique pour parents. Donne des conseils éducatifs pratiques.",
            'general' => "Tu es un assistant IA polyvalent pour le système de gestion scolaire École.",
        ];

        $systemPrompt = $systemPrompts[$validated['mode']] ?? $systemPrompts['general'];

        $messages = [
            ['role' => 'user', 'content' => $validated['message']],
        ];

        $result = $this->ai->chat($systemPrompt, $messages);

        return response()->json([
            'success' => $result['success'],
            'content' => $result['content'],
            'usage' => $result['usage'],
        ]);
    }

    /**
     * Analyse prédictive pour le tableau de bord du directeur
     */
    public function predictiveAnalysis(Request $request)
    {
        $request->validate([
            'periode_id' => 'nullable|exists:periodes,id',
        ]);

        // Récupérer les données statistiques
        $stats = $this->getDashboardStats($request->periode_id);
        $result = $this->ai->analysePredictive($stats);

        return response()->json([
            'success' => $result['success'],
            'data' => $result['success'] ? json_decode($result['content'], true) : null,
            'fallback' => !$result['success'],
        ]);
    }

    /**
     * Assistant de cours pour enseignants
     */
    public function lessonPlan(Request $request)
    {
        $validated = $request->validate([
            'matiere' => 'required|string|max:255',
            'classe' => 'required|string|max:255',
            'sujet' => 'required|string|max:500',
            'duree' => 'nullable|string|max:50',
            'niveau' => 'nullable|string|max:50',
        ]);

        $result = $this->ai->generateLessonPlan(
            $validated['matiere'],
            $validated['classe'],
            $validated['sujet'],
            [
                'duration' => $validated['duree'] ?? '1 heure',
                'level' => $validated['niveau'] ?? 'intermédiaire',
            ]
        );

        return response()->json([
            'success' => $result['success'],
            'data' => $result['success'] ? json_decode($result['content'], true) : $result['content'],
        ]);
    }

    /**
     * Tutorat IA pour élèves
     */
    public function tutor(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:1000',
            'matiere' => 'required|string|max:255',
            'niveau' => 'nullable|string|max:50',
        ]);

        $result = $this->ai->tutorStudent(
            $validated['question'],
            $validated['matiere'],
            $validated['niveau'] ?? null,
        );

        return response()->json([
            'success' => $result['success'],
            'content' => $result['content'],
        ]);
    }

    /**
     * Chatbot parent
     */
    public function parentAssistant(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:1000',
            'enfant_nom' => 'nullable|string|max:255',
            'classe' => 'nullable|string|max:255',
        ]);

        $result = $this->ai->parentChat($validated['question'], [
            'enfant_nom' => $validated['enfant_nom'] ?? null,
            'classe' => $validated['classe'] ?? null,
        ]);

        return response()->json([
            'success' => $result['success'],
            'content' => $result['content'],
        ]);
    }

    /**
     * Analyse des résultats académiques
     */
    public function analyzeResults(Request $request)
    {
        $validated = $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'periode_id' => 'nullable|exists:periodes,id',
        ]);

        // Récupérer les notes
        $notes = \App\Models\Note::whereHas('eleve', fn($q) => $q->where('classe_id', $validated['classe_id']))
            ->when($validated['periode_id'], fn($q, $id) => $q->where('periode_id', $id))
            ->with(['eleve', 'matiere'])
            ->get()
            ->groupBy('eleve_id')
            ->map(fn($eleveNotes) => [
                'nom' => $eleveNotes->first()->eleve->nom . ' ' . $eleveNotes->first()->eleve->prenom,
                'moyenne' => round($eleveNotes->avg('valeur'), 2),
                'matieres' => $eleveNotes->groupBy('matiere.nom')
                    ->map(fn($n) => round($n->avg('valeur'), 2))
                    ->toArray(),
            ]);

        $stats = [
            'total_eleves' => $notes->count(),
            'moyenne_generale' => round($notes->avg('moyenne'), 2),
            'meilleur' => $notes->sortByDesc('moyenne')->first(),
            'moins_bon' => $notes->sortBy('moyenne')->first(),
            'distribution' => [
                'excellent' => $notes->where('moyenne', '>=', 16)->count(),  // 16-20
                'bien' => $notes->where('moyenne', '>=', 12)->where('moyenne', '<', 16)->count(),
                'moyen' => $notes->where('moyenne', '>=', 10)->where('moyenne', '<', 12)->count(),
                'insuffisant' => $notes->where('moyenne', '<', 10)->count(),
            ],
        ];

        $result = $this->ai->analyseAcademicResults($stats);

        return response()->json([
            'success' => true,
            'stats' => $stats,
            'analysis' => $result['success'] ? json_decode($result['content'], true) : null,
            'ia_disponible' => $result['success'],
        ]);
    }

    /**
     * Récupère les statistiques pour le dashboard prédictif
     */
    protected function getDashboardStats(?int $periodeId): array
    {
        $elevesCount = \App\Models\Eleve::count();
        $enseignantsCount = \App\Models\User::where('role', 'like', '%enseignant%')->count();
        $classesCount = \App\Models\Classes::count();

        $notesQuery = \App\Models\Notes::query();
        if ($periodeId) $notesQuery->where('periode', $periodeId);
        $moyenneGenerale = round($notesQuery->avg('note') ?? 0, 2);

        $paiementsTotal = \App\Models\PaiementEleve::sum('montant');

        return [
            'periode' => $periodeId,
            'ecole' => [
                'eleves' => $elevesCount,
                'enseignants' => $enseignantsCount,
                'classes' => $classesCount,
            ],
            'academique' => [
                'moyenne_generale' => $moyenneGenerale,
                'taux_reussite' => $moyenneGenerale >= 10 ? round(($moyenneGenerale / 20) * 100, 1) : 0,
            ],
            'financier' => [
                'total_collecte' => $paiementsTotal,
            ],
        ];
    }
}
