/**
 * CoursPage — Mes cours pour les élèves
 *
 * L'élève consulte ses cours, devoirs et ressources pédagogiques.
 * Données : cahier de textes (/eleves/me/cours) et devoirs (/devoirs/eleve).
 */

import { useState, useMemo } from 'react';
import { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { motion } from 'framer-motion';
import {
  BookOpen, FileText, Clock, Download,
  Play, Search, Calendar,
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Input from '@/shared/components/ui/Input';
import { useTranslation } from '@/shared/i18n';

const COURTE = { day: '2-digit', month: '2-digit', year: 'numeric' };

export default function CoursPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterMatiere, setFilterMatiere] = useState('');
  const [filterType, setFilterType] = useState('');

  // Le chargement passait par un `useState` doublé d'un `useEffect` de
  // premier rendu, sans cache ni déduplication : deux composants montés
  // ensemble lançaient deux requêtes, et un retour sur la page rechargeait
  // tout (cf. audit P4.1). `unwrapList` traverse les trois formes
  // d'enveloppe que renvoient les contrôleurs.
  const requete = useApiQuery(['eleves-me-cours'], '/eleves/me/cours');
  // Devoirs publiés pour la classe : la page les annonçait mais ne lisait que
  // le cahier de textes, si bien que l'élève ne voyait jamais ses devoirs sur
  // le web, alors que son parent les recevait sur le téléphone (16/11/2026).
  const devoirsRequete = useApiQuery(['devoirs-eleve'], '/devoirs/eleve');

  const cours = useMemo(
    () => [
      ...(unwrapList(devoirsRequete.data) ?? []).map((d) => ({
        id: `devoir-${d.id}`,
        type: 'devoir',
        titre: d.titre,
        resume: d.description || '',
        matiere: d.matiere,
        echeance: d.date_limite,
        status: d.rendu ? 'rendu' : 'a_rendre',
        note: d.note,
        ressources: [],
      })),
      ...(unwrapList(requete.data) ?? []).map(c => ({
          ...c,
          type: c.type || 'cours',
          status: c.status || c.statut || 'prevue',
          resume: c.resume || c.description || '',
          ressources: c.ressources || c.documents || []
        })),
    ],
    [requete.data, devoirsRequete.data],
  );
  const loading = requete.isPending || devoirsRequete.isPending;
  const enErreur = requete.isError ? requete : devoirsRequete.isError ? devoirsRequete : null;
  const error = enErreur ? (enErreur.error?.message ?? t('common.load_error')) : null;

  const matieres = useMemo(() => [...new Set(cours.map((c) => c.matiere?.nom || c.matiere).filter(Boolean))], [cours]);

  const filtered = useMemo(() =>
    cours.filter((c) => {
      const cherche = search.toLowerCase();
      const titre = String(c.chapitre || c.intitule || c.titre || '').toLowerCase();
      if (search && !titre.includes(cherche) && !(c.matiere?.nom || c.matiere || '').toLowerCase().includes(cherche)) return false;
      if (filterMatiere && (c.matiere?.nom || c.matiere) !== filterMatiere) return false;
      if (filterType && c.type !== filterType) return false;
      return true;
    }),
    [search, filterMatiere, filterType, cours]
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'termine':
      case 'terminé': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'prevue':
      case 'a_venir': return <Calendar className="h-4 w-4 text-[var(--accent)]" />;
      case 'rendu': return <FileText className="h-4 w-4 text-sky-500" />;
      case 'a_rendre':
      case 'en_retard': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default: return null;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'termine':
      case 'terminé': return t('pages.bibliothecaire.emprunts.termine');
      case 'prevue':
      case 'a_venir': return t('pages.eleve.cours.a_venir');
      case 'rendu': return t('pages.eleve.cours.rendu');
      case 'a_rendre':
      case 'en_retard': return t('pages.eleve.cours.a_rendre');
      default: return status;
    }
  };

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] ">{t('pages.eleve.cours.title')}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{t('pages.eleve.cours.subtitle')}</p>
      </div>

      {/* Filtres */}
      <Card padding>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <Input
              placeholder={t('common.search_course')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterMatiere}
            onChange={(e) => setFilterMatiere(e.target.value)}
            aria-label={t('common.filter_by_subject')}
            className="h-10 rounded-xl border border-[var(--border-heavy)] bg-[var(--surface-raised)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40   "
          >
            <option value="">{t('pages.eleve.cours.toutes_les_matieres')}</option>
            {matieres.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label={t('pages.eleve.cours.filtrer_par_type')}
            className="h-10 rounded-xl border border-[var(--border-heavy)] bg-[var(--surface-raised)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40   "
          >
            <option value="">{t('common.all_types')}</option>
            <option value="cours">{t('common.courses')}</option>
            <option value="devoir">{t('pages.eleve.cours.devoir')}</option>
            <option value="tp">TP</option>
          </select>
        </div>
      </Card>

      {/* Liste des cours */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card padding>
            <div className="text-center py-8 text-[var(--text-secondary)]">
              <BookOpen className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">{t('common.no_course_found')}</p>
            </div>
          </Card>
        )}
        {filtered.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card padding hover>
              <div className="flex items-start gap-4">
                {/* Icône matière */}
                <div className={cn(
                  'h-12 w-12 rounded-xl flex items-center justify-center shrink-0',
                  c.type === 'cours' ? 'bg-[var(--primary-subtle)] bg-[var(--primary-subtle)]' :
                  c.type === 'devoir' ? 'bg-amber-100 dark:bg-amber-900/20' :
                  'bg-emerald-100 dark:bg-emerald-900/20'
                )}>
                  {c.type === 'cours' ? <BookOpen className="h-6 w-6 text-[var(--accent)]" /> :
                   c.type === 'devoir' ? <FileText className="h-6 w-6 text-amber-500" /> :
                   <Play className="h-6 w-6 text-emerald-500" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.matiere?.nom || (typeof c.matiere === 'string' && c.matiere) ? (
                      <Badge variant="primary" size="sm">{c.matiere?.nom || c.matiere}</Badge>
                    ) : null}
                    <span className="text-xs text-[var(--text-secondary)] capitalize">
                      {c.type === 'tp' ? 'TP' : c.type}
                    </span>
                    {c.duree ? (
                      <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                        <Clock className="h-3 w-3" />
                        {c.duree}
                      </div>
                    ) : null}
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)] ">
                    {c.chapitre || c.intitule || c.titre || t('common.courses')}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{c.resume}</p>

                  <div className="mt-3 flex items-center gap-4">
                    <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {c.type === 'devoir'
                        ? (c.echeance
                          ? t('pages.eleve.cours.a_rendre_le', { date: formatDate(c.echeance, COURTE) })
                          : t('pages.eleve.cours.sans_date_limite'))
                        : c.date ? t('pages.eleve.cours.le', { date: formatDate(c.date, COURTE) }) : null}
                    </span>
                    {c.prof || c.enseignant ? (
                      <span className="text-xs text-[var(--text-secondary)]">{c.prof || c.enseignant}</span>
                    ) : null}
                  </div>

                  {/* Ressources */}
                  {c.ressources?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {c.ressources.map((r) => (
                        <button key={r} className="inline-flex items-center gap-1 rounded-lg bg-[var(--surface-subtle)]  px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]  hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] dark:hover:text-[var(--accent)] transition-colors">
                          <Download className="h-3 w-3" />
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    {getStatusIcon(c.status)}
                    <span className={cn(
                      c.status === 'termine' && 'text-emerald-600',
                      c.status === 'prevue' && 'text-[var(--accent)]',
                      c.status === 'rendu' && 'text-sky-600',
                      c.status === 'a_rendre' && 'text-amber-600',
                    )}>
                      {getStatusLabel(c.status)}
                    </span>
                  </div>
                  {c.note !== null && c.note !== undefined && (
                    <span className="text-lg font-bold text-[var(--accent)]">{c.note}/20</span>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}