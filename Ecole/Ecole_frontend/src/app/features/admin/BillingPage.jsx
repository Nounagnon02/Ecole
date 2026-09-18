/**
 * BillingPage — Facturation et transactions (Super Admin)
 *
 * Vue d'ensemble des factures, abonnements et revenus.
 * Données dynamiques via API /api/v1/admin/billing/invoices
 */

import { useState, useMemo } from 'react';
import { useApiQuery } from '@/shared/lib/api-client';
import { useTranslation } from '@/shared/i18n';
import { unwrapList } from '@/shared/lib/unwrap';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  DollarSign, CreditCard, FileText,
  CheckCircle2, Clock, Download,
  Loader2, AlertCircle
} from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer
} from 'recharts';

const STATUS_BADGE = {
  paid: { variant: 'success', label: 'Payé' },
  pending: { variant: 'warning', label: 'En attente' },
  failed: { variant: 'danger', label: 'Échoué' }
};

export default function BillingPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  // Deux requêtes indépendantes, et c'est le point.
  //
  // `Promise.allSettled` isolait bien les deux appels, mais `useApi()` expose
  // un `error` partagé : un 500 sur les revenus — une donnée d'appoint —
  // faisait basculer toute la page en écran d'erreur et effaçait les factures
  // déjà reçues. Chaque requête react-query porte son propre état, donc
  // l'échec de l'une ne dit plus rien de l'autre (cf. audit P4.1).
  const requeteFactures = useApiQuery(['billing', 'invoices'], '/v1/admin/billing/invoices');
  const requeteRevenus = useApiQuery(['billing', 'revenue'], '/v1/admin/analytics/revenue');

  const invoices = useMemo(() => unwrapList(requeteFactures.data) ?? [], [requeteFactures.data]);
  const revenusMensuels = useMemo(() => unwrapList(requeteRevenus.data) ?? [], [requeteRevenus.data]);

  // Les factures commandent l'écran : sans elles, il n'y a rien à montrer.
  // Les revenus manquants dégradent un graphique, ils ne cachent pas la page.
  const loading = requeteFactures.isPending;
  const error = requeteFactures.isError
    ? (requeteFactures.error?.message ?? t('common.load_error'))
    : null;

  const stats = useMemo(() => ({
    total: invoices.length,
    paid: invoices.filter((inv) => inv.status === 'paid').length,
    pending: invoices.filter((inv) => inv.status === 'pending').length,
    totalRevenue: invoices.reduce((s, inv) => s + Number(inv.amount || 0), 0)
  }), [invoices]);

  const filtered = useMemo(() =>
    invoices.filter((inv) => {
      if (search && !(inv.school || inv.tenant_name || '').toLowerCase().includes(search.toLowerCase()) && !(inv.invoice_number || '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    [search, invoices]
  );

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pages.admin.billing.title')}</h1>
        <p className="text-sm text-neutral-500 mt-1">{t('pages.admin.billing.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatsCard title={t('pages.admin.billing.revenu_total')} value={`${stats.totalRevenue.toLocaleString()} FCFA`} icon={DollarSign} color="primary" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatsCard title={t('pages.admin.billing.factures_payees')} value={String(stats.paid)} icon={CheckCircle2} color="emerald" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatsCard title={t('common.status.pending')} value={String(stats.pending)} icon={Clock} color="amber" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatsCard title={t('pages.admin.billing.total_factures')} value={String(stats.total)} icon={CreditCard} color="sky" />
        </motion.div>
      </div>

      <Card>
        <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t('pages.admin.billing.revenus')}</h3>
          <p className="text-xs text-neutral-500">{t('pages.admin.billing.evolution_sur_6_mois')}</p>
        </div>
        <div className="p-4">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenusMensuels.length > 0 ? revenusMensuels : [
                { month: 'Jan', revenue: 0 },
                { month: 'Fév', revenue: 0 },
                { month: 'Mar', revenue: 0 },
                { month: 'Avr', revenue: 0 },
                { month: 'Mai', revenue: 0 },
                { month: 'Juin', revenue: 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <ReTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} name="Revenu (FCFA)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card>
        <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t('pages.admin.billing.factures_recentes')}</h3>
              <p className="text-xs text-neutral-500">{t('pages.admin.billing.historique_des_transactions')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder={t('common.search_ellipsis')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48"
              />
              <Button variant="ghost" size="sm" icon={<Download />}>{t('common.export')}</Button>
            </div>
          </div>
        </div>
        <div className="p-0">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filtered.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-neutral-500">{t('pages.admin.billing.aucune_facture_trouvee')}</div>
            )}
            {filtered.map((inv) => {
              const statusConf = STATUS_BADGE[inv.status] || STATUS_BADGE.pending;
              return (
                <div key={inv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <FileText className="h-5 w-5 text-neutral-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{inv.school || inv.tenant_name || '—'}</p>
                    <p className="text-xs text-neutral-500">{inv.invoice_number || inv.invoice} · {inv.date ? format(new Date(inv.date), 'yyyy-MM-dd') : '—'} · {inv.payment_method || inv.method || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{Number(inv.amount || 0).toLocaleString()} FCFA</p>
                  </div>
                  <Badge variant={statusConf.variant} size="sm">{statusConf.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}