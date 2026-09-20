/**
 * TachesPage — Gestion des tâches et assignments
 *
 * Module université : suivi des tâches, devoirs et projets.
 * Données dynamiques via API /api/universite/taches
 */

import { useState, useMemo } from 'react';
import { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { motion } from 'framer-motion';
import {
  CheckSquare, Plus, Search, Clock, AlertCircle, CheckCircle,
  Calendar, Users, FileText, Paperclip, Loader2,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useTranslation } from '@/shared/i18n';

const PRIORITE_CONFIG = {
  haute: { variant: 'danger', label: 'Haute' },
  moyenne: { variant: 'warning', label: 'Moyenne' },
  basse: { variant: 'outline', label: 'Basse' },
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'devoir': return <FileText className="h-4 w-4" />;
    case 'projet': return <Users className="h-4 w-4" />;
    case 'examen': return <AlertCircle className="h-4 w-4" />;
    case 'exercice': return <Paperclip className="h-4 w-4" />;
    case 'rapport': return <FileText className="h-4 w-4" />;
    default: return <CheckSquare className="h-4 w-4" />;
  }
};

export default function TachesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  // GET /api/universite/devoirs — la ressource s'appelle « devoirs » côté
  // serveur (parité avec le `Devoir` scolaire) ; cette page en est la vue
  // « tâches ». Un enseignant y reçoit les devoirs des matières qu'il
  // assure, un étudiant ceux publiés pour sa filière.
  // Le chargement passait par un `useState` doublé d'un `useEffect` de
  // premier rendu, sans cache ni déduplication : deux composants montés
  // ensemble lançaient deux requêtes, et un retour sur la page rechargeait
  // tout (cf. audit P4.1). `unwrapList` traverse les trois formes
  // d'enveloppe que renvoient les contrôleurs.
  const requete = useApiQuery(['universite-devoirs'], '/universite/devoirs');

  const taches = useMemo(
    () => (unwrapList(requete.data) ?? []).map((item) => ({
          ...item,
          titre: item.titre || item.intitule || t('pages.universite.taches.tache'),
          cours: item.cours?.intitule || item.cours?.nom || item.cours_nom || t('common.courses'),
          type: item.type || 'devoir',
          dateLimite: item.date_limite || item.dateLimite || item.date_fin || null,
          priorite: item.priorite || 'moyenne',
          statut: item.statut || 'en_cours',
          soumissions: item.soumissions || item.soumissions_count || 0,
          totalEtudiants: item.total_etudiants || item.etudiants_count || item.totalEtudiants || 0,
        })),
    [requete.data, t],
  );
  const loading = requete.isPending;
  const error = requete.isError ? (requete.error?.message ?? t('common.load_error')) : null;

  const stats = useMemo(() => ({
    total: taches.length,
    enCours: taches.filter((t) => t.statut === 'en_cours').length,
    termines: taches.filter((t) => t.statut === 'termine' || t.statut === 'terminé').length,
    urgentes: taches.filter((t) => t.priorite === 'haute' && (t.statut === 'en_cours' || t.statut === 'a_faire')).length,
  }), [taches]);

  const filtered = useMemo(() =>
    taches.filter((t) => {
      if (search && !t.titre?.toLowerCase().includes(search.toLowerCase()) && !t.cours?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatut && t.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterStatut, taches]
  );

  const daysUntilDeadline = (date) => {
    if (!date) return '—';
    const diff = Math.ceil((new Date(date) - new Date()) / 86400000);
    if (diff < 0) return t('pages.universite.taches.depassee');
    if (diff === 0) return t('pages.universite.taches.aujourdhui');
    if (diff === 1) return t('pages.universite.taches.demain');
    return t('pages.universite.taches.dans_x_jours', { n: diff });
  };

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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pages.universite.taches.title')}</h1>
          <p className="text-sm text-neutral-500">{t('pages.universite.taches.subtitle')}</p>
        </div>
        <Button size="sm" icon={<Plus />}>{t('pages.universite.taches.nouvelle_tache')}</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title={t('common.total')} value={String(stats.total)} icon={CheckSquare} color="primary" />
        <StatsCard title={t('common.status.in_progress')} value={String(stats.enCours)} icon={Clock} color="amber" />
        <StatsCard title={t('pages.universite.taches.terminees')} value={String(stats.termines)} icon={CheckCircle} color="emerald" />
        <StatsCard title={t('pages.universite.taches.urgentes')} value={String(stats.urgentes)} icon={AlertCircle} color="red" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder={t('pages.universite.taches.rechercher_une_tache')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            aria-label={t('common.filter_by_status')}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">{t('common.all_statuses')}</option>
            <option value="en_cours">{t('common.status.in_progress')}</option>
            <option value="termine">{t('pages.universite.taches.termine')}</option>
            {/* `a_faire` sans accent : la valeur est comparée telle quelle au
                `statut` renvoyé par le serveur, qui stocke la forme ASCII.
                Avec `à_faire` le filtre ne correspondait jamais. */}
            <option value="a_faire">{t('pages.universite.taches.a_faire')}</option>
          </select>
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <CheckSquare className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">{t('pages.universite.taches.aucune_tache_trouvee')}</p>
            </div>
          </Card>
        )}
        {filtered.map((tache) => {
          const isOverdue = tache.dateLimite && new Date(tache.dateLimite) < new Date() && tache.statut !== 'termine';
          return (
            <Card key={tache.id} hover>
              <div className="flex items-start gap-4">
                <div className={cn(
                  'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                  tache.statut === 'termine' ? 'bg-emerald-100 dark:bg-emerald-900/20' :
                  isOverdue ? 'bg-red-100 dark:bg-red-900/20' :
                  'bg-amber-100 dark:bg-amber-900/20'
                )}>
                  {tache.statut === 'termine'
                    ? <CheckCircle className="h-5 w-5 text-emerald-500" />
                    : getTypeIcon(tache.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">{tache.titre}</span>
                    <Badge variant={tache.statut === 'termine' ? 'primary' : 'warning'} size="sm">
                      {tache.statut === 'termine' ? t('pages.universite.taches.terminee') : t('common.status.in_progress')}
                    </Badge>
                    <Badge variant={PRIORITE_CONFIG[tache.priorite]?.variant || 'outline'} size="sm">
                      {PRIORITE_CONFIG[tache.priorite]?.label || tache.priorite}
                    </Badge>
                    <Badge variant="outline" size="sm" className="capitalize">{tache.type}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {tache.cours}</span>
                    <span className={cn(
                      'flex items-center gap-1',
                      isOverdue ? 'text-red-600 font-medium' : ''
                    )}>
                      <Calendar className="h-3 w-3" />
                      {daysUntilDeadline(tache.dateLimite)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {tache.soumissions}/{tache.totalEtudiants} soumissions
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">{t('common.manage')}</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}