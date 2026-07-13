/**
 * StatistiquesPage — Statistiques générales (Super Admin)
 *
 * Module admin : indicateurs clés et analytics du système.
 * Données dynamiques via API /api/v1/admin/analytics/overview
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, Users, Building2, BookOpen,
  GraduationCap, DollarSign, Activity, Clock, CheckCircle, AlertCircle,
  ArrowUpRight, ArrowDownRight, Loader2,
} from 'lucide-react';
import { cn, formatNumber } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useApi } from '@/hooks/useApi';

const ACTIVITE_CONFIG = {
  inscription: { icon: Users, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20' },
  paiement: { icon: DollarSign, color: 'text-green-500 bg-green-100 dark:bg-green-900/20' },
  note: { icon: GraduationCap, color: 'text-[var(--accent)] bg-[var(--accent-subtle)]' },
  compte: { icon: Users, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20' },
  absence: { icon: AlertCircle, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/20' },
  facture: { icon: BookOpen, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/20' },
};

export default function StatistiquesPage() {
  const { loading, error, get } = useApi();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/api/v1/admin/analytics/overview');
        setStats(res?.data || res);
      } catch (e) {
        console.error('Erreur chargement statistiques:', e);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
        <AlertCircle className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const data = stats || {};

  // Calculer la répartition des rôles à partir des données API si disponibles
  const repartitionRoles = data.repartition_roles || data.roles_distribution || [
    { role: 'Élèves', count: data.total_eleves || data.total_students || 0, pct: 0, color: 'bg-[var(--primary)]' },
    { role: 'Enseignants', count: data.total_enseignants || data.total_teachers || 0, pct: 0, color: 'bg-emerald-500' },
    { role: 'Parents', count: data.total_parents || 0, pct: 0, color: 'bg-amber-500' },
    { role: 'Personnel', count: data.total_personnel || 0, pct: 0, color: 'bg-sky-500' },
  ];

  // Calculer les pourcentages
  const totalUsers = repartitionRoles.reduce((s, r) => s + r.count, 0);
  const rolesWithPct = totalUsers > 0
    ? repartitionRoles.map(r => ({ ...r, pct: Math.round((r.count / totalUsers) * 1000) / 10 }))
    : repartitionRoles;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Statistiques</h1>
          <p className="text-sm text-neutral-500">Indicateurs clés et analytics du système</p>
        </div>
        <Badge variant="primary" size="sm">
          <Clock className="h-3 w-3 mr-1" />
          Mis à jour en temps réel
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard
          title="Établissements"
          value={String(data.total_schools ?? data.total_ecoles ?? '—')}
          icon={Building2}
          color="primary"
          footer={
            <span className={cn('flex items-center gap-1 text-xs font-medium', 'text-emerald-600')}>
              <ArrowUpRight className="h-3 w-3" />
              {data.schools_growth ? `+${data.schools_growth}%` : '—'} vs mois dernier
            </span>
          }
        />
        <StatsCard
          title="Utilisateurs"
          value={formatNumber(data.total_users ?? data.total_utilisateurs ?? 0)}
          icon={Users}
          color="emerald"
          footer={
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              {data.users_growth ? `+${data.users_growth}%` : '—'} vs mois dernier
            </span>
          }
        />
        <StatsCard
          title="Revenus Mensuels"
          value={data.monthly_revenue ? `${(data.monthly_revenue / 1000000).toFixed(1)}M` : '—'}
          icon={DollarSign}
          color="amber"
          footer={
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              {data.revenue_growth ? `+${data.revenue_growth}%` : '—'} vs mois dernier
            </span>
          }
        />
        <StatsCard
          title="Taux de Réussite"
          value={data.success_rate ? `${data.success_rate}%` : '—'}
          icon={TrendingUp}
          color="sky"
          footer={
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              {data.success_rate_growth ? `+${data.success_rate_growth}%` : '—'} vs année précédente
            </span>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Répartition des utilisateurs</h3>
          <div className="space-y-4">
            {rolesWithPct.map((item) => (
              <div key={item.role}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">{item.role}</span>
                  <span className="font-medium text-neutral-900 dark:text-white">{formatNumber(item.count)} ({item.pct}%)</span>
                </div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', item.color)} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Activité récente</h3>
          <div className="space-y-3">
            {data.recent_activities?.length > 0 ? (
              data.recent_activities.map((a, i) => {
                const cfg = ACTIVITE_CONFIG[a.type] || { icon: Activity, color: 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800' };
                const IconComponent = cfg.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', cfg.color)}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">{a.action}</p>
                      <p className="text-xs text-neutral-500">{a.entite || a.entity}</p>
                    </div>
                    <span className="text-xs text-neutral-400 shrink-0">{a.date}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-neutral-400 text-center py-4">Aucune activité récente</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Taux de présence</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">{data.attendance_rate ?? '—'}%</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Cours programmés</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">{data.total_courses ? formatNumber(data.total_courses) : '—'}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Diplômés {new Date().getFullYear()}</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">{data.graduates ?? '—'}</p>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}