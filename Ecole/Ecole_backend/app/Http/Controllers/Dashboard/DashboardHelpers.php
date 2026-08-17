<?php

namespace App\Http\Controllers\Dashboard;

use App\Support\Roles;

/**
 * DashboardHelpers — méthodes utilitaires partagées par tous les contrôleurs
 * de dashboard (extraites de DashboardController, 1746 lignes, cf. audit DEBT-1).
 */
trait DashboardHelpers
{
    private function directoryRoles(): array
    {
        return Roles::expand([Roles::DIRECTOR, 'censeur', 'secretaire', Roles::SUPER_ADMIN]);
    }

    private function directoryCacheKey(): string
    {
        return 'dashboard_directeur_' . (\App\Models\Eleve::currentEcoleId() ?? 'global');
    }

    private function appreciationNote(float $note): string
    {
        return match (true) {
            $note >= 16 => 'Excellent',
            $note >= 14 => 'Bien',
            $note >= 10 => 'Moyen',
            default     => 'À améliorer',
        };
    }

    private function calculateAverage($notes)
    {
        if ($notes->isEmpty()) return null;

        return $notes->avg('note');
    }

    private function nomEleve($eleve): string
    {
        if (!$eleve) {
            return '—';
        }

        return trim(($eleve->user?->name ?? '') . ' ' . ($eleve->user?->prenom ?? ''));
    }

    private function moisLabels(): array
    {
        return ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    }

    private function sixDerniersMois(): array
    {
        $labels = $this->moisLabels();
        $mois = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = now()->startOfMonth()->subMonths($i);
            $mois[$m->format('Y-m')] = $labels[$m->month - 1];
        }

        return $mois;
    }

    private function monthExpression(string $column): string
    {
        return \Illuminate\Support\Facades\DB::getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', {$column})"
            : "DATE_FORMAT({$column}, '%Y-%m')";
    }

    private function parentEvolution($children): array
    {
        $moisCourts = [1 => 'Jan', 2 => 'Fév', 3 => 'Mar', 4 => 'Avr', 5 => 'Mai', 6 => 'Juin',
                       7 => 'Juil', 8 => 'Août', 9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Déc'];

        $rows = [];
        for ($i = 5; $i >= 0; $i--) {
            $mois = now()->startOfMonth()->subMonths($i);
            $rows[$mois->format('Y-m')] = ['mois' => $moisCourts[(int) $mois->format('n')]];
        }

        foreach ($children as $child) {
            $prenom = $child->user->prenom ?: $child->user->name ?: 'Enfant ' . $child->id;
            $parMois = $child->notes
                ->filter(fn ($note) => $note->created_at && $note->created_at->gte(now()->startOfMonth()->subMonths(6)))
                ->groupBy(fn ($note) => $note->created_at->format('Y-m'));

            foreach ($parMois as $cle => $groupe) {
                if (!isset($rows[$cle])) {
                    continue;
                }
                $rows[$cle][$prenom] = round($groupe->avg('note'), 2);
            }
        }

        return array_values($rows);
    }

    private function tailLines(string $path, int $nbLignes): array
    {
        $handle = @fopen($path, 'rb');
        if (!$handle) {
            return [];
        }

        $taille = filesize($path);
        $bloc = 4096;
        $position = $taille;
        $contenu = '';
        $lignes = [];

        while ($position > 0 && count($lignes) < $nbLignes) {
            $lecture = min($bloc, $position);
            $position -= $lecture;
            fseek($handle, $position);
            $contenu = fread($handle, $lecture) . $contenu;

            if (substr_count($contenu, "\n") >= $nbLignes) {
                $lignes = explode("\n", $contenu);
                break;
            }
        }

        if ($lignes === []) {
            $lignes = explode("\n", $contenu);
        }

        fclose($handle);

        $lignes = array_values(array_filter($lignes, fn ($l) => trim($l) !== ''));

        return array_slice($lignes, -$nbLignes);
    }

    private function tailLaravelLogs(int $limit = 6): array
    {
        $logFile = storage_path('logs/laravel.log');
        if (!is_readable($logFile)) {
            return $this->legacyLogsLog($limit);
        }

        $lines = collect($this->tailLines($logFile, $limit * 2));
        $parsed = $lines->filter(function ($line) {
            return preg_match('/^\[[^\]]+\] (production|local)\.(\w+):/', $line);
        })->map(function ($line, $i) {
            preg_match('/\[([^\]]+)\] (production|local)\.(\w+): (.*)/', $line, $m);
            return [
                'id'      => $i,
                'level'   => strtoupper($m[3] ?? 'INFO'),
                'time'    => isset($m[1]) ? date('H:i:s', strtotime($m[1])) : '—',
                'message' => mb_substr($m[4] ?? '', 0, 160),
                'module'  => 'laravel',
            ];
        })->take(-$limit)->values();

        return $parsed->isNotEmpty() ? $parsed->all() : $this->legacyLogsLog($limit);
    }

    private function countLogErrors(): int
    {
        $logFile = storage_path('logs/laravel.log');
        if (!is_readable($logFile)) {
            return 0;
        }

        $dernieres = $this->tailLines($logFile, 1000);

        return count(array_filter($dernieres, function ($line) {
            return preg_match('/\.ERROR:/', $line) === 1;
        }));
    }

    private function legacyLogsLog(int $limit = 6): array
    {
        if (!class_exists(\App\Models\AuditLog::class)) {
            return [];
        }

        return \App\Models\AuditLog::latest()->take($limit)->get()->map(function ($log, $i) {
            return [
                'id'      => $i,
                'level'   => str_contains((string) $log->event, 'error') ? 'ERROR' : 'INFO',
                'time'    => $log->created_at?->format('H:i') ?? '—',
                'message' => mb_substr($log->description ?? $log->event ?? 'action', 0, 160),
                'module'  => 'audit',
            ];
        })->all();
    }
}
