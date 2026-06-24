/**
 * ComptableDashboard — Tableau de bord Comptable
 *
 * Sections : Aperçu | Factures | Transactions
 */

import { useState } from 'react';
import { useDashboardStats } from '../hooks/useDashboardData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Receipt, ArrowUpRight, ArrowDownRight, TrendingUp,
  AlertCircle, CheckCircle2, Clock, BarChart3, FileSpreadsheet,
  Download, Printer, Plus,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: BarChart3 },
  { id: 'factures', label: 'Factures', icon: FileSpreadsheet },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
];

const STATS = [
  { title: 'Revenus du Mois', value: '12 450 000 F', icon: TrendingUp, trend: 8.3, trendLabel: 'vs mois dernier', color: 'emerald' },
  { title: 'Factures en Attente', value: '34', icon: Clock, trend: -12, trendLabel: 'vs mois dernier', color: 'amber' },
  { title: 'Taux Recouvrement', value: '87%', icon: CheckCircle2, trend: 3.2, trendLabel: 'ce trimestre', color: 'indigo' },
  { title: 'Dépenses du Mois', value: '4 320 000 F', icon: ArrowDownRight, trend: 2.1, trendLabel: 'vs mois dernier', color: 'red' },
];

const DONNEES_CA = [
  { mois: 'Jan', revenus: 11200, depenses: 4200 },
  { mois: 'Fév', revenus: 10800, depenses: 4100 },
  { mois: 'Mar', revenus: 12450, depenses: 4320 },
  { mois: 'Avr', revenus: 11800, depenses: 4050 },
  { mois: 'Mai', revenus: 13200, depenses: 4500 },
  { mois: 'Juin', revenus: 12450, depenses: 4320 },
];

const PAIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const DONNEES_REPARTITION = [
  { name: 'Frais Scolaire', value: 65 },
  { name: 'Cantine', value: 15 },
  { name: 'Transport', value: 12 },
  { name: 'Activités', value: 8 },
];

const FACTURES_RECENTES = [
  { id: 1, eleve: 'Mensah Jean', classe: '3e A', montant: 45000, statut: 'Payée', echeance: '2026-06-15' },
  { id: 2, eleve: 'Akakpo Ama', classe: '5e B', montant: 38000, statut: 'En attente', echeance: '2026-06-20' },
  { id: 3, eleve: 'Koffi David', classe: '6e A', montant: 42000, statut: 'Payée', echeance: '2026-06-10' },
  { id: 4, eleve: 'Dossa Emile', classe: '4e C', montant: 35000, statut: 'En retard', echeance: '2026-06-01' },
  { id: 5, eleve: 'Amégnigban Rose', classe: '2nde A', montant: 55000, statut: 'En attente', echeance: '2026-06-25' },
];

function ApercuSection({ stats, caData, repartition, factures }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatsCard {...stat} className="h-full" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Évolution des Finances</Card.Title>
            <Card.Description>Revenus et dépenses — 6 derniers mois</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={caData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <ReTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="revenus" name="Revenus" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="depenses" name="Dépenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Répartition</Card.Title>
            <Card.Description>Par type de paiement</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={repartition} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {repartition.map((_, i) => (
                      <Cell key={i} fill={PAIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <ReTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {repartition.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PAIE_COLORS[i] }} />
                    <span className="text-neutral-600 dark:text-neutral-400">{item.name}</span>
                  </div>
                  <span className="font-medium text-neutral-900 dark:text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>Factures Récentes</Card.Title>
            <Badge variant="warning" size="sm">{factures.filter(f => f.statut !== 'Payée').length} en attente</Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table>
            <Table.Header>
              <Table.Head>Élève</Table.Head>
              <Table.Head>Classe</Table.Head>
              <Table.Head>Montant</Table.Head>
              <Table.Head>Statut</Table.Head>
              <Table.Head>Échéance</Table.Head>
            </Table.Header>
            <Table.Body>
              {factures.map((f) => (
                <Table.Row key={f.id}>
                  <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{f.eleve}</span></Table.Cell>
                  <Table.Cell>{f.classe}</Table.Cell>
                  <Table.Cell>{f.montant.toLocaleString()} F</Table.Cell>
                  <Table.Cell>
                    <Badge variant={f.statut === 'Payée' ? 'success' : f.statut === 'En attente' ? 'warning' : 'danger'} size="sm">
                      {f.statut}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-neutral-400">{f.echeance}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

function FacturesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Gestion des Factures</h2>
          <p className="text-sm text-neutral-500 mt-1">Créer, suivre et gérer les factures</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm"><Download className="h-4 w-4 mr-1" /> Exporter</Button>
          <Button><Plus className="h-4 w-4 mr-1" /> Nouvelle Facture</Button>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Interface complète de gestion des factures — création, relances, remises
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function TransactionsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Transactions</h2>
          <p className="text-sm text-neutral-500 mt-1">Journal des transactions financières</p>
        </div>
        <Button variant="ghost" size="sm"><Printer className="h-4 w-4 mr-1" /> Imprimer</Button>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Historique complet des transactions avec filtres et export
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

export default function ComptableDashboard() {
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading } = useDashboardStats('comptable');

  const stats = data?.stats?.map((s, i) => ({ ...s, icon: STATS[i]?.icon, color: STATS[i]?.color })) || STATS;
  const caData = data?.donnes_ca || DONNEES_CA;
  const repartition = data?.repartition || DONNEES_REPARTITION;
  const factures = data?.factures || FACTURES_RECENTES;

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection stats={stats} caData={caData} repartition={repartition} factures={factures} />;
      case 'factures': return <FacturesSection />;
      case 'transactions': return <TransactionsSection />;
      default: return <ApercuSection stats={stats} caData={caData} repartition={repartition} factures={factures} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-neutral-900 dark:text-white"
          >
            Comptabilité
          </motion.h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Suivi financier — {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <Button variant="ghost" size="sm"><Wallet className="h-4 w-4 mr-1" /> Synthèse</Button>
      </div>

      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="flex gap-1 overflow-x-auto -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                )}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {renderSection()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
