/**
 * DirecteurDashboard — données réelles depuis l'API
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, GraduationCap, Activity, School, Search, Wallet, UserX, ShieldAlert } from 'lucide-react';
import { useDashboardStats } from '@/app/dashboards/hooks/useDashboardData';
import DashboardShell from '@/app/dashboards/DashboardShell';
import ADecider from './ADecider';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Table from '@/shared/components/ui/Table';
import Input from '@/shared/components/ui/Input';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useTranslation } from '@/shared/i18n';
import { formatCurrency } from '@/shared/lib/utils';

// Seuls les onglets qui s'affichent ici : ceux qui menaient vers une
// autre page doublaient le menu (audit, recommandation B4).
const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: Activity },
];

function StatCardsGrid({ stats, loading }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const cards = [
    { title: t('dashboards.directeur.stats.total_eleves'), value: String(stats?.total_eleves ?? 0), icon: Users, color: 'primary' },
    { title: t('dashboards.directeur.stats.enseignants'), value: String(stats?.total_enseignants ?? 0), icon: GraduationCap, color: 'emerald' },
    { title: t('dashboards.directeur.stats.classes'), value: String(stats?.total_classes ?? 0), icon: School, color: 'amber' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((stat, i) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <StatsCard {...stat} className="h-full" />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Argent à recouvrer et vie scolaire du jour : ce que l'API calcule déjà et
 * que l'écran ne montrait pas (revue de pertinence, 15/11/2026). Une valeur
 * absente s'affiche « — », jamais 0. Les « revenus du mois » de l'API ne
 * comptent que les frais soldés (versements partiels exclus) : ils ne sont
 * pas présentés comme un encaissement.
 */
function SuiviGrid({ data, loading }) {
  const { t } = useTranslation();
  if (loading) return null;
  const nombre = (v) => (v === null || v === undefined ? '—' : String(v));
  const impayes = data?.finances?.impayes;
  const cards = [
    { title: t('dashboards.directeur.stats.impayes'), value: impayes === null || impayes === undefined ? '—' : formatCurrency(impayes), icon: Wallet, color: 'amber' },
    { title: t('dashboards.directeur.stats.absents_aujourdhui'), value: nombre(data?.assiduite?.absents_aujourdhui), icon: UserX, color: 'primary' },
    { title: t('dashboards.directeur.stats.incidents_ouverts'), value: nombre(data?.alertes?.incidents_ouverts), icon: ShieldAlert, color: 'red' },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((stat) => <StatsCard key={stat.title} {...stat} className="h-full" />)}
    </div>
  );
}

function ClassesTable({ classes, loading }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const filtered = (classes ?? []).filter((c) =>
    !search || c.nom_classe?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="col-span-2">
      <Card.Header>
        {/* Retour à la ligne sur téléphone : titre et recherche côte à côte
            débordaient à 360 px. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Card.Title>{t('dashboards.directeur.classes_et_effectifs')}</Card.Title>
            <Card.Description>{t('dashboards.directeur.vue_d_ensemble_des_classes_actives')}</Card.Description>
          </div>
          <Input
            placeholder={t('common.search_ellipsis')}
            size="sm"
            icon={Search}
            className="w-full sm:w-48"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        <Table>
          <Table.Header>
            <Table.Head>{t('common.class')}</Table.Head>
            <Table.Head>{t('dashboards.directeur.effectif')}</Table.Head>
            <Table.Head>{t('dashboards.directeur.categorie')}</Table.Head>
          </Table.Header>
          <Table.Body>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <Table.Row key={i}>
                {[1, 2, 3].map((j) => (
                  <Table.Cell key={j}><Skeleton className="h-4 w-full" /></Table.Cell>
                ))}
              </Table.Row>
            ))}
            {!loading && filtered.map((cl) => (
              <Table.Row key={cl.id}>
                <Table.Cell>
                  <span className="font-medium text-[var(--text-primary)] ">{cl.nom_classe}</span>
                </Table.Cell>
                <Table.Cell>{cl.effectif ?? cl.eleves_count ?? '—'}</Table.Cell>
                <Table.Cell>
                  <Badge variant="outline" size="sm">{cl.categorie_classe}</Badge>
                </Table.Cell>
              </Table.Row>
            ))}
            {!loading && filtered.length === 0 && (
              <Table.Row>
                <td colSpan={3} className="p-6 text-center text-sm text-[var(--text-secondary)]">{t('dashboards.directeur.aucune_classe')}</td>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </Card.Body>
    </Card>
  );
}

function ApercuSection({ data, loading }) {
  const stats = data?.stats ?? {};
  const classes = data?.classes_effectif ?? data?.classes ?? [];

  return (
    <div className="space-y-6">
      <StatCardsGrid stats={stats} loading={loading} />
      {/* Ce qui demande une action, avant les graphiques (audit, D8). */}
      <ADecider />
      <SuiviGrid data={data} loading={loading} />
      <ClassesTable classes={classes} loading={loading} />
    </div>
  );
}

export default function DirecteurDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading, error, refetch } = useDashboardStats('directeur');

  const handleTabClick = (tabId) => {
    if (tabId === 'apercu') {
      setActiveTab(tabId);
      return;
    }
    // Rediriger vers les pages de fonctionnalités dédiées
    const routes = {
      eleves: '/eleves',
      performances: '/notes',
      finances: '/paiements',
      messages: '/messagerie',
      calendrier: '/emploi-du-temps'
    };
    navigate(routes[tabId] || '/directeur/dashboard');
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection data={data} loading={loading} />;
      default: return <ApercuSection data={data} loading={loading} />;
    }
  };

  return (
    <DashboardShell
      title={t('dashboards.directeur.title')}
      tabs={TABS.map((tab) => ({ ...tab, label: t(`dashboards.directeur.tabs.${tab.id}`) }))}
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
