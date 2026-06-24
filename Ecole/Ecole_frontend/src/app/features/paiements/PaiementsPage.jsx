/**
 * PaiementsPage — Gestion des paiements et transactions financières
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Search, Filter, Download, Plus, CreditCard,
  TrendingUp, TrendingDown, Receipt, Calendar,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { formatCurrency } from '@/shared/lib/utils';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import Input from '@/shared/components/ui/Input';

const PAIEMENTS = Array.from({ length: 20 }, (_, i) => ({
  id: `PAY-${2024}${String(i + 1).padStart(5, '0')}`,
  eleve: ['Diallo A.', 'Touré F.', 'Koné M.', 'Cissé I.', 'Traoré K.'][i % 5],
  classe: ['6e A', '5e B', '4e A', '3e C'][i % 4],
  type: ['Scolarité', "Frais d'inscription", 'Pension', 'Activités', 'Transport'][i % 5],
  montant: [25000, 35000, 15000, 50000, 10000][i % 5] * (1 + i % 3),
  date: `2026-0${3 + (i % 3)}-${String(10 + (i % 15)).padStart(2, '0')}`,
  methode: ['Espèces', 'Mobile Money', 'Virement', 'Carte'][i % 4],
  statut: ['payé', 'payé', 'en attente', 'échec', 'remboursé'][i % 5],
}));

const STATS = [
  { title: 'Revenus du Mois', value: formatCurrency(12400000), icon: DollarSign, trend: 8.1, color: 'indigo' },
  { title: 'Transactions', value: '342', icon: CreditCard, trend: 12, color: 'emerald' },
  { title: "Taux d'Encaisse", value: '92%', icon: TrendingUp, trend: 3.4, color: 'sky' },
  { title: 'Impayés', value: '8%', icon: TrendingDown, trend: -2.1, color: 'red' },
];

const STATUT_COLORS = {
  payé: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  'en attente': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  échec: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  remboursé: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-400',
};

export default function PaiementsPage() {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const filtered = useMemo(() =>
    PAIEMENTS.filter((p) => {
      if (search && !p.eleve.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatut && p.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterStatut]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Paiements</h1>
          <p className="text-sm text-neutral-500">Gestion des transactions financières</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Receipt />}>
            Factures
          </Button>
          <Button variant="outline" size="sm" icon={<Download />}>
            Exporter
          </Button>
          <Button size="sm" icon={<Plus />}>
            Nouveau Paiement
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => <StatsCard key={s.title} {...s} />)}
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un élève..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">Tous les statuts</option>
            <option value="payé">Payé</option>
            <option value="en attente">En attente</option>
            <option value="échec">Échec</option>
          </select>
        </div>
      </Card>

      <Card padding={false}>
        <Table>
          <Table.Header>
            <Table.Head>Référence</Table.Head>
            <Table.Head>Élève</Table.Head>
            <Table.Head>Type</Table.Head>
            <Table.Head>Montant</Table.Head>
            <Table.Head>Méthode</Table.Head>
            <Table.Head>Date</Table.Head>
            <Table.Head>Statut</Table.Head>
          </Table.Header>
          <Table.Body>
            {filtered.length === 0 && (
              <Table.Row>
                <td colSpan={7} className="p-8 text-center text-sm text-neutral-500">
                  Aucun paiement trouvé
                </td>
              </Table.Row>
            )}
            {filtered.map((p) => (
              <Table.Row key={p.id}>
                <Table.Cell className="text-xs font-mono text-neutral-500">{p.id}</Table.Cell>
                <Table.Cell>
                  <span className="font-medium text-neutral-900 dark:text-white">{p.eleve}</span>
                  <span className="ml-2 text-xs text-neutral-500">{p.classe}</span>
                </Table.Cell>
                <Table.Cell>{p.type}</Table.Cell>
                <Table.Cell>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {formatCurrency(p.montant)}
                  </span>
                </Table.Cell>
                <Table.Cell className="text-xs text-neutral-500">{p.methode}</Table.Cell>
                <Table.Cell className="text-xs text-neutral-500">{p.date}</Table.Cell>
                <Table.Cell>
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', STATUT_COLORS[p.statut])}>
                    {p.statut}
                  </span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>
    </motion.div>
  );
}
