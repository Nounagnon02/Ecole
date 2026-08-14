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
     * Exceptions that already carry the right answer for the client.
     *
     * Every one of these maps to a specific status code that Laravel's handler
     * knows how to render — 403, 404, 422, or whatever an HttpException was
     * constructed with.
     */
    private const MEANINGFUL = [
        \Illuminate\Auth\Access\AuthorizationException::class,
        \Illuminate\Auth\AuthenticationException::class,
        \Illuminate\Database\Eloquent\ModelNotFoundException::class,
        \Illuminate\Validation\ValidationException::class,
        \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface::class,
        \App\Exceptions\OutsideCycleException::class,
    ];

    /**
     * Let an exception through when it already knows its own status code.
     *
     * Fifty controller methods wrap their body in `catch (\Exception $e)` and
     * answer 500. `AuthorizationException` is an `\Exception`, so five of those
     * blocks turned a legitimate 403 into a server error: the client could not
     * tell "you may not do this" from "the server is broken", and the frontend
     * had no way to show the right message. `OutsideCycleException` would have
     * been swallowed the same way.
     *
     * Called at the top of a blanket catch, this hands the exception back to
     * the framework when it carries a real answer, and lets the catch handle
     * the genuine faults it was written for.
     */
    protected function rethrowIfMeaningful(\Throwable $e): void
    {
        foreach (self::MEANINGFUL as $type) {
            if ($e instanceof $type) {
                throw $e;
            }
        }
    }

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
