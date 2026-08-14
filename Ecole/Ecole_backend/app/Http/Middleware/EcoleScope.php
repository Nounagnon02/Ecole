<?php

namespace App\Http\Middleware;

use App\Models\Ecole;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class EcoleScope
{
    /** How long a school's active/inactive state is trusted without re-reading it. */
    private const STATUS_TTL_SECONDS = 60;

    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        if (!$user) {
            return $next($request);
        }

        // Un utilisateur rattaché à un établissement est verrouillé dessus.
        // L'en-tête X-Ecole-Id était auparavant recopié en session sans aucune
        // vérification d'appartenance (cf. audit S13).
        if ($user->ecole_id) {
            if ($user->role !== 'super-admin' && !$this->schoolIsActive($user->ecole_id)) {
                // Blocking only at sign-in would leave every open session
                // working after a school is deactivated. A school is never
                // deleted, so this check is what actually cuts access off.
                return $this->refuse($request);
            }

            session(['ecole_id' => $user->ecole_id]);

            return $next($request);
        }

        // Utilisateur sans école propre (super-admin plateforme) : lui seul
        // peut cibler un établissement via l'en-tête.
        $demande = $request->header('X-Ecole-Id');

        if ($demande && $user->role === 'super-admin') {
            session(['ecole_id' => (int) $demande]);
        }

        return $next($request);
    }

    /**
     * Is the school active and not soft-deleted?
     *
     * Cached briefly: this runs on every authenticated request, and a school's
     * status changes rarely. A deactivation therefore takes effect within a
     * minute rather than instantly — an acceptable trade against one extra
     * query per request.
     */
    private function schoolIsActive(int $schoolId): bool
    {
        return Cache::remember(
            "school_active_{$schoolId}",
            self::STATUS_TTL_SECONDS,
            function () use ($schoolId) {
                $school = Ecole::withTrashed()->find($schoolId);

                return $school !== null
                    && !$school->trashed()
                    && $school->status === 'active';
            }
        );
    }

    /**
     * Refuse the request, and end the session so the client stops retrying.
     */
    private function refuse(Request $request)
    {
        if ($request->hasSession()) {
            auth()->guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'success' => false,
            'message' => 'Cet établissement est désactivé. Contactez l\'administrateur.',
        ], 403);
    }
}
