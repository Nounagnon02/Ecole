<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use PDO;
use Tests\TestCase;

/**
 * `backup:run` / `backup:restore` contre un vrai serveur MySQL, pas SQLite.
 *
 * La suite tourne sur SQLite (phpunit.xml) — exactement l'écart moteur que
 * cet audit a trouvé ailleurs comme angle mort à répétition (webhook,
 * `CleanupExpiredSessions`, ...). Un backup qui ne se prouve que sur SQLite
 * ne prouverait rien sur `mysqldump`/`mysql` en ligne de commande, le seul
 * chemin réellement utilisé en production. On bascule donc explicitement
 * `database.default` sur `mysql` pour ce fichier, avec les identifiants déjà
 * configurés dans `.env` local — jamais codés en dur ici — contre deux bases
 * jetables dédiées, jamais `ecole` elle-même.
 *
 * Sauté silencieusement si aucun serveur MySQL n'est joignable (CI sur
 * SQLite uniquement, poste sans MySQL local) : la garantie qui compte est que
 * ce test tourne bien là où un vrai environnement MySQL existe, pas qu'il
 * bloque tout le reste quand ce n'est pas le cas.
 */
class BackupRestoreTest extends TestCase
{
    private string $sourceDb = 'ecole_backup_test_source';
    private string $restoreDb = 'ecole_backup_test_restore';
    private string $backupPath;
    private array $mysqlConfig;

    protected function setUp(): void
    {
        parent::setUp();

        $this->mysqlConfig = config('database.connections.mysql');
        $this->backupPath = 'test-backups-' . uniqid();

        try {
            $pdo = $this->rootPdo();
        } catch (\Throwable $e) {
            $this->markTestSkipped('MySQL injoignable localement : ' . $e->getMessage());
        }

        foreach ([$this->sourceDb, $this->restoreDb] as $db) {
            $pdo->exec("DROP DATABASE IF EXISTS `{$db}`");
        }
        $pdo->exec("CREATE DATABASE `{$this->sourceDb}`");

        $pdo->exec("USE `{$this->sourceDb}`");
        $pdo->exec('CREATE TABLE marqueur (id INT PRIMARY KEY, valeur VARCHAR(255))');
        $pdo->exec("INSERT INTO marqueur VALUES (1, 'ce-contenu-doit-survivre-a-la-restauration')");

        config([
            'database.default' => 'mysql',
            'database.connections.mysql.database' => $this->sourceDb,
            'backup.disk' => 'local',
            'backup.path' => $this->backupPath,
            'backup.retention_days' => 30,
            'backup.encryption_key' => 'clef-de-test-ne-sert-a-rien-en-dehors-de-ce-fichier',
        ]);

        Storage::fake('local');
    }

    protected function tearDown(): void
    {
        try {
            $pdo = $this->rootPdo();
            foreach ([$this->sourceDb, $this->restoreDb] as $db) {
                $pdo->exec("DROP DATABASE IF EXISTS `{$db}`");
            }
        } catch (\Throwable) {
            // Rien à nettoyer si MySQL n'était déjà pas joignable.
        }

        parent::tearDown();
    }

    private function rootPdo(): PDO
    {
        $c = $this->mysqlConfig;

        return new PDO(
            "mysql:host={$c['host']};port={$c['port']}",
            $c['username'],
            $c['password'],
            [PDO::ATTR_TIMEOUT => 3, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    }

    /** @test */
    public function a_backup_is_genuinely_encrypted_and_fully_restorable()
    {
        $exitCode = Artisan::call('backup:run');
        $this->assertSame(0, $exitCode, Artisan::output());

        $files = Storage::disk('local')->files($this->backupPath);
        $this->assertCount(1, $files, 'Une seule sauvegarde attendue.');
        $this->assertStringEndsWith('.enc', $files[0]);

        // Le point du chiffrement : le contenu marqueur ne doit apparaître
        // NULLE PART en clair dans le fichier envoyé, ni le SQL brut du dump
        // (INSERT INTO, CREATE TABLE...).
        $encryptedContent = Storage::disk('local')->get($files[0]);
        $this->assertStringNotContainsString('ce-contenu-doit-survivre-a-la-restauration', $encryptedContent);
        $this->assertStringNotContainsString('CREATE TABLE', $encryptedContent);
        $this->assertStringNotContainsString('INSERT INTO', $encryptedContent);

        $restoreExit = Artisan::call('backup:restore', [
            'file' => basename($files[0]),
            '--database' => $this->restoreDb,
        ]);
        $this->assertSame(0, $restoreExit, Artisan::output());

        $pdo = $this->rootPdo();
        $pdo->exec("USE `{$this->restoreDb}`");
        $row = $pdo->query('SELECT valeur FROM marqueur WHERE id = 1')->fetch(PDO::FETCH_ASSOC);

        $this->assertSame('ce-contenu-doit-survivre-a-la-restauration', $row['valeur'] ?? null);
    }

    /** @test */
    public function it_refuses_to_run_without_an_encryption_key()
    {
        config(['backup.encryption_key' => null]);

        $exitCode = Artisan::call('backup:run');

        $this->assertSame(1, $exitCode);
        $this->assertEmpty(Storage::disk('local')->files($this->backupPath));
    }

    /** @test */
    public function restore_refuses_to_target_the_configured_database_without_force()
    {
        Artisan::call('backup:run');
        $files = Storage::disk('local')->files($this->backupPath);

        $exitCode = Artisan::call('backup:restore', [
            'file' => basename($files[0]),
            '--database' => $this->sourceDb, // la base "de l'application" pour ce test
        ]);

        $this->assertSame(1, $exitCode);
        $this->assertStringContainsString('--force', Artisan::output());
    }

    /** @test */
    public function old_backups_beyond_retention_are_removed()
    {
        Storage::disk('local')->put("{$this->backupPath}/ancien.sql.gz.enc", 'contenu-perime');
        // `lastModified()` du disque `local` fake reflète l'heure réelle
        // d'écriture, pas un horodatage falsifiable directement : la
        // rétention est donc vérifiée en repoussant `now()` plutôt que le
        // fichier, ce qui exerce la même comparaison que le code réel.
        $this->travel(31)->days();

        config(['backup.retention_days' => 30]);
        Artisan::call('backup:run');

        $this->assertFalse(Storage::disk('local')->exists("{$this->backupPath}/ancien.sql.gz.enc"));
    }
}
