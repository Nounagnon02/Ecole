/**
 * EleveDashboard — Tableau de bord premium pour Élève
 *
 * Sections : Aperçu | Notes | Emploi du Temps | Cahier de Textes | Paiements
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  GraduationCap,
  Clock,
  Calendar,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  BarChart3,
  FileText,
  DollarSign,
  ArrowRight,
  Bell,
  CheckCircle2,
  AlertCircle,
  School,
  Target,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';

// ─── Constantes ───────────────────────────────────────────────

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: BarChart3 },
  { id: 'notes', label: 'Mes Notes', icon: ClipboardList },
  { id: 'emploi', label: 'Emploi du Temps', icon: Clock },
  { id: 'cahier', label: 'Cahier de Textes', icon: BookOpen },
  { id: 'paiements', label: 'Paiements', icon: DollarSign },
];

const STATS_ELEVE = [
  { title: 'Moyenne Générale', value: '15.2/20', icon: TrendingUp, trend: 0.8, trendLabel: 'vs trimestre dernier', color: 'emerald' },
  { title: 'Classement', value: '5ème / 42', icon: Award, trend: 3, trendLabel: 'places gagnées', color: 'indigo' },
  { title: 'Assiduité', value: '96%', icon: CheckCircle2, trend: 2, trendLabel: 'vs trimestre dernier', color: 'sky' },
  { title: 'Devoirs en Retard', value: '2', icon: AlertCircle, trend: -1, trendLabel: 'en baisse', color: 'amber' },
];

const NOTES_PAR_MATIERE = [
  { matiere: 'Maths', note: 16, coeff: 4, couleur: '#6366f1' },
  { matiere: 'Français', note: 14, coeff: 3, couleur: '#10b981' },
  { matiere: 'Anglais', note: 15, coeff: 2, couleur: '#f59e0b' },
  { matiere: 'Physique', note: 17, coeff: 3, couleur: '#ef4444' },
  { matiere: 'SVT', note: 13, coeff: 2, couleur: '#06b6d4' },
  { matiere: 'Histoire', note: 15, coeff: 2, couleur: '#8b5cf6' },
  { matiere: 'EPS', note: 18, coeff: 1, couleur: '#14b8a6' },
];

const COMPETENCES_RADAR = [
  { competence: 'Analyse', note: 85 },
  { competence: 'Synthèse', note: 70 },
  { competence: 'Mémorisation', note: 90 },
  { competence: 'Expression', note: 75 },
  { competence: 'Raisonnement', note: 80 },
  { competence: 'Créativité', note: 65 },
];

const PROCHAINS_COURS = [
  { jour: 'Lundi 17', heure: '08h-10h', matiere: 'Mathématiques', salle: 'Salle 12', prof: 'M. Koffi' },
  { jour: 'Lundi 17', heure: '10h-12h', matiere: 'Français', salle: 'Salle 8', prof: 'Mme. Dossa' },
  { jour: 'Mardi 18', heure: '08h-10h', matiere: 'Physique', salle: 'Labo 2', prof: 'M. Mensah' },
  { jour: 'Mardi 18', heure: '14h-16h', matiere: 'Anglais', salle: 'Salle 5', prof: 'Mme. Akakpo' },
];

const DEVOIRS_RECENTS = [
  { id: 1, titre: 'Exercices équations', matiere: 'Maths', date: '20/06', rendu: true, note: '16/20' },
  { id: 2, titre: 'Dissertation Rousseau', matiere: 'Français', date: '22/06', rendu: true, note: '14/20' },
  { id: 3, titre: 'TP pendule simple', matiere: 'Physique', date: '25/06', rendu: false, note: null },
  { id: 4, titre: 'Verbes irréguliers', matiere: 'Anglais', date: '27/06', rendu: false, note: null },
];

// ─── Sections ─────────────────────────────────────────────────

function ApercuSection() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_ELEVE.map((stat, i) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes par matière */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <div className="flex items-center justify-between">
              <div>
                <Card.Title>Notes par Matière</Card.Title>
                <Card.Description>Moyennes trimestrielles</Card.Description>
              </div>
              <Badge variant="primary" size="sm">Moy: 15.2/20</Badge>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={NOTES_PAR_MATIERE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="matiere" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <ReTooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="note" radius={[6, 6, 0, 0]}>
                    {NOTES_PAR_MATIERE.map((entry, i) => (
                      <rect key={i} fill={entry.couleur} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        {/* Radar compétences */}
        <Card>
          <Card.Header>
            <Card.Title>Compétences</Card.Title>
            <Card.Description>Évaluation par compétence</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={COMPETENCES_RADAR}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="competence" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                  <Radar name="Niveau" dataKey="note" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prochains cours */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <div>
                <Card.Title>Prochains Cours</Card.Title>
                <Card.Description>Cette semaine</Card.Description>
              </div>
              <Button variant="ghost" size="sm">
                Voir tout <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {PROCHAINS_COURS.map((cours, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex flex-col items-center w-12">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{cours.heure.split('h')[0]}h</span>
                    <span className="text-[10px] text-neutral-400">{cours.heure.split('-')[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{cours.matiere}</p>
                    <p className="text-xs text-neutral-500">{cours.prof} · {cours.salle}</p>
                  </div>
                  <span className="text-xs text-neutral-400">{cours.jour}</span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* Devoirs récents */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Devoirs Récents</Card.Title>
              <Button variant="ghost" size="sm">
                Voir tout <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <Table>
              <Table.Header>
                <Table.Head>Devoir</Table.Head>
                <Table.Head>Matière</Table.Head>
                <Table.Head>Date</Table.Head>
                <Table.Head>Statut</Table.Head>
                <Table.Head>Note</Table.Head>
              </Table.Header>
              <Table.Body>
                {DEVOIRS_RECENTS.map((d) => (
                  <Table.Row key={d.id}>
                    <Table.Cell>
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{d.titre}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant="info" size="sm">{d.matiere}</Badge>
                    </Table.Cell>
                    <Table.Cell className="text-neutral-400">{d.date}</Table.Cell>
                    <Table.Cell>
                      {d.rendu
                        ? <Badge variant="success" size="sm">Rendu</Badge>
                        : <Badge variant="warning" size="sm">À faire</Badge>
                      }
                    </Table.Cell>
                    <Table.Cell>
                      <span className={cn(
                        'font-semibold',
                        d.note && parseInt(d.note) >= 14
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : d.note && parseInt(d.note) >= 10
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-neutral-400'
                      )}>
                        {d.note || '—'}
                      </span>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

function NotesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Mes Notes</h2>
          <p className="text-sm text-neutral-500 mt-1">Relevés et bulletins</p>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Relevé de notes complet, bulletins trimestriels, et historique
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
          <p className="text-sm text-neutral-500 mt-1">Planning hebdomadaire</p>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Emploi du temps interactif — vue semaine et jour
          </p>
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
          <p className="text-sm text-neutral-500 mt-1">Leçons et exercices</p>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Cahier de textes numérique — leçons et ressources pédagogiques
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function PaiementsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Paiements</h2>
          <p className="text-sm text-neutral-500 mt-1">Suivi des frais de scolarité</p>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Historique des paiements, factures, et échéances
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

// ─── Composant Principal ──────────────────────────────────────

export default function EleveDashboard() {
  const [activeTab, setActiveTab] = useState('apercu');

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection />;
      case 'notes': return <NotesSection />;
      case 'emploi': return <EmploiSection />;
      case 'cahier': return <CahierSection />;
      case 'paiements': return <PaiementsSection />;
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
            Mon Espace Élève
          </motion.h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Classe de 4ème A — {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
      </div>

      {/* Navigation */}
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
