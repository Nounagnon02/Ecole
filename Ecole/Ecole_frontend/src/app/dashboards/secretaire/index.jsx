
/**
 * SecretaireDashboard — Tableau de bord Secrétaire
 *
 * Sections : Aperçu | Inscriptions | Planning | Documents
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useDashboardData';
import DashboardShell from '../DashboardShell';
import { motion } from 'framer-motion';
import {
  FileText, Users, Calendar, BarChart3, UserPlus, ClipboardList 
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import { useTranslation } from '@/shared/i18n';

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: BarChart3 },
  { id: 'inscriptions', label: 'Inscriptions', icon: UserPlus },
  { id: 'planning', label: 'Planning', icon: Calendar },
  { id: 'documents', label: 'Documents', icon: FileText },
];

const STATS_META = [
  { title: 'Inscriptions', key: 'inscriptions', icon: Users, color: 'primary' },
  { title: 'Nouveaux ce Mois', key: 'nouveaux_ce_mois', icon: UserPlus, color: 'emerald' },
  { title: 'Dossiers en Cours', key: 'dossiers_en_cours', icon: ClipboardList, color: 'amber' },
  { title: 'Documents Générés', key: 'documents_generes', icon: FileText, color: 'sky' },
];

function ApercuSection({ stats, fluxInscriptions, rendezVous, inscriptions, planningRendezVous, certificatsAttente }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatsCard {...stat} className="h-full" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>{t('dashboards.secretaire.flux_d_inscriptions')}</Card.Title>
            <Card.Description>{t('dashboards.secretaire.nouveaux_inscrits_6_derniers_mois')}</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fluxInscriptions}>
                  <defs>
                    <linearGradient id="colorNouveaux" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} /><stop offset="95%" stopColor="var(--accent)" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <ReTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                  <Area type="monotone" dataKey="nouveaux" name="Nouveaux" stroke="var(--accent)" fill="url(#colorNouveaux)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>{t('dashboards.secretaire.rendez_vous_du_jour')}</Card.Title>
            <Card.Description>{format(new Date(), 'EEEE d MMMM', { locale: fr })}</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              {rendezVous.map((rv) => (
                <div key={rv.id} className="flex items-start gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-xs font-semibold text-[var(--accent)]">
                    {rv.heure?.split(':')[0] ?? '--'}
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
            <Card.Title>{t('dashboards.secretaire.dernieres_inscriptions')}</Card.Title>
            <Badge variant="primary" size="sm">{t('common.today')}</Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table>
            <Table.Header>
              <Table.Head>{t('dashboards.secretaire.nom')}</Table.Head>
              <Table.Head>{t('common.class')}</Table.Head>
              <Table.Head>{t('common.type')}</Table.Head>
              <Table.Head>{t('common.date')}</Table.Head>
              <Table.Head>{t('common.status_label')}</Table.Head>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>{t('dashboards.secretaire.planning_a_venir')}</Card.Title>
              <Card.Description>{t('dashboards.secretaire.7_prochains_jours')}</Card.Description>
              {planningRendezVous.length > 0 && (
                <Badge variant="primary" size="sm">{planningRendezVous.length}</Badge>
              )}
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {planningRendezVous.length > 0 ? (
            <Table>
              <Table.Header>
                <Table.Head>{t('dashboards.secretaire.visiteur')}</Table.Head>
                <Table.Head>{t('common.reason')}</Table.Head>
                <Table.Head>{t('common.date')}</Table.Head>
                <Table.Head>{t('common.time')}</Table.Head>
              </Table.Header>
              <Table.Body>
                {planningRendezVous.map((rv) => (
                  <Table.Row key={rv.id}>
                    <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{rv.visiteur}</span></Table.Cell>
                    <Table.Cell className="max-w-[180px] truncate">{rv.motif}</Table.Cell>
                    <Table.Cell className="text-neutral-400">{rv.date}</Table.Cell>
                    <Table.Cell className="text-neutral-400">{rv.heure}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
                <Calendar className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">{t('dashboards.secretaire.aucun_rendez_vous_prevu_cette_semaine')}</p>
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>{t('dashboards.secretaire.certificats_a_emettre')}</Card.Title>
              {certificatsAttente.length > 0 && (
                <Badge variant="warning" size="sm">{certificatsAttente.length}</Badge>
              )}
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {certificatsAttente.length > 0 ? (
            <Table>
              <Table.Header>
                <Table.Head>{t('common.student')}</Table.Head>
                <Table.Head>{t('common.type')}</Table.Head>
                <Table.Head>{t('dashboards.secretaire.demande')}</Table.Head>
              </Table.Header>
              <Table.Body>
                {certificatsAttente.map((c) => (
                  <Table.Row key={c.id}>
                    <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{c.eleve}</span></Table.Cell>
                    <Table.Cell>{c.type}</Table.Cell>
                    <Table.Cell className="text-neutral-400">{c.date}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
                <FileText className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">{t('dashboards.secretaire.aucun_certificat_en_attente')}</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default function SecretaireDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading, error, refetch } = useDashboardStats('secretaire');

  const stats = data?.stats?.map((s, i) => ({
    ...s,
    title: STATS_META[i]?.key ? t(`dashboards.secretaire.stats.${STATS_META[i].key}`) : s.title,
    icon: STATS_META[i]?.icon,
    color: STATS_META[i]?.color,
  })) || [];
  const fluxInscriptions = data?.flux_inscriptions || [];
  const rendezVous = data?.rendez_vous || [];
  const inscriptions = data?.inscriptions || [];
  const planningRendezVous = data?.planning_rendez_vous || [];
  const certificatsAttente = data?.certificats_attente || [];

  const handleTabClick = (tabId) => {
    if (tabId === 'apercu') {
      setActiveTab(tabId);
      return;
 }
    const routes = {
      inscriptions: '/secretaire/inscriptions',
      planning: '/secretaire/planning',
      documents: '/secretaire/documents'
 };
    navigate(routes[tabId] || '/secretaire/dashboard');
 };

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection stats={stats} fluxInscriptions={fluxInscriptions} rendezVous={rendezVous} inscriptions={inscriptions} planningRendezVous={planningRendezVous} certificatsAttente={certificatsAttente} />;
      default: return <ApercuSection stats={stats} fluxInscriptions={fluxInscriptions} rendezVous={rendezVous} inscriptions={inscriptions} planningRendezVous={planningRendezVous} certificatsAttente={certificatsAttente} />;
 }
 };

  return (
    <DashboardShell
      title={t('dashboards.secretaire.title')}
      subtitle={t('dashboards.secretaire.subtitle')}
      tabs={TABS.map((tab) => ({ ...tab, label: t(`dashboards.secretaire.tabs.${tab.id}`) }))}
      activeTab={activeTab}
      onTabChange={handleTabClick}
      loading={loading}
      error={error}
      onRefresh={refetch}
      actions={
        <>
    <Button variant="ghost" size="sm"><ClipboardList className="h-4 w-4 mr-1" /> {t('dashboards.secretaire.tableau_de_bord')}</Button>
        </>
      }
    >
      {renderSection()}
    </DashboardShell>
  );
}
