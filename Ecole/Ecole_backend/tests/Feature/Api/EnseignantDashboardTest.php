<?php

namespace Tests\Feature\Api;

use App\Models\Classes;
use App\Models\Devoir;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\EmploiDuTemps;
use App\Models\Enseignant;
use App\Models\EnseignantMatiere;
use App\Models\Matieres;
use App\Models\Notes;
use App\Models\Series;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * Contrat du dashboard enseignant.
 *
 * Le frontend (`dashboards/enseignant`) consomme :
 * - `stats` : 4 cartes (Mes Élèves, Cours Cette Semaine, Moyenne Classe,
 *   Devoirs à Corriger) ;
 * - `emploi_temps` : tableau de `{jour, cours[]}` avec aujourd'hui en tête ;
 * - `notes_recentes` : lignes plates `{id, eleve, classe, matiere, note,
 *   date, appreciation}` (le contrat imposait des objets embarqués, ce qui
 *   cassait le rendu) ;
 * - `devoirs` : échéances à venir `{id, titre, classe, date, etat}`.
 *
 * L'enseignant ne voit que les notes de SES classes/matières.
 */
class EnseignantDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function school(): Ecole
    {
        return Ecole::factory()->create(['status' => 'active']);
    }

    private function classe(Ecole $school, string $nom): Classes
    {
        return Classes::factory()->create([
            'ecole_id'  => $school->id,
            'nom_classe' => $nom,
        ]);
    }

    private function matiere(Ecole $school): Matieres
    {
        return Matieres::factory()->create(['ecole_id' => $school->id]);
    }

    private function enseignant(Ecole $school): Enseignant
    {
        return Enseignant::factory()->forSchool($school)->create();
    }

    /** Affecte l'enseignant à (classe, matière) puis authentifie son compte. */
    private function actingAsEnseignant(Enseignant $enseignant, Classes $classe, Matieres $matiere): void
    {
        $serie = Series::factory()->create(['ecole_id' => $enseignant->ecole_id, 'nom' => '6ème']);
        EnseignantMatiere::create([
            'enseignant_id' => $enseignant->id,
            'classe_id'     => $classe->id,
            'matiere_id'    => $matiere->id,
            'serie_id'      => $serie->id,
            'ecole_id'      => $enseignant->ecole_id,
        ]);

        $this->actingAs($enseignant->user);
    }

    private function eleve(Ecole $school, Classes $classe): Eleve
    {
        return Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
    }

    /** @test */
    public function dashboard_enseignant_returns_the_full_frontend_contract()
    {
        $school = $this->school();
        $classe = $this->classe($school, '6e A');
        $matiere = $this->matiere($school);
        $enseignant = $this->enseignant($school);
        $this->actingAsEnseignant($enseignant, $classe, $matiere);

        // Élèves + notes dans la (classe, matière) de l'enseignant.
        $eleve1 = $this->eleve($school, $classe);
        $eleve2 = $this->eleve($school, $classe);
        Notes::factory()->create(['ecole_id' => $school->id, 'eleve_id' => $eleve1->id, 'classe_id' => $classe->id, 'matiere_id' => $matiere->id, 'note' => 16]);
        Notes::factory()->create(['ecole_id' => $school->id, 'eleve_id' => $eleve2->id, 'classe_id' => $classe->id, 'matiere_id' => $matiere->id, 'note' => 12]);

        // Emploi du temps : aujourd'hui en tête, une autre journée ensuite.
        $aujourdhui = Carbon::today()->isoWeekday(); // 1 = Lundi … 7 = Dimanche
        $jours = [1 => 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        $jourAujourdhui = $jours[$aujourdhui];
        $jourAutre = $jourAujourdhui === 'Lundi' ? 'Mardi' : 'Lundi';

        EmploiDuTemps::create([
            'ecole_id'     => $school->id,
            'classe_id'    => $classe->id,
            'matiere_id'   => $matiere->id,
            'enseignant_id' => $enseignant->id,
            'jour'         => $jourAujourdhui,
            'heure_debut'  => '08:00',
            'heure_fin'    => '09:00',
            'salle'        => 'S101',
        ]);
        EmploiDuTemps::create([
            'ecole_id'     => $school->id,
            'classe_id'    => $classe->id,
            'matiere_id'   => $matiere->id,
            'enseignant_id' => $enseignant->id,
            'jour'         => $jourAutre,
            'heure_debut'  => '10:00',
            'heure_fin'    => '11:00',
            'salle'        => 'S202',
        ]);

        // Devoirs : un à venir, un dont l'échéance est atteinte.
        Devoir::create([
            'ecole_id' => $school->id,
            'enseignant_id' => $enseignant->id,
            'classe_id' => $classe->id,
            'matiere_id' => $matiere->id,
            'titre' => 'Exercices à venir',
            'date_limite' => Carbon::today()->addDays(2),
            'publie' => true,
        ]);
        Devoir::create([
            'ecole_id' => $school->id,
            'enseignant_id' => $enseignant->id,
            'classe_id' => $classe->id,
            'matiere_id' => $matiere->id,
            'titre' => 'Échéance passée',
            'date_limite' => Carbon::today()->subDays(1),
            'publie' => true,
        ]);

        $response = $this->getJson('/api/dashboard/enseignant');
        $response->assertStatus(200)->assertJsonPath('success', true);

        $data = $response->json('data');

        // ── Stats : les 4 cartes du frontend ────────────────────────────
        $this->assertCount(4, $data['stats']);
        $this->assertSame(['Mes Élèves', 'Cours Cette Semaine', 'Moyenne Classe', 'Devoirs à Corriger'], array_column($data['stats'], 'title'));
        $this->assertSame('2', $data['stats'][0]['value']);        // 2 élèves dans mes classes
        $this->assertSame('2', $data['stats'][1]['value']);        // 2 créneaux planifiés
        $this->assertSame('14,00', $data['stats'][2]['value']);    // moyenne (16+12)/2
        $this->assertSame('1', $data['stats'][3]['value']);        // 1 devoir à l'échéance atteinte

        // ── Emploi du temps : aujourd'hui en premier, structure `jour.cours[]` ──
        $this->assertCount(2, $data['emploi_temps']);
        $this->assertSame($jourAujourdhui, $data['emploi_temps'][0]['jour']);
        $this->assertCount(1, $data['emploi_temps'][0]['cours']);
        $this->assertArrayHasKey('heure', $data['emploi_temps'][0]['cours'][0]);
        $this->assertSame($matiere->nom, $data['emploi_temps'][0]['cours'][0]['matiere']);
        $this->assertSame($classe->nom_classe, $data['emploi_temps'][0]['cours'][0]['classe']);
        $this->assertSame('S101', $data['emploi_temps'][0]['cours'][0]['salle']);

        // ── Devoirs : uniquement l'échéance atteinte (à préparer) ───────
        $this->assertCount(1, $data['devoirs']);
        $this->assertSame('Échéance passée', $data['devoirs'][0]['titre']);
        $this->assertSame($classe->nom_classe, $data['devoirs'][0]['classe']);
        $this->assertSame('à préparer', $data['devoirs'][0]['etat']);

        // ── Notes récentes : lignes plates, le contrat du frontend ──────
        $this->assertCount(2, $data['notes_recentes']);
        foreach ($data['notes_recentes'] as $note) {
            $this->assertArrayHasKey('id', $note);
            $this->assertIsString($note['eleve']);
            $this->assertSame($classe->nom_classe, $note['classe']);
            $this->assertSame($matiere->nom, $note['matiere']);
            $this->assertIsNumeric($note['note']);
            $this->assertMatchesRegularExpression('#^\d{2}/\d{2}/\d{4}$#', $note['date']);
            $this->assertContains($note['appreciation'], ['Excellent', 'Bien', 'Moyen', 'À améliorer']);
        }
        // Les deux notes (16 → Excellent, 12 → Moyen) sont exposées.
        $appreciations = array_column($data['notes_recentes'], 'appreciation');
        $this->assertContains('Excellent', $appreciations);
        $this->assertContains('Moyen', $appreciations);
    }

    /** @test */
    public function enseignant_sees_only_notes_from_their_classes_and_matieres()
    {
        $school = $this->school();
        $classeA = $this->classe($school, '6e A');
        $classeB = $this->classe($school, '5e B');
        $matiere = $this->matiere($school);
        $enseignant = $this->enseignant($school);
        $this->actingAsEnseignant($enseignant, $classeA, $matiere);

        $monEleve = $this->eleve($school, $classeA);
        $eleveAutreClasse = $this->eleve($school, $classeB);

        Notes::factory()->create(['ecole_id' => $school->id, 'eleve_id' => $monEleve->id, 'classe_id' => $classeA->id, 'matiere_id' => $matiere->id, 'note' => 15]);
        Notes::factory()->create(['ecole_id' => $school->id, 'eleve_id' => $eleveAutreClasse->id, 'classe_id' => $classeB->id, 'matiere_id' => $matiere->id, 'note' => 9]);

        $this->getJson('/api/dashboard/enseignant')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data.notes_recentes')
            ->assertJsonPath('data.notes_recentes.0.note', 15);
    }

    /** @test */
    public function dashboard_enseignant_returns_404_without_teacher_profile()
    {
        $school = $this->school();
        $user = \App\Models\User::factory()->create([
            'role'     => 'enseignant',
            'ecole_id' => $school->id,
        ]);
        $this->actingAs($user);

        $this->getJson('/api/dashboard/enseignant')
            ->assertStatus(404)
            ->assertJsonPath('message', 'Profil enseignant non trouvé');
    }
}
