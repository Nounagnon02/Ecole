/**
 * ComptableDashboard — Tableau de bord Comptable
 *
 * Sections : Aperçu | Factures | Transactions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useDashboardData';
import DashboardShell from '../DashboardShell';
import { motion } from 'framer-motion';
import {
  Wallet, Receipt, ArrowDownRight, TrendingUp,
  CheckCircle2, Clock, BarChart3, FileSpreadsheet
  
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
  { id: 'factures', label: 'Factures', icon: FileSpreadsheet },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
];

const STATS_META = [
  { title: 'Revenus du Mois', key: 'revenus_du_mois', icon: TrendingUp, color: 'emerald' },
  { title: 'Factures en Attente', key: 'factures_en_attente', icon: Clock, color: 'amber' },
  { title: 'Taux Recouvrement', key: 'taux_recouvrement', icon: CheckCircle2, color: 'primary' },
  { title: 'Dépenses du Mois', key: 'depenses_du_mois', icon: ArrowDownRight, color: 'red' },
];

function ApercuSection({ stats, caData, repartition, factures, impayes, tresorerie }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.length > 0 ? stats.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatsCard {...stat} className="h-full" />
          </motion.div>
        )) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-[var(--text-tertiary)]">
            <Wallet className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">{t('dashboards.comptable.aucune_donnee_financiere_disponible')}</p>
            <p className="text-xs mt-1">{t('dashboards.comptable.les_statistiques_apparaitront_une_fois_les')}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>{t('dashboards.comptable.evolution_des_finances')}</Card.Title>
            <Card.Description>{t('dashboards.comptable.revenus_et_depenses_6_derniers_mois')}</Card.Description>
          </Card.Header>
          <Card.Body>
            {caData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={caData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <ReTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                  <Bar dataKey="revenus" name="Revenus" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="depenses" name="Dépenses" fill="var(--amber)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-sm text-[var(--text-tertiary)]">
                {t('dashboards.comptable.aucune_donnee_financiere_pour_la_periode')}
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>{t('dashboards.comptable.repartition')}</Card.Title>
            <Card.Description>{t('dashboards.comptable.part_des_montants_par_type')}</Card.Description>
          </Card.Header>
          <Card.Body>
            {repartition.length > 0 ? (
            <>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={repartition} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {repartition.map((_, i) => (
                      <Cell key={i} fill={['var(--accent)', 'var(--green)', 'var(--amber)', 'var(--red)'][i]} />
                    ))}
                  </Pie>
                  <ReTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {repartition.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ['var(--accent)', 'var(--green)', 'var(--amber)', 'var(--red)'][i] }} />
                    <span className="text-neutral-600 dark:text-neutral-400">{item.name}</span>
                  </div>
                  <span className="font-medium text-neutral-900 dark:text-white">{item.value}%</span>
                </div>
              ))}
            </div>
            </>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-[var(--text-tertiary)]">
                {t('dashboards.comptable.aucune_repartition_disponible')}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{t('dashboards.comptable.tresorerie_du_mois')}</Card.Title>
            <Card.Description>{t('dashboards.comptable.encaisse_reellement_verse')}</Card.Description>
          </Card.Header>
          <Card.Body className="space-y-4">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('dashboards.comptable.encaissements')}</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {(tresorerie?.encaissements_mois || 0).toLocaleString()} F
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('dashboards.comptable.depenses_du_mois')}</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {(tresorerie?.depenses_mois || 0).toLocaleString()} F
              </p>
            </div>
            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('common.balance')}</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {(tresorerie?.solde || 0).toLocaleString()} F
              </p>
            </div>
          </Card.Body>
        </Card>

        <Card className="lg:col-span-2">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>{t('dashboards.comptable.impayes_prioritaires')}</Card.Title>
              {impayes.length > 0 && (
                <Badge variant="danger" size="sm">{impayes.length} comptes à suivre</Badge>
              )}
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {impayes.length > 0 ? (
            <Table>
              <Table.Header>
                <Table.Head>{t('common.student')}</Table.Head>
                <Table.Head>{t('common.class')}</Table.Head>
                <Table.Head>{t('common.type')}</Table.Head>
                <Table.Head>{t('dashboards.comptable.reste_du')}</Table.Head>
              </Table.Header>
              <Table.Body>
                {impayes.map((f) => (
                  <Table.Row key={f.id}>
                    <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{f.eleve}</span></Table.Cell>
                    <Table.Cell>{f.classe}</Table.Cell>
                    <Table.Cell>{f.type}</Table.Cell>
                    <Table.Cell>
                      <span className="font-semibold text-red-600 dark:text-red-400">{(f.montant_restant ?? 0).toLocaleString()} F</span>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-[var(--text-tertiary)]">
                <CheckCircle2 className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">{t('dashboards.comptable.aucun_impaye_tous_les_comptes_sont_a_jour')}</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>{t('dashboards.comptable.factures_recentes')}</Card.Title>
            {factures.length > 0 && (
            <Badge variant="warning" size="sm">{factures.filter(f => f.statut !== 'Payée').length} en attente</Badge>
            )}
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {factures.length > 0 ? (
          <Table>
            <Table.Header>
              <Table.Head>{t('common.student')}</Table.Head>
              <Table.Head>{t('common.class')}</Table.Head>
              <Table.Head>{t('common.amount')}</Table.Head>
              <Table.Head>{t('common.status_label')}</Table.Head>
              <Table.Head>{t('dashboards.comptable.echeance')}</Table.Head>
            </Table.Header>
            <Table.Body>
              {factures.map((f) => (
                <Table.Row key={f.id}>
                  <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{f.eleve}</span></Table.Cell>
                  <Table.Cell>{f.classe}</Table.Cell>
                  <Table.Cell>{(f.montant ?? 0).toLocaleString()} F</Table.Cell>
                  <Table.Cell>
                    <Badge variant={f.statut === 'Payée' ? 'success' : f.statut === 'En attente' ? 'warning' : 'danger'} size="sm">
                      {f.statut}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-neutral-400">{f.echeance}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--text-tertiary)]">
              <Receipt className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">{t('dashboards.comptable.aucune_facture_recente')}</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default function ComptableDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading, error, refetch } = useDashboardStats('comptable');

  const stats = data?.stats?.map((s, i) => ({
    ...s,
    title: STATS_META[i]?.key ? t(`dashboards.comptable.stats.${STATS_META[i].key}`) : s.title,
    icon: STATS_META[i]?.icon,
    color: STATS_META[i]?.color,
  })) || [];
  const caData = data?.donnes_ca || [];
  const repartition = data?.repartition_revenus || data?.repartition || [];
  const factures = data?.factures || [];
  const impayes = data?.impayes || [];
  const tresorerie = data?.tresorerie || { encaissements_mois: 0, depenses_mois: 0, solde: 0 };

  const handleTabClick = (tabId) => {
    if (tabId === 'apercu') { setActiveTab(tabId); return; }
    const routes = { factures: '/comptable/factures', transactions: '/comptable/transactions' };
    navigate(routes[tabId] || '/comptable/dashboard');
 };

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection stats={stats} caData={caData} repartition={repartition} factures={factures} impayes={impayes} tresorerie={tresorerie} />;
      default: return <ApercuSection stats={stats} caData={caData} repartition={repartition} factures={factures} impayes={impayes} tresorerie={tresorerie} />;
 }
 };

  return (
    <DashboardShell
      title={t('dashboards.comptable.title')}
      subtitle={t('dashboards.comptable.subtitle')}
      tabs={TABS.map((tab) => ({ ...tab, label: t(`dashboards.comptable.tabs.${tab.id}`) }))}
      activeTab={activeTab}
      onTabChange={handleTabClick}
      loading={loading}
      error={error}
      onRefresh={refetch}
      actions={
        <Button variant="ghost" size="sm">
          <Wallet className="h-4 w-4 mr-1" /> {t('dashboards.comptable.synthese')}
        </Button>
      }
    >
      {renderSection()}
    </DashboardShell>
  );
}
