<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Payment;

class PaymentQueryController extends Controller
{
    /** Rôles autorisés à gérer les paiements de toute l'école. */
    private const MANAGER_ROLES = ['directeur', 'comptable', 'secretaire', 'super-admin'];

    /**
     * Obtenir l'historique des paiements
     */
    public function getPaymentHistory(Request $request)
    {
        $user = auth()->user();

        $query = Payment::with(['eleve.user:id,name,prenom', 'ecole:id,nom']);

        // Restriction de périmètre en liste blanche : tout cas non prévu
        // (utilisateur absent, rôle inattendu, élève sans profil) ne renvoie
        // rien, plutôt que de laisser passer faute de filtre.
        // `ecole_id` de la requête est ignoré — l'isolation inter-écoles vient
        // du global scope (cf. audit S9/S10).
        if (in_array($user?->role, self::MANAGER_ROLES, true)) {
            // Périmètre de l'école, déjà borné par BelongsToEcole.
        } elseif ($user?->role === 'parent' && $user->parent) {
            $query->whereIn('eleve_id', $user->parent->eleves()->pluck('eleves.id'));
        } elseif ($user?->role === 'eleve' && $user->eleve) {
            $query->where('eleve_id', $user->eleve->id);
        } else {
            $query->whereRaw('1 = 0');
        }

        $paiements = $query
            ->when($request->eleve_id, fn($q) => $q->where('eleve_id', $request->eleve_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->when($request->date_from, fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json(['success' => true, 'data' => $paiements]);
    }

    /**
     * Statistiques de paiement
     */
    public function getPaymentStats(Request $request)
    {
        // École déduite de la session utilisateur — jamais de la requête,
        // sinon un directeur lit les finances d'un autre établissement (S10).
        $ecoleId = auth()->user()?->ecole_id ?? session('ecole_id');

        $stats = [
            'total_collected' => Payment::where('ecole_id', $ecoleId)->where('status', 'completed')->sum('amount'),
            'pending_amount' => Payment::where('ecole_id', $ecoleId)->where('status', 'pending')->sum('amount'),
            'failed_amount' => Payment::where('ecole_id', $ecoleId)->where('status', 'failed')->sum('amount'),
            'total_transactions' => Payment::where('ecole_id', $ecoleId)->count(),
            'completed_count' => Payment::where('ecole_id', $ecoleId)->where('status', 'completed')->count(),
            'by_type' => Payment::where('ecole_id', $ecoleId)
                ->where('status', 'completed')
                ->select('type', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
                ->groupBy('type')
                ->get(),
            'monthly_revenue' => Payment::where('ecole_id', $ecoleId)
                ->where('status', 'completed')
                ->whereYear('paid_at', date('Y'))
                ->select(DB::raw('MONTH(paid_at) as month'), DB::raw('SUM(amount) as total'))
                ->groupBy('month')
                ->get()
        ];

        return response()->json(['success' => true, 'data' => $stats]);
    }

    /**
     * Export des paiements
     */
    public function exportPayments(Request $request)
    {
        if (!in_array(auth()->user()?->role, self::MANAGER_ROLES, true)) {
            return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
        }

        $payments = Payment::with(['eleve', 'ecole'])
            ->when($request->date_from, fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->get();

        $csv = "ID,Élève,Type,Montant,Statut,Date\n";
        foreach ($payments as $payment) {
            $csv .= "{$payment->id},{$payment->eleve->nom} {$payment->eleve->prenom},{$payment->type},{$payment->amount},{$payment->status},{$payment->created_at}\n";
        }

        return response($csv, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="paiements_' . date('Y-m-d') . '.csv"');
    }
}
