<?php

namespace App\Http\Resources;

use Illuminate\Http\JsonResponse;

/**
 * ApiResponse — Structure de réponse API unifiée
 *
 * Toutes les réponses JSON suivent ce format pour la cohérence
 * entre le frontend et le backend.
 */
class ApiResponse
{
    /**
     * Succès avec données
     */
    public static function success(mixed $data = null, string $message = 'Opération réussie', int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    /**
     * Succès avec message uniquement
     */
    public static function ok(string $message = 'Opération réussie', int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
        ], $code);
    }

    /**
     * Création réussie
     */
    public static function created(mixed $data = null, string $message = 'Ressource créée avec succès'): JsonResponse
    {
        return self::success($data, $message, 201);
    }

    /**
     * Erreur
     */
    public static function error(string $message = 'Une erreur est survenue', int $code = 400, mixed $errors = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }

    /**
     * Erreur de validation
     */
    public static function validationError(mixed $errors, string $message = 'Données invalides'): JsonResponse
    {
        return self::error($message, 422, $errors);
    }

    /**
     * Non trouvé
     */
    public static function notFound(string $message = 'Ressource non trouvée'): JsonResponse
    {
        return self::error($message, 404);
    }

    /**
     * Non autorisé
     */
    public static function unauthorized(string $message = 'Action non autorisée'): JsonResponse
    {
        return self::error($message, 403);
    }

    /**
     * Pagination avec métadonnées
     */
    public static function paginated(mixed $data, string $message = 'Liste récupérée avec succès'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data->items(),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
                'has_more_pages' => $data->hasMorePages(),
            ],
        ]);
    }
}
