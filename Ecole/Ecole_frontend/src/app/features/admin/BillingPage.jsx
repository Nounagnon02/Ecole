/**
 * BillingPage — Facturation et transactions (Super Admin)
 *
 * Vue d'ensemble des factures, abonnements et revenus.
 * Données dynamiques via API /api/v1/admin/billing/invoices
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DollarSign, TrendingUp, CreditCard, FileText,
  CheckCircle2, XCircle, Clock, Search, Download,
  Loader2, AlertCircle,
} from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
} from 'recharts';
import { useApi } from '@/hooks/useApi';

const STATUS_BADGE = {
  paid: { variant: 'success', label: 'Payé' },
  pending: { variant: 'warning', label: 'En attente' },
  failed: { variant: 'danger', label: 'Échoué' },
};

export default function BillingPage() {
  const { loading, error, get } = useApi();
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [revenusMensuels, setRevenusMensuels] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [invoicesRes, revenusRes] = await Promise.allSettled([
          get('/api/v1/admin/billing/invoices'),
          get('/api/v1/admin/billing/revenus-mensuels'),
        ]);

        const invoicesData = invoicesRes.status === 'fulfilled'
          ? (Array.isArray(invoicesRes.value?.data?.data) ? invoicesRes.value.data.data
            : Array.isArray(invoicesRes.value?.data) ? invoicesRes.value.data
            : Array.isArray(invoicesRes.value) ? invoicesRes.value : [])
          : [];
        setInvoices(invoicesData);

        const revenusData = revenusRes.status === 'fulfilled'
          ? (Array.isArray(revenusRes.value?.data?.data) ? revenusRes.value.data.data
            : Array.isArray(revenusRes.value?.data) ? revenusRes.value.data
            : Array.isArray(revenusRes.value) ? revenusRes.value : [])
          : [];
        setRevenusMensuels(revenusData);
      } catch (e) {
        console.error('Erreur chargement facturation:', e);
      }
    })();
  }, [get]);

  const stats = useMemo(() => ({
    total: invoices.length,
    paid: invoices.filter((inv) => inv.status === 'paid').length,
    pending: invoices.filter((inv) => inv.status === 'pending').length,
    totalRevenue: invoices.reduce((s, inv) => s + Number(inv.amount || 0), 0),
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
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Facturation</h1>
        <p className="text-sm text-neutral-500 mt-1">Transactions, abonnements et revenus</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatsCard title="Revenu total" value={`${stats.totalRevenue.toLocaleString()} FCFA`} icon={DollarSign} color="primary" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatsCard title="Factures payées" value={String(stats.paid)} icon={CheckCircle2} color="emerald" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatsCard title="En attente" value={String(stats.pending)} icon={Clock} color="amber" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatsCard title="Total factures" value={String(stats.total)} icon={CreditCard} color="sky" />
        </motion.div>
      </div>

      <Card>
        <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Revenus</h3>
          <p className="text-xs text-neutral-500">Évolution sur 6 mois</p>
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
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Factures récentes</h3>
              <p className="text-xs text-neutral-500">Historique des transactions</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48"
              />
              <Button variant="ghost" size="sm" icon={<Download />}>Exporter</Button>
            </div>
          </div>
        </div>
        <div className="p-0">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filtered.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-neutral-500">Aucune facture trouvée</div>
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