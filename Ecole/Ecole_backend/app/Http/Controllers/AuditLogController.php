<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

/**
 * Consultation du journal d'audit — « qui a modifié quoi ».
 *
 * `AuditLog` et `Auditable` existaient déjà et étaient alimentés (`Notes`,
 * `User`), mais jamais exposés à un directeur : la donnée était lue en
 * interne (`AdminDashboardController`, un widget de 10 dernières actions)
 * sans jamais offrir de recherche/filtre sur l'historique complet.
 *
 * `AuditLog` porte `BelongsToEcole` : cette lecture reste bornée à l'école
 * de l'appelant sans rien faire de spécial ici, contrairement à la vue
 * plateforme (`Central\AnalyticsController::auditLogs`), qui lève le scope
 * explicitement et est réservée au super-admin.
 */
class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user:id,name,prenom,role')
            ->orderBy('created_at', 'desc');

        if ($request->filled('event')) {
            $query->where('event', $request->string('event'));
        }

        if ($request->filled('auditable_type')) {
            $query->where('auditable_type', 'like', '%' . $request->string('auditable_type'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->date('to')->endOfDay());
        }

        return response()->json(
            $query->paginate($request->integer('per_page', 25))
        );
    }
}
