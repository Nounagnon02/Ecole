/**
 * PlanningPage — Planning des événements
 *
 * La secrétaire planifie et suit les événements et rendez-vous.
 * Données dynamiques via API /evenements
 */

import { useState, useEffect, useMemo } from 'react';
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
import { useApi } from '@/hooks/useApi';

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
  const { loading, error, get } = useApi();
  const [evenements, setEvenements] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/evenements');
        const raw = res?.data?.data || res?.data || res || [];
        const items = Array.isArray(raw) ? raw : [];
        setEvenements(items);
      } catch (e) {
        console.error('Erreur chargement événements:', e);
      }
    })();
  }, []);

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

  const now = new Date();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Planning</h1>
          <p className="text-sm text-neutral-500">Planification des événements et rendez-vous</p>
        </div>
        <Button size="sm" icon={<Plus />}>Nouvel événement</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total" value={String(stats.total)} icon={CalendarDays} color="primary" />
        <StatsCard title="Planifiés" value={String(stats.planifies)} icon={Clock} color="sky" />
        <StatsCard title="Terminés" value={String(stats.termines)} icon={CheckCircle} color="emerald" />
        <StatsCard title="Aujourd'hui" value={String(stats.aujourdhui)} icon={AlertCircle} color="amber" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un événement..."
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
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
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
            <div className="text-center py-8 text-neutral-500">
              <CalendarDays className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucun événement trouvé</p>
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
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 shrink-0">
                    <span className="text-lg font-bold text-neutral-900 dark:text-white leading-none">
                      {dateObj.getDate()}
                    </span>
                    <span className="text-[10px] text-neutral-500 uppercase mt-0.5">
                      {dateObj.toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white">{evt.titre}</span>
                      <Badge variant={estFutur ? 'warning' : 'primary'} size="sm">
                        {estFutur ? 'Planifié' : 'Terminé'}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
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
                      <p className="mt-1 text-xs text-neutral-400 italic">{evt.description}</p>
                    )}
                  </div>

                  <Button variant="ghost" size="sm">Détails</Button>
                </div>
              </Card>
            );
          })}
      </div>
    </motion.div>
  );
}
