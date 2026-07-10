/**
 * SurveillancePage — Gestion des surveillances et incidents
 *
 * Le surveillant planifie et suit les incidents et absences.
 * Données dynamiques via API /surveillant/incidents et /surveillant/absences
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Clock, AlertTriangle, CheckCircle,
  Search, Plus, Calendar, Loader2, AlertCircle,
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useApi } from '@/hooks/useApi';

const getStatutVariant = (statut) => {
  switch (statut) {
    case 'résolu':
    case 'termine':
    case 'terminee': return 'primary';
    case 'en_cours': return 'warning';
    case 'signalé':
    case 'signale': return 'danger';
    default: return 'outline';
  }
};

const getStatutLabel = (statut) => {
  switch (statut) {
    case 'termine':
    case 'terminee': return 'Terminé';
    case 'en_cours': return 'En cours';
    case 'signalé':
    case 'signale': return 'Signalé';
    default: return statut || '—';
  }
};

const getGraviteColor = (gravite) => {
  switch (gravite) {
    case 'grave': return 'text-red-500 bg-red-100 dark:bg-red-900/20';
    case 'moyenne': return 'text-amber-500 bg-amber-100 dark:bg-amber-900/20';
    case 'faible': return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20';
    default: return 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800';
  }
};

export default function SurveillancePage() {
  const { loading, error, get } = useApi();
  const [incidents, setIncidents] = useState([]);
  const [filterGravite, setFilterGravite] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/surveillant/incidents');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setIncidents(items);
      } catch (e) {
        console.error('Erreur chargement incidents:', e);
      }
    })();
  }, []);

  const stats = useMemo(() => ({
    total: incidents.length,
    enCours: incidents.filter((s) => s.statut === 'en_cours' || s.statut === 'signalé' || s.statut === 'signale').length,
    termines: incidents.filter((s) => s.statut === 'termine' || s.statut === 'résolu').length,
    graves: incidents.filter((s) => s.gravite === 'grave').length,
  }), [incidents]);

  const filtered = useMemo(() =>
    incidents.filter((s) => {
      if (filterGravite && s.gravite !== filterGravite) return false;
      return true;
    }),
    [filterGravite, incidents]
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
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Surveillance</h1>
        <p className="text-sm text-neutral-500">Registre des incidents et signalements</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total" value={String(stats.total)} icon={Shield} color="primary" />
        <StatsCard title="En cours" value={String(stats.enCours)} icon={AlertTriangle} color="amber" />
        <StatsCard title="Terminés" value={String(stats.termines)} icon={CheckCircle} color="emerald" />
        <StatsCard title="Graves" value={String(stats.graves)} icon={AlertCircle} color="red" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <select
              value={filterGravite}
              onChange={(e) => setFilterGravite(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Toutes les gravités</option>
              <option value="faible">Faible</option>
              <option value="moyenne">Moyenne</option>
              <option value="grave">Grave</option>
            </select>
          </div>
          <Button size="sm" icon={<Plus />}>Nouvel incident</Button>
        </div>
      </Card>

      {/* Liste des incidents */}
      <div className="grid gap-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <Shield className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucun incident trouvé</p>
            </div>
          </Card>
        )}
        {filtered.map((s) => (
          <Card key={s.id} hover>
            <div className="flex items-start gap-4">
              <div className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center shrink-0',
                s.gravite === 'grave' ? 'bg-red-100 dark:bg-red-900/20' :
                s.gravite === 'moyenne' ? 'bg-amber-100 dark:bg-amber-900/20' :
                'bg-neutral-100 dark:bg-neutral-800'
              )}>
                <Shield className={cn(
                  'h-6 w-6',
                  s.gravite === 'grave' ? 'text-red-500' :
                  s.gravite === 'moyenne' ? 'text-amber-500' :
                  'text-neutral-400'
                )} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">{s.description}</span>
                  <Badge variant={getStatutVariant(s.statut)} size="sm">{getStatutLabel(s.statut)}</Badge>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                  <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium', getGraviteColor(s.gravite))}>
                    {s.gravite ? `Gravité: ${s.gravite}` : 'Non définie'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {s.date ? formatDate(s.date) : '—'}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm">Détails</Button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
