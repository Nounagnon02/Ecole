<?php

namespace App\Http\Controllers\Central;

use App\Models\AuditLog;
use App\Models\SaaS\Tenant;
use App\Models\SaaS\Subscription;
use App\Models\SaaS\Plan;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function overview()
    {
        $totalSchools = Tenant::count();
        $activeSchools = Tenant::where('status', 'active')->count();
        $trialSchools = Tenant::where('status', 'trial')->count();
        $suspendedSchools = Tenant::where('status', 'suspended')->count();

        $totalRevenue = Subscription::whereIn('status', ['active', 'trial'])
            ->sum('amount');

        $monthlyRevenue = Subscription::whereIn('status', ['active', 'trial'])
            ->where('billing_cycle', 'monthly')
            ->sum('amount');

        $yearlyRevenue = Subscription::whereIn('status', ['active', 'trial'])
            ->where('billing_cycle', 'yearly')
            ->sum('amount');

        $planDistribution = Plan::withCount('tenants')
            ->get()
            ->map(fn ($plan) => [
                'name' => $plan->name,
                'count' => $plan->tenants_count,
                'slug' => $plan->slug,
            ]);

        return response()->json([
            'total_schools' => $totalSchools,
            'active_schools' => $activeSchools,
            'trial_schools' => $trialSchools,
            'suspended_schools' => $suspendedSchools,
            'total_revenue' => (float) $totalRevenue,
            'monthly_revenue' => (float) $monthlyRevenue,
            'yearly_revenue' => (float) $yearlyRevenue,
            'plan_distribution' => $planDistribution,
        ]);
    }

    public function revenue()
    {
        $monthly = Subscription::select(
            DB::raw('YEAR(created_at) as year'),
            DB::raw('MONTH(created_at) as month'),
            DB::raw('SUM(amount) as total'),
            DB::raw('COUNT(*) as count')
        )
            ->where('status', '!=', 'canceled')
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->limit(12)
            ->get();

        return response()->json($monthly);
    }

    public function auditLogs(Request $request)
    {
        $query = AuditLog::with('user')
            ->orderBy('created_at', 'desc');

        // Filtrer par événement
        if ($request->event) {
            $query->where('event', $request->event);
        }

        // Filtrer par type de modèle
        if ($request->auditable_type) {
            $query->where('auditable_type', 'like', '%' . $request->auditable_type);
        }

        // Filtre date
        if ($request->from) {
            $query->where('created_at', '>=', $request->from);
        }
        if ($request->to) {
            $query->where('created_at', '<=', $request->to);
        }

        $logs = $query->paginate($request->per_page ?? 50);

        return response()->json($logs);
    }

    public function schools()
    {
        $recent = Tenant::with('plan')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'slug' => $t->slug,
                'status' => $t->status,
                'plan' => $t->plan?->name,
                'school_type' => $t->school_type,
                'created_at' => $t->created_at->toISOString(),
            ]);

        $byType = Tenant::select('school_type', DB::raw('COUNT(*) as count'))
            ->groupBy('school_type')
            ->get();

        $byPlan = Plan::withCount('tenants')
            ->get()
            ->map(fn ($p) => [
                'plan' => $p->name,
                'count' => $p->tenants_count,
            ]);

        return response()->json([
            'recent' => $recent,
            'by_type' => $byType,
            'by_plan' => $byPlan,
        ]);
    }
}
