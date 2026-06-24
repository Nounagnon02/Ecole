/**
 * SurveillantDashboard — Tableau de bord Surveillant
 *
 * Sections : Aperçu | Présences | Surveillance
 */

import { useState } from 'react';
import { useDashboardStats } from '../hooks/useDashboardData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Clock, AlertTriangle, CheckCircle2, XCircle,
  BarChart3, UserCheck, UserX, Camera, MapPin,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Table from '@/shared/components/ui/Table';
import Button from '@/shared/components/ui/Button';

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: BarChart3 },
  { id: 'presences', label: 'Présences', icon: UserCheck },
  { id: 'surveillance', label: 'Surveillance', icon: Camera },
];

const STATS = [
  { title: 'Total Élèves', value: '1 284', icon: Users, trend: 2.1, trendLabel: 'ce trimestre', color: 'indigo' },
  { title: 'Présents Aujourd\'hui', value: '1 156', icon: UserCheck, trend: 90.0, trendLabel: 'taux de présence', color: 'emerald' },
  { title: 'Absents', value: '128', icon: UserX, trend: -10.0, trendLabel: 'vs hier', color: 'red' },
  { title: 'Alertes', value: '3', icon: AlertTriangle, trend: 0, trendLabel: 'incidents en cours', color: 'amber' },
];

const DONNEES_PRESENCES = [
  { jour: 'Lun', presents: 1160, absents: 124 },
  { jour: 'Mar', presents: 1175, absents: 109 },
  { jour: 'Mer', presents: 1156, absents: 128 },
  { jour: 'Jeu', presents: 1180, absents: 104 },
  { jour: 'Ven', presents: 1142, absents: 142 },
  { jour: 'Sam', presents: 0, absents: 0 },
];

const RETARDS_RECENTS = [
  { id: 1, eleve: 'Kodjo Aymar', classe: '3e B', temps: '15 min', motif: 'Transport', recurrent: true },
  { id: 2, eleve: 'Sewavi Grace', classe: '5e A', temps: '8 min', motif: 'Médical', recurrent: false },
  { id: 3, eleve: 'Hounkpatin Marc', classe: '4e C', temps: '20 min', motif: 'Non justifié', recurrent: true },
  { id: 4, eleve: 'Dagba Fidèle', classe: '6e B', temps: '5 min', motif: 'Médical', recurrent: false },
  { id: 5, eleve: 'Akue Marina', classe: '2nde A', temps: '12 min', motif: 'Transport', recurrent: true },
];

function ApercuSection({ stats, presences, retards }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatsCard {...stat} className="h-full" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Présences de la Semaine</Card.Title>
            <Card.Description>Tendance quotidienne</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={presences}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="jour" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <ReTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="presents" name="Présents" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absents" name="Absents" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Points de Surveillance</Card.Title>
            <Card.Description>Zones actives aujourd'hui</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              {[
                { zone: 'Entrée Principale', etat: 'Actif', personnels: 2 },
                { zone: 'Cour de Récréation', etat: 'Actif', personnels: 3 },
                { zone: 'Parcage', etat: 'Actif', personnels: 1 },
                { zone: 'Infirmerie', etat: 'Inactif', personnels: 0 },
              ].map((point) => (
                <div key={point.zone} className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-neutral-400" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">{point.zone}</p>
                      <p className="text-xs text-neutral-500">{point.personnels} agent{point.personnels > 1 ? 's' : ''} affecté{point.personnels > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <Badge variant={point.etat === 'Actif' ? 'success' : 'neutral'} size="sm">{point.etat}</Badge>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>Retards du Jour</Card.Title>
            <Badge variant="warning" size="sm">{retards.length} signalés</Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table>
            <Table.Header>
              <Table.Head>Élève</Table.Head>
              <Table.Head>Classe</Table.Head>
              <Table.Head>Retard</Table.Head>
              <Table.Head>Motif</Table.Head>
              <Table.Head>Récurrent</Table.Head>
            </Table.Header>
            <Table.Body>
              {retards.map((r) => (
                <Table.Row key={r.id}>
                  <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{r.eleve}</span></Table.Cell>
                  <Table.Cell>{r.classe}</Table.Cell>
                  <Table.Cell>{r.temps}</Table.Cell>
                  <Table.Cell>{r.motif}</Table.Cell>
                  <Table.Cell>
                    {r.recurrent ? <Badge variant="danger" size="sm">Récurrent</Badge> : <Badge variant="neutral" size="sm">Ponctuel</Badge>}
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

function PresencesSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Gestion des Présences</h2>
          <p className="text-sm text-neutral-500 mt-1">Saisie et suivi des présences par classe</p>
        </div>
        <Badge variant="success" size="sm"><Clock className="h-3 w-3 mr-1" /> En cours</Badge>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Interface de pointage — feuilles de présence par classe, import, et validation
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function SurveillanceSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Surveillance</h2>
          <p className="text-sm text-neutral-500 mt-1">Gestion des tours de garde et incidents</p>
        </div>
        <Button variant="ghost" size="sm"><Shield className="h-4 w-4 mr-1" /> Rapport</Button>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Planning de surveillance, zones, et rapport d'incidents
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

export default function SurveillantDashboard() {
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading } = useDashboardStats('surveillant');

  const stats = data?.stats?.map((s, i) => ({ ...s, icon: STATS[i]?.icon, color: STATS[i]?.color })) || STATS;
  const presences = data?.presences_semaine || DONNEES_PRESENCES;
  const retards = data?.retards || RETARDS_RECENTS;

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection stats={stats} presences={presences} retards={retards} />;
      case 'presences': return <PresencesSection />;
      case 'surveillance': return <SurveillanceSection />;
      default: return <ApercuSection stats={stats} presences={presences} retards={retards} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-neutral-900 dark:text-white"
          >
            Surveillance
          </motion.h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Suivi des présences — {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <Button variant="ghost" size="sm"><Shield className="h-4 w-4 mr-1" /> Mon Service</Button>
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
