/**
 * DirecteurDashboard — données réelles depuis l'API
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, BookOpen, GraduationCap, DollarSign, TrendingUp,
  Activity, School, CheckCircle2, XCircle, Bell, MessageSquare,
  Calendar, BarChart3, PieChart, ArrowRight, Download,
  Search, Filter, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend,
  Area, AreaChart,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import { useDashboardStats } from '@/app/dashboards/hooks/useDashboardData';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import Input from '@/shared/components/ui/Input';
import { Skeleton } from '@/shared/components/ui/Skeleton';

const COLORS = ['var(--accent)', 'var(--green)', 'var(--amber)', 'var(--red)', 'var(--blue)', 'var(--primary)', 'var(--text-secondary)'];

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: Activity },
  { id: 'eleves', label: 'Élèves', icon: Users },
  { id: 'performances', label: 'Performances', icon: BarChart3 },
  { id: 'finances', label: 'Finances', icon: DollarSign },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'calendrier', label: 'Calendrier', icon: Calendar },
];

function StatCardsGrid({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const cards = [
    { title: 'Total Élèves', value: String(stats?.total_eleves ?? 0), icon: Users, color: 'primary' },
    { title: 'Enseignants', value: String(stats?.total_enseignants ?? 0), icon: GraduationCap, color: 'emerald' },
    { title: 'Classes', value: String(stats?.total_classes ?? 0), icon: School, color: 'amber' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((stat, i) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <StatsCard {...stat} className="h-full" />
        </motion.div>
      ))}
    </div>
  );
}

function PerformanceChart({ data, loading }) {
  const chartData = data?.evolution_effectifs ?? [];

  return (
    <Card className="col-span-2">
      <Card.Header>
        <div className="flex items-center justify-between">
          <div>
            <Card.Title>Évolution des Effectifs</Card.Title>
            <Card.Description>Inscriptions par mois</Card.Description>
          </div>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-1" />Exporter
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="h-[300px]">
          {loading ? <Skeleton className="h-full w-full rounded-xl" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)' }} />
                <Area type="monotone" dataKey="students" stroke="var(--accent)" fill="url(#grad)" strokeWidth={2} name="Élèves" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

function RepartitionPie({ data, loading }) {
  const chartData = data?.repartition_notes ?? [];

  return (
    <Card>
      <Card.Header>
        <Card.Title>Répartition des Notes</Card.Title>
        <Card.Description>Distribution par tranche</Card.Description>
      </Card.Header>
      <Card.Body>
        <div className="h-[300px]">
          {loading ? <Skeleton className="h-full w-full rounded-xl" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </RePieChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

function ClassesTable({ classes, loading }) {
  const [search, setSearch] = useState('');
  const filtered = (classes ?? []).filter((c) =>
    !search || c.nom_classe?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="col-span-2">
      <Card.Header>
        <div className="flex items-center justify-between">
          <div>
            <Card.Title>Classes et Effectifs</Card.Title>
            <Card.Description>Vue d'ensemble des classes actives</Card.Description>
          </div>
          <Input
            placeholder="Rechercher..."
            size="sm"
            icon={Search}
            className="w-48"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        <Table>
          <Table.Header>
            <Table.Head>Classe</Table.Head>
            <Table.Head>Effectif</Table.Head>
            <Table.Head>Catégorie</Table.Head>
          </Table.Header>
          <Table.Body>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <Table.Row key={i}>
                {[1, 2, 3].map((j) => (
                  <Table.Cell key={j}><Skeleton className="h-4 w-full" /></Table.Cell>
                ))}
              </Table.Row>
            ))}
            {!loading && filtered.map((cl) => (
              <Table.Row key={cl.id}>
                <Table.Cell>
                  <span className="font-medium text-neutral-900 dark:text-white">{cl.nom_classe}</span>
                </Table.Cell>
                <Table.Cell>{cl.effectif ?? cl.eleves_count ?? '—'}</Table.Cell>
                <Table.Cell>
                  <Badge variant="outline" size="sm">{cl.categorie_classe}</Badge>
                </Table.Cell>
              </Table.Row>
            ))}
            {!loading && filtered.length === 0 && (
              <Table.Row>
                <td colSpan={3} className="p-6 text-center text-sm text-neutral-500">Aucune classe</td>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </Card.Body>
    </Card>
  );
}

function ApercuSection({ data, loading }) {
  const stats = data?.stats ?? {};
  const classes = data?.classes_effectif ?? data?.classes ?? [];

  return (
    <div className="space-y-6">
      <StatCardsGrid stats={stats} loading={loading} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PerformanceChart data={stats} loading={loading} />
        <RepartitionPie data={stats} loading={loading} />
      </div>
      <ClassesTable classes={classes} loading={loading} />
    </div>
  );
}

export default function DirecteurDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading, error, refetch } = useDashboardStats('directeur');

  const handleTabClick = (tabId) => {
    if (tabId === 'apercu') {
      setActiveTab(tabId);
      return;
    }
    // Rediriger vers les pages de fonctionnalités dédiées
    const routes = {
      eleves: '/eleves',
      performances: '/notes',
      finances: '/paiements',
      messages: '/messagerie',
      calendrier: '/emploi-du-temps',
    };
    navigate(routes[tabId] || '/directeur/dashboard');
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection data={data} loading={loading} />;
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
            Tableau de Bord
          </motion.h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-red-500">Erreur de chargement</span>
          )}
          <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-1" />Rapport
          </Button>
        </div>
      </div>

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
