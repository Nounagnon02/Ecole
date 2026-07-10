<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AIService — Service d'intégration IA (Anthropic Claude)
 *
 * Centralise tous les appels à l'API Anthropic Claude pour :
 * - Analyse prédictive des performances scolaires
 * - Génération de rapports intelligents
 * - Assistant pédagogique pour enseignants
 * - Tutorat personnalisé pour élèves
 * - Chatbot pour parents
 *
 * @package App\Services
 */
class AIService
{
    protected string $apiKey;
    protected string $model;
    protected int $maxTokens;
    protected float $temperature;

    public function __construct()
    {
        $this->apiKey = config('services.anthropic.api_key', '');
        $this->model = config('services.anthropic.model', 'claude-sonnet-4-20250514');
        $this->maxTokens = config('services.anthropic.max_tokens', 4096);
        $this->temperature = config('services.anthropic.temperature', 0.7);
    }

    /**
     * Point d'entrée unique — envoie un prompt à Claude et retourne la réponse
     */
    public function chat(string $systemPrompt, array $messages, array $options = []): array
    {
        if (empty($this->apiKey)) {
            return $this->fallbackResponse('Clé API IA non configurée');
        }

        try {
            $response = Http::withHeaders([
                'x-api-key' => $this->apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ])->post('https://api.anthropic.com/v1/messages', array_merge([
                'model' => $options['model'] ?? $this->model,
                'max_tokens' => $options['max_tokens'] ?? $this->maxTokens,
                'temperature' => $options['temperature'] ?? $this->temperature,
                'system' => $systemPrompt,
                'messages' => $messages,
            ], $options));

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'content' => $data['content'][0]['text'] ?? '',
                    'usage' => $data['usage'] ?? [],
                    'model' => $data['model'] ?? $this->model,
                ];
            }

            Log::error('IA API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return $this->fallbackResponse('Erreur API IA : ' . $response->status());

        } catch (\Exception $e) {
            Log::error('IA Service exception', ['error' => $e->getMessage()]);
            return $this->fallbackResponse('Service IA temporairement indisponible');
        }
    }

    /**
     * Analyse prédictive : tendances et prédictions pour un directeur
     */
    public function analysePredictive(array $stats): array
    {
        $systemPrompt = "Tu es un analyste de données scolaires expert. Analyse les statistiques fournies et génère :
1. 3-5 tendances clés identifiées
2. 2-3 prédictions pour le prochain trimestre
3. 3-5 recommandations actionnables
4. 2-3 alertes potentielles
Réponds en JSON strict avec les clés : trends, predictions, recommendations, alerts";

        return $this->chat($systemPrompt, [
            ['role' => 'user', 'content' => json_encode($stats, JSON_PRETTY_PRINT)],
        ]);
    }

    /**
     * Assistant pédagogique : génération de plans de cours
     */
    public function generateLessonPlan(string $subject, string $class, string $topic, array $options = []): array
    {
        $duration = $options['duration'] ?? '1 heure';
        $level = $options['level'] ?? 'intermédiaire';

        $systemPrompt = "Tu es un professeur expert en pédagogie. Génère un plan de cours détaillé.
Format : objectifs, prérequis, déroulé (5 phases), exercices, évaluation.
Réponds en JSON structuré.";

        $prompt = "Matière : {$subject}\nClasse : {$class}\nSujet : {$topic}\nDurée : {$duration}\nNiveau : {$level}";

        return $this->chat($systemPrompt, [
            ['role' => 'user', 'content' => $prompt],
        ]);
    }

    /**
     * Tutorat : réponse à une question d'élève
     */
    public function tutorStudent(string $question, string $subject, ?string $level = null): array
    {
        $systemPrompt = "Tu es un tuteur patient et encourageant. Guide l'élève vers la réponse sans la donner directement.
Utilise la méthode socratique : pose des questions, donne des indices, félicite les progrès.
Adapte ton langage au niveau de l'élève.";

        $niveau = $level ?? 'non spécifié';
        $prompt = "Matière : {$subject}\nNiveau : {$niveau}\nQuestion : {$question}";

        return $this->chat($systemPrompt, [
            ['role' => 'user', 'content' => $prompt],
        ]);
    }

    /**
     * Chatbot parent : réponse aux questions des parents
     */
    public function parentChat(string $question, array $contexte = []): array
    {
        $enfant = $contexte['enfant_nom'] ?? 'votre enfant';
        $classe = $contexte['classe'] ?? 'sa classe';

        $systemPrompt = "Tu es un conseiller pédagogique expert. Tu réponds aux questions des parents
d'élèves de manière claire, empathique et professionnelle.
Tu parles en français et tu donnes des conseils pratiques et actionnables.";

        $prompt = "Contexte : parent de {$enfant}, en {$classe}\nQuestion : {$question}";

        return $this->chat($systemPrompt, [
            ['role' => 'user', 'content' => $prompt],
        ]);
    }

    /**
     * Analyse automatique des résultats scolaires
     */
    public function analyseAcademicResults(array $results): array
    {
        $systemPrompt = "Tu es un analyste de données éducatives. Analyse les résultats fournis et :
1. Calcule les statistiques clés (moyenne, médiane, écart-type)
2. Identifie les élèves en difficulté
3. Suggère des interventions personnalisées
4. Détecte les tendances par matière
Réponds en JSON.";

        return $this->chat($systemPrompt, [
            ['role' => 'user', 'content' => json_encode($results, JSON_PRETTY_PRINT)],
        ]);
    }

    /**
     * Génération d'appréciations personnalisées pour bulletins
     */
    public function generateAppreciation(array $studentData): array
    {
        $systemPrompt = "Tu es un professeur qui rédige des appréciations de bulletin.
Génère une appréciation personnalisée (2-3 phrases) qui :
- Mentionne les points forts
- Identifie un axe d'amélioration
- Propose une action concrète
- Reste encourageante
Style professionnel et bienveillant.";

        return $this->chat($systemPrompt, [
            ['role' => 'user', 'content' => json_encode($studentData, JSON_PRETTY_PRINT)],
        ]);
    }

    /**
     * Fallback si l'API n'est pas configurée
     */
    protected function fallbackResponse(string $reason): array
    {
        return [
            'success' => false,
            'content' => "⚠️ {$reason}. Les fonctionnalités IA seront disponibles après configuration de la clé API Anthropic dans config/services.php.",
            'usage' => [],
            'model' => 'fallback',
        ];
    }
}
