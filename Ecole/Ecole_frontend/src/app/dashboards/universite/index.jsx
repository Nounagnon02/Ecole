/**
 * UniversiteDashboard — Tableau de bord université v1
 *
 * Rôles : Recteur, Doyen, Professeur, Étudiant, Personnel
 * Sections : Aperçu | Facultés | Étudiants | Cours | Planning
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Users, BookOpen, GraduationCap, Calendar,
  TrendingUp, TrendingDown, Activity, School, MapPin,
  UserCheck, FileText, Clock, Plus, Search, Bell,
  BarChart3, ChevronRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
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
import Avatar from '@/shared/components/ui/Avatar';
import { Skeleton } from '@/shared/components/ui/Skeleton';

/* ─── Constantes ─────────────────────────────────────────────── */
const COLORS = ['var(--accent)', 'var(--green)', 'var(--amber)', 'var(--blue)', 'var(--primary)', 'var(--red)'];

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: Activity },
  { id: 'facultes', label: 'Facultés', icon: Building2 },
  { id: 'etudiants', label: 'Étudiants', icon: Users },
  { id: 'cours', label: 'Cours', icon: BookOpen },
  { id: 'planning', label: 'Planning', icon: Calendar },
];

const STATS_META = [
  { title: 'Facultés', icon: Building2, color: 'primary' },
  { title: 'Départements', icon: School, color: 'sky' },
  { title: 'Enseignants', icon: Users, color: 'emerald' },
  { title: 'Étudiants', icon: GraduationCap, color: 'violet' },
];

/* ─── Sections ────────────────────────────────────────────────── */

function ApercuSection({ stats, inscriptions, facultes, activites, loading }) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : stats.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatsCard {...stat} className="h-full" />
          </motion.div>
        ))}
      </div>
      {loading && <Skeleton className="h-[300px] rounded-2xl" />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inscriptions */}
        <Card>
          <Card.Header>
            <Card.Title>Inscriptions & Diplômes</Card.Title>
            <Card.Description>Évolution sur 5 ans</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[260px]">
              {inscriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)]">
                  <BarChart3 className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">Aucune donnée d'inscription</p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inscriptions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="annee" tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <ReTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                  <Bar dataKey="inscriptions" name="Inscriptions" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="diplomes" name="Diplômés" fill="var(--green)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Répartition par faculté */}
        <Card>
          <Card.Header>
            <Card.Title>Étudiants par Faculté</Card.Title>
            <Card.Description>Répartition semestre actuel</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[260px]">
              {facultes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)]">
                  <Building2 className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">Aucune donnée facultaire</p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={facultes} dataKey="etudiants" nameKey="nom" cx="50%" cy="50%" outerRadius={90} label={({ nom, percent }) => `${nom} ${(percent * 100).toFixed(0)}%`}>
                    {facultes.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Activités récentes */}
      <Card>
        <Card.Header>
          <Card.Title>Activités Récentes</Card.Title>
          <Card.Description>Derniers événements dans l'université</Card.Description>
        </Card.Header>
        <Card.Body>
          {activites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-[var(--text-tertiary)]">
              <Activity className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">Aucune activité récente</p>
            </div>
          ) : (
          <div className="space-y-1">
            {activites.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50/50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/30">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full',
                  a.type === 'inscription' && 'bg-[var(--emerald-subtle)] text-[var(--emerald)]',
                  a.type === 'note' && 'bg-[var(--accent-subtle)] text-[var(--accent)]',
                  a.type === 'evenement' && 'bg-[var(--amber-subtle)] text-[var(--amber)]',
                  a.type === 'alerte' && 'bg-[var(--red-subtle)] text-[var(--red)]',
                  a.type === 'cours' && 'bg-[var(--sky-subtle)] text-[var(--sky)]',
                )}>
                  {a.type === 'inscription' && <UserCheck className="h-4 w-4" />}
                  {a.type === 'note' && <FileText className="h-4 w-4" />}
                  {a.type === 'evenement' && <Calendar className="h-4 w-4" />}
                  {a.type === 'alerte' && <Bell className="h-4 w-4" />}
                  {a.type === 'cours' && <BookOpen className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{a.message}</p>
                  <p className="text-xs text-neutral-400">{a.temps}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-300" />
              </div>
            ))}
          </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

