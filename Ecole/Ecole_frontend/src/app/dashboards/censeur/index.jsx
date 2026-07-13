/**
 * CenseurDashboard — Tableau de bord Censeur
 *
 * Sections : Aperçu | Discipline | Absences
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useDashboardData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Users, AlertTriangle, CheckCircle2, XCircle,
  BarChart3, Gavel, CalendarX, MessageSquare, Scale,
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
  { id: 'discipline', label: 'Discipline', icon: Gavel },
  { id: 'absences', label: 'Absences', icon: CalendarX },
];

const STATS_META = [
  { title: 'Total Élèves', icon: Users, color: 'primary' },
  { title: 'Sanctions du Mois', icon: Gavel, color: 'amber' },
  { title: 'Absences Non Justifiées', icon: CalendarX, color: 'red' },
  { title: 'Avertissements', icon: AlertTriangle, color: 'sky' },
];

const SANCTIONS_COLORS = ['var(--accent)', 'var(--red)', 'var(--amber)', 'var(--green)'];

function ApercuSection({ stats, evolution, types_sanctions, sanctions }) {
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
            <Card.Title>Évolution Disciplinaire</Card.Title>
            <Card.Description>Sanctions et avertissements — 6 derniers mois</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <ReTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                  <Bar dataKey="sanctions" name="Sanctions" fill="var(--amber)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avertissements" name="Avertissements" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Répartition</Card.Title>
            <Card.Description>Types de sanctions</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={types_sanctions} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {types_sanctions.map((_, i) => (
                      <Cell key={i} fill={SANCTIONS_COLORS[i]} />
                    ))}
                  </Pie>
                  <ReTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-1.5">
              {types_sanctions.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SANCTIONS_COLORS[i] }} />
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
            <Card.Title>Sanctions Récentes</Card.Title>
            <Badge variant="warning" size="sm">{sanctions.filter(s => s.statut === 'En cours').length} en cours</Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table>
            <Table.Header>
              <Table.Head>Élève</Table.Head>
              <Table.Head>Classe</Table.Head>
              <Table.Head>Motif</Table.Head>
              <Table.Head>Sanction</Table.Head>
              <Table.Head>Date</Table.Head>
              <Table.Head>Statut</Table.Head>
            </Table.Header>
            <Table.Body>
              {sanctions.map((s) => (
                <Table.Row key={s.id}>
                  <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{s.eleve}</span></Table.Cell>
                  <Table.Cell>{s.classe}</Table.Cell>
                  <Table.Cell className="max-w-[160px] truncate">{s.motif}</Table.Cell>
                  <Table.Cell>{s.sanction}</Table.Cell>
                  <Table.Cell className="text-neutral-400">{s.date}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={s.statut === 'Exécuté' ? 'success' : s.statut === 'En cours' ? 'warning' : 'neutral'} size="sm">
                      {s.statut}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

function DisciplineSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">Gestion Disciplinaire</h2>
          <p className="text-sm text-neutral-500 mt-1">Sanctions, suivis et convocations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm"><MessageSquare className="h-4 w-4 mr-1" /> Convoquer</Button>
          <Button><Scale className="h-4 w-4 mr-1" /> Nouvelle Sanction</Button>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Interface complète de gestion disciplinaire — conseils de discipline, décisions, suivi
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function AbsencesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">Absences</h2>
          <p className="text-sm text-neutral-500 mt-1">Suivi et justification des absences</p>
        </div>
        <Button variant="ghost" size="sm">Export</Button>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Relevé d'absences avec filtres par classe, période, et statut de justification
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

export default function CenseurDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading } = useDashboardStats('censeur');

  const stats = data?.stats?.map((s, i) => ({ ...s, icon: STATS_META[i]?.icon, color: STATS_META[i]?.color })) || [];
  const evolution = data?.evolution || [];
  const types_sanctions = data?.types_sanctions || [];
  const sanctions = data?.sanctions || [];

  const handleTabClick = (tabId) => {
    if (tabId === 'apercu') { setActiveTab(tabId); return; }
    const routes = { discipline: '/censeur/discipline', absences: '/censeur/absences' };
    navigate(routes[tabId] || '/censeur/dashboard');
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection stats={stats} evolution={evolution} types_sanctions={types_sanctions} sanctions={sanctions} />;
      default: return <ApercuSection stats={stats} evolution={evolution} types_sanctions={types_sanctions} sanctions={sanctions} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-neutral-900 dark:text-white"
          >
            Censeur
          </motion.h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Discipline et absences — {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <Button variant="ghost" size="sm"><BookOpen className="h-4 w-4 mr-1" /> Règlement</Button>
      </div>

      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="flex gap-1 overflow-x-auto -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-[var(--accent)] text-[var(--accent)] dark:text-[var(--accent)]'
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
