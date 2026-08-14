<?php

namespace Tests\Feature\Api;

use App\Models\Absence;
use App\Models\Certificat;
use App\Models\Classes;
use App\Models\ConsultationMedicale;
use App\Models\Depense;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Emprunt;
use App\Models\Enseignant;
use App\Models\Incident;
use App\Models\Livre;
use App\Models\PaiementEleve;
use App\Models\RendezVous;
use App\Models\Sanction;
use App\Models\User;
use App\Models\UserParent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Contrats des 6 dashboards staff (`/api/dashboard/{role}`).
 *
 * Le front indexe les cartes par position (STATS_META[i]) et lit des clés
 * précises (`donnes_ca`, `presences_semaine`, `evolution`, `motifs`, …) :
 * chaque endpoint doit donc retourner un ensemble exact de clés, sans colonne
 * inexistante (statut sur `paiements`/`emprunts`, nom visiteur sur
 * `rendez_vous`).
 */
class StaffDashboardContractTest extends TestCase
{
    use RefreshDatabase;

    private function school(): Ecole
    {
        return Ecole::factory()->create(['status' => 'active']);
    }

    private function staff(Ecole $school, string $role): User
    {
        return User::factory()->create(['role' => $role, 'ecole_id' => $school->id]);
    }

    private function classe(Ecole $school, string $categorie = 'Secondaire'): Classes
    {
        return Classes::factory()->create([
            'ecole_id'         => $school->id,
            'categorie_classe' => $categorie,
        ]);
    }

    private function eleve(Ecole $school, Classes $classe): Eleve
    {
        return Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
    }

