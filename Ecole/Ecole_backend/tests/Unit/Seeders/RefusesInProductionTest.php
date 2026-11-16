<?php

namespace Tests\Unit\Seeders;

use App\Models\User;
use Database\Seeders\AdminUsersSeeder;
use Database\Seeders\BeninEducationSeeder;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DemoDataSeeder;
use Database\Seeders\FixParentLinksSeeder;
use Database\Seeders\UniversiteSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Chaque seeder qui crée des comptes au mot de passe unique et prévisible
 * (`password` — cf. `credentials.md`) doit refuser de tourner en production,
 * quelle que soit la façon dont il est invoqué (`migrate:fresh --seed`,
 * `db:seed`, ou `db:seed --class=...` isolé — rien ne garantit que
 * `DatabaseSeeder` soit dans la boucle). Avant `RefusesInProduction`, rien ne
 * l'en empêchait : seule l'absence de `--seed` dans les scripts de déploiement
 * actuels protégeait la production, une garantie fragile.
 */
class RefusesInProductionTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, array{class-string<\Illuminate\Database\Seeder>}> */
    public static function seederClasses(): array
    {
        return [
            'DatabaseSeeder' => [DatabaseSeeder::class],
            'AdminUsersSeeder' => [AdminUsersSeeder::class],
            'BeninEducationSeeder' => [BeninEducationSeeder::class],
            'DemoDataSeeder' => [DemoDataSeeder::class],
            'FixParentLinksSeeder' => [FixParentLinksSeeder::class],
            'UniversiteSeeder' => [UniversiteSeeder::class],
        ];
    }

    /**
     * Appelle directement la méthode protégée du trait, sans passer par
     * l'exécution réelle du seeder : certains (`UniversiteSeeder`) exigent
     * des données préalables (une école) pour aller au bout, et « aucun
     * utilisateur créé » serait alors vrai même si le garde ne servait à
     * rien — un faux négatif de mutation testing. Cette méthode teste
     * exactement le comportement changé, rien d'autre.
     */
    private function abortIfProduction(string $seederClass): bool
    {
        $method = new ReflectionMethod($seederClass, 'abortIfProduction');
        $method->setAccessible(true);

        return $method->invoke(new $seederClass());
    }

    /**
     * @test
     * @dataProvider seederClasses
     */
    public function it_refuses_to_run_in_production(string $seederClass)
    {
        app()['env'] = 'production';

        try {
            $this->assertTrue(
                $this->abortIfProduction($seederClass),
                "{$seederClass} ne refuse pas de tourner en production."
            );
        } finally {
            app()['env'] = 'testing';
        }
    }

    /**
     * @test
     * @dataProvider seederClasses
     */
    public function it_does_not_refuse_outside_production(string $seederClass)
    {
        $this->assertFalse($this->abortIfProduction($seederClass));
    }

    /**
     * Bout en bout, sur un cas concret : même passé `--force` (ce qu'un
     * script de déploiement non interactif utilise pour contourner la
     * confirmation qu'Illuminate\Console\ConfirmableTrait pose déjà en
     * production), aucun compte n'est créé.
     *
     * @test
     */
    public function end_to_end_forced_seeding_creates_no_account_in_production()
    {
        $usersBefore = User::withoutGlobalScopes()->count();

        app()['env'] = 'production';

        try {
            $this->artisan('db:seed', ['--class' => AdminUsersSeeder::class, '--force' => true]);
        } finally {
            app()['env'] = 'testing';
        }

        $this->assertSame($usersBefore, User::withoutGlobalScopes()->count());
    }

    /** @test */
    public function it_still_seeds_normally_outside_production()
    {
        $this->assertSame('testing', app()->environment());

        // AdminUsersSeeder crée un compte par rôle et par école : sans école,
        // la boucle ne tourne pas et le test ne prouverait rien.
        \App\Models\Ecole::factory()->create(['status' => 'active']);

        $this->seed(AdminUsersSeeder::class);

        $this->assertGreaterThan(0, User::withoutGlobalScopes()->count());
    }
}
