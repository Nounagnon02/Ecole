/**
 * CoursPage — Mes cours pour les élèves
 *
 * L'élève consulte ses cours, devoirs et ressources pédagogiques.
 * Données dynamiques via API /eleve/cours
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, FileText, Clock, Download, Eye,
  Play, ChevronRight, Search, Filter, Calendar,
  CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';
import { cn, formatDate, formatRelativeTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import { useApi } from '@/hooks/useApi';

export default function CoursPage() {
  const { loading, error, get } = useApi();
  const [cours, setCours] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMatiere, setFilterMatiere] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/eleve/cours');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setCours(items.map(c => ({
          ...c,
          type: c.type || 'cours',
          status: c.status || c.statut || 'prevue',
          duree: c.duree || '—',
          resume: c.resume || c.description || '',
          ressources: c.ressources || c.documents || [],
        })));
      } catch (e) {
        console.error('Erreur chargement cours:', e);
      }
    })();
  }, [get]);

  const matieres = useMemo(() => [...new Set(cours.map((c) => c.matiere?.nom || c.matiere).filter(Boolean))], [cours]);

  const filtered = useMemo(() =>
    cours.filter((c) => {
      if (search && !c.chapitre?.toLowerCase().includes(search.toLowerCase()) && !(c.matiere?.nom || c.matiere || '').toLowerCase().includes(search.toLowerCase())) return false;
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
      case 'terminé': return 'Terminé';
      case 'prevue':
      case 'a_venir': return 'À venir';
      case 'rendu': return 'Rendu';
      case 'a_rendre':
      case 'en_retard': return 'À rendre';
      default: return status;
    }
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
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Mes Cours</h1>
        <p className="text-sm text-neutral-500">Consultez vos cours, devoirs et ressources</p>
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un cours..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterMatiere}
            onChange={(e) => setFilterMatiere(e.target.value)}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">Toutes les matières</option>
            {matieres.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">Tous les types</option>
            <option value="cours">Cours</option>
            <option value="devoir">Devoir</option>
            <option value="tp">TP</option>
          </select>
        </div>
      </Card>

      {/* Liste des cours */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <BookOpen className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucun cours trouvé</p>
            </div>
          </Card>
        )}
        {filtered.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card hover>
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
                    <Badge variant="primary" size="sm">{c.matiere?.nom || c.matiere || 'Matière'}</Badge>
                    <span className="text-xs text-neutral-500 capitalize">
                      {c.type === 'tp' ? 'TP' : c.type}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-neutral-400">
                      <Clock className="h-3 w-3" />
                      {c.duree}
                    </div>
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-neutral-900 dark:text-white">
                    {c.chapitre || c.intitule || c.titre || 'Cours'}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">{c.resume}</p>

                  <div className="mt-3 flex items-center gap-4">
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {c.date > new Date() ? 'Prévu le ' : 'Le '}
                      {formatDate(c.date)}
                    </span>
                    <span className="text-xs text-neutral-500">{c.prof || c.enseignant || '—'}</span>
                  </div>

                  {/* Ressources */}
                  {c.ressources?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {c.ressources.map((r) => (
                        <button key={r} className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] dark:hover:text-[var(--accent)] transition-colors">
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
                  {c.note && (
                    <span className="text-lg font-bold text-[var(--accent)]">{c.note}/20</span>
                  )}
                  <Button variant="ghost" size="sm" icon={<Eye />}>
                    Voir
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}