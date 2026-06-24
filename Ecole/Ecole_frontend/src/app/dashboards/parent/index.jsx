/**
 * ParentDashboard — Tableau de bord premium pour Parent
 *
 * Sections : Aperçu | Notes Enfant | Emploi du Temps | Paiements | Communications
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  ClipboardList,
  DollarSign,
  MessageSquare,
  Award,
  Bell,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  Eye,
  School,
  Heart,
  BookOpen,
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

// ─── Constantes ───────────────────────────────────────────────

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: BarChart3 },
  { id: 'notes', label: 'Notes', icon: ClipboardList },
  { id: 'emploi', label: 'Emploi du Temps', icon: Clock },
  { id: 'paiements', label: 'Paiements', icon: DollarSign },
  { id: 'communications', label: 'Échanges', icon: MessageSquare },
];

const ENFANTS = [
  { id: 1, nom: 'Koffi Mensah', classe: '4ème A', moyenne: '15.2/20', rang: '5e/42' },
  { id: 2, nom: 'Ama Mensah', classe: '6ème B', moyenne: '13.8/20', rang: '8e/38' },
];

const STATS_PARENT = [
  { title: 'Enfants Scolarisés', value: '2', icon: Users, trend: 0, trendLabel: 'dans l\'établissement', color: 'indigo' },
  { title: 'Moyenne Générale', value: '14.5/20', icon: TrendingUp, trend: 2.1, trendLabel: 'progression', color: 'emerald' },
  { title: 'Assiduité', value: '95%', icon: CheckCircle2, trend: 1, trendLabel: 'vs trimestre dernier', color: 'sky' },
  { title: 'Solde', value: '45 000 FCFA', icon: DollarSign, trend: -15, trendLabel: 'échéance dans 7j', color: 'amber' },
];

const EVOLUTION_NOTES = [
  { mois: 'Jan', Koffi: 14, Ama: 13 },
  { mois: 'Fév', Koffi: 15, Ama: 13.5 },
  { mois: 'Mars', Koffi: 14.5, Ama: 14 },
  { mois: 'Avr', Koffi: 16, Ama: 13 },
  { mois: 'Mai', Koffi: 15.2, Ama: 13.8 },
  { mois: 'Juin', Koffi: 15.5, Ama: 14 },
];

const COMMUNICATIONS = [
  { id: 1, from: 'M. Koffi', role: 'Enseignant', sujet: 'Progression de votre enfant', date: '15/06', urgent: false },
  { id: 2, from: 'Mme. Dossa', role: 'Comptable', sujet: 'Rappel échéance de paiement', date: '14/06', urgent: true },
  { id: 3, from: 'M. Mensah', role: 'Surveillant', sujet: 'Comportement en étude', date: '12/06', urgent: false },
  { id: 4, from: 'Directeur', role: 'Administration', sujet: 'Réunion parents-professeurs', date: '10/06', urgent: false },
];

// ─── Sections ─────────────────────────────────────────────────

function ApercuSection() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_PARENT.map((stat, i) => (
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
        {/* Évolution des notes */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <div className="flex items-center justify-between">
              <div>
                <Card.Title>Évolution des Notes</Card.Title>
                <Card.Description>Suivi trimestriel</Card.Description>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  <span className="text-neutral-500">Koffi</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-neutral-500">Ama</span>
                </div>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={EVOLUTION_NOTES}>
                  <defs>
                    <linearGradient id="koffiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="amaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis domain={[10, 18]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <ReTooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                  />
                  <Area type="monotone" dataKey="Koffi" stroke="#6366f1" fill="url(#koffiGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Ama" stroke="#10b981" fill="url(#amaGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        {/* Enfants */}
        <Card>
          <Card.Header>
            <Card.Title>Mes Enfants</Card.Title>
            <Card.Description>Vue rapide</Card.Description>
          </Card.Header>
          <Card.Body className="space-y-4">
            {ENFANTS.map((enfant) => (
              <div
                key={enfant.id}
                className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={enfant.nom} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 dark:text-white">{enfant.nom}</p>
                    <p className="text-xs text-neutral-500">{enfant.classe}</p>
                  </div>
                  <Badge variant="primary" size="sm">{enfant.moyenne}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Rang: <strong className="text-neutral-700 dark:text-neutral-300">{enfant.rang}</strong></span>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      </div>

      {/* Communications récentes */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <Card.Title>Derniers Échanges</Card.Title>
              <Card.Description>Avec l'établissement</Card.Description>
            </div>
            <Badge variant="danger" size="sm">{COMMUNICATIONS.filter(c => c.urgent).length} urgent</Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {COMMUNICATIONS.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex items-center gap-4 px-6 py-4 transition-colors cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                  msg.urgent && 'bg-red-50/30 dark:bg-red-500/5'
                )}
              >
                <Avatar name={msg.from} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-neutral-900 dark:text-white">{msg.sujet}</span>
                    {msg.urgent && <Badge variant="danger" size="sm">Urgent</Badge>}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">{msg.from} · {msg.role}</p>
                </div>
                <span className="text-xs text-neutral-400">{msg.date}</span>
              </div>
            ))}
          </div>
        </Card.Body>
        <Card.Footer>
          <Button variant="ghost" size="sm" className="w-full">
            Voir tous les échanges <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}

function NotesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Notes des Enfants</h2>
          <p className="text-sm text-neutral-500 mt-1">Suivi académique complet</p>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Relevés de notes, bulletins et appréciations par enfant
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
          <p className="text-sm text-neutral-500 mt-1">Planning des enfants</p>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Emploi du temps par enfant — vue hebdomadaire
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
          <p className="text-sm text-neutral-500 mt-1">Frais de scolarité et factures</p>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Historique des paiements, factures en ligne et échéances
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function CommunicationsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Communications</h2>
          <p className="text-sm text-neutral-500 mt-1">Messagerie avec l'établissement</p>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Messagerie complète — contacter les enseignants et l'administration
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

// ─── Composant Principal ──────────────────────────────────────

export default function ParentDashboard() {
  const [activeTab, setActiveTab] = useState('apercu');

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection />;
      case 'notes': return <NotesSection />;
      case 'emploi': return <EmploiSection />;
      case 'paiements': return <PaiementsSection />;
      case 'communications': return <CommunicationsSection />;
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
            Espace Parent
          </motion.h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Suivi de vos enfants — {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
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
