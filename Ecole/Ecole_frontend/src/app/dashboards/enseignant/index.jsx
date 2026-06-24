/**
 * EnseignantDashboard — Tableau de bord premium pour Enseignant
 *
 * Sections : Aperçu | Ma Classe | Notes | Cahier de Textes | Emploi du Temps | Messages
 */

import { useState } from 'react';
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
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import Input from '@/shared/components/ui/Input';

// ─── Constantes ───────────────────────────────────────────────

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: BarChart3 },
  { id: 'classe', label: 'Ma Classe', icon: Users },
  { id: 'notes', label: 'Notes', icon: ClipboardList },
  { id: 'cahier', label: 'Cahier de Textes', icon: FileText },
  { id: 'emploi', label: 'Emploi du Temps', icon: Clock },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
];

const STATS_ENSEIGNANT = [
  { title: 'Mes Élèves', value: '165', icon: Users, trend: 0, trendLabel: '3 classes', color: 'indigo' },
  { title: 'Cours Cette Semaine', value: '18h', icon: Clock, trend: 0, trendLabel: '24 périodes', color: 'emerald' },
  { title: 'Moyenne Classe', value: '14.2/20', icon: TrendingUp, trend: 3.1, trendLabel: 'vs trimestre dernier', color: 'sky' },
  { title: 'Devoirs à Corriger', value: '43', icon: ClipboardList, trend: -12, trendLabel: 'en retard', color: 'amber' },
];

const EMPLOI_TEMPS = [
  { jour: 'Lundi', cours: [
    { heure: '08h-10h', matiere: 'Mathématiques', classe: '4ème A', salle: 'Salle 12' },
    { heure: '10h-12h', matiere: 'Mathématiques', classe: '3ème B', salle: 'Salle 8' },
  ]},
  { jour: 'Mardi', cours: [
    { heure: '08h-10h', matiere: 'Mathématiques', classe: '4ème B', salle: 'Salle 12' },
    { heure: '14h-16h', matiere: 'Sciences', classe: '3ème A', salle: 'Labo 2' },
  ]},
  { jour: 'Mercredi', cours: [
    { heure: '10h-12h', matiere: 'Mathématiques', classe: '4ème A', salle: 'Salle 12' },
  ]},
  { jour: 'Jeudi', cours: [
    { heure: '08h-10h', matiere: 'Mathématiques', classe: '3ème B', salle: 'Salle 8' },
    { heure: '10h-12h', matiere: 'Sciences', classe: '3ème A', salle: 'Labo 2' },
  ]},
  { jour: 'Vendredi', cours: [
    { heure: '08h-10h', matiere: 'Mathématiques', classe: '4ème A', salle: 'Salle 12' },
    { heure: '14h-16h', matiere: 'Sciences', classe: '4ème B', salle: 'Labo 1' },
  ]},
];

const NOTES_RECENTES = [
  { id: 1, eleve: 'Koffi A.', classe: '4ème A', matiere: 'Maths', note: '16/20', date: '15/06/2026', appreciation: 'Excellent' },
  { id: 2, eleve: 'Mensah J.', classe: '4ème A', matiere: 'Maths', note: '12/20', date: '15/06/2026', appreciation: 'Bien' },
  { id: 3, eleve: 'Akakpo M.', classe: '4ème A', matiere: 'Maths', note: '8/20', date: '15/06/2026', appreciation: 'À améliorer' },
  { id: 4, eleve: 'Dossa F.', classe: '4ème A', matiere: 'Maths', note: '14/20', date: '15/06/2026', appreciation: 'Bien' },
  { id: 5, eleve: 'Amégnigban P.', classe: '4ème A', matiere: 'Maths', note: '18/20', date: '15/06/2026', appreciation: 'Excellent' },
];

const DEVOIRS_A_VENIR = [
  { id: 1, titre: 'Devoir sur les équations', classe: '4ème A', date: '22/06/2026', etat: 'à préparer' },
  { id: 2, titre: 'Interrogation fractions', classe: '4ème B', date: '24/06/2026', etat: 'à préparer' },
  { id: 3, titre: 'Composition trimestrielle', classe: '3ème B', date: '28/06/2026', etat: 'à rédiger' },
];

// ─── Sections ─────────────────────────────────────────────────

function ApercuSection() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_ENSEIGNANT.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <StatsCard {...stat} className="h-full" />
          </motion.div>
        ))}
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
              <Badge variant="primary" size="sm">3 cours</Badge>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {EMPLOI_TEMPS[0].cours.map((cours, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex flex-col items-center justify-center w-16 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <span className="text-xs font-semibold">{cours.heure.split('h')[0]}h</span>
                    <span className="text-[10px]">{cours.heure.split('-')[1]}</span>
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
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {DEVOIRS_A_VENIR.map((d) => (
                <div key={d.id} className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-xl',
                    d.etat === 'à préparer' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                      : 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400'
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
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Mes Classes</h2>
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

function NotesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Saisie des Notes</h2>
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
              {NOTES_RECENTES.map((n) => (
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
                      parseInt(n.note) >= 14 ? 'text-emerald-600 dark:text-emerald-400'
                        : parseInt(n.note) >= 10 ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
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
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Cahier de Textes</h2>
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

function EmploiSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Emploi du Temps</h2>
          <p className="text-sm text-neutral-500 mt-1">Planning hebdomadaire des cours</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {EMPLOI_TEMPS.map((jour) => (
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
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{cours.heure}</p>
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
    </div>
  );
}

function MessagesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Messages</h2>
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
  const [activeTab, setActiveTab] = useState('apercu');

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection />;
      case 'classe': return <ClasseSection />;
      case 'notes': return <NotesSection />;
      case 'cahier': return <CahierSection />;
      case 'emploi': return <EmploiSection />;
      case 'messages': return <MessagesSection />;
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
            Mon Espace Enseignant
          </motion.h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Bon retour — {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
