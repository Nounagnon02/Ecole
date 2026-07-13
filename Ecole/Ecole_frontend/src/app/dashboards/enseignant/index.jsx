/**
 * EnseignantDashboard — Tableau de bord premium pour Enseignant
 *
 * Sections : Aperçu | Ma Classe | Notes | Cahier de Textes | Emploi du Temps | Messages
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Users,
  GraduationCap,
  ClipboardList,
  Clock,
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  ArrowRight,
  Bell,
  PenLine,
  Eye,
  Download,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  School,
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
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import Input from '@/shared/components/ui/Input';
import { Skeleton } from '@/shared/components/ui/Skeleton';

// ─── Constantes ───────────────────────────────────────────────

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: BarChart3 },
  { id: 'classe', label: 'Ma Classe', icon: Users },
  { id: 'notes', label: 'Notes', icon: ClipboardList },
  { id: 'cahier', label: 'Cahier de Textes', icon: FileText },
  { id: 'emploi', label: 'Emploi du Temps', icon: Clock },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
];

const STATS_META = [
  { title: 'Mes Élèves', icon: Users, color: 'primary' },
  { title: 'Cours Cette Semaine', icon: Clock, color: 'emerald' },
  { title: 'Moyenne Classe', icon: TrendingUp, color: 'sky' },
  { title: 'Devoirs à Corriger', icon: ClipboardList, color: 'amber' },
];

// ─── Sections ─────────────────────────────────────────────────

function ApercuSection({ stats, emploiTemps, devoirs, loading }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : stats.map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <StatsCard {...stat} className="h-full" />
              </motion.div>
            ))
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prochains cours */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <div>
                <Card.Title>Emploi du Temps — Aujourd'hui</Card.Title>
                <Card.Description>{format(new Date(), 'EEEE d MMMM', { locale: fr })}</Card.Description>
              </div>
              <Badge variant="primary" size="sm">{emploiTemps[0]?.cours?.length || 0} cours</Badge>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : emploiTemps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
                <Clock className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">Aucun cours prévu aujourd'hui</p>
              </div>
            ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {(emploiTemps[0]?.cours || []).map((cours, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex flex-col items-center justify-center w-16 h-14 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)]">
                    <span className="text-xs font-semibold">{cours.heure?.split('h')[0]}h</span>
                    <span className="text-[10px]">{cours.heure?.split('-')[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{cours.matiere}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{cours.classe} · {cours.salle}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            )}
          </Card.Body>
          <Card.Footer>
            <Button variant="ghost" size="sm" className="w-full">
              Voir la semaine <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Card.Footer>
        </Card>

        {/* Devoirs à venir */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <div>
                <Card.Title>Devoirs & Évaluations</Card.Title>
                <Card.Description>À venir cette semaine</Card.Description>
              </div>
              <Button variant="ghost" size="sm">
                <PenLine className="h-4 w-4 mr-1" /> Nouveau
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : devoirs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
                <FileText className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">Aucun devoir ou évaluation à venir</p>
              </div>
            ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {devoirs.map((d) => (
                <div key={d.id} className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-xl',
                    d.etat === 'à préparer' ? 'bg-[var(--amber-subtle)] text-[var(--amber)]'
                      : 'bg-[var(--sky-subtle)] text-[var(--sky)]'
                  )}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{d.titre}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{d.classe} · {d.date}</p>
                  </div>
                  <Badge variant={d.etat === 'à préparer' ? 'warning' : 'info'} size="sm">
                    {d.etat}
                  </Badge>
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

function ClasseSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">Mes Classes</h2>
          <p className="text-sm text-neutral-500 mt-1">Gestion des classes et élèves</p>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Liste des classes attribuées, profils élèves et suivi individuel
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function NotesSection({ notes, loading }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">Saisie des Notes</h2>
          <p className="text-sm text-neutral-500 mt-1">Gérer les évaluations et notes</p>
        </div>
        <Button>
          <PenLine className="h-4 w-4 mr-2" /> Saisir des Notes
        </Button>
      </div>

      {/* Aperçu notes */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>Dernières Notes Saisies</Card.Title>
            <Input placeholder="Rechercher..." size="sm" icon={Search} className="w-48" />
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table>
            <Table.Header>
              <Table.Head>Élève</Table.Head>
              <Table.Head>Classe</Table.Head>
              <Table.Head>Matière</Table.Head>
              <Table.Head>Note</Table.Head>
              <Table.Head>Date</Table.Head>
              <Table.Head>Appréciation</Table.Head>
            </Table.Header>
            <Table.Body>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <Table.Row key={i}>
                  {[1, 2, 3, 4, 5, 6].map((j) => <Table.Cell key={j}><Skeleton className="h-4 w-full" /></Table.Cell>)}
                </Table.Row>
              ))}
              {!loading && notes.length === 0 && (
                <Table.Row>
                  <td colSpan={6} className="p-6 text-center text-sm text-neutral-500">Aucune note saisie</td>
                </Table.Row>
              )}
              {!loading && notes.map((n) => (
                <Table.Row key={n.id}>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <Avatar name={n.eleve} size="sm" />
                      <span className="font-medium text-neutral-900 dark:text-white">{n.eleve}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>{n.classe}</Table.Cell>
                  <Table.Cell>{n.matiere}</Table.Cell>
                  <Table.Cell>
                    <span className={cn(
                      'font-semibold',
                      parseInt(n.note) >= 14 ? 'text-[var(--emerald)]'
                        : parseInt(n.note) >= 10 ? 'text-[var(--amber)]'
                          : 'text-[var(--red)]'
                    )}>
                      {n.note}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="text-neutral-400">{n.date}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={
                      n.appreciation === 'Excellent' ? 'success'
                        : n.appreciation === 'Bien' ? 'primary'
                          : n.appreciation === 'À améliorer' ? 'warning'
                            : 'danger'
                    } size="sm">
                      {n.appreciation}
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

function CahierSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">Cahier de Textes</h2>
          <p className="text-sm text-neutral-500 mt-1">Suivi des leçons et séances</p>
        </div>
        <Button>
          <PenLine className="h-4 w-4 mr-2" /> Nouvelle Séance
        </Button>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Cahier de textes numérique — leçons, séances, et progression pédagogique
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function EmploiSection({ emploiTemps }) {
  const planning = emploiTemps;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">Emploi du Temps</h2>
          <p className="text-sm text-neutral-500 mt-1">Planning hebdomadaire des cours</p>
        </div>
      </div>
      {planning.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--text-tertiary)]">
          <Calendar className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm">Aucun emploi du temps disponible</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {planning.map((jour) => (
          <Card key={jour.jour}>
            <Card.Header>
              <Card.Title className="text-base">{jour.jour}</Card.Title>
            </Card.Header>
            <Card.Body>
              {jour.cours.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-4">Pas de cours</p>
              ) : (
                <div className="space-y-3">
                  {jour.cours.map((cours, i) => (
                    <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                      <p className="text-xs font-semibold text-[var(--accent)] dark:text-[var(--accent)]">{cours.heure}</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1">{cours.matiere}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{cours.classe} · {cours.salle}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}

function MessagesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">Messages</h2>
          <p className="text-sm text-neutral-500 mt-1">Communications internes</p>
        </div>
        <Button>
          <MessageSquare className="h-4 w-4 mr-2" /> Nouveau Message
        </Button>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Messagerie — à connecter avec l'API
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

// ─── Composant Principal ──────────────────────────────────────

export default function EnseignantDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading, error, refetch } = useDashboardStats('enseignant');

  const stats = data?.stats?.map((s, i) => ({ ...s, icon: STATS_META[i]?.icon, color: STATS_META[i]?.color })) || [];
  const emploiTemps = data?.emploi_temps || [];
  const notes = data?.notes_recentes || [];
  const devoirs = data?.devoirs || [];

  const handleTabClick = (tabId) => {
    if (tabId === 'apercu') { setActiveTab(tabId); return; }
    if (tabId === 'classe') { navigate('/enseignant/classes'); return; }
    if (tabId === 'messages') { navigate('/messagerie'); return; }
    setActiveTab(tabId);
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection stats={stats} emploiTemps={emploiTemps} devoirs={devoirs} loading={loading} />;
      case 'notes': return <NotesSection notes={notes} loading={loading} />;
      case 'cahier': return <CahierSection />;
      case 'emploi': return <EmploiSection emploiTemps={emploiTemps} />;
      default: return <ApercuSection stats={stats} emploiTemps={emploiTemps} devoirs={devoirs} loading={loading} />;
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
            className="font-fraunces text-2xl font-bold text-neutral-900 dark:text-white"
          >
            Mon Espace Enseignant
          </motion.h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Bon retour — {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
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
            <Bell className="h-4 w-4 mr-1" />
            Rappels
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
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-[var(--accent)] text-[var(--accent)] dark:text-[var(--accent)] dark:border-[var(--accent)]'
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
