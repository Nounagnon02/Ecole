/**
 * CoursPage — Gestion des cours universitaires
 *
 * Module université : planification et gestion des cours.
 * Données dynamiques via API /api/universite/cours
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Plus, Search, Filter, Clock, Users, Calendar,
  GraduationCap, Building2, Eye, Loader2, AlertCircle,
} from 'lucide-react';
import { cn, formatDate, formatTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useApi } from '@/hooks/useApi';

export default function CoursPage() {
  const { loading, error, get } = useApi();
  const [cours, setCours] = useState([]);
  const [search, setSearch] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/universite/cours');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setCours(items.map(c => ({
          ...c,
          credits: c.credits || c.ects || 0,
          heures: c.heures || c.volume_horaire || 0,
          etudiants: c.etudiants_count || c.etudiants || 0,
          statut: c.statut || 'actif',
        })));
      } catch (e) {
        console.error('Erreur chargement cours:', e);
      }
    })();
  }, [get]);

  const stats = useMemo(() => ({
    total: cours.length,
    actifs: cours.filter((c) => c.statut === 'actif').length,
    termines: cours.filter((c) => c.statut === 'termine' || c.statut === 'terminé').length,
    creditsTotal: cours.reduce((s, c) => s + Number(c.credits || 0), 0),
  }), [cours]);

  const niveaux = useMemo(() => ['Tous', ...new Set(cours.map((c) => c.niveau).filter(Boolean))], [cours]);

  const filtered = useMemo(() =>
    cours.filter((c) => {
      if (search && !c.intitule?.toLowerCase().includes(search.toLowerCase()) && !c.code?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterNiveau && c.niveau !== filterNiveau) return false;
      return true;
    }),
    [search, filterNiveau, cours]
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Cours</h1>
          <p className="text-sm text-neutral-500">Planification et gestion des cours universitaires</p>
        </div>
        <Button size="sm" icon={<Plus />}>Ajouter un cours</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total Cours" value={String(stats.total)} icon={BookOpen} color="primary" />
        <StatsCard title="En cours" value={String(stats.actifs)} icon={Clock} color="emerald" />
        <StatsCard title="Terminés" value={String(stats.termines)} icon={GraduationCap} color="sky" />
        <StatsCard title="Crédits" value={String(stats.creditsTotal)} icon={Building2} color="amber" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un cours..."
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
                    ? 'bg-[var(--primary-subtle)] text-[var(--accent)] bg-[var(--primary-subtle)] dark:text-[var(--accent)]'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <Card>
              <div className="text-center py-8 text-neutral-500">
                <BookOpen className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">Aucun cours trouvé</p>
              </div>
            </Card>
          </div>
        )}
        {filtered.map((c) => (
          <Card key={c.id} hover>
            <div className="flex items-start justify-between mb-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-emerald-500" />
              </div>
              <Badge variant={c.statut === 'actif' ? 'primary' : 'outline'} size="sm">
                {c.statut === 'actif' ? 'En cours' : 'Terminé'}
              </Badge>
            </div>
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">{c.intitule}</h3>
            <p className="text-xs text-neutral-500 mb-1">{c.code} · {c.professeur || c.enseignant || '—'}</p>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" size="sm">{c.niveau}</Badge>
              <Badge variant="outline" size="sm">{c.semestre}</Badge>
              <span className="text-xs text-neutral-400">{c.filiere || ''}</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {c.credits} crédits</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {c.heures}h</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.etudiants}</span>
            </div>
            <div className="mt-3">
              <Button variant="outline" size="sm" icon={<Eye />}>Détails</Button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}