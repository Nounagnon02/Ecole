/**
 * NotesPage — Gestion des notes universitaires
 *
 * Module université : saisie et consultation des notes.
 * Données dynamiques via API /api/universite/notes
 */

import { useState, useMemo } from 'react';
import { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { motion } from 'framer-motion';
import {
  GraduationCap, Search, Plus, Download, Clock, CheckCircle,
  AlertCircle, TrendingUp, Eye, Loader2
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useTranslation } from '@/shared/i18n';

export default function NotesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  // Le chargement passait par un `useState` doublé d'un `useEffect` de
  // premier rendu, sans cache ni déduplication : deux composants montés
  // ensemble lançaient deux requêtes, et un retour sur la page rechargeait
  // tout (cf. audit P4.1). `unwrapList` traverse les trois formes
  // d'enveloppe que renvoient les contrôleurs.
  const requete = useApiQuery(['universite-notes'], '/universite/notes');

  const notes = useMemo(
    () => (unwrapList(requete.data) ?? []).map((n) => ({
          ...n,
          etudiant: n.etudiant?.nom || n.etudiant?.prenom ? `${n.etudiant?.prenom || ''} ${n.etudiant?.nom || ''}`.trim() : n.etudiant_nom || 'Étudiant',
          matricule: n.etudiant?.matricule || n.matricule || '—',
          cours: n.cours?.intitule || n.cours?.nom || n.cours_nom || 'Cours',
          note: n.note || n.valeur || 0,
          sur: n.sur || n.note_sur || 20,
          coefficient: n.coefficient || n.coef || 1,
          semestre: n.semestre || 'S1',
          date: n.date || n.created_at || null,
          statut: n.statut || 'validee'
        })),
    [requete.data],
  );
  const loading = requete.isPending;
  const error = requete.isError ? (requete.error?.message ?? 'Erreur de chargement') : null;

  const getNoteColor = (note, sur) => {
    const pct = (note / sur) * 100;
    if (pct >= 70) return 'text-emerald-600';
    if (pct >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const stats = useMemo(() => {
    const validees = notes.filter((n) => n.statut === 'validee');
    const moyenne = validees.length > 0 ? validees.reduce((s, n) => s + (n.note / n.sur) * 100, 0) / validees.length : 0;
    return {
      total: notes.length,
      validees: validees.length,
      enAttente: notes.filter((n) => n.statut === 'en_attente').length,
      moyenne: moyenne.toFixed(1)
    };
  }, [notes]);

  const filtered = useMemo(() =>
    notes.filter((n) => {
      if (search && !n.etudiant?.toLowerCase().includes(search.toLowerCase()) && !n.cours?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatut && n.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterStatut, notes]
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pages.universite.notes.title')}</h1>
          <p className="text-sm text-neutral-500">{t('pages.universite.notes.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Download />}>{t('common.export')}</Button>
          <Button size="sm" icon={<Plus />}>{t('pages.universite.notes.ajouter_une_note')}</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title={t('pages.universite.notes.total_notes')} value={String(stats.total)} icon={GraduationCap} color="primary" />
        <StatsCard title={t('pages.universite.notes.validees')} value={String(stats.validees)} icon={CheckCircle} color="emerald" />
        <StatsCard title={t('common.status.pending')} value={String(stats.enAttente)} icon={Clock} color="amber" />
        <StatsCard title={t('common.average')} value={`${stats.moyenne}%`} icon={TrendingUp} color="sky" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder={t('pages.universite.notes.rechercher_par_etudiant_ou_cours')}
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
            <option value="validee">{t('pages.universite.notes.validee')}</option>
            <option value="en_attente">{t('common.status.pending')}</option>
          </select>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <th scope="col" className="pb-3 pr-4">{t('pages.universite.notes.etudiant')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.matricule')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.courses')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.grade')}</th>
                <th scope="col" className="pb-3 pr-4">{t('pages.universite.notes.coefficient')}</th>
                <th scope="col" className="pb-3 pr-4">{t('pages.universite.notes.semestre')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.date')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.status_label')}</th>
                <th scope="col" className="pb-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-neutral-500">
                    {t('pages.universite.notes.aucune_note_trouvee')}
                  </td>
                </tr>
              )}
              {filtered.map((n) => (
                <tr key={n.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={n.etudiant} size="sm" />
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{n.etudiant}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">{n.matricule}</td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">{n.cours}</td>
                  <td className="py-3 pr-4">
                    <span className={cn('text-lg font-bold', getNoteColor(n.note, n.sur))}>
                      {n.note}
                    </span>
                    <span className="text-xs text-neutral-400">/{n.sur}</span>
                  </td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">x{n.coefficient}</td>
                  <td className="py-3 pr-4"><Badge variant="outline" size="sm">{n.semestre}</Badge></td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">{n.date ? formatDate(n.date) : '—'}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={n.statut === 'validee' ? 'primary' : 'warning'} size="sm">
                      {n.statut === 'validee' ? 'Validée' : 'En attente'}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="sm" icon={<Eye />} title={t('common.view')} />
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