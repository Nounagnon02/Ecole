/**
 * CenseurDashboard — Tableau de bord Censeur
 *
 * Sections : Aperçu | Discipline | Absences
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useDashboardData';
import DashboardShell from '../DashboardShell';
import { motion } from 'framer-motion';
import {
  BookOpen, Users, AlertTriangle, BarChart3, Gavel, CalendarX 
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import { useTranslation } from '@/shared/i18n';

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: BarChart3 },
  { id: 'discipline', label: 'Discipline', icon: Gavel },
  { id: 'absences', label: 'Absences', icon: CalendarX },
];

const STATS_META = [
  { title: 'Total Élèves', key: 'total_eleves', icon: Users, color: 'primary' },
  { title: 'Sanctions du Mois', key: 'sanctions_du_mois', icon: Gavel, color: 'amber' },
  { title: 'Absences Non Justifiées', key: 'absences_non_justifiees', icon: CalendarX, color: 'red' },
  { title: 'Avertissements', key: 'avertissements', icon: AlertTriangle, color: 'sky' },
];

const SANCTIONS_COLORS = ['var(--accent)', 'var(--red)', 'var(--amber)', 'var(--green)'];

function ApercuSection({ stats, evolution, types_sanctions, sanctions, absencesParClasse, sanctionsAttente, recidivistes }) {
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
            <Card.Title>{t('dashboards.censeur.evolution_disciplinaire')}</Card.Title>
            <Card.Description>{t('dashboards.censeur.sanctions_et_avertissements_6_derniers_mois')}</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <ReTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                  <Bar dataKey="sanctions" name="Sanctions" fill="var(--amber)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avertissements" name="Avertissements" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>{t('dashboards.censeur.repartition')}</Card.Title>
            <Card.Description>{t('dashboards.censeur.types_de_sanctions')}</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={types_sanctions} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {types_sanctions.map((_, i) => (
                      <Cell key={i} fill={SANCTIONS_COLORS[i]} />
                    ))}
                  </Pie>
                  <ReTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-1.5">
              {types_sanctions.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SANCTIONS_COLORS[i] }} />
                    <span className="text-neutral-600 dark:text-neutral-400">{item.name}</span>
                  </div>
                  <span className="font-medium text-neutral-900 dark:text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>{t('dashboards.censeur.sanctions_recentes')}</Card.Title>
            <Badge variant="warning" size="sm">{sanctions.filter(s => s.statut === 'En cours').length} en cours</Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table>
            <Table.Header>
              <Table.Head>{t('common.student')}</Table.Head>
              <Table.Head>{t('common.class')}</Table.Head>
              <Table.Head>{t('common.reason')}</Table.Head>
              <Table.Head>{t('dashboards.censeur.sanction')}</Table.Head>
              <Table.Head>{t('common.date')}</Table.Head>
              <Table.Head>{t('common.status_label')}</Table.Head>
            </Table.Header>
            <Table.Body>
              {sanctions.map((s) => (
                <Table.Row key={s.id}>
                  <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{s.eleve}</span></Table.Cell>
                  <Table.Cell>{s.classe}</Table.Cell>
                  <Table.Cell className="max-w-[160px] truncate">{s.motif}</Table.Cell>
                  <Table.Cell>{s.sanction}</Table.Cell>
                  <Table.Cell className="text-neutral-400">{s.date}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={s.statut === 'Exécuté' ? 'success' : s.statut === 'En cours' ? 'warning' : 'neutral'} size="sm">
                      {s.statut}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{t('dashboards.censeur.absences_par_classe')}</Card.Title>
            <Card.Description>{t('dashboards.censeur.non_justifiees_ce_mois_ci')}</Card.Description>
          </Card.Header>
          <Card.Body>
            {absencesParClasse.length > 0 ? (
            <div className="space-y-3">
              {absencesParClasse.map((item) => {
                const max = Math.max(...absencesParClasse.map((c) => c.absences), 1);
                return (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--red)]" style={{ width: `${(item.absences / max) * 100}%` }} />
                      </div>
                      <span className="w-6 text-right font-medium text-neutral-900 dark:text-white">{item.absences}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
                <CalendarX className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">{t('dashboards.censeur.aucune_absence_non_justifiee_ce_mois')}</p>
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>{t('dashboards.censeur.sanctions_en_attente')}</Card.Title>
              {sanctionsAttente.length > 0 && (
                <Badge variant="warning" size="sm">{sanctionsAttente.length}</Badge>
              )}
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {sanctionsAttente.length > 0 ? (
            <Table>
              <Table.Header>
                <Table.Head>{t('common.student')}</Table.Head>
                <Table.Head>{t('dashboards.censeur.sanction')}</Table.Head>
                <Table.Head>{t('common.date')}</Table.Head>
              </Table.Header>
              <Table.Body>
                {sanctionsAttente.map((s) => (
                  <Table.Row key={s.id}>
                    <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{s.eleve}</span></Table.Cell>
                    <Table.Cell>{s.sanction}</Table.Cell>
                    <Table.Cell className="text-neutral-400">{s.date}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
                <Gavel className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">{t('dashboards.censeur.aucune_sanction_a_suivre')}</p>
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>{t('dashboards.censeur.recidivistes')}</Card.Title>
            <Card.Description>{t('dashboards.censeur.2_sanctions_ou_plus')}</Card.Description>
          </Card.Header>
          <Card.Body className="p-0">
            {recidivistes.length > 0 ? (
            <Table>
              <Table.Header>
                <Table.Head>{t('common.student')}</Table.Head>
                <Table.Head>{t('common.class')}</Table.Head>
                <Table.Head>{t('dashboards.censeur.sanctions')}</Table.Head>
              </Table.Header>
              <Table.Body>
                {recidivistes.map((r) => (
                  <Table.Row key={r.eleve}>
                    <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{r.eleve}</span></Table.Cell>
                    <Table.Cell>{r.classe}</Table.Cell>
                    <Table.Cell>
                      <Badge variant={r.sanctions >= 3 ? 'danger' : 'warning'} size="sm">{r.sanctions}</Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
                <AlertTriangle className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">{t('dashboards.censeur.aucun_recidiviste')}</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default function CenseurDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading, error, refetch } = useDashboardStats('censeur');

  const stats = data?.stats?.map((s, i) => ({
    ...s,
    title: STATS_META[i]?.key ? t(`dashboards.censeur.stats.${STATS_META[i].key}`) : s.title,
    icon: STATS_META[i]?.icon,
    color: STATS_META[i]?.color,
  })) || [];
  const evolution = data?.evolution || [];
  const types_sanctions = data?.types_sanctions || [];
  const sanctions = data?.sanctions || [];
  const absencesParClasse = data?.absences_par_classe || [];
  const sanctionsAttente = data?.sanctions_attente || [];
  const recidivistes = data?.recidivistes || [];

  const handleTabClick = (tabId) => {
    if (tabId === 'apercu') { setActiveTab(tabId); return; }
    const routes = { discipline: '/censeur/discipline', absences: '/censeur/absences' };
    navigate(routes[tabId] || '/censeur/dashboard');
 };

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection stats={stats} evolution={evolution} types_sanctions={types_sanctions} sanctions={sanctions} absencesParClasse={absencesParClasse} sanctionsAttente={sanctionsAttente} recidivistes={recidivistes} />;
      default: return <ApercuSection stats={stats} evolution={evolution} types_sanctions={types_sanctions} sanctions={sanctions} absencesParClasse={absencesParClasse} sanctionsAttente={sanctionsAttente} recidivistes={recidivistes} />;
 }
 };

  return (
    <DashboardShell
      title={t('dashboards.censeur.title')}
      subtitle={t('dashboards.censeur.subtitle')}
      tabs={TABS.map((tab) => ({ ...tab, label: t(`dashboards.censeur.tabs.${tab.id}`) }))}
      activeTab={activeTab}
      onTabChange={handleTabClick}
      loading={loading}
      error={error}
      onRefresh={refetch}
      actions={
        <>
    <Button variant="ghost" size="sm"><BookOpen className="h-4 w-4 mr-1" /> {t('dashboards.censeur.reglement')}</Button>
        </>
      }
    >
      {renderSection()}
    </DashboardShell>
  );
}
