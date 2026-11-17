<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Sentry\State\Scope;
use Symfony\Component\HttpFoundation\Response;

/**
 * Attribue un identifiant de corrélation à chaque requête, disponible pour
 * toute la suite du cycle (logs, Sentry, réponse) sans que chaque site
 * d'appel n'ait à le transmettre lui-même.
 *
 * Enregistré en tout premier dans la pile globale (`bootstrap/app.php`) :
 * tout le reste (logs applicatifs, erreurs interceptées par les middlewares
 * suivants, Sentry) doit pouvoir s'appuyer dessus.
 */
class AssignCorrelationId
{
    public const HEADER = 'X-Request-Id';

    public function handle(Request $request, Closure $next): Response
    {
        // Honore un identifiant fourni par l'appelant (utile si un jour le
        // frontend ou un appel serveur-à-serveur en propage un) ; en génère
        // un sinon. Rien ne le fait aujourd'hui côté frontend — voir
        // api-client.js — donc en pratique on génère à chaque requête.
        $id = $request->header(self::HEADER) ?: (string) Str::uuid();

        $request->attributes->set('correlation_id', $id);

        // `Log::shareContext()`, pas `withContext()` : ce dernier ne touche
        // que le channel par défaut déjà résolu, `shareContext()` alimente
        // `LogManager::$sharedContext`, fusionné dans tout channel créé
        // ensuite (y compris `single`/`json` si `LOG_CHANNEL` est changé en
        // cours de route) — voir LogManager::get(). Injecte cette clé dans
        // TOUTE ligne de log de la requête en cours, sans modifier les
        // dizaines de sites d'appel existants (`Log::info('...', [...])` un
        // peu partout dans app/Http, app/Jobs, app/Services).
        Log::shareContext(['correlation_id' => $id]);

        // Sentry n'a aucun tag configuré nulle part avant ceci — sans DSN,
        // `configureScope` est un no-op sûr (même principe que
        // `Integration::handles($exceptions)` dans bootstrap/app.php).
        \Sentry\configureScope(function (Scope $scope) use ($id) {
            $scope->setTag('correlation_id', $id);
        });

        $response = $next($request);
        $response->headers->set(self::HEADER, $id);

        return $response;
    }
}
