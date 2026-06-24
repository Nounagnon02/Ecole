
/**
 * SecretaireDashboard — Tableau de bord Secrétaire
 *
 * Sections : Aperçu | Inscriptions | Planning | Documents
 */

import { useState } from 'react';
import { useDashboardStats } from '../hooks/useDashboardData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Users, Calendar, Clock, CheckCircle2, AlertCircle,
  BarChart3, UserPlus, ClipboardList, Mail, Printer, Download, Plus,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: BarChart3 },
  { id: 'inscriptions', label: 'Inscriptions', icon: UserPlus },
  { id: 'planning', label: 'Planning', icon: Calendar },
  { id: 'documents', label: 'Documents', icon: FileText },
];

const STATS = [
  { title: 'Inscriptions', value: '1 284', icon: Users, trend: 2.1, trendLabel: 'ce trimestre', color: 'indigo' },
  { title: 'Nouveaux ce Mois', value: '38', icon: UserPlus, trend: 12, trendLabel: 'vs mois dernier', color: 'emerald' },
  { title: 'Dossiers en Cours', value: '7', icon: ClipboardList, trend: -3, trendLabel: 'en attente', color: 'amber' },
  { title: 'Documents Générés', value: '156', icon: FileText, trend: 8.5, trendLabel: 'ce mois', color: 'sky' },
];

const DONNEES_INSCRIPTIONS = [
  { mois: 'Jan', nouveaux: 42, transferts: 8 },
  { mois: 'Fév', nouveaux: 28, transferts: 5 },
  { mois: 'Mar', nouveaux: 35, transferts: 10 },
  { mois: 'Avr', nouveaux: 22, transferts: 6 },
  { mois: 'Mai', nouveaux: 18, transferts: 4 },
  { mois: 'Juin', nouveaux: 38, transferts: 12 },
];

const RENDEZ_VOUS = [
  { id: 1, visiteur: 'M. Akakpo', motif: 'Inscription 6e A', heure: '08:30', statut: 'Confirmé' },
  { id: 2, visiteur: 'Mme Hountondji', motif: 'Réinscription 4e B', heure: '09:30', statut: 'Confirmé' },
  { id: 3, visiteur: 'M. Dossa', motif: 'Demande documents', heure: '10:00', statut: 'En attente' },
  { id: 4, visiteur: 'Mme Koffi', motif: 'Changement classe', heure: '11:30', statut: 'Confirmé' },
  { id: 5, visiteur: 'M. Gbaguidi', motif: 'Information bourse', heure: '14:00', statut: 'En attente' },
];

const INSCRIPTIONS_RECENTES = [
  { id: 1, nom: 'Adjanohoun Koffi', classe: '6e A', type: 'Nouveau', date: '2026-06-23', statut: 'Complété' },
  { id: 2, nom: 'Tossou Amen', classe: '5e B', type: 'Réinscription', date: '2026-06-23', statut: 'Complété' },
  { id: 3, nom: 'Hountondji Ella', classe: '4e C', type: 'Transfert', date: '2026-06-22', statut: 'En cours' },
  { id: 4, nom: 'Zannou David', classe: '3e A', type: 'Nouveau', date: '2026-06-22', statut: 'Complété' },
  { id: 5, nom: 'Dagba Ruth', classe: '2nde B', type: 'Réinscription', date: '2026-06-21', statut: 'En cours' },
];

