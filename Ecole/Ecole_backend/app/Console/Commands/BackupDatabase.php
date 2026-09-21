<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

/**
 * Sauvegarde chiffrée de la base, vers un disque configurable
 * (config/backup.php — `local` par défaut, `s3` une fois l'hébergement
 * décidé, sans changement de code).
 *
 * Chaîne : dump (mysqldump / copie SQLite) → gzip → chiffrement AES-256-CBC
 * (OpenSSL, clé distincte d'APP_KEY — voir config/backup.php) → envoi sur le
 * disque configuré → suppression de tout fichier local intermédiaire, y
 * compris le dump en clair. Rien de lisible ne doit survivre sur le disque
 * local une fois l'exécution terminée, que la destination finale soit locale
 * ou distante.
 *
 * `backup:restore` (RestoreEncryptedBackup) fait le chemin inverse — c'est
 * lui qui prouve qu'une sauvegarde chiffrée sert à quelque chose.
 */
class BackupDatabase extends Command
{
    protected $signature = 'backup:run';

    protected $description = 'Sauvegarde chiffrée de la base vers le disque configuré (config/backup.php)';

    public function handle(): int
    {
        $key = config('backup.encryption_key');
        if (empty($key)) {
            $this->error('BACKUP_ENCRYPTION_KEY absente : une sauvegarde en clair ne protège personne. Générer avec `openssl rand -base64 32`.');
            return 1;
        }

        $connection = config('database.default');
        $tmpDir = storage_path('app/backup-tmp');
        File::ensureDirectoryExists($tmpDir);

        $stem = 'backup_' . now()->format('Y-m-d_His');
        $plainPath = null;

        try {
            $plainPath = match ($connection) {
                'mysql' => $this->dumpMysql($tmpDir, $stem),
                'sqlite' => $this->dumpSqlite($tmpDir, $stem),
                default => throw new \RuntimeException("Moteur non pris en charge : {$connection}"),
            };

            $gzPath = $this->compress($plainPath);
            $encPath = $this->encrypt($gzPath, $key);

            $remoteName = basename($encPath);
            $remotePath = trim(config('backup.path'), '/') . '/' . $remoteName;
            $disk = config('backup.disk');

            Storage::disk($disk)->put($remotePath, File::get($encPath));

            $size = $this->formatBytes(Storage::disk($disk)->size($remotePath));
            $this->info("Sauvegarde chiffrée envoyée : [{$disk}] {$remotePath} ({$size})");

            $this->cleanupOldBackups($disk);

            return 0;
        } catch (\Throwable $e) {
            $this->error("Échec de la sauvegarde : {$e->getMessage()}");
            return 1;
        } finally {
            // Toujours nettoyer les fichiers locaux intermédiaires, même sur
            // échec : un dump en clair oublié dans storage/ après une
            // exception serait exactement le risque que ce chiffrement existe
            // pour éviter.
            File::deleteDirectory($tmpDir);
        }
    }

    private function dumpMysql(string $tmpDir, string $stem): string
    {
        $config = config('database.connections.mysql');
        $filepath = "{$tmpDir}/{$stem}.sql";

        $socket = $config['unix_socket'] ?? '';
        $socketArg = !empty($socket)
            ? '--socket=' . escapeshellarg($socket)
            : '--host=' . escapeshellarg($config['host']) . ' --port=' . escapeshellarg((string) $config['port']);

        // Mot de passe en variable d'environnement (MYSQL_PWD), pas en
        // argument de ligne de commande : un argument de processus reste
        // visible aux autres utilisateurs de la machine via `ps aux` pendant
        // toute l'exécution, une variable d'environnement de ce process ne
        // l'est pas de la même façon.
        $cmd = sprintf(
            'MYSQL_PWD=%s mysqldump --no-tablespaces %s -u %s %s > %s 2>&1',
            escapeshellarg((string) ($config['password'] ?? '')),
            $socketArg,
            escapeshellarg($config['username']),
            escapeshellarg($config['database']),
            escapeshellarg($filepath)
        );

        exec($cmd, $output, $exitCode);

        if ($exitCode !== 0) {
            @unlink($filepath);
            throw new \RuntimeException('mysqldump a échoué : ' . implode("\n", $output));
        }

        return $filepath;
    }

    private function dumpSqlite(string $tmpDir, string $stem): string
    {
        $databasePath = config('database.connections.sqlite.database');

        if ($databasePath === ':memory:' || !File::exists($databasePath)) {
            throw new \RuntimeException("Fichier SQLite introuvable ou en mémoire uniquement : {$databasePath}");
        }

        $filepath = "{$tmpDir}/{$stem}.sqlite";
        File::copy($databasePath, $filepath);

        return $filepath;
    }

    private function compress(string $plainPath): string
    {
        if (!function_exists('gzopen')) {
            $this->line('Extension gz absente, sauvegarde non compressée.');
            return $plainPath;
        }

        $gzPath = "{$plainPath}.gz";
        $source = File::get($plainPath);

        $gz = gzopen($gzPath, 'wb9');
        gzwrite($gz, $source);
        gzclose($gz);

        return $gzPath;
    }

    /**
     * `openssl enc`, pas `openssl_encrypt()` de PHP : la commande shell
     * traite le fichier en flux, sans jamais charger un dump potentiellement
     * volumineux entier en mémoire PHP — cohérent avec le choix déjà fait
     * pour `mysqldump` lui-même juste au-dessus.
     */
    private function encrypt(string $gzPath, string $key): string
    {
        $encPath = "{$gzPath}.enc";

        $cmd = sprintf(
            'OPENSSL_BACKUP_KEY=%s openssl enc -aes-256-cbc -salt -pbkdf2 -pass env:OPENSSL_BACKUP_KEY -in %s -out %s 2>&1',
            escapeshellarg($key),
            escapeshellarg($gzPath),
            escapeshellarg($encPath)
        );

        exec($cmd, $output, $exitCode);

        if ($exitCode !== 0) {
            throw new \RuntimeException('Chiffrement OpenSSL échoué : ' . implode("\n", $output));
        }

        return $encPath;
    }

    private function cleanupOldBackups(string $disk): void
    {
        $path = config('backup.path');
        $cutoff = now()->subDays(config('backup.retention_days'))->timestamp;
        $removed = 0;

        foreach (Storage::disk($disk)->files($path) as $file) {
            if (Storage::disk($disk)->lastModified($file) < $cutoff) {
                Storage::disk($disk)->delete($file);
                $removed++;
            }
        }

        if ($removed > 0) {
            $this->line("{$removed} sauvegarde(s) au-delà de la rétention supprimée(s).");
        }
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['o', 'Ko', 'Mo', 'Go'];
        $i = 0;
        $size = (float) $bytes;

        while ($size >= 1024 && $i < count($units) - 1) {
            $size /= 1024;
            $i++;
        }

        return round($size, 2) . ' ' . $units[$i];
    }
}
