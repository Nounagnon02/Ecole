/**
 * UniversiteDashboard — Tableau de bord université v1
 *
 * Rôles : Recteur, Doyen, Professeur, Étudiant, Personnel
 * Sections : Aperçu | Facultés | Étudiants | Cours | Planning
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Users, BookOpen, GraduationCap, Calendar,
  Activity, School, UserCheck, FileText, Search, Bell,
  BarChart3, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { cn } from '@/shared/lib/utils';
import { useDashboardStats } from '@/app/dashboards/hooks/useDashboardData';
import DashboardShell from '@/app/dashboards/DashboardShell';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import { useTranslation } from '@/shared/i18n';
import { Skeleton } from '@/shared/components/ui/Skeleton';

/* ─── Constantes ─────────────────────────────────────────────── */
const COLORS = ['var(--accent)', 'var(--green)', 'var(--amber)', 'var(--blue)', 'var(--primary)', 'var(--red)'];

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: Activity },
  { id: 'facultes', label: 'Facultés', icon: Building2 },
  { id: 'etudiants', label: 'Étudiants', icon: Users },
  { id: 'cours', label: 'Cours', icon: BookOpen },
  { id: 'planning', label: 'Planning', icon: Calendar },
];

const STATS_META = [
  { title: 'Facultés', key: 'facultes', icon: Building2, color: 'primary' },
  { title: 'Départements', key: 'departements', icon: School, color: 'sky' },
  { title: 'Enseignants', key: 'enseignants', icon: Users, color: 'emerald' },
  { title: 'Étudiants', key: 'etudiants', icon: GraduationCap, color: 'violet' },
];

/* ─── Sections ────────────────────────────────────────────────── */

function ApercuSection({ stats, inscriptions, facultes, activites, loading }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : stats.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatsCard {...stat} className="h-full" />
          </motion.div>
        ))}
      </div>
      {loading && <Skeleton className="h-[300px] rounded-2xl" />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inscriptions */}
        <Card>
          <Card.Header>
            <Card.Title>{t('dashboards.universite.inscriptions_diplomes')}</Card.Title>
            <Card.Description>{t('dashboards.universite.evolution_sur_5_ans')}</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[260px]">
              {inscriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)]">
                  <BarChart3 className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">{t('dashboards.universite.aucune_donnee_d_inscription')}</p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inscriptions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="annee" tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <ReTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                  <Bar dataKey="inscriptions" name="Inscriptions" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="diplomes" name="Diplômés" fill="var(--green)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Répartition par faculté */}
        <Card>
          <Card.Header>
            <Card.Title>{t('dashboards.universite.etudiants_par_faculte')}</Card.Title>
            <Card.Description>{t('dashboards.universite.repartition_semestre_actuel')}</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[260px]">
              {facultes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)]">
                  <Building2 className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">{t('dashboards.universite.aucune_donnee_facultaire')}</p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={facultes} dataKey="etudiants" nameKey="nom" cx="50%" cy="50%" outerRadius={90} label={({ nom, percent }) => `${nom} ${(percent * 100).toFixed(0)}%`}>
                    {facultes.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Activités récentes */}
      <Card>
        <Card.Header>
          <Card.Title>{t('dashboards.universite.activites_recentes')}</Card.Title>
          <Card.Description>{t('dashboards.universite.derniers_evenements_dans_l_universite')}</Card.Description>
        </Card.Header>
        <Card.Body>
          {activites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-[var(--text-tertiary)]">
              <Activity className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">{t('dashboards.universite.aucune_activite_recente')}</p>
            </div>
          ) : (
          <div className="space-y-1">
            {activites.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50/50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/30">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full',
                  a.type === 'inscription' && 'bg-[var(--emerald-subtle)] text-[var(--emerald)]',
                  a.type === 'note' && 'bg-[var(--accent-subtle)] text-[var(--accent)]',
                  a.type === 'evenement' && 'bg-[var(--amber-subtle)] text-[var(--amber)]',
                  a.type === 'alerte' && 'bg-[var(--red-subtle)] text-[var(--red)]',
                  a.type === 'cours' && 'bg-[var(--sky-subtle)] text-[var(--sky)]',
                )}>
                  {a.type === 'inscription' && <UserCheck className="h-4 w-4" />}
                  {a.type === 'note' && <FileText className="h-4 w-4" />}
                  {a.type === 'evenement' && <Calendar className="h-4 w-4" />}
                  {a.type === 'alerte' && <Bell className="h-4 w-4" />}
                  {a.type === 'cours' && <BookOpen className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{a.message}</p>
                  <p className="text-xs text-neutral-400">{a.temps}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-300" />
              </div>
            ))}
          </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

/* ─── Dashboard principal ──────────────────────────────────────── */
export default function UniversiteDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading, error, refetch } = useDashboardStats('universite');

  const stats = data?.stats?.map((s, i) => ({
    ...s,
    title: STATS_META[i]?.key ? t(`dashboards.universite.stats.${STATS_META[i].key}`) : s.title,
    icon: STATS_META[i]?.icon,
    color: STATS_META[i]?.color,
  })) || [];
  const inscriptions = data?.inscriptions || [];
  const facultes = data?.facultes || [];
  const activites = data?.activites || [];

  const handleTabClick = (tabId) => {
    if (tabId === 'apercu') { setActiveTab(tabId); return; }
    const routes = {
      facultes: '/universite/facultes',
      etudiants: '/universite/etudiants',
      cours: '/universite/cours',
      planning: '/universite/planning'
 };
    navigate(routes[tabId] || '/universite/dashboard');
 };

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection stats={stats} inscriptions={inscriptions} facultes={facultes} activites={activites} loading={loading} />;
      default: return <ApercuSection stats={stats} inscriptions={inscriptions} facultes={facultes} activites={activites} loading={loading} />;
 }
 };

  return (
    <DashboardShell
      title={t('dashboards.universite.title')}
      subtitle={t('dashboards.universite.subtitle')}
      tabs={TABS.map((tab) => ({ ...tab, label: t(`dashboards.universite.tabs.${tab.id}`) }))}
      activeTab={activeTab}
      onTabChange={handleTabClick}
      loading={loading}
      error={error}
      onRefresh={refetch}
      actions={
        <>
    <Button variant="ghost" size="sm" icon={<Search className="h-4 w-4" />} />
    <Button variant="ghost" size="sm"><Bell className="h-4 w-4" /></Button>
    <Button variant="ghost" size="sm" icon={<Calendar className="h-4 w-4" />}>
    {t('dashboards.universite.calendrier')}
    </Button>
        </>
      }
    >
      {renderSection()}
    </DashboardShell>
  );
}