    private function assignClass(Enseignant $teacher, Classes $classe, Ecole $school): void
    {
        $serieId = DB::table('series')->insertGetId([
            'nom'        => 'Serie dashboard',
            'ecole_id'   => $school->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $teacher->classes()->attach($classe->id, [
            'matiere_id' => \App\Models\Matieres::factory()->create(['ecole_id' => $school->id])->id,
            'serie_id'   => $serieId,
            'ecole_id'   => $school->id,
        ]);
    }

    private function titles(array $stats): array
    {
        return array_column($stats, 'title');
    }

    /* ─── Comptable ─────────────────────────────────────────────────── */

    /** @test */
    public function comptable_dashboard_returns_the_financial_contract()
    {
        $school = $this->school();
        $user   = $this->staff($school, 'comptable');

        $classe = $this->classe($school);
        $eleve  = $this->eleve($school, $classe);

        PaiementEleve::factory()->count(3)->create([
            'eleve_id'      => $eleve->id,
            'ecole_id'      => $school->id,
            'date_paiement' => now(),
            'type_paiement' => 'Scolarité',
            'statut_global' => PaiementEleve::PAID,
        ]);
        PaiementEleve::factory()->create([
            'eleve_id'      => $eleve->id,
            'ecole_id'      => $school->id,
            'date_paiement' => now(),
            'type_paiement' => 'Scolarité',
            'statut_global' => PaiementEleve::PENDING,
        ]);
        Depense::create([
            'ecole_id'    => $school->id,
            'categorie'   => 'Manutention',
            'description' => 'Fournitures',
            'montant'     => 25000,
            'date_depense' => now(),
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/dashboard/comptable')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSame(
            ['Revenus du Mois', 'Factures en Attente', 'Taux Recouvrement', 'Dépenses du Mois'],
            $this->titles($response->json('data.stats'))
        );
        $this->assertCount(6, $response->json('data.donnes_ca'));
        $response->assertJsonStructure([
            'data' => [
                'donnes_ca'       => [['mois', 'revenus', 'depenses']],
                'repartition'     => [['name', 'value']],
                'factures'        => [['id', 'eleve', 'classe', 'montant', 'statut', 'echeance']],
            ],
        ]);

        $factures = $response->json('data.factures');
        $this->assertCount(4, $factures);
        $statuts = collect($factures)->pluck('statut');
        $this->assertContains('Payée', $statuts);
        $this->assertContains('En attente', $statuts);
    }

    /* ─── Surveillant ───────────────────────────────────────────────── */

    /** @test */
    public function surveillant_dashboard_returns_the_daily_oversight_contract()
    {
        $school = $this->school();
        $user   = $this->staff($school, 'surveillant');

        $classe  = $this->classe($school, 'Secondaire');
        $eleveA  = $this->eleve($school, $classe);
        $eleveB  = $this->eleve($school, $classe);

        $teacher = Enseignant::factory()->forSchool($school)->create();
        $this->assignClass($teacher, $classe, $school);

        Absence::create(['eleve_id' => $eleveA->id, 'ecole_id' => $school->id, 'date' => today(), 'type' => 'absence', 'justifiee' => false, 'motif' => 'Maladie']);
        Absence::create(['eleve_id' => $eleveB->id, 'ecole_id' => $school->id, 'date' => today(), 'type' => 'retard', 'justifiee' => true, 'motif' => 'Transport']);
        Incident::create([
            'ecole_id'    => $school->id,
            'description' => 'Bagarre dans la cour',
            'date'        => now(),
            'gravite'     => 'moyenne',
            'statut'      => 'en_cours',
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/dashboard/surveillant')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSame(
            ['Total Élèves', "Présents Aujourd'hui", 'Absents', 'Alertes'],
            $this->titles($response->json('data.stats'))
        );
        $this->assertCount(7, $response->json('data.presences_semaine'));
        $response->assertJsonStructure([
            'data' => [
                'presences_semaine'   => [['jour', 'presents', 'absents']],
                'points_surveillance' => [['zone', 'personnels', 'etat']],
                'retards'             => [['id', 'eleve', 'classe', 'temps', 'motif', 'recurrent']],
            ],
        ]);

        $retards = $response->json('data.retards');
        $this->assertCount(1, $retards);
        $this->assertSame('Transport', $retards[0]['motif']);
        $this->assertFalse($retards[0]['recurrent']);

        $zones = $response->json('data.points_surveillance');
        $this->assertSame('Secondaire', $zones[0]['zone']);
        $this->assertGreaterThanOrEqual(1, $zones[0]['personnels']);
        $this->assertSame('Actif', $zones[0]['etat']);
    }

    /* ─── Censeur ───────────────────────────────────────────────────── */

    /** @test */
    public function censeur_dashboard_returns_the_discipline_contract()
    {
        $school = $this->school();
        $user   = $this->staff($school, 'censeur');

        $classe = $this->classe($school);
        $eleve  = $this->eleve($school, $classe);

        Sanction::create([
            'eleve_id'      => $eleve->id,
            'ecole_id'      => $school->id,
            'type_sanction' => 'Avertissement',
            'motif'         => 'Bavardage',
            'date'          => now(),
            'duree'         => null,
            'statut'        => 'active',
        ]);
        Sanction::create([
            'eleve_id'      => $eleve->id,
            'ecole_id'      => $school->id,
            'type_sanction' => 'Exclusion',
            'motif'         => 'Violence',
            'date'          => now(),
            'statut'        => 'terminee',
        ]);
        Absence::create([
            'eleve_id'  => $eleve->id,
            'ecole_id'  => $school->id,
            'date'      => today(),
            'type'      => 'absence',
            'justifiee' => false,
            'motif'     => null,
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/dashboard/censeur')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSame(
            ['Total Élèves', 'Sanctions du Mois', 'Absences Non Justifiées', 'Avertissements'],
            $this->titles($response->json('data.stats'))
        );
        $this->assertCount(6, $response->json('data.evolution'));
        $response->assertJsonStructure([
            'data' => [
                'evolution'       => [['mois', 'sanctions', 'avertissements']],
                'types_sanctions' => [['name', 'value']],
                'sanctions'       => [['id', 'eleve', 'classe', 'motif', 'sanction', 'date', 'statut']],
            ],
        ]);

        $sanctions = $response->json('data.sanctions');
        $this->assertCount(2, $sanctions);
        $this->assertSame('En cours', collect($sanctions)->firstWhere('sanction', 'Avertissement')['statut']);
        $this->assertSame('Exécuté', collect($sanctions)->firstWhere('sanction', 'Exclusion')['statut']);
        $this->assertEquals(1, $response->json('data.stats.3.value'));
    }

    /* ─── Infirmier ─────────────────────────────────────────────────── */

    /** @test */
    public function infirmier_dashboard_returns_the_health_contract()
    {
        $school = $this->school();
        $user   = $this->staff($school, 'infirmier');

        $classe = $this->classe($school);
        $eleve  = $this->eleve($school, $classe);

        foreach (['Maux de tête', 'Fièvre', 'Angine'] as $i => $motif) {
            ConsultationMedicale::create([
                'eleve_id'   => $eleve->id,
                'ecole_id'   => $school->id,
                'motif'      => $motif,
                'diagnostic' => 'Bilan',
                'date'       => today(),
                'traitement' => 'Repos',
                'urgence'    => false,
            ]);
        }
        ConsultationMedicale::create([
            'eleve_id'   => $eleve->id,
            'ecole_id'   => $school->id,
            'motif'      => 'Maux de tête',
            'diagnostic' => 'Céphalée de tension',
            'date'       => now(),
            'traitement' => 'Paracétamol',
            'urgence'    => true,
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/dashboard/infirmier')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSame(
            ['Visites du Mois', 'En Cours', 'Cas Urgents', 'Consultations'],
            $this->titles($response->json('data.stats'))
        );
        $this->assertCount(6, $response->json('data.frequentation'));
        $response->assertJsonStructure([
            'data' => [
                'frequentation' => [['mois', 'visites', 'urgences']],
                'motifs'        => [['motif', 'count']],
                'visites'       => [['id', 'eleve', 'classe', 'motif', 'soin', 'statut', 'heure']],
            ],
        ]);

        $this->assertEquals(4, $response->json('data.stats.0.value'));
        $this->assertEquals(4, $response->json('data.stats.3.value'));
        $visites = $response->json('data.visites');
        $this->assertMatchesRegularExpression('/^\d{1,2}:\d{2}$/', $visites[0]['heure']);
    }

    /* ─── Bibliothécaire ────────────────────────────────────────────── */

    /** @test */
    public function bibliothecaire_dashboard_returns_the_lending_contract()
    {
        $school = $this->school();
        $user   = $this->staff($school, 'bibliothecaire');

        $classe = $this->classe($school);
        $eleve  = $this->eleve($school, $classe);

        $livre = Livre::create([
            'ecole_id'          => $school->id,
            'titre'             => 'Le Rouge et le Noir',
            'auteur'            => 'Stendhal',
            'isbn'              => '978-2-07-036002-4',
            'categorie'         => 'Roman',
            'annee_publication' => 2010,
            'nombre_exemplaires' => 3,
            'disponible'        => true,
        ]);

        Emprunt::create([
            'livre_id'            => $livre->id,
            'eleve_id'            => $eleve->id,
            'ecole_id'            => $school->id,
            'date_emprunt'        => today()->subDays(5),
            'date_retour_prevue'  => today()->addDays(9),
            'date_retour_effective' => null,
        ]);
        Emprunt::create([
            'livre_id'            => $livre->id,
            'eleve_id'            => $eleve->id,
            'ecole_id'            => $school->id,
            'date_emprunt'        => today()->subDays(20),
            'date_retour_prevue'  => today()->subDays(10),
            'date_retour_effective' => null,
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/dashboard/bibliothecaire')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSame(
            ['Total Ouvrages', 'Emprunts en Cours', 'Retards', 'Membres Actifs'],
            $this->titles($response->json('data.stats'))
        );
        $this->assertCount(6, $response->json('data.activite'));
        $response->assertJsonStructure([
            'data' => [
                'activite'   => [['mois', 'emprunts', 'retours']],
                'categories' => [['name', 'value']],
                'emprunts'   => [['id', 'eleve', 'classe', 'ouvrage', 'dateEmprunt', 'dateRetour', 'statut']],
            ],
        ]);

        $emprunts = $response->json('data.emprunts');
        $this->assertCount(2, $emprunts);
        $this->assertSame('En cours', collect($emprunts)->first()['statut']);
        $this->assertSame('En retard', collect($emprunts)->last()['statut']);
    }

    /* ─── Secrétaire ────────────────────────────────────────────────── */

    /** @test */
    public function secretaire_dashboard_returns_the_registry_contract()
    {
        $school = $this->school();
        $user   = $this->staff($school, 'secretaire');

        $classe = $this->classe($school);
        $eleve  = $this->eleve($school, $classe);

        Certificat::create([
            'ecole_id'        => $school->id,
            'type_certificat' => 'Scolarité',
            'eleve_id'        => $eleve->id,
            'date_emission'   => now(),
            'numero_certificat' => 'CERT-001',
            'delivre'         => false,
        ]);

        $parent = UserParent::factory()->forSchool($school)->create();
        RendezVous::create([
            'ecole_id'    => $school->id,
            'motif'       => 'Orientation',
            'parent_id'   => $parent->id,
            'eleve_id'    => $eleve->id,
            'date'        => now(),
            'heure'       => '10:30',
            'statut'      => 'confirmé',
        ]);

        $eleve2 = $this->eleve($school, $classe);
        Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);

        $response = $this->actingAs($user)
            ->getJson('/api/dashboard/secretaire')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSame(
            ['Inscriptions', 'Nouveaux ce Mois', 'Dossiers en Cours', 'Documents Générés'],
            $this->titles($response->json('data.stats'))
        );
        $this->assertCount(6, $response->json('data.flux_inscriptions'));
        $response->assertJsonStructure([
            'data' => [
                'flux_inscriptions' => [['mois', 'nouveaux']],
                'rendez_vous'       => [['id', 'visiteur', 'motif', 'heure', 'statut']],
                'inscriptions'      => [['id', 'nom', 'classe', 'type', 'date', 'statut']],
            ],
        ]);

        $rdv = $response->json('data.rendez_vous')[0] ?? null;
        $this->assertNotNull($rdv);
        $this->assertSame('Orientation', $rdv['motif']);
        $this->assertSame('Confirmé', $rdv['statut']);
        $this->assertNotEmpty(trim($rdv['visiteur']));
        $this->assertEquals(3, $response->json('data.stats.0.value'));
        $this->assertEquals(1, $response->json('data.stats.2.value'));
        $this->assertEquals(1, $response->json('data.stats.3.value'));
    }
}