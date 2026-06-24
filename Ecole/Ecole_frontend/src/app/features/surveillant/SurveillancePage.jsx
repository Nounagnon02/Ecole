/**
 * SurveillancePage — Gestion des surveillances
 *
 * Le surveillant planifie et suit les tours de surveillance.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Clock, Users, MapPin, CheckCircle, AlertTriangle,
  Search, Filter, Plus, Calendar,
} from 'lucide-react';
import { cn, formatDate, formatTime, formatRelativeTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import StatsCard from '@/shared/components/ui/StatsCard';

const ZONES = ['Bâtiment A', 'Bâtiment B', 'Cour principale', 'Cantine', 'Bibliothèque', 'Laboratoire', 'Infirmerie', 'Péristyle'];

const PERSONNEL = ['M. Koné', 'Mme Cissé', 'M. Touré', 'Mme Diallo', 'M. Traoré', 'Mme Sow'];

const SURVEILLANCES = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  zone: ZONES[i % ZONES.length],
  surveillant: PERSONNEL[i % PERSONNEL.length],
  date: new Date(Date.now() + 86400000 * Math.floor(i / 4)),
  debut: `${String(7 + Math.floor(i / 2) % 4).padStart(2, '0')}:00`,
  fin: `${String(7 + Math.floor(i / 2) % 4 + 2).padStart(2, '0')}:00`,
  statut: ['planifiee', 'en_cours', 'terminee', 'planifiee', 'planifiee', 'en_cours', 'terminee', 'planifiee', 'terminee', 'planifiee', 'en_cours', 'planifiee'][i],
  observations: i % 3 === 0 ? 'RAS' : i % 3 === 1 ? 'Porte arrière mal fermée' : '',
}));

const getStatutVariant = (statut) => {
  switch (statut) {
    case 'planifiee': return 'outline';
    case 'en_cours': return 'warning';
    case 'terminee': return 'primary';
    default: return 'outline';
  }
};

const getStatutLabel = (statut) => {
  switch (statut) {
    case 'planifiee': return 'Planifiée';
    case 'en_cours': return 'En cours';
    case 'terminee': return 'Terminée';
    default: return statut;
  }
};

export default function SurveillancePage() {
  const [filterZone, setFilterZone] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const filtered = useMemo(() =>
    SURVEILLANCES.filter((s) => {
      if (filterZone && s.zone !== filterZone) return false;
      if (filterStatut && s.statut !== filterStatut) return false;
      return true;
    }),
    [filterZone, filterStatut]
  );

  const stats = useMemo(() => ({
    total: SURVEILLANCES.length,
    enCours: SURVEILLANCES.filter((s) => s.statut === 'en_cours').length,
    planifiees: SURVEILLANCES.filter((s) => s.statut === 'planifiee').length,
    terminees: SURVEILLANCES.filter((s) => s.statut === 'terminee').length,
  }), []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Surveillance</h1>
        <p className="text-sm text-neutral-500">Planifiez et suivez les tours de surveillance</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Totale" value={String(stats.total)} icon={Shield} color="indigo" />
        <StatsCard title="En cours" value={String(stats.enCours)} icon={AlertTriangle} color="amber" />
        <StatsCard title="Planifiées" value={String(stats.planifiees)} icon={Clock} color="sky" />
        <StatsCard title="Terminées" value={String(stats.terminees)} icon={CheckCircle} color="emerald" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Toutes les zones</option>
              {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Tous les statuts</option>
              <option value="planifiee">Planifiée</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminée</option>
            </select>
          </div>
          <Button size="sm" icon={<Plus />}>Nouvelle surveillance</Button>
        </div>
      </Card>

      {/* Planning du jour */}
      <div className="grid gap-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <Shield className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucune surveillance trouvée</p>
            </div>
          </Card>
        )}
        {filtered.map((s) => (
          <Card key={s.id} hover>
            <div className="flex items-start gap-4">
              <div className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center shrink-0',
                s.statut === 'en_cours' ? 'bg-amber-100 dark:bg-amber-900/20' :
                s.statut === 'terminee' ? 'bg-emerald-100 dark:bg-emerald-900/20' :
                'bg-neutral-100 dark:bg-neutral-800'
              )}>
                <Shield className={cn(
                  'h-6 w-6',
                  s.statut === 'en_cours' ? 'text-amber-500' :
                  s.statut === 'terminee' ? 'text-emerald-500' :
                  'text-neutral-400'
                )} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="primary" size="sm">{s.zone}</Badge>
                  <Badge variant={getStatutVariant(s.statut)} size="sm">{getStatutLabel(s.statut)}</Badge>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {s.debut} - {s.fin}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(s.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {s.surveillant}
                  </span>
                </div>
                {s.observations && (
                  <p className="mt-2 text-xs text-neutral-500 italic">{s.observations}</p>
                )}
              </div>
              <Button variant="ghost" size="sm">Détails</Button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
