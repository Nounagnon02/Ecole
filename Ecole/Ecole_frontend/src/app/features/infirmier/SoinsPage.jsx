/**
 * SoinsPage — Gestion des soins infirmiers
 *
 * L'infirmier enregistre et suit les soins dispensés aux élèves.
 * Données dynamiques via API /infirmier/consultations
 */

import { useState, useMemo } from 'react';
import { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { motion } from 'framer-motion';
import {
  Heart, Plus, Search, Clock, AlertTriangle, CheckCircle,
  Pill, Activity, Loader2, AlertCircle
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useTranslation } from '@/shared/i18n';

const getTypeIcon = (urgence) => {
  if (urgence) return <Activity className="h-4 w-4" />;
  return <Pill className="h-4 w-4" />;
};

const getTypeColor = (urgence) => {
  if (urgence) return 'text-red-500 bg-red-100 dark:bg-red-900/20';
  return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20';
};

const getTypeLabel = (urgence) => urgence ? 'Urgence' : 'Consultation';

export default function SoinsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterUrgence, setFilterUrgence] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  // Le chargement passait par un `useState` doublé d'un `useEffect` de
  // premier rendu, sans cache ni déduplication : deux composants montés
  // ensemble lançaient deux requêtes, et un retour sur la page rechargeait
  // tout (cf. audit P4.1). `unwrapList` traverse les trois formes
  // d'enveloppe que renvoient les contrôleurs.
  const requete = useApiQuery(['infirmier-consultations'], '/infirmier/consultations');

  const soins = useMemo(() => unwrapList(requete.data) ?? [], [requete.data]);
  const loading = requete.isPending;
  const error = requete.isError ? (requete.error?.message ?? 'Erreur de chargement') : null;

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: soins.length,
      aujourdhui: soins.filter((s) => s.date && new Date(s.date).toDateString() === today).length,
      urgences: soins.filter((s) => s.urgence).length,
      traites: soins.filter((s) => s.traitement).length
    };
  }, [soins]);

  const filtered = useMemo(() =>
    soins.filter((s) => {
      const q = search.toLowerCase();
      if (search) {
        const nom = `${s.eleve?.prenom || ''} ${s.eleve?.nom || ''}`;
        if (!nom.toLowerCase().includes(q) && !(s.motif || '').toLowerCase().includes(q)) return false;
      }
      if (filterUrgence === 'urgence' && !s.urgence) return false;
      if (filterUrgence === 'consultation' && s.urgence) return false;
      if (filterStatut === 'traite' && !s.traitement) return false;
      if (filterStatut === 'en_cours' && s.traitement) return false;
      return true;
    }),
    [search, filterUrgence, filterStatut, soins]
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
        <AlertCircle className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pages.infirmier.soins.title')}</h1>
          <p className="text-sm text-neutral-500">{t('pages.infirmier.soins.subtitle')}</p>
        </div>
        <Button size="sm" icon={<Plus />}>{t('pages.infirmier.soins.nouveau_soin')}</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title={t('pages.infirmier.soins.total_soins')} value={String(stats.total)} icon={Heart} color="primary" />
        <StatsCard title={t('common.today')} value={String(stats.aujourdhui)} icon={Clock} color="amber" />
        <StatsCard title={t('pages.infirmier.soins.urgences')} value={String(stats.urgences)} icon={AlertTriangle} color="red" />
        <StatsCard title={t('pages.infirmier.soins.traites')} value={String(stats.traites)} icon={CheckCircle} color="emerald" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder={t('common.search_student')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterUrgence}
              onChange={(e) => setFilterUrgence(e.target.value)}
              aria-label={t('pages.infirmier.soins.filtrer_par_type_d_urgence')}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">{t('common.all_types')}</option>
              <option value="urgence">{t('pages.infirmier.soins.urgence')}</option>
              <option value="consultation">{t('pages.infirmier.soins.consultation')}</option>
            </select>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              aria-label={t('common.filter_by_status')}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">{t('common.all_statuses')}</option>
              <option value="traite">{t('pages.infirmier.soins.traite')}</option>
              <option value="en_cours">{t('common.status.in_progress')}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <Heart className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">{t('pages.infirmier.soins.aucun_soin_trouve')}</p>
            </div>
          </Card>
        )}
        {filtered.map((soin) => (
          <Card key={soin.id} hover>
            <div className="flex items-start gap-4">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', getTypeColor(soin.urgence))}>
                {getTypeIcon(soin.urgence)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">{soin.motif || 'Consultation'}</span>
                  <Badge variant={soin.traitement ? 'primary' : 'warning'} size="sm">
                    {soin.traitement ? 'Traité' : 'En cours'}
                  </Badge>
                  <Badge variant={soin.urgence ? 'danger' : 'outline'} size="sm">
                    {getTypeLabel(soin.urgence)}
                  </Badge>
                </div>
                {soin.diagnostic && (
                  <p className="text-xs text-neutral-500 mt-1 italic">{soin.diagnostic}</p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Avatar name={`${soin.eleve?.prenom || ''} ${soin.eleve?.nom || ''}`} size="xs" />
                    {soin.eleve?.prenom} {soin.eleve?.nom} · {soin.eleve?.classe?.nom_classe || '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {soin.date ? formatDate(soin.date) : '—'}
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
