/**
 * PlanningPage — Planning des événements
 *
 * La secrétaire planifie et suit les événements et rendez-vous.
 * Données dynamiques via API /evenements
 */

import { useState, useMemo } from 'react';
import apiClient, { useApiQuery } from '@/shared/lib/api-client';
import FormDialog from '@/shared/components/ui/FormDialog';
import { unwrapList } from '@/shared/lib/unwrap';
import { motion } from 'framer-motion';
import {
  CalendarDays, Plus, Search, Clock, Users, MapPin, BookOpen,
  CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useTranslation } from '@/shared/i18n';

const TYPE_CONFIG = {
  reunion: { label: 'Réunion', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20' },
  conseil: { label: 'Conseil', color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/20' },
  sortie: { label: 'Sortie', color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20' },
  evenement: { label: 'Événement', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/20' },
  academique: { label: 'Académique', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20' },
  culturel: { label: 'Culturel', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/20' },
  administratif: { label: 'Administratif', color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/20' },
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'reunion': return <Users className="h-4 w-4" />;
    case 'conseil': return <BookOpen className="h-4 w-4" />;
    case 'sortie': return <MapPin className="h-4 w-4" />;
    default: return <CalendarDays className="h-4 w-4" />;
  }
};

export default function PlanningPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  // Le chargement passait par un `useState` doublé d'un `useEffect` de
  // premier rendu, sans cache ni déduplication : deux composants montés
  // ensemble lançaient deux requêtes, et un retour sur la page rechargeait
  // tout (cf. audit P4.1). `unwrapList` traverse les trois formes
  // d'enveloppe que renvoient les contrôleurs.
  // `/evenements` est fermé au secrétariat ; ses propres routes servent le
  // planning sur une période (du mois écoulé aux six prochains).
  const requete = useApiQuery(['planning'], '/secretaire/evenements');
  const [edition, setEdition] = useState(null);
  const champsEvenement = [
    { name: 'titre', label: t('pages.secretaire.planning_edition.titre'), required: true },
    { name: 'type', label: t('pages.secretaire.planning_edition.type'), type: 'select', options: Object.entries(TYPE_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label })) },
    { name: 'date_debut', label: t('pages.secretaire.planning_edition.debut'), type: 'datetime-local', required: true },
    { name: 'date_fin', label: t('pages.secretaire.planning_edition.fin'), type: 'datetime-local' },
    { name: 'lieu', label: t('pages.secretaire.planning_edition.lieu') },
    { name: 'description', label: t('pages.secretaire.planning_edition.description'), type: 'textarea' },
  ];
  const versChamp = (d) => (d ? String(d).replace(' ', 'T').slice(0, 16) : '');
  const enregistrer = async (valeurs) => {
    if (edition?.id) await apiClient.put(`/secretaire/evenements/${edition.id}`, valeurs);
    else await apiClient.post('/secretaire/evenements', valeurs);
    requete.refetch();
  };
  const supprimer = async (evt) => {
    if (!window.confirm(t('pages.secretaire.planning_edition.confirmer_suppression', { titre: evt.titre }))) return;
    await apiClient.delete(`/secretaire/evenements/${evt.id}`);
    requete.refetch();
  };

  const evenements = useMemo(() => unwrapList(requete.data) ?? [], [requete.data]);
  const loading = requete.isPending;
  const error = requete.isError ? (requete.error?.message ?? t('common.load_error')) : null;

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: evenements.length,
      planifies: evenements.filter((e) => e.date_debut && new Date(e.date_debut) >= now).length,
      termines: evenements.filter((e) => e.date_debut && new Date(e.date_debut) < now).length,
      aujourdhui: evenements.filter((e) => {
        if (!e.date_debut) return false;
        const d = new Date(e.date_debut);
        return d.toDateString() === now.toDateString();
      }).length,
    };
  }, [evenements]);

  const filtered = useMemo(() =>
    evenements.filter((e) => {
      const q = search.toLowerCase();
      if (search && !(e.titre || '').toLowerCase().includes(q)) return false;
      if (filterType && e.type !== filterType) return false;
      return true;
    }),
    [search, filterType, evenements]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--text-secondary)]">
        <AlertCircle className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const now = new Date();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] ">{t('pages.secretaire.planning.title')}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{t('pages.secretaire.planning.subtitle')}</p>
        </div>
        <Button size="sm" icon={<Plus />} onClick={() => setEdition({})}>{t('pages.secretaire.planning.nouvel_evenement')}</Button>
      </div>
      <FormDialog
        open={edition !== null}
        title={edition?.id ? t('pages.secretaire.planning_edition.modifier') : t('pages.secretaire.planning.nouvel_evenement')}
        fields={champsEvenement}
        initial={edition?.id ? { ...edition, date_debut: versChamp(edition.date_debut), date_fin: versChamp(edition.date_fin) } : { type: 'evenement' }}
        onSubmit={enregistrer}
        onClose={() => setEdition(null)}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title={t('common.total')} value={String(stats.total)} icon={CalendarDays} color="primary" />
        <StatsCard title={t('pages.secretaire.planning.planifies')} value={String(stats.planifies)} icon={Clock} color="sky" />
        <StatsCard title={t('common.finished')} value={String(stats.termines)} icon={CheckCircle} color="emerald" />
        <StatsCard title={t('common.today')} value={String(stats.aujourdhui)} icon={AlertCircle} color="amber" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <Input
              placeholder={t('pages.secretaire.planning.rechercher_un_evenement')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setFilterType(filterType === key ? '' : key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filterType === key
                    ? 'bg-[var(--primary-subtle)] text-[var(--accent)] dark:text-[var(--accent)]'
                    : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]   '
                )}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-[var(--text-secondary)]">
              <CalendarDays className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">{t('pages.secretaire.planning.aucun_evenement_trouve')}</p>
            </div>
          </Card>
        )}
        {filtered
          .sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut))
          .map((evt) => {
            const dateObj = evt.date_debut ? new Date(evt.date_debut) : new Date();
            const estFutur = dateObj >= now;
            const typeCfg = TYPE_CONFIG[evt.type] || TYPE_CONFIG.evenement;
            return (
              <Card key={evt.id} hover>
                <div className="flex items-start gap-4">
                  {/* Date badge */}
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-[var(--surface-subtle)]  shrink-0">
                    <span className="text-lg font-bold text-[var(--text-primary)]  leading-none">
                      {dateObj.getDate()}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] uppercase mt-0.5">
                      {dateObj.toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--text-primary)] ">{evt.titre}</span>
                      <Badge variant={estFutur ? 'warning' : 'primary'} size="sm">
                        {estFutur ? t('pages.secretaire.planning.planifie') : t('pages.secretaire.planning.termine')}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                      <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded', typeCfg.color)}>
                        {getTypeIcon(evt.type)}
                        {typeCfg.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(evt.date_debut)}
                        {evt.date_fin && ` — ${formatDate(evt.date_fin)}`}
                      </span>
                      {evt.lieu && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {evt.lieu}
                        </span>
                      )}
                    </div>
                    {evt.description && (
                      <p className="mt-1 text-xs text-[var(--text-tertiary)] italic">{evt.description}</p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => setEdition(evt)}>{t('common.edit')}</Button>
                    <Button variant="ghost" size="sm" onClick={() => supprimer(evt)}>{t('common.delete')}</Button>
                  </div>
                </div>
              </Card>
            );
          })}
      </div>
    </motion.div>
  );
}
