/**
 * DirecteurDashboard — Tableau de bord premium du Directeur
 *
 * Vue d'ensemble : KPIs clés, tendances, activités récentes
 * Sections : Aperçu Élèves | Performances | Finances | Messages
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  BookOpen,
  GraduationCap,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  School,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bell,
  MessageSquare,
  Calendar,
  BarChart3,
  PieChart,
  ArrowRight,
  Download,
  MoreHorizontal,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart,
} from 'recharts';
import { format, subDays, isToday, parseISO } from 'date-fns';
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

// ─── Constantes ───────────────────────────────────────────────
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#14b8a6'];

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: Activity },
  { id: 'eleves', label: 'Élèves', icon: Users },
  { id: 'performances', label: 'Performances', icon: BarChart3 },
  { id: 'finances', label: 'Finances', icon: DollarSign },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'calendrier', label: 'Calendrier', icon: Calendar },
];

// ─── Données simulées (à remplacer par API) ───────────────────
const STATS = [
  { title: 'Total Élèves', value: '1 284', icon: Users, trend: 12, trendLabel: 'vs mois dernier', color: 'indigo' },
  { title: 'Enseignants', value: '64', icon: GraduationCap, trend: 4, trendLabel: 'vs mois dernier', color: 'emerald' },
  { title: 'Taux de Réussite', value: '87%', icon: TrendingUp, trend: 5.2, trendLabel: 'vs trimestre dernier', color: 'sky' },
  { title: 'Revenus Mensuels', value: '12,4 M FCFA', icon: DollarSign, trend: 8.1, trendLabel: 'vs mois dernier', color: 'purple' },
  { title: 'Classes Actives', value: '28', icon: School, trend: 0, trendLabel: 'inchangé', color: 'amber' },
  { title: 'Taux d\'Absence', value: '4.2%', icon: XCircle, trend: -1.3, trendLabel: 'en baisse', color: 'red' },
];

const PERFORMANCE_DATA = [
  { mois: 'Sept', moyenne: 72, present: 95, absents: 12 },
  { mois: 'Oct', moyenne: 74, present: 93, absents: 15 },
  { mois: 'Nov', moyenne: 76, present: 96, absents: 8 },
  { mois: 'Déc', moyenne: 73, present: 90, absents: 20 },
  { mois: 'Jan', moyenne: 78, present: 97, absents: 6 },
  { mois: 'Fév', moyenne: 81, present: 98, absents: 4 },
  { mois: 'Mars', moyenne: 79, present: 94, absents: 11 },
  { mois: 'Avr', moyenne: 82, present: 96, absents: 7 },
  { mois: 'Mai', moyenne: 84, present: 97, absents: 5 },
];

const REPARTITION_CLASSES = [
  { name: '6ème', value: 240, couleur: '#6366f1' },
  { name: '5ème', value: 215, couleur: '#10b981' },
  { name: '4ème', value: 198, couleur: '#f59e0b' },
  { name: '3ème', value: 185, couleur: '#ef4444' },
  { name: '2nde', value: 172, couleur: '#06b6d4' },
  { name: '1ère', value: 156, couleur: '#8b5cf6' },
  { name: 'Tle', value: 118, couleur: '#14b8a6' },
];

const ACTIVITES_RECENTES = [
  { id: 1, type: 'inscription', message: 'Inscription de Koffi Amégnigban', time: 'il y a 2h', user: 'Koffi A.', status: 'success' },
  { id: 2, type: 'paiement', message: 'Paiement de 45 000 FCFA - Marie Dossa', time: 'il y a 3h', user: 'Marie D.', status: 'success' },
  { id: 3, type: 'note', message: 'Saisie des notes de la 4ème A', time: 'il y a 4h', user: 'M. Koffi', status: 'info' },
  { id: 4, type: 'absence', message: 'Absence signalée - Jean Mensah', time: 'il y a 5h', user: 'Jean M.', status: 'warning' },
  { id: 5, type: 'reclamation', message: 'Réclamation parent - Famille Akakpo', time: 'il y a 6h', user: 'F. Akakpo', status: 'danger' },
  { id: 6, type: 'echeance', message: 'Échéance de paiement - 15 élèves', time: 'il y a 1j', user: 'Système', status: 'warning' },
];

const CLASSES_RECENTES = [
  { id: 'CL-001', nom: '4ème A', effectif: 42, enseignant: 'M. Koffi', moyenne: '14.2/20', present: 40 },
  { id: 'CL-002', nom: '3ème B', effectif: 38, enseignant: 'Mme. Dossa', moyenne: '12.8/20', present: 35 },
  { id: 'CL-003', nom: '6ème C', effectif: 45, enseignant: 'M. Mensah', moyenne: '15.1/20', present: 43 },
  { id: 'CL-004', nom: '2nde A', effectif: 40, enseignant: 'Mme. Akakpo', moyenne: '11.5/20', present: 37 },
  { id: 'CL-005', nom: 'Tle D', effectif: 35, enseignant: 'M. Amégnigban', moyenne: '13.7/20', present: 33 },
];

const MESSAGES_RECENTS = [
  { id: 1, from: 'M. Koffi', role: 'Enseignant', message: 'Demande de réunion concernant le programme de 4ème', time: '10:30', avatar: null, unread: true },
  { id: 2, from: 'Mme. Akakpo', role: 'Parent', message: 'Inquiétude sur les notes de mon fils en mathématiques', time: '09:15', avatar: null, unread: true },
  { id: 3, from: 'M. Mensah', role: 'Surveillant', message: 'Rapport de discipline hebdomadaire - Semaine 24', time: 'Hier', avatar: null, unread: false },
  { id: 4, from: 'Mme. Dossa', role: 'Comptable', message: 'Budget trimestriel à valider pour signature', time: 'Hier', avatar: null, unread: false },
];

// ─── Composants internes ──────────────────────────────────────

function StatCardsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {STATS.map((stat, i) => (
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

function PerformanceChart() {
  return (
    <Card className="col-span-2">
      <Card.Header>
        <div className="flex items-center justify-between">
          <div>
            <Card.Title>Performance Académique</Card.Title>
            <Card.Description>Évolution de la moyenne générale et présence</Card.Description>
          </div>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Exporter
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={PERFORMANCE_DATA}>
              <defs>
                <linearGradient id="moyenneGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Area type="monotone" dataKey="moyenne" stroke="#6366f1" fill="url(#moyenneGrad)" strokeWidth={2} name="Moyenne" />
              <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Présence %" dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card.Body>
    </Card>
  );
}

function RepartitionPie() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Répartition par Niveau</Card.Title>
        <Card.Description>Effectifs par classe</Card.Description>
      </Card.Header>
      <Card.Body>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={REPARTITION_CLASSES}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {REPARTITION_CLASSES.map((entry, i) => (
                  <Cell key={entry.name} fill={entry.couleur} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-sm text-neutral-600">{value}</span>}
              />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      </Card.Body>
    </Card>
  );
}

function ActivitesRecentes() {
  const statusConfig = {
    success: { label: 'Succès', color: 'bg-emerald-500' },
    info: { label: 'Info', color: 'bg-sky-500' },
    warning: { label: 'Attention', color: 'bg-amber-500' },
    danger: { label: 'Urgent', color: 'bg-red-500' },
  };

  return (
    <Card className="col-span-1">
      <Card.Header>
        <Card.Title>Activités Récentes</Card.Title>
        <Card.Description>Les 6 dernières actions</Card.Description>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {ACTIVITES_RECENTES.map((act) => (
            <div key={act.id} className="flex items-start gap-3 px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              <span className={cn('mt-1 h-2 w-2 rounded-full shrink-0', statusConfig[act.status].color)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{act.message}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{act.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}

function ClassesTable() {
  return (
    <Card className="col-span-2">
      <Card.Header>
        <div className="flex items-center justify-between">
          <div>
            <Card.Title>Classes et Effectifs</Card.Title>
            <Card.Description>Vue d'ensemble des classes actives</Card.Description>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Rechercher..."
              size="sm"
              icon={Search}
              className="w-48"
            />
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        <Table>
          <Table.Header>
            <Table.Head>Classe</Table.Head>
            <Table.Head>Effectif</Table.Head>
            <Table.Head>Enseignant Principal</Table.Head>
            <Table.Head>Moyenne</Table.Head>
            <Table.Head>Présence</Table.Head>
            <Table.Head>Statut</Table.Head>
          </Table.Header>
          <Table.Body>
            {CLASSES_RECENTES.map((cl) => (
              <Table.Row key={cl.id}>
                <Table.Cell>
                  <span className="font-medium text-neutral-900 dark:text-white">{cl.nom}</span>
                </Table.Cell>
                <Table.Cell>{cl.effectif}</Table.Cell>
                <Table.Cell>{cl.enseignant}</Table.Cell>
                <Table.Cell>{cl.moyenne}</Table.Cell>
                <Table.Cell>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {cl.present}/{cl.effectif}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className={cn(
                    'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full',
                    cl.present / cl.effectif > 0.95
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                  )}>
                    {cl.present / cl.effectif > 0.95 ? 'Bon' : 'Moyen'}
                  </span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card.Body>
    </Card>
  );
}

function MessagesList() {
  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <div>
            <Card.Title>Messages Récents</Card.Title>
            <Card.Description>Communications non lues</Card.Description>
          </div>
          <Badge variant="danger" size="sm">{MESSAGES_RECENTS.filter(m => m.unread).length} non lus</Badge>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {MESSAGES_RECENTS.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex items-center gap-3 px-6 py-3.5 transition-colors cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                msg.unread && 'bg-indigo-50/30 dark:bg-indigo-500/5'
              )}
            >
              <Avatar name={msg.from} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm', msg.unread ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300')}>
                    {msg.from}
                  </span>
                  <span className="text-xs text-neutral-400">{msg.role}</span>
                </div>
                <p className={cn('text-sm truncate', msg.unread ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-500')}>
                  {msg.message}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-neutral-400">{msg.time}</span>
                {msg.unread && <span className="h-2 w-2 rounded-full bg-indigo-500" />}
              </div>
            </div>
          ))}
        </div>
      </Card.Body>
      <Card.Footer>
        <Button variant="ghost" size="sm" className="w-full">
          Voir tous les messages
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </Card.Footer>
    </Card>
  );
}

// ─── Sections par onglet ──────────────────────────────────────

function ApercuSection() {
  return (
    <div className="space-y-6">
      <StatCardsGrid />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PerformanceChart />
        <RepartitionPie />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ClassesTable />
        <div className="space-y-6">
          <ActivitesRecentes />
          <MessagesList />
        </div>
      </div>
    </div>
  );
}

function ElevesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Gestion des Élèves</h2>
          <p className="text-sm text-neutral-500 mt-1">Gérez les inscriptions, profils et dossiers</p>
        </div>
        <Button>
          <Users className="h-4 w-4 mr-2" />
          Nouvel Élève
        </Button>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Module de gestion complète des élèves — à implémenter avec la table des élèves et CRUD
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function PerformancesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Performances Académiques</h2>
          <p className="text-sm text-neutral-500 mt-1">Analyses, comparaisons et tendances</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualiser
          </Button>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Analyse détaillée des performances par classe, matière et période
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function FinancesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Gestion Financière</h2>
          <p className="text-sm text-neutral-500 mt-1">Paiements, budgets et rapports</p>
        </div>
        <Button variant="secondary">
          <Download className="h-4 w-4 mr-2" />
          Rapport Financier
        </Button>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Tableau de bord financier complet — à connecter avec le module de paiement
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function MessagesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Messagerie Interne</h2>
          <p className="text-sm text-neutral-500 mt-1">Communications avec l'équipe</p>
        </div>
        <Button>
          <MessageSquare className="h-4 w-4 mr-2" />
          Nouveau Message
        </Button>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Système de messagerie complet — boîte de réception, envoi, archivage
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function CalendrierSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Calendrier Scolaire</h2>
          <p className="text-sm text-neutral-500 mt-1">Événements, congés et examens</p>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Calendrier interactif — à implémenter avec vue mois/semaine
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

// ─── Composant Principal ──────────────────────────────────────

export default function DirecteurDashboard() {
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading, error, refetch } = useDashboardStats('directeur');

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection />;
      case 'eleves': return <ElevesSection />;
      case 'performances': return <PerformancesSection />;
      case 'finances': return <FinancesSection />;
      case 'messages': return <MessagesSection />;
      case 'calendrier': return <CalendrierSection />;
      default: return <ApercuSection />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-neutral-900 dark:text-white"
          >
            Tableau de Bord
          </motion.h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Vue d'ensemble de l'établissement — {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
            Actualiser
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Rapport
          </Button>
        </div>
      </div>

      {/* Navigation tabs */}
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
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
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

      {/* Content */}
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
