/**
 * PresencesPage — Gestion des présences
 *
 * Le surveillant enregistre et consulte les présences des élèves.
 * Données dynamiques via API /surveillant/absences
 */

import { useState, useMemo } from 'react';
import { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { motion } from 'framer-motion';
import {
  Users, Clock, CheckCircle, XCircle,
  Search, Download, Loader2
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useTranslation } from '@/shared/i18n';

export default function PresencesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const today = new Date();

  // Deux requêtes indépendantes remplacent le `Promise.allSettled` derrière un
  // `useApi()` à l'état partagé : chacune porte son erreur, et le roster
  // d'élèves reste en cache entre les visites (cf. audit P4.1).
  const requeteAbsences = useApiQuery(['surveillant-absences'], '/surveillant/absences');
  const requeteEleves = useApiQuery(['eleves'], '/eleves');

  const loading = requeteAbsences.isPending;
  const error = requeteAbsences.isError
    ? (requeteAbsences.error?.message ?? t('common.load_error'))
    : null;

  // La liste de présence est dérivée, pas stockée : les absences du jour
  // reportées sur le roster. Sans roster, on retombe sur les seules absences.
  const presences = useMemo(() => {
    const absences = unwrapList(requeteAbsences.data) ?? [];
    const elevesList = unwrapList(requeteEleves.data) ?? [];

    const todayAbsences = absences.filter((a) => {
      if (!a.date) return false;
      return new Date(a.date).toDateString() === today.toDateString();
    });

    const absenceMap = new Map();
    todayAbsences.forEach((a) => {
      absenceMap.set(a.eleve_id || a.eleve?.id, a);
    });

    if (elevesList.length > 0) {
      return elevesList.map((e) => {
        const abs = absenceMap.get(e.id);
        return {
          id: e.id,
          nom: `${e.prenom || ''} ${e.nom || ''}`.trim(),
          classe: e.classe?.nom_classe || e.classe_id || '—',
          statut: abs ? (abs.type === 'retard' ? 'retard' : 'absent') : 'present',
          heureArrivee: '—',
          motif: abs?.motif || '',
        };
      });
    }

    return absences.map((a) => ({
      id: a.id,
      nom: `${a.eleve?.prenom || ''} ${a.eleve?.nom || ''}`.trim() || t('common.student'),
      classe: a.eleve?.classe?.nom_classe || '—',
      statut: a.type === 'retard' ? 'retard' : 'absent',
      heureArrivee: '—',
      motif: a.motif || '',
    }));
  }, [requeteAbsences.data, requeteEleves.data, t]);

  const stats = useMemo(() => ({
    total: presences.length,
    presents: presences.filter((p) => p.statut === 'present').length,
    retards: presences.filter((p) => p.statut === 'retard').length,
    absents: presences.filter((p) => p.statut === 'absent').length
  }), [presences]);

  const classesList = useMemo(() => {
    const set = new Set(presences.map((p) => p.classe).filter(Boolean));
    return Array.from(set);
  }, [presences]);

  const filtered = useMemo(() =>
    presences.filter((p) => {
      const q = search.toLowerCase();
      if (search && !p.nom.toLowerCase().includes(q)) return false;
      if (filterClasse && p.classe !== filterClasse) return false;
      if (filterStatut && p.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterClasse, filterStatut, presences]
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
        <XCircle className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'present': return <CheckCircle className="h-4 w-4" />;
      case 'retard': return <Clock className="h-4 w-4" />;
      case 'absent': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatutClass = (statut) => {
    switch (statut) {
      case 'present': return 'text-emerald-600';
      case 'retard': return 'text-amber-600';
      case 'absent': return 'text-red-600';
      default: return '';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pages.surveillant.presences.title')}</h1>
          <p className="text-sm text-neutral-500">{t('pages.surveillant.presences.subtitle', { date: formatDate(today) })}</p>
        </div>
        <Button variant="outline" size="sm" icon={<Download />}>{t('common.export')}</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title={t('common.total')} value={String(stats.total)} icon={Users} color="primary" />
        <StatsCard title={t('pages.surveillant.presences.presents')} value={String(stats.presents)} icon={CheckCircle} color="emerald" />
        <StatsCard title={t('pages.surveillant.presences.retards')} value={String(stats.retards)} icon={Clock} color="amber" />
        <StatsCard title={t('pages.surveillant.presences.absents')} value={String(stats.absents)} icon={XCircle} color="red" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder={t('common.search_student')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterClasse}
            onChange={(e) => setFilterClasse(e.target.value)}
            aria-label={t('common.filter_by_class')}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">{t('common.all_classes')}</option>
            {classesList.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            aria-label={t('common.filter_by_status')}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">{t('common.all_statuses')}</option>
            <option value="present">{t('pages.surveillant.presences.present')}</option>
            <option value="retard">{t('common.late')}</option>
            <option value="absent">{t('pages.surveillant.presences.absent')}</option>
          </select>
        </div>
      </Card>

      {/* Tableau */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <th scope="col" className="pb-3 pr-4">{t('common.student')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.class')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.status_label')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.time')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.reason')}</th>
                <th scope="col" className="pb-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-neutral-500">
                    {t('pages.surveillant.presences.aucune_presence_trouvee')}
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.nom} size="sm" />
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{p.nom}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant="outline" size="sm">{p.classe}</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={cn('inline-flex items-center gap-1 text-sm font-medium', getStatutClass(p.statut))}>
                      {getStatutIcon(p.statut)}
                      <span className="capitalize">{p.statut === 'retard' ? t('common.late') : p.statut}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{p.heureArrivee || '—'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-500 italic">{p.motif || '—'}</span>
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="sm">{t('common.edit')}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
