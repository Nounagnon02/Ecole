<?php

namespace Tests\Feature\Jobs;

use App\Jobs\CleanupExpiredSessions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * `sessions.last_activity` est un `integer` (timestamp Unix — voir la
 * migration `create_sessions_table`), pas un `datetime`. `handle()` le
 * comparait à `now()->subMinutes(...)`, un Carbon : lié en paramètre PDO, il
 * se sérialise en chaîne `'2026-09-20 10:35:31'`.
 *
 * En MySQL 8 (production), la colonne est strictement typée : la requête
 * lève `PDOException: SQLSTATE[22007] Invalid datetime format` et le job
 * échoue à chaque exécution — planifié `->hourly()` dans `bootstrap/app.php`,
 * il n'a donc jamais nettoyé une seule session depuis son écriture (cf.
 * audit AUTH-18, jamais réellement refermé).
 *
 * SQLite (moteur de la suite de tests) n'a pas cette rigueur : une colonne à
 * affinité INTEGER comparée à une chaîne suit la règle d'ordre des types de
 * SQLite (NULL < INTEGER/REAL < TEXT), où *tout* entier est « inférieur » à
 * *toute* chaîne. Le même bug s'y manifeste donc autrement : au lieu
 * d'échouer, la requête supprime absolument toutes les lignes, expirées ou
 * non. On teste donc le comportement (une session récente doit survivre),
 * pas le message d'erreur MySQL — le test attrape le défaut sur les deux
 * moteurs.
 */
class CleanupExpiredSessionsTest extends TestCase
{
    use RefreshDatabase;

    private function seedSession(string $id, int $lastActivity): void
    {
        DB::table('sessions')->insert([
            'id' => $id,
            'user_id' => null,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'test',
            'payload' => base64_encode('test'),
            'last_activity' => $lastActivity,
        ]);
    }

    /** @test */
    public function it_deletes_sessions_older_than_the_configured_lifetime_and_keeps_recent_ones()
    {
        config(['session.lifetime' => 120]);

        $this->seedSession('expiree', now()->subMinutes(200)->getTimestamp());
        $this->seedSession('recente', now()->subMinutes(5)->getTimestamp());

        (new CleanupExpiredSessions())->handle();

        $this->assertFalse(
            DB::table('sessions')->where('id', 'expiree')->exists(),
            'Une session inactive depuis plus longtemps que session.lifetime doit être supprimée.'
        );
        $this->assertTrue(
            DB::table('sessions')->where('id', 'recente')->exists(),
            "Une session encore active ne doit pas être supprimée — avant le correctif, la comparaison "
                . 'Carbon-contre-entier supprimait soit rien (MySQL, exception), soit tout (SQLite, règle '
                . "d'ordre des types)."
        );
    }

    /** @test */
    public function it_does_nothing_when_the_sessions_table_is_absent()
    {
        DB::statement('DROP TABLE sessions');

        (new CleanupExpiredSessions())->handle();

        $this->assertTrue(true, "Ne doit pas lever d'exception quand la table n'existe pas.");
    }
}
