/**
 * UniversiteDashboard — Tableau de bord université v1
 *
 * Rôles : Recteur, Doyen, Professeur, Étudiant, Personnel
 * Sections : Aperçu | Facultés | Étudiants | Cours | Planning
 */

import { useState } from 'react';
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
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import Avatar from '@/shared/components/ui/Avatar';

/* ─── Constantes ─────────────────────────────────────────────── */
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444'];

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: Activity },
  { id: 'facultes', label: 'Facultés', icon: Building2 },
  { id: 'etudiants', label: 'Étudiants', icon: Users },
  { id: 'cours', label: 'Cours', icon: BookOpen },
  { id: 'planning', label: 'Planning', icon: Calendar },
];

const STATS = [
  { title: 'Facultés', value: '6', icon: Building2, trend: 0, trendLabel: 'ce semestre', color: 'indigo' },
  { title: 'Départements', value: '27', icon: School, trend: 3.8, trendLabel: 'vs semestre précédent', color: 'sky' },
  { title: 'Enseignants', value: '235', icon: Users, trend: 5.2, trendLabel: 'vs année dernière', color: 'emerald' },
  { title: 'Étudiants', value: '5 190', icon: GraduationCap, trend: 8.1, trendLabel: 'vs année dernière', color: 'violet' },
];

const DONNEES_INSCRIPTIONS = [
  { annee: '2021-22', inscriptions: 4200, diplomes: 3800 },
  { annee: '2022-23', inscriptions: 4550, diplomes: 4100 },
  { annee: '2023-24', inscriptions: 4890, diplomes: 4450 },
  { annee: '2024-25', inscriptions: 5100, diplomes: 4680 },
  { annee: '2025-26', inscriptions: 5190, diplomes: null },
];

const DONNEES_FACULTES = [
  { nom: 'Sciences', etudiants: 1200, enseignants: 45, departements: 5 },
  { nom: 'Lettres', etudiants: 950, enseignants: 38, departements: 4 },
  { nom: 'Droit', etudiants: 780, enseignants: 28, departements: 3 },
  { nom: 'SEG', etudiants: 890, enseignants: 32, departements: 4 },
  { nom: 'Médecine', etudiants: 650, enseignants: 52, departements: 6 },
  { nom: 'Ingénierie', etudiants: 720, enseignants: 40, departements: 5 },
];

const ACTIVITES_RECENTES = [
  { id: 1, type: 'inscription', message: 'Nouvel étudiant inscrit — Koffi Mensah (FST)', temps: 'Il y a 15 min' },
  { id: 2, type: 'note', message: 'Notes du département de Droit publiées', temps: 'Il y a 1h' },
  { id: 3, type: 'evenement', message: 'Conseil d\'université — 28 juin 2026', temps: 'Il y a 3h' },
  { id: 4, type: 'alerte', message: 'Rappel: validation des inscriptions au 30 juin', temps: 'Il y a 1j' },
  { id: 5, type: 'cours', message: 'Emploi du temps mis à jour — FSI', temps: 'Il y a 2j' },
];

/* ─── Sections ────────────────────────────────────────────────── */

function ApercuSection() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatsCard {...stat} className="h-full" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inscriptions */}
        <Card>
          <Card.Header>
            <Card.Title>Inscriptions & Diplômes</Card.Title>
            <Card.Description>Évolution sur 5 ans</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DONNEES_INSCRIPTIONS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="annee" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <ReTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="inscriptions" name="Inscriptions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="diplomes" name="Diplômés" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={DONNEES_FACULTES} dataKey="etudiants" nameKey="nom" cx="50%" cy="50%" outerRadius={90} label={({ nom, percent }) => `${nom} ${(percent * 100).toFixed(0)}%`}>
                    {DONNEES_FACULTES.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
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
          <div className="space-y-1">
            {ACTIVITES_RECENTES.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50/50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/30">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full',
                  a.type === 'inscription' && 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
                  a.type === 'note' && 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
                  a.type === 'evenement' && 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
                  a.type === 'alerte' && 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                  a.type === 'cours' && 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
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
        </Card.Body>
      </Card>
    </div>
  );
}

function FacultesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Facultés & Départements</h2>
          <p className="text-sm text-neutral-500 mt-1">Gestion des facultés et départements</p>
        </div>
        <Button size="sm" icon={<Plus />}>Nouvelle Faculté</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {DONNEES_FACULTES.map((f) => (
          <Card key={f.nom}>
            <Card.Body>
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                  <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
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
    </div>
  );
}

function EtudiantsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Étudiants</h2>
          <p className="text-sm text-neutral-500 mt-1">Gestion des inscriptions et dossiers étudiants</p>
        </div>
        <Button size="sm" icon={<Plus />}>Nouvel Étudiant</Button>
      </div>

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
              {[
                { niveau: 'Licence 1', inscrits: 1350, h: 720, f: 630, evol: '+8%' },
                { niveau: 'Licence 2', inscrits: 1180, h: 610, f: 570, evol: '+5%' },
                { niveau: 'Licence 3', inscrits: 1050, h: 540, f: 510, evol: '+3%' },
                { niveau: 'Master 1', inscrits: 820, h: 420, f: 400, evol: '+12%' },
                { niveau: 'Master 2', inscrits: 540, h: 280, f: 260, evol: '+7%' },
                { niveau: 'Doctorat', inscrits: 250, h: 140, f: 110, evol: '+2%' },
              ].map((r) => (
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
    </div>
  );
}

function CoursSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Cours & Programmes</h2>
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
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Planning</h2>
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
  const [activeTab, setActiveTab] = useState('apercu');

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection />;
      case 'facultes': return <FacultesSection />;
      case 'etudiants': return <EtudiantsSection />;
      case 'cours': return <CoursSection />;
      case 'planning': return <PlanningSection />;
      default: return <ApercuSection />;
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

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {renderSection()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
