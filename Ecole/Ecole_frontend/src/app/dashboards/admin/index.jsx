/**
 * AdminDashboard — Tableau de bord premium pour Super Admin
 *
 * Sections : Aperçu Système | Utilisateurs | Configuration | Logs | Sauvegardes
 */

import { useState } from 'react';
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
  FileText,
  UserPlus,
  Lock,
  Globe,
  Smartphone,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import Avatar from '@/shared/components/ui/Avatar';

// ─── Constantes ───────────────────────────────────────────────

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: Activity },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: Users },
  { id: 'configuration', label: 'Configuration', icon: Settings },
  { id: 'logs', label: 'Logs Système', icon: Terminal },
  { id: 'sauvegardes', label: 'Sauvegardes', icon: Database },
];

const STATS_ADMIN = [
  { title: 'Utilisateurs Actifs', value: '2 456', icon: Users, trend: 8.2, trendLabel: 'ce mois', color: 'indigo' },
  { title: 'Requêtes/minute', value: '1 247', icon: Activity, trend: 12.5, trendLabel: 'vs hier', color: 'emerald' },
  { title: 'Espace Disque', value: '64%', icon: HardDrive, trend: -3, trendLabel: 'utilisé (256 Go)', color: 'sky' },
  { title: 'Erreurs API', value: '6', icon: AlertTriangle, trend: -42, trendLabel: 'dernières 24h', color: 'red' },
  { title: 'Temps Réponse', value: '124ms', icon: Clock, trend: -8, trendLabel: 'médiane', color: 'purple' },
  { title: 'Uptime', value: '99.97%', icon: CheckCircle2, trend: 0.01, trendLabel: 'ce mois', color: 'emerald' },
];

const DONNEES_TRAFFIC = [
  { jour: 'Lun', req: 15200, erreurs: 23, temps: 145 },
  { jour: 'Mar', req: 16800, erreurs: 18, temps: 132 },
  { jour: 'Mer', req: 14300, erreurs: 31, temps: 156 },
  { jour: 'Jeu', req: 17500, erreurs: 15, temps: 118 },
  { jour: 'Ven', req: 19200, erreurs: 12, temps: 108 },
  { jour: 'Sam', req: 8900, erreurs: 6, temps: 89 },
  { jour: 'Dim', req: 7200, erreurs: 4, temps: 76 },
];

const UTILISATEURS_RECENTS = [
  { id: 1, nom: 'M. Koffi', role: 'Enseignant', email: 'koffi@ecole.bf', status: 'Actif', lastActive: 'Il y a 5 min' },
  { id: 2, nom: 'Mme. Dossa', role: 'Comptable', email: 'dossa@ecole.bf', status: 'Actif', lastActive: 'Il y a 12 min' },
  { id: 3, nom: 'Jean Mensah', role: 'Élève', email: 'mensah@ecole.bf', status: 'Actif', lastActive: 'Il y a 1h' },
  { id: 4, nom: 'Famille Akakpo', role: 'Parent', email: 'akakpo@ecole.bf', status: 'Inactif', lastActive: 'Hier' },
  { id: 5, nom: 'M. Amégnigban', role: 'Surveillant', email: 'amegnigban@ecole.bf', status: 'Actif', lastActive: 'Il y a 30 min' },
];

const LOGS_RECENTS = [
  { id: 1, level: 'ERROR', message: 'Échec de connexion API — timeout dépassé', module: 'Auth', time: '10:32:15', ip: '192.168.1.45' },
  { id: 2, level: 'WARN', message: 'Tentative de connexion échouée x3 — utilisateur bloqué', module: 'Security', time: '10:28:02', ip: '10.0.0.88' },
  { id: 3, level: 'INFO', message: 'Sauvegarde BDD terminée — 1.2 Go', module: 'Backup', time: '10:00:00', ip: null },
  { id: 4, level: 'ERROR', message: 'Paiement échoué — refus banque', module: 'Paiement', time: '09:45:12', ip: '192.168.1.32' },
  { id: 5, level: 'WARN', message: 'Espace disque < 40% sur serveur principal', module: 'System', time: '08:00:00', ip: null },
  { id: 6, level: 'INFO', message: 'Nouvel utilisateur inscrit — 45 cette heure', module: 'Auth', time: '07:35:00', ip: '10.0.0.12' },
];

