<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;

    /**
     * Message d'erreur destiné au client.
     *
     * Le détail de l'exception (requête SQL, chemins de fichiers, noms de
     * colonnes) n'est révélé qu'en mode debug. En production, le client reçoit
     * un libellé neutre et le détail part dans les logs (cf. audit S20).
     */
    protected function clientErrorMessage(\Throwable $e, string $repli = 'Une erreur est survenue'): string
    {
        \Illuminate\Support\Facades\Log::error($repli, [
            'exception' => get_class($e),
            'message'   => $e->getMessage(),
            'file'      => $e->getFile() . ':' . $e->getLine(),
        ]);

        return config('app.debug') ? $e->getMessage() : $repli;
    }
}
