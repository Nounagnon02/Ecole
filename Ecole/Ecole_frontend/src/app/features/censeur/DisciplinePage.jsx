/**
 * DisciplinePage — Gestion de la discipline avec tendances et alertes
 *
 * Le censeur suit les incidents, sanctions et tendances disciplinaires.
 * Données via API /surveillant/incidents et /surveillant/statistiques
 */

import { useState, useMemo } from 'react';
import { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { motion } from 'framer-motion';
import {
  Scale, AlertTriangle, Search, Plus,
  Clock, CheckCircle, Loader2, TrendingUp, TrendingDown,
  AlertOctagon, Info
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useTranslation } from '@/shared/i18n';

const getGraviteVariant = (g) => {
  switch (g) {
    case 'legere':
    case 'faible': return 'outline';
    case 'moyenne': return 'warning';
    case 'grave': return 'danger';
    default: return 'outline';
  }
};

const getGraviteLabel = (g) => {
  switch (g) {
    case 'legere':
    case 'faible': return 'Légère';
    case 'moyenne': return 'Moyenne';
    case 'grave': return 'Grave';
    default: return g || '--';
  }
};

const ALERT_ICONS = {
  danger: AlertOctagon,
  warning: AlertTriangle,
  info: Info
};

const ALERT_COLORS = {
  danger: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10 text-red-700 dark:text-red-400',
  warning: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400',
  info: 'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/10 text-sky-700 dark:text-sky-400'
};

export default function DisciplinePage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterGravite, setFilterGravite] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  // Deux requêtes indépendantes plutôt qu'un `Promise.all` derrière un
  // `useApi()` à l'état partagé : l'échec de l'une ne dit plus rien de
  // l'autre, et chacune a son entrée de cache (cf. audit P4.1).
  const requeteIncidents = useApiQuery(['surveillant-incidents'], '/surveillant/incidents');
  const requeteStats = useApiQuery(['surveillant-statistiques'], '/surveillant/statistiques');

  // La projection d'origine est conservée : la page affiche `type`, que le
  // serveur ne renvoie pas toujours — il faut retomber sur la description.
  const incidents = useMemo(
    () => (unwrapList(requeteIncidents.data) ?? []).map((inc) => ({
      ...inc,
      type: inc.description || inc.type || 'Incident',
      statut: inc.statut || 'en_cours',
      rapportePar: '--',
    })),
    [requeteIncidents.data],
  );
  // `/surveillant/statistiques` renvoie un objet, pas une liste : pas de
  // `unwrapList` ici, seulement le déballage de l'enveloppe.
  const stats = requeteStats.data?.data ?? requeteStats.data ?? null;
  const statsLoading = requeteStats.isPending;

  const loading = requeteIncidents.isPending;
  const error = requeteIncidents.isError
    ? (requeteIncidents.error?.message ?? t('common.load_error'))
    : null;

  const incidentStats = useMemo(() => ({
    total: incidents.length,
    enCours: incidents.filter((i) => i.statut === 'en_cours' || i.statut === 'signalé').length,
    traitees: incidents.filter((i) => i.statut === 'termine' || i.statut === 'résolu' || i.statut === 'traitee').length,
    graves: incidents.filter((i) => i.gravite === 'grave').length
  }), [incidents]);

  const filtered = useMemo(() =>
    incidents.filter((i) => {
      const q = search.toLowerCase();
      if (search && !(i.type || '').toLowerCase().includes(q)) return false;
      if (filterGravite && i.gravite !== filterGravite) return false;
      if (filterStatut) {
        if (filterStatut === 'en_cours' && (i.statut === 'termine' || i.statut === 'traitee' || i.statut === 'résolu')) return false;
        if (filterStatut === 'traitee' && i.statut !== 'termine' && i.statut !== 'traitee' && i.statut !== 'résolu') return false;
      }
      return true;
    }),
    [search, filterGravite, filterStatut, incidents]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
        <AlertTriangle className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pages.censeur.discipline.title')}</h1>
        <p className="text-sm text-neutral-500">{t('pages.censeur.discipline.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title={t('pages.censeur.discipline.total_incidents')} value={String(incidentStats.total)} icon={AlertTriangle} color="primary" />
        <StatsCard title={t('common.status.in_progress')} value={String(incidentStats.enCours)} icon={Clock} color="amber" />
        <StatsCard title={t('pages.censeur.discipline.traites')} value={String(incidentStats.traitees)} icon={CheckCircle} color="emerald" />
        <StatsCard title={t('pages.censeur.discipline.cas_graves')} value={String(incidentStats.graves)} icon={Scale} color="red" />
      </div>

      {/* Tendances + Alertes */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Tendances */}
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
              <TrendingUp className="h-4 w-4 inline mr-1.5 text-neutral-400" />
              {t('pages.censeur.discipline.tendances_du_mois')}
            </h3>
            {statsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                ))}
              </div>
            ) : !stats ? (
              <p className="text-sm text-neutral-400">{t('pages.censeur.discipline.statistiques_non_disponibles')}</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{t('pages.censeur.discipline.incidents_ce_mois')}</span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">{stats.mois_courant}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{t('pages.censeur.discipline.evolution_vs_mois_dernier')}</span>
                  <span className={cn(
                    'inline-flex items-center gap-1 text-sm font-medium',
                    stats.evolution > 0 ? 'text-red-500' : stats.evolution < 0 ? 'text-emerald-500' : 'text-neutral-500'
                  )}>
                    {stats.evolution > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {stats.evolution > 0 ? '+' : ''}{stats.evolution}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{t('pages.censeur.discipline.total_sanctions')}</span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">{stats.total_sanctions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{t('pages.censeur.discipline.total_absences')}</span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">{stats.total_absences}</span>
                </div>
                {/* Répartition par gravité */}
                {stats.par_gravite && (
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <p className="text-xs text-neutral-500 mb-2">{t('pages.censeur.discipline.repartition_par_gravite')}</p>
                    <div className="flex gap-2">
                      {Object.entries(stats.par_gravite).map(([key, val]) => (
                        <div key={key} className="flex-1 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 p-2 text-center">
                          <p className="text-lg font-bold text-neutral-900 dark:text-white">{val}</p>
                          <p className="text-[10px] text-neutral-500 capitalize">{key}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Alertes */}
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
              <AlertTriangle className="h-4 w-4 inline mr-1.5 text-amber-500" />
              {t('pages.censeur.discipline.alertes_automatiques')}
            </h3>
            {statsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                ))}
              </div>
            ) : !stats?.alertes || stats.alertes.length === 0 ? (
              <div className="py-8 text-center text-sm text-neutral-400">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                <p>{t('pages.censeur.discipline.aucune_alerte_pour_le_moment')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.alertes.map((alerte, i) => {
                  const Icon = ALERT_ICONS[alerte.type] || AlertTriangle;
                  return (
                    <div key={i} className={cn(
                      'flex items-start gap-3 rounded-xl border p-3',
                      ALERT_COLORS[alerte.type] || ALERT_COLORS.warning
                    )}>
                      <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                      <p className="text-sm">{alerte.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder={t('pages.censeur.discipline.rechercher_un_incident')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterGravite}
              onChange={(e) => setFilterGravite(e.target.value)}
              aria-label={t('pages.censeur.discipline.filtrer_par_gravite')}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">{t('pages.censeur.discipline.toutes_les_gravites')}</option>
              <option value="faible">{t('pages.censeur.discipline.faible')}</option>
              <option value="moyenne">{t('common.average')}</option>
              <option value="grave">{t('pages.censeur.discipline.grave')}</option>
            </select>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              aria-label={t('common.filter_by_status')}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">{t('common.all_statuses')}</option>
              <option value="en_cours">{t('common.status.in_progress')}</option>
              <option value="traitee">{t('pages.censeur.discipline.traitee')}</option>
            </select>
            <Button size="sm" icon={<Plus />}>{t('pages.censeur.discipline.nouvel_incident')}</Button>
          </div>
        </div>
      </Card>

      {/* Liste des incidents */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <Scale className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">{t('pages.censeur.discipline.aucun_incident_trouve')}</p>
            </div>
          </Card>
        )}
        {filtered.map((incident) => (
          <Card key={incident.id} hover>
            <div className="flex items-start gap-4">
              <div className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center shrink-0',
                incident.gravite === 'grave' ? 'bg-red-100 dark:bg-red-900/20' :
                incident.gravite === 'moyenne' ? 'bg-amber-100 dark:bg-amber-900/20' :
                'bg-neutral-100 dark:bg-neutral-800'
              )}>
                <AlertTriangle className={cn(
                  'h-6 w-6',
                  incident.gravite === 'grave' ? 'text-red-500' :
                  incident.gravite === 'moyenne' ? 'text-amber-500' :
                  'text-neutral-400'
                )} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">{incident.type}</span>
                  <Badge variant={getGraviteVariant(incident.gravite)} size="sm">{getGraviteLabel(incident.gravite)}</Badge>
                  <Badge variant={incident.statut === 'traitee' || incident.statut === 'termine' || incident.statut === 'résolu' ? 'primary' : 'warning'} size="sm">
                    {incident.statut === 'traitee' || incident.statut === 'termine' || incident.statut === 'résolu' ? t('pages.censeur.discipline.traitee') : t('common.status.in_progress')}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {incident.date ? formatDate(incident.date) : '--'}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm">{t('common.details')}</Button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
