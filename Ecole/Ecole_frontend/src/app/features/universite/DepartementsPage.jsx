/**
 * DepartementsPage — Gestion des départements universitaires
 *
 * Module université : départements rattachés aux facultés.
 * Données dynamiques via API /api/universite/departements
 */

import { useState, useMemo } from 'react';
import { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { motion } from 'framer-motion';
import {
  BookOpen, Plus, Search, Users,   User, GraduationCap, Mail, Phone, Loader2, AlertCircle
} from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useTranslation } from '@/shared/i18n';

export default function DepartementsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterFaculte, setFilterFaculte] = useState('');

  // Le chargement passait par un `useState` doublé d'un `useEffect` de
  // premier rendu, sans cache ni déduplication : deux composants montés
  // ensemble lançaient deux requêtes, et un retour sur la page rechargeait
  // tout (cf. audit P4.1). `unwrapList` traverse les trois formes
  // d'enveloppe que renvoient les contrôleurs.
  const requete = useApiQuery(['universite-departements'], '/universite/departements');

  const departements = useMemo(
    () => (unwrapList(requete.data) ?? []).map((d) => ({
          ...d,
          chef: d.chef || d.responsable || '—',
          code: d.code || d.sigle || '—',
          enseignants: d.enseignants_count ?? d.enseignants ?? 0,
          etudiants: d.etudiants_count ?? d.etudiants ?? 0,
          cours: d.cours_count ?? d.cours ?? 0,
          faculte_nom: d.faculte?.nom || d.faculte_nom || '—'
        })),
    [requete.data],
  );
  const loading = requete.isPending;
  const error = requete.isError ? (requete.error?.message ?? t('common.load_error')) : null;

  const facultes = useMemo(() =>
    [...new Set(departements.map((d) => d.faculte_nom).filter(Boolean))],
    [departements]
  );

  const stats = useMemo(() => ({
    total: departements.length,
    enseignants: departements.reduce((s, d) => s + Number(d.enseignants), 0),
    etudiants: departements.reduce((s, d) => s + Number(d.etudiants), 0)
  }), [departements]);

  const filtered = useMemo(() =>
    departements.filter((d) => {
      if (search && !d.nom?.toLowerCase().includes(search.toLowerCase()) && !d.code?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterFaculte && d.faculte_nom !== filterFaculte) return false;
      return true;
    }),
    [search, filterFaculte, departements]
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pages.universite.departements.title')}</h1>
          <p className="text-sm text-neutral-500">{t('pages.universite.departements.subtitle')}</p>
        </div>
        <Button size="sm" icon={<Plus />}>{t('pages.universite.departements.nouveau_departement')}</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title={t('pages.universite.departements.departements')} value={String(stats.total)} icon={BookOpen} color="primary" />
        <StatsCard title={t('common.teachers')} value={String(stats.enseignants)} icon={Users} color="emerald" />
        <StatsCard title={t('common.students')} value={String(stats.etudiants)} icon={GraduationCap} color="amber" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder={t('pages.universite.departements.rechercher_un_departement')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterFaculte}
            onChange={(e) => setFilterFaculte(e.target.value)}
            aria-label={t('pages.universite.departements.filtrer_par_faculte')}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">{t('pages.universite.departements.toutes_facultes')}</option>
            {facultes.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <BookOpen className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">{t('pages.universite.departements.aucun_departement_trouve')}</p>
            </div>
          </Card>
        )}
        {filtered.map((d) => (
          <Card key={d.id} hover>
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-sky-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">{d.nom}</span>
                  <Badge variant="primary" size="sm">{d.code}</Badge>
                  <Badge variant="outline" size="sm">{d.faculte_nom}</Badge>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" /> Chef : {d.chef}</span>
                </div>
                <div className="mt-2 flex gap-3 text-xs">
                  <span className="text-neutral-600 dark:text-neutral-400"><strong>{d.enseignants}</strong> enseignants</span>
                  <span className="text-neutral-600 dark:text-neutral-400"><strong>{d.etudiants}</strong> étudiants</span>
                  <span className="text-neutral-600 dark:text-neutral-400"><strong>{d.cours}</strong> cours</span>
                </div>
                {(d.email || d.telephone) && (
                  <div className="mt-2 space-y-1 text-xs text-neutral-500">
                    {d.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {d.email}</span>}
                    {d.telephone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {d.telephone}</span>}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm">{t('pages.universite.departements.gerer')}</Button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