function FacultesSection({ facultes }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">Facultés & Départements</h2>
          <p className="text-sm text-neutral-500 mt-1">Gestion des facultés et départements</p>
        </div>
        <Button size="sm" icon={<Plus />}>Nouvelle Faculté</Button>
      </div>

      {facultes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--text-tertiary)]">
          <Building2 className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm">Aucune faculté disponible</p>
        </div>
      ) : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {facultes.map((f) => (
          <Card key={f.nom}>
            <Card.Body>
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-subtle)]">
                  <Building2 className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <Badge variant="neutral" size="sm">{f.departements} dép.</Badge>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{f.nom}</h3>
              <div className="mt-4 flex gap-4 text-sm text-neutral-500">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {f.etudiants}</span>
                <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {f.enseignants}</span>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}

function EtudiantsSection({ etudiantsData }) {
  const data = etudiantsData || [];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">Étudiants</h2>
          <p className="text-sm text-neutral-500 mt-1">Gestion des inscriptions et dossiers étudiants</p>
        </div>
        <Button size="sm" icon={<Plus />}>Nouvel Étudiant</Button>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--text-tertiary)]">
          <Users className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm">Aucune donnée étudiante disponible</p>
        </div>
      ) : (
      <Card>
        <Card.Header>
          <Card.Title>Inscriptions du Semestre</Card.Title>
          <Card.Description>Répartition par niveau</Card.Description>
        </Card.Header>
        <Card.Body className="p-0">
          <Table>
            <Table.Header>
              <Table.Head>Niveau</Table.Head>
              <Table.Head>Inscrits</Table.Head>
              <Table.Head>Hommes</Table.Head>
              <Table.Head>Femmes</Table.Head>
              <Table.Head>Évolution</Table.Head>
            </Table.Header>
            <Table.Body>
              {data.map((r) => (
                <Table.Row key={r.niveau}>
                  <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{r.niveau}</span></Table.Cell>
                  <Table.Cell>{r.inscrits}</Table.Cell>
                  <Table.Cell>{r.h}</Table.Cell>
                  <Table.Cell>{r.f}</Table.Cell>
                  <Table.Cell><Badge variant="success" size="sm">{r.evol}</Badge></Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>
      )}
    </div>
  );
}

function CoursSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">Cours & Programmes</h2>
          <p className="text-sm text-neutral-500 mt-1">Gestion des enseignements et programmes</p>
        </div>
        <Button size="sm" icon={<Plus />}>Nouveau Cours</Button>
      </div>

      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Interface de gestion des cours — programmes, affectations, et suivis pédagogiques
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function PlanningSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">Planning</h2>
          <p className="text-sm text-neutral-500 mt-1">Emplois du temps et calendrier universitaire</p>
        </div>
        <Button size="sm" icon={<Plus />}>Nouvel Événement</Button>
      </div>

      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Calendrier universitaire — emplois du temps, examens, et événements académiques
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

/* ─── Dashboard principal ──────────────────────────────────────── */
export default function UniversiteDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading } = useDashboardStats('universite');

  const stats = data?.stats?.map((s, i) => ({ ...s, icon: STATS_META[i]?.icon, color: STATS_META[i]?.color })) || [];
  const inscriptions = data?.inscriptions || [];
  const facultes = data?.facultes || [];
  const activites = data?.activites || [];

  const handleTabClick = (tabId) => {
    if (tabId === 'apercu') { setActiveTab(tabId); return; }
    const routes = {
      facultes: '/universite/facultes',
      etudiants: '/universite/etudiants',
      cours: '/universite/cours',
      planning: '/universite/planning',
    };
    navigate(routes[tabId] || '/universite/dashboard');
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection stats={stats} inscriptions={inscriptions} facultes={facultes} activites={activites} loading={loading} />;
      default: return <ApercuSection stats={stats} inscriptions={inscriptions} facultes={facultes} activites={activites} loading={loading} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-neutral-900 dark:text-white"
          >
            Université
          </motion.h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Tableau de bord — {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<Search className="h-4 w-4" />} />
          <Button variant="ghost" size="sm"><Bell className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" icon={<Calendar className="h-4 w-4" />}>
            Calendrier
          </Button>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {renderSection()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
