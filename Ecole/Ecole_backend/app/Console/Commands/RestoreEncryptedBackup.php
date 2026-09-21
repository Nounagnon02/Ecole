<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

/**
 * Restaure une sauvegarde chiffrée (voir BackupDatabase) — vers une base
 * séparée par défaut, jamais celle configurée par l'application sans
 * `--force` explicite.
 *
 * C'est cette commande, pas seulement l'existence d'un fichier `.enc` quelque
 * part, qui prouve qu'une sauvegarde chiffrée sert à quelque chose :
 * l'exercice de restauration trimestriel mentionné dans le plan d'ajouts
 * consiste à la lancer pour de vrai contre une base neuve, périodiquement —
 * une sauvegarde jamais restaurée n'est qu'une hypothèse.
 */
class RestoreEncryptedBackup extends Command
{
    protected $signature = 'backup:restore {file} {--database=} {--force}';

    protected $description = 'Restaure une sauvegarde chiffrée vers une base de vérification (jamais celle de l\'application sans --force)';

    public function handle(): int
    {
        $key = config('backup.encryption_key');
        if (empty($key)) {
            $this->error('BACKUP_ENCRYPTION_KEY absente : impossible de déchiffrer quoi que ce soit.');
            return 1;
        }

        $targetDatabase = $this->option('database');
        if (empty($targetDatabase)) {
            $this->error('--database est obligatoire : nomme explicitement la base de destination (jamais un défaut implicite pour cette opération).');
            return 1;
        }

        $connection = config('database.default');
        $ownDatabase = $connection === 'sqlite'
            ? config('database.connections.sqlite.database')
            : config('database.connections.mysql.database');

        if ($targetDatabase === $ownDatabase && !$this->option('force')) {
            $this->error("« {$targetDatabase} » est la base configurée de l'application. Ajouter --force pour écraser une base réelle par une restauration — sinon, nommer une base de vérification séparée.");
            return 1;
        }

        $disk = config('backup.disk');
        $remotePath = trim(config('backup.path'), '/') . '/' . $this->argument('file');

        if (!Storage::disk($disk)->exists($remotePath)) {
            $this->error("Introuvable sur le disque [{$disk}] : {$remotePath}");
            return 1;
        }

        $tmpDir = storage_path('app/restore-tmp');
        File::ensureDirectoryExists($tmpDir);

        try {
            $encPath = "{$tmpDir}/download.enc";
            File::put($encPath, Storage::disk($disk)->get($remotePath));

            $gzPath = $this->decrypt($encPath, $key);
            $plainPath = $this->decompress($gzPath);

            match ($connection) {
                'mysql' => $this->restoreMysql($plainPath, $targetDatabase),
                'sqlite' => $this->restoreSqlite($plainPath, $targetDatabase),
                default => throw new \RuntimeException("Moteur non pris en charge : {$connection}"),
            };

            $this->info("Restauration terminée dans « {$targetDatabase} ».");

            return 0;
        } catch (\Throwable $e) {
            $this->error("Échec de la restauration : {$e->getMessage()}");
            return 1;
        } finally {
            File::deleteDirectory($tmpDir);
        }
    }

    private function decrypt(string $encPath, string $key): string
    {
        $gzPath = str_replace('.enc', '', $encPath) . '.gz';

        $cmd = sprintf(
            'OPENSSL_BACKUP_KEY=%s openssl enc -d -aes-256-cbc -pbkdf2 -pass env:OPENSSL_BACKUP_KEY -in %s -out %s 2>&1',
            escapeshellarg($key),
            escapeshellarg($encPath),
            escapeshellarg($gzPath)
        );

        exec($cmd, $output, $exitCode);

        if ($exitCode !== 0) {
            throw new \RuntimeException('Déchiffrement OpenSSL échoué (mauvaise clé ?) : ' . implode("\n", $output));
        }

        return $gzPath;
    }

    private function decompress(string $gzPath): string
    {
        $plainPath = str_replace('.gz', '', $gzPath);

        $gz = gzopen($gzPath, 'rb');
        $out = fopen($plainPath, 'wb');
        while (!gzeof($gz)) {
            fwrite($out, gzread($gz, 1024 * 1024));
        }
        gzclose($gz);
        fclose($out);

        return $plainPath;
    }

    private function restoreMysql(string $plainPath, string $database): void
    {
        $config = config('database.connections.mysql');

        $createCmd = sprintf(
            'MYSQL_PWD=%s mysql -u %s -h %s -P %s -e %s 2>&1',
            escapeshellarg((string) ($config['password'] ?? '')),
            escapeshellarg($config['username']),
            escapeshellarg($config['host']),
            escapeshellarg((string) $config['port']),
            escapeshellarg("CREATE DATABASE IF NOT EXISTS `{$database}`")
        );
        exec($createCmd, $createOutput, $createExit);
        if ($createExit !== 0) {
            throw new \RuntimeException('Création de la base cible échouée : ' . implode("\n", $createOutput));
        }

        $restoreCmd = sprintf(
            'MYSQL_PWD=%s mysql -u %s -h %s -P %s %s < %s 2>&1',
            escapeshellarg((string) ($config['password'] ?? '')),
            escapeshellarg($config['username']),
            escapeshellarg($config['host']),
            escapeshellarg((string) $config['port']),
            escapeshellarg($database),
            escapeshellarg($plainPath)
        );
        exec($restoreCmd, $restoreOutput, $restoreExit);
        if ($restoreExit !== 0) {
            throw new \RuntimeException('Chargement du dump échoué : ' . implode("\n", $restoreOutput));
        }
    }

    private function restoreSqlite(string $plainPath, string $targetPath): void
    {
        File::copy($plainPath, $targetPath);
    }
}
