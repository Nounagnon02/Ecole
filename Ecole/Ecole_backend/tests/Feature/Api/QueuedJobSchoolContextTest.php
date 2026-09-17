<?php

namespace Tests\Feature\Api;

use App\Jobs\ExportReportJob;
use App\Jobs\ProcessImportJob;
use App\Jobs\SendNotificationJob;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Notification;
use App\Models\User;
use App\Support\SchoolContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Les jobs en file, dans les conditions d'un worker (audit A2).
 *
 * `phpunit.xml` fixe `QUEUE_CONNECTION=sync` : en test, un job s'exécute en
 * ligne, dans la requête, avec l'utilisateur authentifié. En production
 * `QUEUE_CONNECTION=database` et tous les jobs implémentent `ShouldQueue` :
 * `handle()` tourne dans un processus séparé, sans `auth()` ni session. Le
 * scope `ecole` retombait donc sur `whereRaw('1 = 0')` en lecture, et écrivait
 * `ecole_id = null`. Les deux échecs étaient muets.
 *
 * Ces tests appellent `handle()` directement, sans `actingAs` : c'est
 * exactement l'état d'un worker, et c'est ce que la suite ne reproduisait
 * jamais.
 */
class QueuedJobSchoolContextTest extends TestCase
{
    use RefreshDatabase;

    private function schoolWithStaff(): array
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $user = User::factory()->create(['role' => 'directeur', 'ecole_id' => $school->id]);

        return [$school, $user];
    }

    /** @test */
    public function an_export_run_without_a_session_still_contains_rows()
    {
        Storage::fake('local');

        [$school, $staff] = $this->schoolWithStaff();

        SchoolContext::for($school->id, function () use ($school) {
            Eleve::factory()->forSchool($school)->count(3)->create();
        });

        $this->assertGuest();

        (new ExportReportJob($staff, 'eleves'))->handle();

        $chemin = "exports/eleves_{$staff->id}_{$school->id}.csv";
        Storage::disk('local')->assertExists($chemin);

        $lignes = array_values(array_filter(explode("\n", Storage::disk('local')->get($chemin))));

        // 1 en-tête + 3 élèves. Sans contexte, le fichier s'arrêtait à l'en-tête.
        $this->assertCount(4, $lignes, "L'export doit contenir les 3 élèves, pas seulement l'en-tête.");
    }

    /** @test */
    public function an_export_never_leaks_another_schools_pupils()
    {
        Storage::fake('local');

        [$schoolA, $staff] = $this->schoolWithStaff();
        $schoolB = Ecole::factory()->create(['status' => 'active']);

        SchoolContext::for($schoolA->id, fn () => Eleve::factory()->forSchool($schoolA)->count(2)->create());
        SchoolContext::for($schoolB->id, fn () => Eleve::factory()->forSchool($schoolB)->count(5)->create());

        (new ExportReportJob($staff, 'eleves'))->handle();

        $contenu = Storage::disk('local')->get("exports/eleves_{$staff->id}_{$schoolA->id}.csv");
        $lignes = array_values(array_filter(explode("\n", $contenu)));

        $this->assertCount(3, $lignes, "Seuls les 2 élèves de l'école A doivent figurer.");
    }

    /**
     * Un utilisateur sans école n'importe rien.
     *
     * Avant le garde-fou, `Eleve::create()` s'exécutait quand même et posait
     * `ecole_id = null` : des élèves réels rattachés à aucun établissement,
     * invisibles de tous, y compris de celui qui venait de les importer.
     * Abandonner bruyamment vaut mieux que ce silence.
     *
     * NB : la correspondance des colonnes de `ProcessImportJob::importEleve()`
     * est par ailleurs erronée (`nom`, `prenom`, `matricule`, `email`,
     * `telephone` n'existent pas sur `eleves` — ils vivent sur `users`), et
     * `importNote()` référence `App\Models\Note`, qui n'existe pas. Ce job ne
     * peut donc rien importer aujourd'hui, indépendamment du contexte d'école.
     * Défaut distinct, à traiter avec le contrat d'import.
     *
     * @test
     */
    public function an_import_by_a_user_without_a_school_writes_nothing()
    {
        $orphelin = User::factory()->create(['role' => 'directeur', 'ecole_id' => null]);

        (new ProcessImportJob($orphelin, 'eleves', [
            ['nom' => 'Dossou', 'prenom' => 'Awa'],
        ]))->handle();

        $this->assertSame(
            0,
            Eleve::withoutGlobalScope('ecole')->count(),
            "Aucune ligne ne doit être écrite sans école."
        );
    }

    /** @test */
    public function a_notification_run_without_a_session_is_attached_to_the_school()
    {
        [$school, $staff] = $this->schoolWithStaff();

        (new SendNotificationJob([
            'user_id' => $staff->id,
            'type'    => 'export',
            'title'   => 'Export prêt',
            'body'    => 'Le fichier est disponible.',
        ]))->handle();

        $notification = Notification::withoutGlobalScope('ecole')->first();

        $this->assertNotNull($notification, 'La notification doit être créée.');
        $this->assertSame($school->id, $notification->ecole_id);
    }
}
