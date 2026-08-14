<?php

namespace Tests\Feature\Api;

use App\Models\Absence;
use App\Models\Classes;
use App\Models\Coefficients;
use App\Models\ConsultationMedicale;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Emprunt;
use App\Models\Enseignant;
use App\Models\Livre;
use App\Models\Matieres;
use App\Models\Notes;
use App\Models\Series;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Régression des métriques des dashboards (audit P3).
 *
 * Des compteurs affichaient des données qui ne correspondaient à aucune source :
 * enseignants comptés sur un champ null (super-admin), `matiere->coefficient`
 * inexistant (toujours 1), `enseignants_count` d'une relation qui n'existe pas
 * (toujours 0), absences additionnées sur toutes les années, élèves comptés deux
 * fois quand deux absences le même jour, `transferts` codé en dur à 0, et un
 * graphique d'effectifs croisant libellés scolaires avec données civiles.
 */
class DashboardMetricsRegressionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function school(): Ecole
    {
        return Ecole::factory()->create(['status' => 'active']);
    }

    /* ─── total_enseignants (directeur) ─────────────────────────────── */

    /** @test */
    public function directeur_compte_les_enseignants_de_son_ecole()
    {
        $schoolA = $this->school();
        $schoolB = $this->school();
        Enseignant::factory()->forSchool($schoolA)->count(3)->create();
        Enseignant::factory()->forSchool($schoolB)->count(5)->create();

        $directeur = User::factory()->create(['role' => 'directeur', 'ecole_id' => $schoolA->id]);

        $this->actingAs($directeur)
            ->getJson('/api/dashboard/directeur/data')
            ->assertStatus(200)
            ->assertJsonPath('data.stats.total_enseignants', 3);
    }

    /** @test */
    public function super_admin_ciblant_une_ecole_compte_ses_enseignants()
    {
        $school = $this->school();
        Enseignant::factory()->forSchool($school)->count(5)->create();

        $superAdmin = User::factory()->create(['role' => 'super-admin', 'ecole_id' => null]);

        // L'ancien compte filtrait `users.role = 'enseignant'` sur
        // `user->ecole_id` (null ici) : il renvoyait 0.
        $this->actingAs($superAdmin)
            ->withHeaders(['X-Ecole-Id' => $school->id])
            ->getJson('/api/dashboard/directeur/data')
            ->assertStatus(200)
            ->assertJsonPath('data.stats.total_enseignants', 5);
    }

    /* ─── evolution_effectifs (année scolaire) ──────────────────────── */

    /** @test */
    public function evolution_effectifs_suit_l_annee_scolaire_et_pas_l_annee_civile()
    {
        $school = $this->school();
        $directeur = User::factory()->create(['role' => 'directeur', 'ecole_id' => $school->id]);

        // Début de l'année scolaire en cours : septembre (de cette année si on y
        // est déjà, sinon de l'année précédente).
        $debut = now()->month >= 9
            ? now()->copy()->startOfMonth()->month(9)
            : now()->copy()->startOfMonth()->month(9)->subYear();

        // 2 élèves inscrits en septembre, 1 ce mois-ci, 1 hors fenêtre (avant
        // septembre de l'année scolaire). L'ancien code, qui croisait libellés
        // scolaires avec `whereYear(now()->year)`, perdait les premiers.
        Eleve::factory()->forSchool($school)->count(2)->create(['created_at' => $debut->copy()->addDays(3)]);
        Eleve::factory()->forSchool($school)->create(['created_at' => now()]);
        Eleve::factory()->forSchool($school)->create(['created_at' => $debut->copy()->subMonths(2)->addDays(1)]);

        $evolution = $this->actingAs($directeur)
            ->getJson('/api/dashboard/directeur/data')
            ->assertStatus(200)
            ->json('data.stats.evolution_effectifs');

        $this->assertCount(12, $evolution);
        $this->assertSame('Sept', $evolution[0]['name']);
        $this->assertSame(2, $evolution[0]['students']);
        $this->assertSame(3, collect($evolution)->sum('students'));
    }

    /* ─── surveillant : élèves distincts ─────────────────────────────── */

    /** @test */
    public function surveillant_compte_un_eleve_absent_une_fois_par_jour()
    {
        $school = $this->school();
        $surveillant = User::factory()->create(['role' => 'surveillant', 'ecole_id' => $school->id]);

        $eleves = Eleve::factory()->forSchool($school)->count(3)->create();

        // Deux lignes d'absence le même jour pour le même élève : un seul absent.
        Absence::create(['eleve_id' => $eleves[0]->id, 'ecole_id' => $school->id, 'date' => today(), 'type' => 'absence']);
        Absence::create(['eleve_id' => $eleves[0]->id, 'ecole_id' => $school->id, 'date' => today(), 'type' => 'absence']);
        // Un retard n'est pas une absence.
        Absence::create(['eleve_id' => $eleves[1]->id, 'ecole_id' => $school->id, 'date' => today(), 'type' => 'retard']);

        $response = $this->actingAs($surveillant)
            ->getJson('/api/dashboard/surveillant')
            ->assertStatus(200);

        $this->assertSame('3', $response->json('data.stats.0.value')); // Total Élèves
        $this->assertSame('2', $response->json('data.stats.1.value')); // Présents Aujourd'hui
        $this->assertSame('1', $response->json('data.stats.2.value')); // Absents
    }

    /* ─── secretaire : année + transferts retiré ─────────────────────── */

    /** @test */
    public function secretaire_compte_les_nouveaux_du_mois_de_l_annee_courante()
    {
        $school = $this->school();
        $secretaire = User::factory()->create(['role' => 'secretaire', 'ecole_id' => $school->id]);

        Eleve::factory()->forSchool($school)->count(2)->create(['created_at' => now()]);
        // Même mois, année précédente : ne doit pas compter.
        Eleve::factory()->forSchool($school)->create(['created_at' => now()->subYear()]);

        $response = $this->actingAs($secretaire)
            ->getJson('/api/dashboard/secretaire')
            ->assertStatus(200);

        $this->assertSame('3', $response->json('data.stats.0.value'));  // Inscriptions
        $this->assertSame('2', $response->json('data.stats.1.value'));  // Nouveaux ce Mois
        $this->assertArrayNotHasKey('transferts', $response->json('data.flux_inscriptions')[0]);
    }

    /* ─── élève : coefficients réels + absences de l'année ───────────── */

    /** @test */
    public function eleve_voit_les_coefficients_reels_et_ses_absences_de_l_annee()
    {
        $school = $this->school();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);
        $serie = Series::factory()->create(['ecole_id' => $school->id]);

        $eleve = Eleve::factory()->forSchool($school)->create([
            'classe_id' => $classe->id,
            'serie_id'  => $serie->id,
        ]);

        $matiere = Matieres::factory()->create(['ecole_id' => $school->id]);
        Coefficients::create([
            'matiere_id'  => $matiere->id,
            'classe_id'   => $classe->id,
            'serie_id'    => $serie->id,
            'coefficient' => 4,
            'ecole_id'    => $school->id,
        ]);

        Notes::factory()->create([
            'eleve_id'       => $eleve->id,
            'matiere_id'     => $matiere->id,
            'classe_id'      => $classe->id,
            'note'           => 12,
            'date_evaluation' => now(),
            'ecole_id'       => $school->id,
        ]);

        // Même mois, année précédente : ne doit pas compter dans absences_mois.
        Absence::create([
            'eleve_id' => $eleve->id,
            'ecole_id' => $school->id,
            'date'     => now()->subYear(),
            'type'     => 'absence',
        ]);

        $response = $this->actingAs($eleve->user)
            ->getJson('/api/dashboard/eleve')
            ->assertStatus(200);

        $this->assertSame(4, $response->json('data.matieres.0.coeff'));
        $this->assertSame(1, $response->json('data.stats.total_notes'));
        $this->assertSame(0, $response->json('data.stats.absences_mois'));
    }

    /* ─── université : enseignants par faculté ───────────────────────── */

    /** @test */
    public function universite_compte_les_enseignants_par_faculte()
    {
        $school = $this->school();
        $recteur = User::factory()->create(['role' => 'recteur', 'ecole_id' => $school->id]);

        $faculte = \App\Models\Universite\Faculte::factory()->forSchool($school)->create();
        $departement = \App\Models\Universite\Departement::factory()->create([
            'ecole_id'   => $school->id,
            'faculte_id' => $faculte->id,
        ]);
        \App\Models\Universite\Enseignant::factory()->count(2)->create([
            'ecole_id'      => $school->id,
            'departement_id' => $departement->id,
        ]);

        $response = $this->actingAs($recteur)
            ->getJson('/api/dashboard/universite')
            ->assertStatus(200);

        $this->assertSame(2, $response->json('data.facultes.0.enseignants'));
    }

    /* ─── bibliothécaire : membres actifs sur 6 mois ─────────────────── */

    /** @test */
    public function bibliothecaire_compte_les_membres_actifs_sur_la_fenetre_de_6_mois()
    {
        $school = $this->school();
        $bibliothecaire = User::factory()->create(['role' => 'bibliothecaire', 'ecole_id' => $school->id]);

        $eleveActif = Eleve::factory()->forSchool($school)->create();
        $eleveAncien = Eleve::factory()->forSchool($school)->create();

        $livre = Livre::create([
            'titre'              => 'Les Misérables',
            'auteur'             => 'Victor Hugo',
            'isbn'               => '978-2253004226',
            'categorie'          => 'Roman',
            'annee_publication'  => 1862,
            'nombre_exemplaires' => 2,
            'disponible'         => true,
            'ecole_id'           => $school->id,
        ]);

        Emprunt::create([
            'livre_id'           => $livre->id,
            'eleve_id'           => $eleveActif->id,
            'ecole_id'           => $school->id,
            'date_emprunt'       => now(),
            'date_retour_prevue' => now()->addDays(7),
        ]);
        // Emprunt il y a 7 mois : hors fenêtre d'activité.
        Emprunt::create([
            'livre_id'           => $livre->id,
            'eleve_id'           => $eleveAncien->id,
            'ecole_id'           => $school->id,
            'date_emprunt'       => now()->subMonths(7),
            'date_retour_prevue' => now()->subMonths(7)->addDays(7),
        ]);

        $response = $this->actingAs($bibliothecaire)
            ->getJson('/api/dashboard/bibliothecaire')
            ->assertStatus(200);

        $this->assertSame('1', $response->json('data.stats.3.value')); // Membres Actifs
    }

    /* ─── infirmier : visites de l'année courante ────────────────────── */

    /** @test */
    public function infirmier_filtre_les_visites_et_urgences_par_annee()
    {
        $school = $this->school();
        $infirmier = User::factory()->create(['role' => 'infirmier', 'ecole_id' => $school->id]);
        $eleve = Eleve::factory()->forSchool($school)->create();

        ConsultationMedicale::create([
            'eleve_id'   => $eleve->id,
            'ecole_id'   => $school->id,
            'motif'      => 'Fièvre',
            'diagnostic' => 'Bilan',
            'date'       => today(),
            'urgence'    => false,
        ]);
        // Même mois, année précédente : ne doit compter ni dans les visites ni
        // dans les urgences.
        ConsultationMedicale::create([
            'eleve_id'   => $eleve->id,
            'ecole_id'   => $school->id,
            'motif'      => 'Toux',
            'diagnostic' => 'Bilan',
            'date'       => today()->subYear(),
            'urgence'    => true,
        ]);

        $response = $this->actingAs($infirmier)
            ->getJson('/api/dashboard/infirmier')
            ->assertStatus(200);

        $this->assertSame('1', $response->json('data.stats.0.value')); // Visites du Mois
        $this->assertSame('0', $response->json('data.stats.2.value')); // Cas Urgents
    }
}