// ─── Sections ─────────────────────────────────────────────────

function ApercuSection() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STATS_ADMIN.map((stat, i) => (
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
                <AreaChart data={DONNEES_TRAFFIC}>
                  <defs>
                    <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="jour" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <ReTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                  <Area yAxisId="left" type="monotone" dataKey="req" stroke="#6366f1" fill="url(#reqGrad)" strokeWidth={2} name="Requêtes" />
                  <Line yAxisId="right" type="monotone" dataKey="temps" stroke="#10b981" strokeWidth={2} name="Temps (ms)" dot={{ r: 3 }} />
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
            {[
              { label: 'CPU', value: '34%', color: 'bg-emerald-500', width: '34%' },
              { label: 'RAM', value: '62%', color: 'bg-amber-500', width: '62%' },
              { label: 'Disque', value: '64%', color: 'bg-sky-500', width: '64%' },
              { label: 'Cache Redis', value: '28%', color: 'bg-emerald-500', width: '28%' },
              { label: 'Workers', value: '7/10', color: 'bg-emerald-500', width: '70%' },
            ].map((item) => (
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
            <Badge variant="danger" size="sm">{LOGS_RECENTS.filter(l => l.level === 'ERROR').length} erreurs</Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {LOGS_RECENTS.slice(0, 4).map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-6 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-sm font-mono">
                <span className={cn(
                  'text-xs font-semibold uppercase min-w-[4rem]',
                  log.level === 'ERROR' && 'text-red-500',
                  log.level === 'WARN' && 'text-amber-500',
                  log.level === 'INFO' && 'text-emerald-500',
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

function UtilisateursSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Gestion des Utilisateurs</h2>
          <p className="text-sm text-neutral-500 mt-1">2 456 utilisateurs enregistrés</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" /> Nouvel Utilisateur
        </Button>
      </div>
      <Card>
        <Card.Header>
          <Card.Title>Utilisateurs Récents</Card.Title>
        </Card.Header>
        <Card.Body className="p-0">
          <Table>
            <Table.Header>
              <Table.Head>Utilisateur</Table.Head>
              <Table.Head>Rôle</Table.Head>
              <Table.Head>Email</Table.Head>
              <Table.Head>Statut</Table.Head>
              <Table.Head>Dernière Activité</Table.Head>
            </Table.Header>
            <Table.Body>
              {UTILISATEURS_RECENTS.map((u) => (
                <Table.Row key={u.id}>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <Avatar name={u.nom} size="sm" />
                      <span className="font-medium text-neutral-900 dark:text-white">{u.nom}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>{u.role}</Table.Cell>
                  <Table.Cell className="text-neutral-400">{u.email}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={u.status === 'Actif' ? 'success' : 'neutral'} size="sm">
                      {u.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-neutral-400">{u.lastActive}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

function ConfigurationSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Configuration</h2>
          <p className="text-sm text-neutral-500 mt-1">Paramètres de l'application</p>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Configuration système — paramètres, rôles, permissions, et préférences
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function LogsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Logs Système</h2>
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
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Sauvegardes</h2>
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
  const [activeTab, setActiveTab] = useState('apercu');

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection />;
      case 'utilisateurs': return <UtilisateursSection />;
      case 'configuration': return <ConfigurationSection />;
      case 'logs': return <LogsSection />;
      case 'sauvegardes': return <SauvegardesSection />;
      default: return <ApercuSection />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-neutral-900 dark:text-white"
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
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
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