function ApercuSection({ stats, fluxInscriptions, rendezVous, inscriptions }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatsCard {...stat} className="h-full" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Flux d'Inscriptions</Card.Title>
            <Card.Description>Nouveaux inscrits et transferts — 6 derniers mois</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fluxInscriptions}>
                  <defs>
                    <linearGradient id="colorNouveaux" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                    <linearGradient id="colorTransferts" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <ReTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                  <Area type="monotone" dataKey="nouveaux" name="Nouveaux" stroke="#6366f1" fill="url(#colorNouveaux)" strokeWidth={2} />
                  <Area type="monotone" dataKey="transferts" name="Transferts" stroke="#f59e0b" fill="url(#colorTransferts)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Rendez-vous du Jour</Card.Title>
            <Card.Description>{format(new Date(), 'EEEE d MMMM', { locale: fr })}</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              {rendezVous.map((rv) => (
                <div key={rv.id} className="flex items-start gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {rv.heure.split(':')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{rv.visiteur}</p>
                    <p className="text-xs text-neutral-500 truncate">{rv.motif}</p>
                  </div>
                  <Badge variant={rv.statut === 'Confirmé' ? 'success' : 'warning'} size="sm">{rv.statut}</Badge>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>Dernières Inscriptions</Card.Title>
            <Badge variant="primary" size="sm">Aujourd'hui</Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table>
            <Table.Header>
              <Table.Head>Nom</Table.Head>
              <Table.Head>Classe</Table.Head>
              <Table.Head>Type</Table.Head>
              <Table.Head>Date</Table.Head>
              <Table.Head>Statut</Table.Head>
            </Table.Header>
            <Table.Body>
              {inscriptions.map((ins) => (
                <Table.Row key={ins.id}>
                  <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{ins.nom}</span></Table.Cell>
                  <Table.Cell>{ins.classe}</Table.Cell>
                  <Table.Cell><Badge variant={ins.type === 'Nouveau' ? 'primary' : ins.type === 'Transfert' ? 'warning' : 'neutral'} size="sm">{ins.type}</Badge></Table.Cell>
                  <Table.Cell className="text-neutral-400">{ins.date}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={ins.statut === 'Complété' ? 'success' : 'warning'} size="sm">{ins.statut}</Badge>
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

function InscriptionsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Inscriptions</h2>
          <p className="text-sm text-neutral-500 mt-1">Gestion des inscriptions et réinscriptions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm"><Download className="h-4 w-4 mr-1" /> Exporter</Button>
          <Button><Plus className="h-4 w-4 mr-1" /> Nouvelle Inscription</Button>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Module d'inscription — dossier complet, pièces justificatives, et validation
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
          <p className="text-sm text-neutral-500 mt-1">Agenda et planification</p>
        </div>
        <Button variant="ghost" size="sm"><Printer className="h-4 w-4 mr-1" /> Imprimer</Button>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Agenda — calendrier des rendez-vous, événements et échéances administratives
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function DocumentsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Documents</h2>
          <p className="text-sm text-neutral-500 mt-1">Génération et gestion des documents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm"><Mail className="h-4 w-4 mr-1" /> Envoyer</Button>
          <Button><FileText className="h-4 w-4 mr-1" /> Nouveau Document</Button>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Générateur de documents — certificats, attestations, relevés, et correspondances
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

export default function SecretaireDashboard() {
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading } = useDashboardStats('secretaire');

  const stats = data?.stats?.map((s, i) => ({ ...s, icon: STATS[i]?.icon, color: STATS[i]?.color })) || STATS;
  const fluxInscriptions = data?.flux_inscriptions || DONNEES_INSCRIPTIONS;
  const rendezVous = data?.rendez_vous || RENDEZ_VOUS;
  const inscriptions = data?.inscriptions || INSCRIPTIONS_RECENTES;

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection stats={stats} fluxInscriptions={fluxInscriptions} rendezVous={rendezVous} inscriptions={inscriptions} />;
      case 'inscriptions': return <InscriptionsSection />;
      case 'planning': return <PlanningSection />;
      case 'documents': return <DocumentsSection />;
      default: return <ApercuSection stats={stats} fluxInscriptions={fluxInscriptions} rendezVous={rendezVous} inscriptions={inscriptions} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-neutral-900 dark:text-white"
          >
            Secrétariat
          </motion.h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Gestion administrative — {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <Button variant="ghost" size="sm"><ClipboardList className="h-4 w-4 mr-1" /> Tableau de Bord</Button>
      </div>

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

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {renderSection()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
