<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Emprunt;
use App\Models\Livre;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * Jours de retard et pénalité des emprunts de la bibliothèque.
 *
 * Carbon 3 rend `diffInDays()` signé : `today()->diffInDays($échéance)` avec
 * une échéance passée est négatif. Le dashboard bibliothécaire affichait donc
 * « -3 jours de retard ». Les accesseurs du modèle `Emprunt` partent, eux, de
 * l'échéance et sont gardés par `$retour <= $échéance` : ils étaient justes,
 * mais rien ne le fixait — d'où les tests de caractérisation ci-dessous.
 */
class LibraryLatenessTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);
        $this->travelTo(Carbon::parse('2026-09-19 10:00:00'));
    }

    protected function tearDown(): void
    {
        $this->travelBack();
        parent::tearDown();
    }

    private function emprunt(string $prevue, ?string $retourEffectif = null): Emprunt
    {
        $livre = Livre::create([
            'titre' => 'Les Soleils des indépendances',
            'auteur' => 'Ahmadou Kourouma',
            'isbn' => '978-' . uniqid(),
            'categorie' => 'Roman',
            'annee_publication' => 1968,
            'nombre_exemplaires' => 1,
            'disponible' => true,
            'ecole_id' => $this->school->id,
        ]);
        $eleve = Eleve::factory()->forSchool($this->school)->create();

        return Emprunt::create([
            'livre_id' => $livre->id,
            'eleve_id' => $eleve->id,
            'date_emprunt' => '2026-09-01',
            'date_retour_prevue' => $prevue,
            'date_retour_effective' => $retourEffectif,
            'ecole_id' => $this->school->id,
        ]);
    }

    /* ─── Accesseurs du modèle (caractérisation) ─────────────────────── */

    /** @test */
    public function an_overdue_loan_costs_100_francs_per_full_day_late()
    {
        $emprunt = $this->emprunt('2026-09-16');

        $this->assertSame(3, $emprunt->jours_retard);
        $this->assertSame(300, $emprunt->penalite);
    }

    /** @test */
    public function a_loan_due_today_is_not_late()
    {
        $emprunt = $this->emprunt('2026-09-19');

        $this->assertSame(0, $emprunt->jours_retard);
        $this->assertSame(0, $emprunt->penalite);
    }

    /** @test */
    public function a_loan_not_yet_due_has_no_negative_lateness_or_penalty()
    {
        $emprunt = $this->emprunt('2026-09-22');

        $this->assertSame(0, $emprunt->jours_retard);
        $this->assertSame(0, $emprunt->penalite);
    }

    /** @test */
    public function a_returned_loan_is_measured_to_its_return_date_not_to_today()
    {
        $emprunt = $this->emprunt('2026-09-10', '2026-09-13');

        $this->assertSame(3, $emprunt->jours_retard);
        $this->assertSame(300, $emprunt->penalite);
    }

    /** @test */
    public function a_loan_returned_before_its_due_date_has_no_penalty()
    {
        $emprunt = $this->emprunt('2026-09-12', '2026-09-10');

        $this->assertSame(0, $emprunt->jours_retard);
        $this->assertSame(0, $emprunt->penalite);
    }

    /** @test */
    public function the_penalty_is_capped_at_10000_francs()
    {
        $emprunt = $this->emprunt('2026-01-01');

        $this->assertGreaterThan(100, $emprunt->jours_retard);
        $this->assertSame(10000, $emprunt->penalite);
    }

    /* ─── Dashboard bibliothécaire ────────────────────────────────────── */

    /** @test */
    public function the_librarian_dashboard_reports_a_positive_number_of_days_late()
    {
        $librarian = User::factory()->create(['role' => 'bibliothecaire', 'ecole_id' => $this->school->id]);
        $this->emprunt('2026-09-16');

        $data = $this->actingAs($librarian)
            ->getJson('/api/dashboard/bibliothecaire')
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $data['retards_liste']);
        $this->assertSame(3, $data['retards_liste'][0]['jours_retard']);
    }
}
