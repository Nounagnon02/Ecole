/**
 * EleveDashboard — données réelles depuis l'API
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, GraduationCap, Clock, Calendar, ClipboardList,
  TrendingUp, Award, BarChart3, FileText, DollarSign,
  ArrowRight, CheckCircle2, AlertCircle, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import { useDashboardStats } from '@/app/dashboards/hooks/useDashboardData';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import { Skeleton } from '@/shared/components/ui/Skeleton';

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: BarChart3 },
  { id: 'notes', label: 'Mes Notes', icon: ClipboardList },
  { id: 'emploi', label: 'Emploi du Temps', icon: Clock },
  { id: 'paiements', label: 'Paiements', icon: DollarSign },
];

function ApercuSection({ data, loading }) {
  const eleve = data?.eleve ?? {};
  const stats = data?.stats ?? {};
  const matieres = data?.matieres ?? [];
  const emploi = data?.emploi_du_temps ?? [];

  const statsCards = [
    {
      title: 'Moyenne Générale',
      value: stats.moyenne_generale ? `${stats.moyenne_generale}/20` : '—',
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      title: 'Total Notes',
      value: String(stats.total_notes ?? 0),
      icon: Award,
      color: 'primary',
    },
    {
      title: 'Absences ce Mois',
      value: String(stats.absences_mois ?? 0),
      icon: AlertCircle,
      color: 'amber',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : statsCards.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <StatsCard {...s} className="h-full" />
              </motion.div>
            ))
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <Card.Header>
            <div className="flex items-center justify-between">
              <div>
                <Card.Title>Notes par Matière</Card.Title>
                <Card.Description>Moyennes par matière</Card.Description>
              </div>
              {stats.moyenne_generale && (
                <Badge variant="primary" size="sm">Moy: {stats.moyenne_generale}/20</Badge>
              )}
            </div>
          </Card.Header>
          <Card.Body>
            <div className="h-[250px]">
              {loading ? <Skeleton className="h-full w-full rounded-xl" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={matieres}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
                    <ReTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                    <Bar dataKey="note" fill="var(--accent)" radius={[6, 6, 0, 0]} name="Note" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Prochains Cours</Card.Title>
            <Card.Description>Emploi du temps</Card.Description>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : emploi.length === 0 ? (
              <p className="p-6 text-center text-sm text-neutral-400">Aucun cours planifié</p>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {emploi.slice(0, 5).map((cours, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <div className="flex flex-col items-center w-12">
                      <span className="text-xs font-semibold text-[var(--accent)]">{cours.heure_debut}</span>
                      <span className="text-[10px] text-neutral-400">{cours.heure_fin}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">{cours.matiere?.nom}</p>
                      <p className="text-xs text-neutral-500">{cours.enseignant?.user?.name} · {cours.salle}</p>
                    </div>
                    <span className="text-xs text-neutral-400">{cours.jour}</span>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

function NotesSection({ data, loading }) {
  const matieres = data?.matieres ?? [];

  return (
    <div className="space-y-6">
      <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">Mes Notes</h2>
      <Card padding={false}>
        <Table>
          <Table.Header>
            <Table.Head>Matière</Table.Head>
            <Table.Head>Note</Table.Head>
            <Table.Head>Coefficient</Table.Head>
          </Table.Header>
          <Table.Body>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <Table.Row key={i}>
                {[1, 2, 3].map((j) => <Table.Cell key={j}><Skeleton className="h-4 w-full" /></Table.Cell>)}
              </Table.Row>
            ))}
            {!loading && matieres.length === 0 && (
              <Table.Row>
                <td colSpan={3} className="p-8 text-center text-sm text-neutral-500">Aucune note disponible</td>
              </Table.Row>
            )}
            {!loading && matieres.map((m, i) => (
              <Table.Row key={i}>
                <Table.Cell className="font-medium">{m.name}</Table.Cell>
                <Table.Cell>
                  <span className={cn(
                    'font-semibold',
                    m.note >= 14 ? 'text-emerald-500' : m.note >= 10 ? 'text-amber-500' : 'text-red-500'
                  )}>
                    {m.note}/20
                  </span>
                </Table.Cell>
                <Table.Cell className="text-neutral-500">×{m.coeff}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>
    </div>
  );
}

export default function EleveDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading, error, refetch } = useDashboardStats('eleve');

  const eleve = data?.eleve ?? {};

  const handleTabClick = (tabId) => {
    if (tabId === 'apercu') { setActiveTab(tabId); return; }
    if (tabId === 'notes') { setActiveTab(tabId); return; }
    const routes = { emploi: '/emploi-du-temps', paiements: '/paiements' };
    navigate(routes[tabId] || '/eleve/dashboard');
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection data={data} loading={loading} />;
      case 'notes': return <NotesSection data={data} loading={loading} />;
      default: return <ApercuSection data={data} loading={loading} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-fraunces text-2xl font-bold text-neutral-900 dark:text-white"
          >
            Mon Espace Élève
          </motion.h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {eleve.classe ? `Classe de ${eleve.classe} — ` : ''}
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
          Actualiser
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          Erreur de chargement : {error}
        </div>
      )}

      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="flex gap-1 overflow-x-auto -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {renderSection()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
