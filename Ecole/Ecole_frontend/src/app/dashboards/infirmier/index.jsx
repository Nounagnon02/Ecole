/**
 * InfirmierDashboard — Tableau de bord Infirmier
 *
 * Sections : Aperçu | Soins | Dossiers Médicaux
 */

import { useState } from 'react';
import { useDashboardStats } from '../hooks/useDashboardData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Users, Activity, AlertTriangle, CheckCircle2, Clock,
  BarChart3, Stethoscope, FileText, Plus, Pill, Thermometer,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer,
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
  { id: 'soins', label: 'Soins', icon: Stethoscope },
  { id: 'dossiers', label: 'Dossiers', icon: FileText },
];

const STATS = [
  { title: 'Visites du Mois', value: '89', icon: Activity, trend: 12, trendLabel: 'vs mois dernier', color: 'indigo' },
  { title: 'En Cours', value: '3', icon: Clock, trend: 0, trendLabel: 'patients actuellement', color: 'amber' },
  { title: 'Cas Urgents', value: '5', icon: AlertTriangle, trend: -2, trendLabel: 'ce mois', color: 'red' },
  { title: 'Consultations', value: '312', icon: Stethoscope, trend: 8.5, trendLabel: 'ce trimestre', color: 'emerald' },
];

const DONNEES_VISITES = [
  { mois: 'Jan', visites: 72, urgences: 6 },
  { mois: 'Fév', visites: 68, urgences: 4 },
  { mois: 'Mar', visites: 85, urgences: 8 },
  { mois: 'Avr', visites: 78, urgences: 5 },
  { mois: 'Mai', visites: 92, urgences: 7 },
  { mois: 'Juin', visites: 89, urgences: 5 },
];

const VISITES_RECENTES = [
  { id: 1, eleve: 'Hounkpe Joël', classe: '5e A', motif: 'Maux de tête', soin: 'Paracétamol', heure: '08:30', statut: 'Traité' },
  { id: 2, eleve: 'Dossou Yvette', classe: '4e C', motif: 'Chute cour', soin: 'Pansement', heure: '09:15', statut: 'Traité' },
  { id: 3, eleve: 'Gbaguidi Félicien', classe: '3e B', motif: 'Fièvre', soin: 'En observation', heure: '10:00', statut: 'En cours' },
  { id: 4, eleve: 'Ahyi Rosalie', classe: '6e A', motif: 'Allergie', soin: 'Antihistaminique', heure: '11:20', statut: 'Traité' },
  { id: 5, eleve: 'Zannou Pascal', classe: '2nde A', motif: 'Douleur abdominale', soin: 'Repos', heure: '12:05', statut: 'En cours' },
];

function ApercuSection({ stats, frequentation, visites }) {
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
            <Card.Title>Fréquentation Infirmerie</Card.Title>
            <Card.Description>Visites et urgences — 6 derniers mois</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={frequentation}>
                  <defs>
                    <linearGradient id="colorVisites" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                    <linearGradient id="colorUrgences" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <ReTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                  <Area type="monotone" dataKey="visites" name="Visites" stroke="#6366f1" fill="url(#colorVisites)" strokeWidth={2} />
                  <Area type="monotone" dataKey="urgences" name="Urgences" stroke="#ef4444" fill="url(#colorUrgences)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Motifs Fréquents</Card.Title>
            <Card.Description>Ce mois-ci</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              {[
                { motif: 'Maux de tête', count: 28, color: 'bg-indigo-500' },
                { motif: 'Douleurs abdominales', count: 19, color: 'bg-amber-500' },
                { motif: 'Blessures légères', count: 15, color: 'bg-red-500' },
                { motif: 'Fièvre', count: 12, color: 'bg-emerald-500' },
                { motif: 'Réactions allergiques', count: 8, color: 'bg-purple-500' },
              ].map((item) => (
                <div key={item.motif} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">{item.motif}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.count / 28) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right font-medium text-neutral-900 dark:text-white">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>Dernières Visites</Card.Title>
            <Badge variant="warning" size="sm">{visites.filter(v => v.statut === 'En cours').length} en cours</Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table>
            <Table.Header>
              <Table.Head>Élève</Table.Head>
              <Table.Head>Classe</Table.Head>
              <Table.Head>Motif</Table.Head>
              <Table.Head>Soin</Table.Head>
              <Table.Head>Heure</Table.Head>
              <Table.Head>Statut</Table.Head>
            </Table.Header>
            <Table.Body>
              {visites.map((v) => (
                <Table.Row key={v.id}>
                  <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{v.eleve}</span></Table.Cell>
                  <Table.Cell>{v.classe}</Table.Cell>
                  <Table.Cell>{v.motif}</Table.Cell>
                  <Table.Cell>{v.soin}</Table.Cell>
                  <Table.Cell className="text-neutral-400">{v.heure}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={v.statut === 'Traité' ? 'success' : 'warning'} size="sm">{v.statut}</Badge>
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

function SoinsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Soins Infirmiers</h2>
          <p className="text-sm text-neutral-500 mt-1">Enregistrement et suivi des soins</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm"><Pill className="h-4 w-4 mr-1" /> Stock</Button>
          <Button><Plus className="h-4 w-4 mr-1" /> Nouveau Soin</Button>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Registre des soins — consultations, médicaments, et suivi des patients
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function DossiersSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Dossiers Médicaux</h2>
          <p className="text-sm text-neutral-500 mt-1">Fiches de santé et antécédents</p>
        </div>
        <Button variant="ghost" size="sm"><Thermometer className="h-4 w-4 mr-1" /> Carnet de Santé</Button>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Dossiers médicaux complets — antécédents, allergies, vaccins, visites
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

export default function InfirmierDashboard() {
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading } = useDashboardStats('infirmier');

  const stats = data?.stats?.map((s, i) => ({ ...s, icon: STATS[i]?.icon, color: STATS[i]?.color })) || STATS;
  const frequentation = data?.frequentation || DONNEES_VISITES;
  const visites = data?.visites || VISITES_RECENTES;

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection stats={stats} frequentation={frequentation} visites={visites} />;
      case 'soins': return <SoinsSection />;
      case 'dossiers': return <DossiersSection />;
      default: return <ApercuSection stats={stats} frequentation={frequentation} visites={visites} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-neutral-900 dark:text-white"
          >
            Infirmerie
          </motion.h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Soins et santé — {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <Button variant="ghost" size="sm"><Heart className="h-4 w-4 mr-1" /> État des Lieux</Button>
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
