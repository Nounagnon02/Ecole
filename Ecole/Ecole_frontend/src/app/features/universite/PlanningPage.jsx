/**
 * PlanningPage — Planning universitaire
 *
 * Module université : calendrier des cours, examens et événements.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays, Plus, Search, Filter, Clock, Users, MapPin, BookOpen,
  CheckCircle, AlertCircle, GraduationCap,
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const EVENEMENTS = [
  { id: 1, titre: 'Cours Algèbre Linéaire', type: 'cours', date: new Date(Date.now() + 86400000 * 1), debut: '08:00', fin: '10:00', lieu: 'Amphi A', intervenant: 'Pr. Diallo', statut: 'planifie' },
  { id: 2, titre: 'TD Mécanique Quantique', type: 'td', date: new Date(Date.now() + 86400000 * 2), debut: '10:00', fin: '12:00', lieu: 'Salle 201', intervenant: 'Dr. Touré', statut: 'planifie' },
  { id: 3, titre: 'Examen Partiel Droit', type: 'examen', date: new Date(Date.now() + 86400000 * 5), debut: '08:00', fin: '11:00', lieu: 'Amphi B', intervenant: 'Pr. Traoré', statut: 'planifie' },
  { id: 4, titre: 'Soutenance Projets L3', type: 'soutenance', date: new Date(Date.now() - 86400000 * 4), debut: '09:00', fin: '17:00', lieu: 'Salle des Actes', intervenant: 'Jury', statut: 'termine' },
  { id: 5, titre: 'Conférence Intelligence Artificielle', type: 'conference', date: new Date(Date.now() + 86400000 * 8), debut: '14:00', fin: '16:00', lieu: 'Grand Amphi', intervenant: 'Pr. Ndiaye', statut: 'planifie' },
  { id: 6, titre: 'TP Physique', type: 'tp', date: new Date(Date.now() + 86400000 * 3), debut: '14:00', fin: '17:00', lieu: 'Labo Physique', intervenant: 'Dr. Ba', statut: 'planifie' },
  { id: 7, titre: 'Réunion Département Mathématiques', type: 'reunion', date: new Date(Date.now() - 86400000 * 2), debut: '10:00', fin: '12:00', lieu: 'Salle Réunion', intervenant: 'Pr. Diallo', statut: 'termine' },
  { id: 8, titre: 'Journée Portes Ouvertes', type: 'evenement', date: new Date(Date.now() + 86400000 * 12), debut: '08:00', fin: '18:00', lieu: 'Campus', intervenant: 'Tous', statut: 'planifie' },
];

const TYPE_CONFIG = {
  cours: { label: 'Cours', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20', icon: BookOpen },
  td: { label: 'TD', color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20', icon: BookOpen },
  tp: { label: 'TP', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/20', icon: BookOpen },
  examen: { label: 'Examen', color: 'text-red-500 bg-red-100 dark:bg-red-900/20', icon: AlertCircle },
  soutenance: { label: 'Soutenance', color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/20', icon: GraduationCap },
  conference: { label: 'Conférence', color: 'text-sky-500 bg-sky-100 dark:bg-sky-900/20', icon: Users },
  reunion: { label: 'Réunion', color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/20', icon: Users },
  evenement: { label: 'Événement', color: 'text-pink-500 bg-pink-100 dark:bg-pink-900/20', icon: CalendarDays },
};

export default function PlanningPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const stats = useMemo(() => ({
    total: EVENEMENTS.length,
    planifies: EVENEMENTS.filter((e) => e.statut === 'planifie').length,
    termines: EVENEMENTS.filter((e) => e.statut === 'termine').length,
    aujourdhui: EVENEMENTS.filter((e) => e.date.toDateString() === new Date().toDateString()).length,
  }), []);

  const filtered = useMemo(() =>
    EVENEMENTS.filter((e) => {
      if (search && !e.titre.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && e.type !== filterType) return false;
      return true;
    }),
    [search, filterType]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Planning</h1>
          <p className="text-sm text-neutral-500">Calendrier universitaire des cours et événements</p>
        </div>
        <Button size="sm" icon={<Plus />}>Nouvel événement</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total" value={String(stats.total)} icon={CalendarDays} color="indigo" />
        <StatsCard title="Planifiés" value={String(stats.planifies)} icon={Clock} color="sky" />
        <StatsCard title="Terminés" value={String(stats.termines)} icon={CheckCircle} color="emerald" />
        <StatsCard title="Aujourd'hui" value={String(stats.aujourdhui)} icon={AlertCircle} color="amber" />
      </div>

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
          <div className="flex gap-2 flex-wrap">
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setFilterType(filterType === key ? '' : key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filterType === key
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                )}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

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
          .sort((a, b) => a.date - b.date)
          .map((evt) => {
            const cfg = TYPE_CONFIG[evt.type] || TYPE_CONFIG.evenement;
            const IconComponent = cfg.icon;
            return (
              <Card key={evt.id} hover>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 shrink-0">
                    <span className="text-lg font-bold text-neutral-900 dark:text-white leading-none">
                      {evt.date.getDate()}
                    </span>
                    <span className="text-[10px] text-neutral-500 uppercase mt-0.5">
                      {evt.date.toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white">{evt.titre}</span>
                      <Badge variant={evt.statut === 'termine' ? 'primary' : 'warning'} size="sm">
                        {evt.statut === 'termine' ? 'Terminé' : 'Planifié'}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                      <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded', cfg.color)}>
                        <IconComponent className="h-3 w-3" />
                        {cfg.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {evt.debut} - {evt.fin}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {evt.lieu}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {evt.intervenant}
                      </span>
                    </div>
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
