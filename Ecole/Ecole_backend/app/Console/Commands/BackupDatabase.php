<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class BackupDatabase extends Command
{
    protected $signature = 'backup:run {--path=}';

    protected $description = 'Backup the database (MySQL via mysqldump, SQLite via file copy)';

    public function handle(): int
    {
        $connection = config('database.default');

        try {
            match ($connection) {
                'mysql' => $this->backupMysql(),
                'sqlite' => $this->backupSqlite(),
                default => $this->error("Unsupported database driver: {$connection}"),
            };

            $this->cleanupOldBackups();

            return 0;
        } catch (\Throwable $e) {
            $this->error("Backup failed: {$e->getMessage()}");
            return 1;
        }
    }

    private function backupMysql(): void
    {
        $config = config('database.connections.mysql');

        $host = $config['host'];
        $port = $config['port'];
        $database = $config['database'];
        $username = $config['username'];
        $password = $config['password'];

        $backupDir = $this->option('path') ?? storage_path('app/backups');
        File::makeDirectory($backupDir, 0755, true, true);

        $filename = 'backup_' . now()->format('Y-m-d_His') . '.sql';
        $filepath = rtrim($backupDir, '/') . '/' . $filename;

        $socket = $config['unix_socket'] ?? '';
        $socketArg = !empty($socket) ? "--socket={$socket}" : "--host={$host} --port={$port}";

        $cmd = sprintf(
            'mysqldump --no-tablespaces %s -u %s %s %s > %s 2>&1',
            $socketArg,
            escapeshellarg($username),
            !empty($password) ? '-p' . escapeshellarg($password) : '',
            escapeshellarg($database),
            escapeshellarg($filepath)
        );

        exec($cmd, $output, $exitCode);

        if ($exitCode !== 0) {
            @unlink($filepath);
            throw new \RuntimeException('mysqldump failed: ' . implode("\n", $output));
        }

        $this->compressFile($filepath);

        $this->logSuccess($filepath);
    }

    private function backupSqlite(): void
    {
        $databasePath = config('database.connections.sqlite.database');

        if (!File::exists($databasePath)) {
            throw new \RuntimeException("SQLite database file not found: {$databasePath}");
        }

        $backupDir = $this->option('path') ?? storage_path('app/backups');
        File::makeDirectory($backupDir, 0755, true, true);

        $filename = 'backup_' . now()->format('Y-m-d_His') . '.sqlite';
        $filepath = rtrim($backupDir, '/') . '/' . $filename;

        File::copy($databasePath, $filepath);

        $this->compressFile($filepath);

        $this->logSuccess($filepath);
    }

    private function compressFile(string $filepath): void
    {
        if (!function_exists('gzopen')) {
            $this->line('gz extension not available, skipping compression.');
            return;
        }

        $gzPath = $filepath . '.gz';
        $source = file_get_contents($filepath);

        if ($source === false) {
            return;
        }

        $gz = gzopen($gzPath, 'wb9');
        if ($gz === false) {
            return;
        }

        gzwrite($gz, $source);
        gzclose($gz);

        File::delete($filepath);
    }

    private function cleanupOldBackups(): void
    {
        $backupDir = $this->option('path') ?? storage_path('app/backups');

        if (!File::isDirectory($backupDir)) {
            return;
        }

        $files = File::files($backupDir);
        $cutoff = now()->subDays(30);
        $removed = 0;

        foreach ($files as $file) {
            if ($file->getMTime() < $cutoff->timestamp) {
                File::delete($file->getRealPath());
                $removed++;
            }
        }

        if ($removed > 0) {
            $this->line("Cleaned up {$removed} old backup(s).");
        }
    }

    private function logSuccess(string $filepath): void
    {
        $size = File::exists($filepath) ? File::size($filepath) : 0;

        if (File::exists($filepath . '.gz')) {
            $size = File::size($filepath . '.gz');
            $filepath = $filepath . '.gz';
        }

        $humanSize = $this->formatBytes($size);
        $this->info("Backup saved: {$filepath} ({$humanSize})");
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        $size = (float) $bytes;

        while ($size >= 1024 && $i < count($units) - 1) {
            $size /= 1024;
            $i++;
        }

        return round($size, 2) . ' ' . $units[$i];
    }
}
