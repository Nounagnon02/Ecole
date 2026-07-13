/**
 * AdminDashboard — Tableau de bord premium pour Super Admin
 *
 * Sections : Aperçu Système | Utilisateurs | Configuration | Logs | Sauvegardes
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  Settings,
  Activity,
  Database,
  Server,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Download,
  RefreshCw,
  Bell,
  Terminal,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import { useDashboardStats } from '@/app/dashboards/hooks/useDashboardData';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';

// ─── Constantes ───────────────────────────────────────────────

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: Activity },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: Users },
  { id: 'configuration', label: 'Configuration', icon: Settings },
  { id: 'logs', label: 'Logs Système', icon: Terminal },
  { id: 'sauvegardes', label: 'Sauvegardes', icon: Database },
];

const STATS_META = [
  { title: 'Utilisateurs Actifs', icon: Users, color: 'primary' },
  { title: 'Requêtes/minute', icon: Activity, color: 'emerald' },
  { title: 'Espace Disque', icon: HardDrive, color: 'sky' },
  { title: 'Erreurs API', icon: AlertTriangle, color: 'red' },
  { title: 'Temps Réponse', icon: Clock, color: 'purple' },
  { title: 'Uptime', icon: CheckCircle2, color: 'emerald' },
];

// ─── Sections ─────────────────────────────────────────────────

function ApercuSection({ data, loading }) {
  const safeStats = data?.stats?.map((s, i) => ({ ...s, icon: STATS_META[i]?.icon, color: STATS_META[i]?.color })) || [];
  const safeTraffic = data?.traffic || [];
  const safeLogs = data?.logs || [];
  const safeHealth = data?.health || [];
  const safeUtilisateurs = data?.utilisateurs || [];
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {safeStats.map((stat, i) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic chart */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <div className="flex items-center justify-between">
              <div>
                <Card.Title>Trafic API</Card.Title>
                <Card.Description>Requêtes et temps de réponse — 7 derniers jours</Card.Description>
              </div>
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" /> Actualiser
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={safeTraffic}>
                  <defs>
                    <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="jour" tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <ReTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                  <Area yAxisId="left" type="monotone" dataKey="req" stroke="var(--accent)" fill="url(#reqGrad)" strokeWidth={2} name="Requêtes" />
                  <Line yAxisId="right" type="monotone" dataKey="temps" stroke="var(--green)" strokeWidth={2} name="Temps (ms)" dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        {/* System health */}
        <Card>
          <Card.Header>
            <Card.Title>Santé Système</Card.Title>
            <Card.Description>Indicateurs clés</Card.Description>
          </Card.Header>
          <Card.Body className="space-y-4">
            {safeHealth.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-neutral-500">{item.label}</span>
                  <span className="text-xs text-neutral-700 dark:text-neutral-300">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className={cn('h-full rounded-full transition-all', item.color)}
                    style={{ width: item.width }}
                  />
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      </div>

      {/* Logs récents */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>Logs Système — Temps Réel</Card.Title>
            <Badge variant="danger" size="sm">{safeLogs.filter(l => l.level === 'ERROR').length} erreurs</Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {safeLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-6 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-sm font-mono">
                <span className={cn(
                  'text-xs font-semibold uppercase min-w-[4rem]',
                  log.level === 'ERROR' && 'text-[var(--red)]',
                  log.level === 'WARN' && 'text-[var(--amber)]',
                  log.level === 'INFO' && 'text-[var(--emerald)]',
                )}>
                  {log.level}
                </span>
                <span className="text-neutral-500 text-xs min-w-[5rem]">{log.time}</span>
                <span className="text-neutral-700 dark:text-neutral-300 flex-1">{log.message}</span>
                <span className="text-neutral-400 text-xs">{log.module}</span>
              </div>
            ))}
          </div>
        </Card.Body>
        <Card.Footer>
          <Button variant="ghost" size="sm" className="w-full">
            Voir tous les logs <Terminal className="h-4 w-4 ml-1" />
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}

function LogsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">Logs Système</h2>
          <p className="text-sm text-neutral-500 mt-1">Journalisation détaillée</p>
        </div>
        <Button variant="ghost" size="sm">
          <Download className="h-4 w-4 mr-1" /> Exporter
        </Button>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Console de logs avec filtres, recherche et export
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function SauvegardesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">Sauvegardes</h2>
          <p className="text-sm text-neutral-500 mt-1">Gestion des backups</p>
        </div>
        <Button>
          <Database className="h-4 w-4 mr-2" /> Sauvegarder
        </Button>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Backups automatiques, restauration et planification
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

// ─── Composant Principal ──────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading } = useDashboardStats('admin');

  const handleTabClick = (tabId) => {
    if (tabId === 'apercu') {
      setActiveTab(tabId);
      return;
    }
    const routes = {
      utilisateurs: '/admin/utilisateurs',
      configuration: '/admin/configuration',
    };
    if (routes[tabId]) {
      navigate(routes[tabId]);
    } else {
      setActiveTab(tabId);
    }
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection data={data} loading={loading} />;
      case 'logs': return <LogsSection />;
      case 'sauvegardes': return <SauvegardesSection />;
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
            Administration Système
          </motion.h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Gestion de la plateforme — {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4 mr-1" /> Alertes
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4 mr-1" /> Paramètres
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
                    ? 'border-[var(--accent)] text-[var(--accent)] dark:text-[var(--accent)]'
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
