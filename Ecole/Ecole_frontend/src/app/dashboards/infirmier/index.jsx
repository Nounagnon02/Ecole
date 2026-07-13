/**
 * InfirmierDashboard — Tableau de bord Infirmier
 *
 * Sections : Aperçu | Soins | Dossiers Médicaux
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const STATS_META = [
  { title: 'Visites du Mois', icon: Activity, color: 'primary' },
  { title: 'En Cours', icon: Clock, color: 'amber' },
  { title: 'Cas Urgents', icon: AlertTriangle, color: 'red' },
  { title: 'Consultations', icon: Stethoscope, color: 'emerald' },
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
                    <linearGradient id="colorVisites" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} /><stop offset="95%" stopColor="var(--accent)" stopOpacity={0} /></linearGradient>
                    <linearGradient id="colorUrgences" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--red)" stopOpacity={0.3} /><stop offset="95%" stopColor="var(--red)" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <ReTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                  <Area type="monotone" dataKey="visites" name="Visites" stroke="var(--accent)" fill="url(#colorVisites)" strokeWidth={2} />
                  <Area type="monotone" dataKey="urgences" name="Urgences" stroke="var(--red)" fill="url(#colorUrgences)" strokeWidth={2} />
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
                { motif: 'Maux de tête', count: 28, color: 'bg-[var(--accent)]' },
                { motif: 'Douleurs abdominales', count: 19, color: 'bg-[var(--amber)]' },
                { motif: 'Blessures légères', count: 15, color: 'bg-[var(--red)]' },
                { motif: 'Fièvre', count: 12, color: 'bg-[var(--emerald)]' },
                { motif: 'Réactions allergiques', count: 8, color: 'bg-[var(--purple)]' },
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
          <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">Soins Infirmiers</h2>
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
          <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">Dossiers Médicaux</h2>
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading } = useDashboardStats('infirmier');

  const stats = data?.stats?.map((s, i) => ({ ...s, icon: STATS_META[i]?.icon, color: STATS_META[i]?.color })) || [];
  const frequentation = data?.frequentation || [];
  const visites = data?.visites || [];

  const handleTabClick = (tabId) => {
    if (tabId === 'apercu') { setActiveTab(tabId); return; }
    const routes = { soins: '/infirmier/soins', dossiers: '/infirmier/dossiers' };
    navigate(routes[tabId] || '/infirmier/dashboard');
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection stats={stats} frequentation={frequentation} visites={visites} />;
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

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {renderSection()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
