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
  Heart, Activity, AlertTriangle, Clock,
  BarChart3, Stethoscope, FileText 
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import { RefreshButton } from '@/shared/components/ui';
import { ErrorDisplay } from '@/shared/components/ui/EmptyState';

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

const MOTIF_COLORS = [
  'bg-[var(--accent)]',
  'bg-[var(--amber)]',
  'bg-[var(--red)]',
  'bg-[var(--emerald)]',
  'bg-[var(--purple)]',
];

function ApercuSection({ stats, frequentation, visites, motifs, urgencesJour, alertesMedicales, soinsRecurrents }) {
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
              {(motifs?.length ? motifs : []).map((item, i) => {
                const max = Math.max(...(motifs?.map((m) => m.count) || [1]), 1);
                return (
                  <div key={item.motif} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">{item.motif}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                        <div className={`h-full rounded-full ${MOTIF_COLORS[i % MOTIF_COLORS.length]}`} style={{ width: `${(item.count / max) * 100}%` }} />
                      </div>
                      <span className="w-6 text-right font-medium text-neutral-900 dark:text-white">{item.count}</span>
                    </div>
                  </div>
                );
              })}
              {!motifs?.length && (
                <p className="text-sm text-neutral-400 dark:text-neutral-500">Aucune consultation ce mois-ci.</p>
              )}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Urgences du Jour</Card.Title>
              {urgencesJour.length > 0 && (
                <Badge variant="danger" size="sm">{urgencesJour.length}</Badge>
              )}
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {urgencesJour.length > 0 ? (
            <Table>
              <Table.Header>
                <Table.Head>Élève</Table.Head>
                <Table.Head>Motif</Table.Head>
                <Table.Head>Heure</Table.Head>
              </Table.Header>
              <Table.Body>
                {urgencesJour.map((u) => (
                  <Table.Row key={u.id}>
                    <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{u.eleve}</span></Table.Cell>
                    <Table.Cell className="max-w-[160px] truncate">{u.motif}</Table.Cell>
                    <Table.Cell className="text-neutral-400">{u.heure}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
                <Heart className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Aucune urgence aujourd'hui</p>
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Alertes Médicales</Card.Title>
              {alertesMedicales.length > 0 && (
                <Badge variant="warning" size="sm">{alertesMedicales.length}</Badge>
              )}
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {alertesMedicales.length > 0 ? (
            <Table>
              <Table.Header>
                <Table.Head>Élève</Table.Head>
                <Table.Head>Allergies / Maladie</Table.Head>
              </Table.Header>
              <Table.Body>
                {alertesMedicales.map((a) => (
                  <Table.Row key={a.id}>
                    <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{a.eleve}</span></Table.Cell>
                    <Table.Cell className="max-w-[180px] truncate">{a.allergies || a.maladie}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
                <AlertTriangle className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Aucune alerte médicale signalée</p>
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Soins Récurrents</Card.Title>
            <Card.Description>Élèves suivis régulièrement</Card.Description>
          </Card.Header>
          <Card.Body className="p-0">
            {soinsRecurrents.length > 0 ? (
            <Table>
              <Table.Header>
                <Table.Head>Élève</Table.Head>
                <Table.Head>Visites</Table.Head>
              </Table.Header>
              <Table.Body>
                {soinsRecurrents.map((s) => (
                  <Table.Row key={s.eleve}>
                    <Table.Cell>
                      <span className="font-medium text-neutral-900 dark:text-white">{s.eleve}</span>
                      <span className="block text-xs text-neutral-400">{s.dernier_motif}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={s.visites >= 3 ? 'danger' : 'warning'} size="sm">{s.visites}</Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
                <Activity className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Aucun élève suivi de façon récurrente</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default function InfirmierDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading, error, refetch } = useDashboardStats('infirmier');

  const stats = data?.stats?.map((s, i) => ({ ...s, icon: STATS_META[i]?.icon, color: STATS_META[i]?.color })) || [];
  const frequentation = data?.frequentation || [];
  const visites = data?.visites || [];
  const motifs = data?.motifs || [];
  const urgencesJour = data?.urgences_jour || [];
  const alertesMedicales = data?.alertes_medicales || [];
  const soinsRecurrents = data?.soins_recurrents || [];

  const handleTabClick = (tabId) => {
    if (tabId === 'apercu') { setActiveTab(tabId); return; }
    const routes = { soins: '/infirmier/soins', dossiers: '/infirmier/dossiers' };
    navigate(routes[tabId] || '/infirmier/dashboard');
 };

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection stats={stats} frequentation={frequentation} visites={visites} motifs={motifs} urgencesJour={urgencesJour} alertesMedicales={alertesMedicales} soinsRecurrents={soinsRecurrents} />;
      default: return <ApercuSection stats={stats} frequentation={frequentation} visites={visites} motifs={motifs} urgencesJour={urgencesJour} alertesMedicales={alertesMedicales} soinsRecurrents={soinsRecurrents} />;
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
        <div className="flex items-center gap-2">
          <RefreshButton loading={loading} onRefresh={refetch} />
          <Button variant="ghost" size="sm"><Heart className="h-4 w-4 mr-1" /> État des Lieux</Button>
        </div>
      </div>

      {error && (
        <ErrorDisplay message={error} onRetry={refetch} />
      )}

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
