<?php

namespace App\Jobs;

use App\Models\Classe;
use App\Models\Periode;
use App\Services\BulletinService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * GenerateBulletinJob — Génération asynchrone des bulletins
 *
 * Traite la génération des bulletins en arrière-plan pour
 * éviter les timeouts lors de la création de masse.
 */
class GenerateBulletinJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 300;

    public function __construct(
        public int $classeId,
        public int $periodeId,
        public ?int $eleveId = null, // null = tous les élèves de la classe
    ) {}

    public function handle(BulletinService $bulletinService): void
    {
        $classe = Classe::find($this->classeId);
        $periode = Periode::find($this->periodeId);

        if (!$classe || !$periode) {
            Log::error('Bulletin generation failed: classe or periode not found', [
                'classe_id' => $this->classeId,
                'periode_id' => $this->periodeId,
            ]);
            return;
        }

        $eleves = $this->eleveId
            ? [$this->eleveId]
            : $classe->eleves()->pluck('id')->toArray();

        $generated = 0;
        $failed = 0;

        foreach ($eleves as $eleveId) {
            try {
                $pdf = $bulletinService->generatePdf($eleveId, $this->periodeId);
                if ($pdf) {
                    $filename = "bulletins/classe_{$this->classeId}/periode_{$this->periodeId}/eleve_{$eleveId}.pdf";
                    Storage::disk('local')->put($filename, $pdf);
                    $generated++;
                }
            } catch (\Exception $e) {
                Log::error('Bulletin generation failed for student', [
                    'eleve_id' => $eleveId,
                    'error' => $e->getMessage(),
                ]);
                $failed++;
            }
        }

        Log::info('Bulletins generated', [
            'classe_id' => $this->classeId,
            'periode_id' => $this->periodeId,
            'generated' => $generated,
            'failed' => $failed,
        ]);
    }

    public function failed(\Throwable $e): void
    {
        Log::error('GenerateBulletinJob failed completely', [
            'classe_id' => $this->classeId,
            'periode_id' => $this->periodeId,
            'error' => $e->getMessage(),
        ]);
    }
}
