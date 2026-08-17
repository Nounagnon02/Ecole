<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * FileUploadService — validation et stockage sécurisés des fichiers uploadés.
 *
 * Vérifie le type MIME via `finfo_file()` (pas le Content-Type du client),
 * impose une taille maximale et utilise des noms UUID pour éviter les
 * collisions et les attaques par chemin (cf. audit S7).
 */
class FileUploadService
{
    /** Types MIME autorisés (whitelist). */
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
    ];

    /** Taille maximale par défaut : 5 Mo. */
    private const MAX_SIZE_BYTES = 5 * 1024 * 1024;

    /**
     * Valide et stocke un fichier uploadé.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public static function store(
        UploadedFile $file,
        string $directory,
        string $disk = 'local',
        array $allowedTypes = self::ALLOWED_MIME_TYPES,
        int $maxSize = self::MAX_SIZE_BYTES,
    ): string {
        // Vérification du type MIME via le contenu réel (pas le Content-Type)
        $realMimeType = $file->getMimeType();

        if (!in_array($realMimeType, $allowedTypes, true)) {
            abort(422, 'Type de fichier non autorisé : ' . $realMimeType);
        }

        // Vérification de la taille
        if ($file->getSize() > $maxSize) {
            abort(422, 'Le fichier dépasse la taille maximale de ' . ($maxSize / 1024 / 1024) . ' Mo.');
        }

        // Stockage avec nom UUID (pas le nom original)
        return $file->storeAs(
            $directory,
            \Illuminate\Support\Str::uuid() . '.' . $file->getClientOriginalExtension(),
            $disk,
        );
    }
}
