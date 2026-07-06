/**
 * BillingPage — Facturation et transactions (Super Admin)
 *
 * Vue d'ensemble des factures, abonnements et revenus.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DollarSign, TrendingUp, CreditCard, FileText,
  CheckCircle2, XCircle, Clock, Search, Download,
} from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
} from 'recharts';

const STATS = [
  { title: 'Revenu mensuel', value: '1 247 000 FCFA', icon: DollarSign, trend: 12.5, trendLabel: 'vs mois dernier', color: 'indigo' },
  { title: 'Abonnements actifs', value: '23', icon: TrendingUp, trend: 4, trendLabel: 'ce mois', color: 'emerald' },
  { title: 'Factures en attente', value: '5', icon: Clock, trend: -2, trendLabel: 'vs hier', color: 'amber' },
  { title: 'Taux de conversion', value: '78%', icon: CreditCard, trend: 3.2, trendLabel: 'ce trimestre', color: 'sky' },
];

const INVOICES = [
  { id: 1, invoice: 'INV-20260706-0001', school: 'Groupe Scolaire Les Palmiers', amount: 29000, status: 'paid', date: '2026-07-06', method: 'CinetPay' },
  { id: 2, invoice: 'INV-20260705-0002', school: 'Collège Privé Saint-Jean', amount: 79000, status: 'paid', date: '2026-07-05', method: 'FedaPay' },
  { id: 3, invoice: 'INV-20260704-0003', school: 'Lycée Moderne d\'Abobo', amount: 290000, status: 'pending', date: '2026-07-04', method: 'Virement' },
  { id: 4, invoice: 'INV-20260703-0004', school: 'Complexe Scolaire La Renaissance', amount: 29000, status: 'paid', date: '2026-07-03', method: 'CinetPay' },
  { id: 5, invoice: 'INV-20260702-0005', school: 'Institut Supérieur de l\'Éducation', amount: 79000, status: 'failed', date: '2026-07-02', method: 'Carte' },
];

const REVENUE_DATA = [
  { month: 'Jan', revenue: 890000 },
  { month: 'Fév', revenue: 920000 },
  { month: 'Mar', revenue: 1050000 },
  { month: 'Avr', revenue: 980000 },
  { month: 'Mai', revenue: 1150000 },
  { month: 'Juin', revenue: 1247000 },
];

const STATUS_BADGE = {
  paid: { variant: 'success', label: 'Payé' },
  pending: { variant: 'warning', label: 'En attente' },
  failed: { variant: 'danger', label: 'Échoué' },
};

export default function BillingPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Facturation</h1>
        <p className="text-sm text-neutral-500 mt-1">Transactions, abonnements et revenus</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatsCard {...stat} className="h-full" />
          </motion.div>
        ))}
      </div>

      {/* Revenue chart */}
      <Card>
        <Card.Header>
          <Card.Title>Revenus</Card.Title>
          <Card.Description>Évolution sur 6 mois</Card.Description>
        </Card.Header>
        <Card.Body>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <ReTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} name="Revenu (FCFA)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card.Body>
      </Card>

      {/* Invoices */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <Card.Title>Factures récentes</Card.Title>
              <Card.Description>Historique des transactions</Card.Description>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48"
                prefix={<Search className="h-4 w-4 text-neutral-400" />}
              />
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4 mr-1" /> Exporter
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {INVOICES.map((inv) => {
              const statusConf = STATUS_BADGE[inv.status] || STATUS_BADGE.pending;
              return (
                <div key={inv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <FileText className="h-5 w-5 text-neutral-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{inv.school}</p>
                    <p className="text-xs text-neutral-500">{inv.invoice} · {inv.date} · {inv.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{inv.amount.toLocaleString()} FCFA</p>
                  </div>
                  <Badge variant={statusConf.variant} size="sm">{statusConf.label}</Badge>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
