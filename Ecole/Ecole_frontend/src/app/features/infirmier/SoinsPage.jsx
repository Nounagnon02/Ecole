/**
 * SoinsPage — Gestion des soins infirmiers
 *
 * L'infirmier enregistre et suit les soins dispensés aux élèves.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Plus, Search, Filter, Clock, AlertTriangle, CheckCircle,
  Pill, Thermometer, Activity, Droplets,
} from 'lucide-react';
import { cn, formatDate, formatTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const SOINS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  eleve: ['Diallo Amadou', 'Touré Fatou', 'Koné Moussa', 'Cissé Inza', 'Traoré Kadiatou', 'Sow Mariam', 'Diop Souleymane', 'Ndiaye Fatma', 'Ba Ousmane', 'Sylla Aïcha', 'Faye Cheikh', 'Gueye Ndeye'][i],
  classe: ['4e A', '4e A', '4e A', '4e A', '4e A', '4e A', '4e B', '4e B', '3e A', '3e A', '5e A', '6e B'][i],
  type: ['blessure', 'malaise', 'medicament', 'blessure', 'malaise', 'medicament', 'blessure', 'medicament', 'malaise', 'blessure', 'medicament', 'malaise'][i],
  description: ['Chute dans la cour', 'Vertiges après sport', 'Administration vaccin', 'Coup au genou', 'Maux de tête persistants', 'Traitement antipaludique', 'Égratignure bras', 'Anti-allergique', 'Hypoglycémie', 'Entorse cheville', 'Vitamines prescrites', 'Nausées matinales'][i],
  date: new Date(Date.now() - 86400000 * i),
  soignant: 'Mme Diallo',
  statut: ['traite', 'traite', 'traite', 'traite', 'en_cours', 'traite', 'traite', 'traite', 'traite', 'en_cours', 'traite', 'traite'][i],
}));

const getTypeIcon = (type) => {
  switch (type) {
    case 'blessure': return <Activity className="h-4 w-4" />;
    case 'malaise': return <Thermometer className="h-4 w-4" />;
    case 'medicament': return <Pill className="h-4 w-4" />;
    default: return <Droplets className="h-4 w-4" />;
  }
};

const getTypeColor = (type) => {
  switch (type) {
    case 'blessure': return 'text-red-500 bg-red-100 dark:bg-red-900/20';
    case 'malaise': return 'text-amber-500 bg-amber-100 dark:bg-amber-900/20';
    case 'medicament': return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20';
    default: return 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800';
  }
};

export default function SoinsPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const stats = useMemo(() => ({
    total: SOINS.length,
    aujourdhui: SOINS.filter((s) => s.date.toDateString() === new Date().toDateString()).length,
    enCours: SOINS.filter((s) => s.statut === 'en_cours').length,
    traites: SOINS.filter((s) => s.statut === 'traite').length,
  }), []);

  const filtered = useMemo(() =>
    SOINS.filter((s) => {
      if (search && !s.eleve.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && s.type !== filterType) return false;
      if (filterStatut && s.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterType, filterStatut]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Soins Infirmiers</h1>
          <p className="text-sm text-neutral-500">Registre des soins dispensés aux élèves</p>
        </div>
        <Button size="sm" icon={<Plus />}>Nouveau soin</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total Soins" value={String(stats.total)} icon={Heart} color="indigo" />
        <StatsCard title="Aujourd'hui" value={String(stats.aujourdhui)} icon={Clock} color="amber" />
        <StatsCard title="En cours" value={String(stats.enCours)} icon={AlertTriangle} color="red" />
        <StatsCard title="Traités" value={String(stats.traites)} icon={CheckCircle} color="emerald" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un élève..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Tous les types</option>
              <option value="blessure">Blessure</option>
              <option value="malaise">Malaise</option>
              <option value="medicament">Médicament</option>
            </select>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Tous les statuts</option>
              <option value="traite">Traité</option>
              <option value="en_cours">En cours</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <Heart className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucun soin trouvé</p>
            </div>
          </Card>
        )}
        {filtered.map((soin) => (
          <Card key={soin.id} hover>
            <div className="flex items-start gap-4">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', getTypeColor(soin.type))}>
                {getTypeIcon(soin.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">{soin.description}</span>
                  <Badge variant={soin.statut === 'traite' ? 'primary' : 'warning'} size="sm">
                    {soin.statut === 'traite' ? 'Traité' : 'En cours'}
                  </Badge>
                  <Badge variant="outline" size="sm" className="capitalize">{soin.type}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Avatar name={soin.eleve} size="xs" />
                    {soin.eleve} · {soin.classe}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(soin.date)}
                  </span>
                  <span>Par {soin.soignant}</span>
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
