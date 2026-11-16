/**
 * EtudiantsPage — Gestion des étudiants universitaires
 *
 * Module université : inscriptions et profils étudiants.
 * Données dynamiques via API /api/universite/etudiants
 */

import { useState, useMemo } from 'react';
import { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { motion } from 'framer-motion';
import {
  GraduationCap, Plus, Search, Mail, User, BookOpen,
  Eye, Loader2, AlertCircle,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useTranslation } from '@/shared/i18n';

export default function EtudiantsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');

  // Le chargement passait par un `useState` doublé d'un `useEffect` de
  // premier rendu, sans cache ni déduplication : deux composants montés
  // ensemble lançaient deux requêtes, et un retour sur la page rechargeait
  // tout (cf. audit P4.1). `unwrapList` traverse les trois formes
  // d'enveloppe que renvoient les contrôleurs.
  const requete = useApiQuery(['universite-etudiants'], '/universite/etudiants');

  const etudiants = useMemo(
    () => (unwrapList(requete.data) ?? []).map((e) => ({
          ...e,
          matricule: e.matricule || e.ine || '—',
          niveau: e.niveau || e.annee || '—',
          filiere: e.filiere?.nom || e.filiere_nom || e.filiere || '—',
          faculte: e.faculte?.sigle || e.faculte_sigle || e.faculte?.nom || '—',
          dateInscription: e.date_inscription || e.created_at || null,
          statut: e.statut || 'actif',
        })),
    [requete.data],
  );
  const loading = requete.isPending;
  const error = requete.isError ? (requete.error?.message ?? t('common.load_error')) : null;

  const niveaux = useMemo(() =>
    ['Tous', ...new Set(etudiants.map((e) => e.niveau).filter(Boolean))],
    [etudiants]
  );

  const stats = useMemo(() => ({
    total: etudiants.length,
    actifs: etudiants.filter((e) => e.statut === 'actif').length,
    suspendus: etudiants.filter((e) => e.statut === 'suspendu' || e.statut === 'inactif').length,
    niveaux: new Set(etudiants.map((e) => e.niveau)).size,
  }), [etudiants]);

  const filtered = useMemo(() =>
    etudiants.filter((e) => {
      if (search && !e.nom?.toLowerCase().includes(search.toLowerCase()) && !e.matricule?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterNiveau && e.niveau !== filterNiveau) return false;
      return true;
    }),
    [search, filterNiveau, etudiants]
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pages.universite.etudiants.title')}</h1>
          <p className="text-sm text-neutral-500">{t('pages.universite.etudiants.subtitle')}</p>
        </div>
        <Button size="sm" icon={<Plus />}>{t('pages.universite.etudiants.ajouter_un_etudiant')}</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title={t('common.total')} value={String(stats.total)} icon={GraduationCap} color="primary" />
        <StatsCard title={t('pages.universite.etudiants.actifs')} value={String(stats.actifs)} icon={User} color="emerald" />
        <StatsCard title={t('pages.universite.etudiants.suspendus')} value={String(stats.suspendus)} icon={User} color="red" />
        <StatsCard title={t('pages.universite.etudiants.niveaux')} value={String(stats.niveaux)} icon={BookOpen} color="sky" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder={t('pages.universite.etudiants.rechercher_un_etudiant')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {niveaux.map((n) => (
              <button
                key={n}
                onClick={() => setFilterNiveau(n === 'Tous' ? '' : n)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filterNiveau === (n === 'Tous' ? '' : n)
                    ? 'bg-[var(--primary-subtle)] text-[var(--accent)] dark:text-[var(--accent)]'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tableau */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <th scope="col" className="pb-3 pr-4">{t('pages.universite.etudiants.etudiant')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.matricule')}</th>
                <th scope="col" className="pb-3 pr-4">{t('pages.universite.etudiants.niveau')}</th>
                <th scope="col" className="pb-3 pr-4">{t('pages.universite.etudiants.filiere')}</th>
                <th scope="col" className="pb-3 pr-4">{t('pages.universite.etudiants.faculte')}</th>
                <th scope="col" className="pb-3 pr-4">{t('pages.universite.etudiants.contact')}</th>
                <th scope="col" className="pb-3 pr-4">{t('pages.universite.etudiants.inscription')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.status_label')}</th>
                <th scope="col" className="pb-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-neutral-500">
                    {t('pages.universite.etudiants.aucun_etudiant_trouve')}
                  </td>
                </tr>
              )}
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[var(--primary-subtle)] flex items-center justify-center text-xs font-bold text-[var(--accent)]">
                        {e.nom?.charAt(0) || '?'}
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{e.nom}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">{e.matricule}</td>
                  <td className="py-3 pr-4"><Badge variant="outline" size="sm">{e.niveau}</Badge></td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">{e.filiere}</td>
                  <td className="py-3 pr-4"><Badge variant="primary" size="sm">{e.faculte}</Badge></td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-col text-xs text-neutral-500">
                      {e.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {e.email}</span>}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {e.dateInscription ? new Date(e.dateInscription).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={e.statut === 'actif' ? 'primary' : 'danger'} size="sm">
                      {e.statut === 'actif' ? t('common.status.active') : t('common.status.suspended')}
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
