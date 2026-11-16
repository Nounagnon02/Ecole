/**
 * EleveDashboard — données réelles depuis l'API
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock, ClipboardList,
  TrendingUp, Award, BarChart3, DollarSign,
  AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer } from 'recharts';
import { cn } from '@/shared/lib/utils';
import { useDashboardStats } from '@/app/dashboards/hooks/useDashboardData';
import DashboardShell from '@/app/dashboards/DashboardShell';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Table from '@/shared/components/ui/Table';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useTranslation } from '@/shared/i18n';

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: BarChart3 },
  { id: 'notes', label: 'Mes Notes', icon: ClipboardList },
  { id: 'emploi', label: 'Emploi du Temps', icon: Clock },
  { id: 'paiements', label: 'Paiements', icon: DollarSign },
];

function ApercuSection({ data, loading }) {
  const { t } = useTranslation();
  const eleve = data?.eleve ?? {};
  const stats = data?.stats ?? {};
  const matieres = data?.matieres ?? [];
  const emploi = data?.emploi_du_temps ?? [];

  const statsCards = [
    {
      title: t('dashboards.eleve.stats.moyenne_generale'),
      value: stats.moyenne_generale ? `${stats.moyenne_generale}/20` : '—',
      icon: TrendingUp,
      color: 'emerald'
    },
    {
      title: t('dashboards.eleve.stats.total_notes'),
      value: String(stats.total_notes ?? 0),
      icon: Award,
      color: 'primary'
    },
    {
      title: t('dashboards.eleve.stats.absences_ce_mois'),
      value: String(stats.absences_mois ?? 0),
      icon: AlertCircle,
      color: 'amber'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : statsCards.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <StatsCard {...s} className="h-full" />
              </motion.div>
            ))
        }
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <Card.Header>
            <div className="flex items-center justify-between">
              <div>
                <Card.Title>{t('dashboards.eleve.notes_par_matiere')}</Card.Title>
                <Card.Description>{t('dashboards.eleve.moyennes_par_matiere')}</Card.Description>
              </div>
              {stats.moyenne_generale && (
                <Badge variant="primary" size="sm">Moy: {stats.moyenne_generale}/20</Badge>
              )}
            </div>
          </Card.Header>
          <Card.Body>
            <div className="h-[250px]">
              {loading ? <Skeleton className="h-full w-full rounded-xl" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={matieres}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
                    <ReTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                    <Bar dataKey="note" fill="var(--accent)" radius={[6, 6, 0, 0]} name="Note" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>{t('dashboards.eleve.prochains_cours')}</Card.Title>
            <Card.Description>{t('dashboards.eleve.emploi_du_temps')}</Card.Description>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : emploi.length === 0 ? (
              <p className="p-6 text-center text-sm text-neutral-400">{t('dashboards.eleve.aucun_cours_planifie')}</p>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {emploi.slice(0, 5).map((cours, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <div className="flex flex-col items-center w-12">
                      <span className="text-xs font-semibold text-[var(--accent)]">{cours.heure_debut}</span>
                      <span className="text-[10px] text-neutral-400">{cours.heure_fin}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">{cours.matiere?.nom}</p>
                      <p className="text-xs text-neutral-500">{cours.enseignant?.user?.name} · {cours.salle}</p>
                    </div>
                    <span className="text-xs text-neutral-400">{cours.jour}</span>
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

function NotesSection({ data, loading }) {
  const { t } = useTranslation();
  const matieres = data?.matieres ?? [];

  return (
    <div className="space-y-6">
      <h2 className="font-fraunces text-xl font-semibold text-neutral-900 dark:text-white">{t('dashboards.eleve.mes_notes')}</h2>
      <Card padding={false}>
        <Table>
          <Table.Header>
            <Table.Head>{t('common.subject')}</Table.Head>
            <Table.Head>{t('common.grade')}</Table.Head>
            <Table.Head>{t('dashboards.eleve.coefficient')}</Table.Head>
          </Table.Header>
          <Table.Body>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <Table.Row key={i}>
                {[1, 2, 3].map((j) => <Table.Cell key={j}><Skeleton className="h-4 w-full" /></Table.Cell>)}
              </Table.Row>
            ))}
            {!loading && matieres.length === 0 && (
              <Table.Row>
                <td colSpan={3} className="p-8 text-center text-sm text-neutral-500">{t('dashboards.eleve.aucune_note_disponible')}</td>
              </Table.Row>
            )}
            {!loading && matieres.map((m, i) => (
              <Table.Row key={i}>
                <Table.Cell className="font-medium">{m.name}</Table.Cell>
                <Table.Cell>
                  <span className={cn(
                    'font-semibold',
                    m.note >= 14 ? 'text-emerald-500' : m.note >= 10 ? 'text-amber-500' : 'text-red-500'
                  )}>
                    {m.note}/20
                  </span>
                </Table.Cell>
                <Table.Cell className="text-neutral-500">×{m.coeff}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>
    </div>
  );
}

export default function EleveDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading, error, refetch } = useDashboardStats('eleve');

  const eleve = data?.eleve ?? {};

  const handleTabClick = (tabId) => {
    if (tabId === 'apercu') { setActiveTab(tabId); return; }
    if (tabId === 'notes') { setActiveTab(tabId); return; }
    const routes = { emploi: '/emploi-du-temps', paiements: '/paiements' };
    navigate(routes[tabId] || '/eleve/dashboard');
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection data={data} loading={loading} />;
      case 'notes': return <NotesSection data={data} loading={loading} />;
      default: return <ApercuSection data={data} loading={loading} />;
    }
  };

  return (
    <DashboardShell
      title={t('dashboards.eleve.title')}
      subtitle={eleve.classe ? t('dashboards.eleve.subtitle_classe', { classe: eleve.classe }) : null}
      tabs={TABS.map((tab) => ({ ...tab, label: t(`dashboards.eleve.tabs.${tab.id}`) }))}
      activeTab={activeTab}
      onTabChange={handleTabClick}
      loading={loading}
      error={error}
      onRefresh={refetch}
    >
      {renderSection()}
    </DashboardShell>
  );
}
