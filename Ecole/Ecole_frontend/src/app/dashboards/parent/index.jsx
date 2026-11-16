/**
 * ParentDashboard — Tableau de bord premium pour Parent
 *
 * Sections : Aperçu | Notes Enfant | Emploi du Temps | Paiements | Communications
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Clock,
  ClipboardList,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  Eye
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';
import { cn } from '@/shared/lib/utils';
import { useDashboardStats } from '@/app/dashboards/hooks/useDashboardData';
import DashboardShell from '@/app/dashboards/DashboardShell';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useTranslation } from '@/shared/i18n';

// ─── Constantes ───────────────────────────────────────────────

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: BarChart3 },
  { id: 'notes', label: 'Notes', icon: ClipboardList },
  { id: 'emploi', label: 'Emploi du Temps', icon: Clock },
  { id: 'paiements', label: 'Paiements', icon: DollarSign },
  { id: 'communications', label: 'Échanges', icon: MessageSquare },
];

const STATS_META = [
  { title: 'Enfants Scolarisés', key: 'enfants_scolarises', icon: Users, color: 'primary' },
  { title: 'Moyenne Générale', key: 'moyenne_generale', icon: TrendingUp, color: 'emerald' },
  { title: 'Assiduité', key: 'assiduite', icon: CheckCircle2, color: 'sky' },
  { title: 'Solde', key: 'solde', icon: DollarSign, color: 'amber' },
];

// ─── Sections ─────────────────────────────────────────────────

function ApercuSection({ data, loading }) {
  const { t } = useTranslation();
  const safeStats = data?.stats?.map((s, i) => ({
    ...s,
    title: STATS_META[i]?.key ? t(`dashboards.parent.stats.${STATS_META[i].key}`) : s.title,
    icon: STATS_META[i]?.icon,
    color: STATS_META[i]?.color,
  })) || [];
  const safeEnfants = data?.enfants || data?.children || [];
  const safeEvolution = data?.evolution || [];
  const safeCommunications = data?.communications || [];

  // Clés dynamiques du graphique : un prénom par enfant (plus de "Koffi"/"Ama" codés en dur).
  const childKeys = [...new Set(safeEvolution.flatMap((row) =>
    Object.keys(row).filter((k) => k !== 'mois')
  ))];

  const roleVariant = (role) => {
    const map = {
      père: 'primary',
      mère: 'accent',
      tuteur: 'warning',
      correspondant: 'info',
    };
    return map[role] || 'default';
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : safeStats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <StatsCard {...stat} className="h-full" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Évolution des notes */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <div className="flex items-center justify-between">
              <div>
                <Card.Title>{t('dashboards.parent.evolution_des_notes')}</Card.Title>
                <Card.Description>{t('dashboards.parent.suivi_trimestriel')}</Card.Description>
              </div>
              {childKeys.length > 0 && (
                <div className="flex items-center gap-4 text-xs">
                  {childKeys.slice(0, 4).map((key, i) => (
                    <div key={key} className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--emerald)' : 'var(--amber)' }} />
                      <span className="text-neutral-500">{key}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card.Header>
          <Card.Body>
            <div className="h-[250px]">
              {safeEvolution.length === 0 || childKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)]">
                  <TrendingUp className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">{t('dashboards.parent.aucune_donnee_d_evolution_disponible')}</p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={safeEvolution}>
                  <defs>
                    {childKeys.slice(0, 4).map((key, i) => (
                      <linearGradient key={key} id={`childGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={i === 0 ? 'var(--accent)' : i === 1 ? 'var(--emerald)' : 'var(--amber)'} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={i === 0 ? 'var(--accent)' : i === 1 ? 'var(--emerald)' : 'var(--amber)'} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <ReTooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                  {childKeys.slice(0, 4).map((key, i) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={i === 0 ? 'var(--accent)' : i === 1 ? 'var(--emerald)' : 'var(--amber)'}
                      fill={`url(#childGrad-${i})`}
                      strokeWidth={2}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Enfants */}
        <Card>
          <Card.Header>
            <Card.Title>{t('dashboards.parent.mes_enfants')}</Card.Title>
            <Card.Description>{t('dashboards.parent.vue_rapide')}</Card.Description>
          </Card.Header>
          <Card.Body className="space-y-4">
            {safeEnfants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--text-tertiary)]">
                <Users className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">{t('dashboards.parent.aucun_enfant_trouve')}</p>
              </div>
            ) : (
              safeEnfants.map((enfant) => (
                <div
                  key={enfant.id}
                  className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={enfant.nom} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        {enfant.nom} {enfant.prenom}
                      </p>
                      <p className="text-xs text-neutral-500">{enfant.classe}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {enfant.role && (
                          <Badge variant={roleVariant(enfant.role)} size="sm">{enfant.role}</Badge>
                        )}
                        {enfant.is_primary && (
                          <Badge variant="success" size="sm">{t('dashboards.parent.contact_principal')}</Badge>
                        )}
                        {enfant.is_guardian && (
                          <Badge variant="info" size="sm">{t('dashboards.parent.tuteur_legal')}</Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant="primary" size="sm">{enfant.moyenne ?? '—'}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Rang: <strong className="text-neutral-700 dark:text-neutral-300">{enfant.rang ?? '—'}</strong></span>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Communications récentes */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <Card.Title>{t('dashboards.parent.derniers_echanges')}</Card.Title>
              <Card.Description>{t('dashboards.parent.avec_l_etablissement')}</Card.Description>
            </div>
            <Badge variant="danger" size="sm">{safeCommunications.filter(c => c.urgent).length} urgent</Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {safeCommunications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--text-tertiary)]">
              <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">{t('dashboards.parent.aucun_echange_recent')}</p>
            </div>
          ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {safeCommunications.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex items-center gap-4 px-6 py-4 transition-colors cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                  msg.urgent && 'bg-red-50/30 dark:bg-red-500/5'
                )}
              >
                <Avatar name={msg.from} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-neutral-900 dark:text-white">{msg.sujet}</span>
                    {msg.urgent && <Badge variant="danger" size="sm">{t('dashboards.parent.urgent')}</Badge>}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">{msg.from} · {msg.role}</p>
                </div>
                <span className="text-xs text-neutral-400">{msg.date}</span>
              </div>
            ))}
          </div>
          )}
        </Card.Body>
        <Card.Footer>
          <Button variant="ghost" size="sm" className="w-full">
            {t('dashboards.parent.voir_tous_les_echanges')} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}

// ─── Composant Principal ──────────────────────────────────────

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading, error, refetch } = useDashboardStats('parent');

  const handleTabClick = (tabId) => {
    if (tabId === 'apercu') { setActiveTab(tabId); return; }
    const routes = {
      notes: '/notes',
      emploi: '/emploi-du-temps',
      paiements: '/paiements',
      communications: '/communications'
    };
    navigate(routes[tabId] || '/parent/dashboard');
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection data={data} loading={loading} />;
      default: return <ApercuSection />;
    }
  };

  return (
    <DashboardShell
      title={t('dashboards.parent.title')}
      subtitle={t('dashboards.parent.subtitle')}
      tabs={TABS.map((tab) => ({ ...tab, label: t(`dashboards.parent.tabs.${tab.id}`) }))}
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
