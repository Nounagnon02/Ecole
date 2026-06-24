/**
 * EmpruntsPage — Gestion des emprunts
 *
 * Le bibliothécaire suit les emprunts et retours d'ouvrages.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookMarked, Plus, Search, Filter, Clock, CheckCircle, AlertTriangle,
  XCircle, ArrowLeft, ArrowRight, User, Calendar,
} from 'lucide-react';
import { cn, formatDate, formatRelativeTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const EMPRUNTS = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  eleve: ['Diallo Amadou', 'Touré Fatou', 'Koné Moussa', 'Cissé Inza', 'Traoré Kadiatou', 'Sow Mariam', 'Diop Souleymane', 'Ndiaye Fatma', 'Ba Ousmane', 'Sylla Aïcha'][i],
  classe: ['4e A', '4e A', '4e A', '4e A', '4e A', '4e A', '4e B', '4e B', '3e A', '3e A'][i],
  ouvrage: [
    'Mathématiques 4e', 'Physique Chimie TS', 'Français 6e', 'Histoire-Géo 3e',
    'Anglais Terminale', 'SVT 5e', 'Philosophie TS', 'Algorithme et Programmation',
    'Grammaire Française', 'Atlas Mondial',
  ][i],
  dateEmprunt: new Date(Date.now() - 86400000 * (15 + i * 5)),
  dateRetourPrevue: new Date(Date.now() - 86400000 * (5 - i * 2)),
  dateRetour: i % 4 === 0 ? new Date(Date.now() - 86400000 * (10 + i * 3)) : null,
  statut: ['en_cours', 'en_cours', 'en_cours', 'en_retard', 'termine', 'en_cours', 'en_retard', 'termine', 'en_cours', 'en_retard'][i],
}));

const getStatutVariant = (statut) => {
  switch (statut) {
    case 'en_cours': return 'warning';
    case 'en_retard': return 'danger';
    case 'termine': return 'primary';
    default: return 'outline';
  }
};

const getStatutLabel = (statut) => {
  switch (statut) {
    case 'en_cours': return 'En cours';
    case 'en_retard': return 'En retard';
    case 'termine': return 'Terminé';
    default: return statut;
  }
};

export default function EmpruntsPage() {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const stats = useMemo(() => ({
    total: EMPRUNTS.length,
    enCours: EMPRUNTS.filter((e) => e.statut === 'en_cours').length,
    enRetard: EMPRUNTS.filter((e) => e.statut === 'en_retard').length,
    termines: EMPRUNTS.filter((e) => e.statut === 'termine').length,
  }), []);

  const filtered = useMemo(() =>
    EMPRUNTS.filter((e) => {
      if (search && !e.eleve.toLowerCase().includes(search.toLowerCase()) && !e.ouvrage.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatut && e.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterStatut]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Emprunts</h1>
          <p className="text-sm text-neutral-500">Suivi des emprunts et retours d'ouvrages</p>
        </div>
        <Button size="sm" icon={<Plus />}>Nouvel emprunt</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total Emprunts" value={String(stats.total)} icon={BookMarked} color="indigo" />
        <StatsCard title="En cours" value={String(stats.enCours)} icon={Clock} color="amber" />
        <StatsCard title="En retard" value={String(stats.enRetard)} icon={AlertTriangle} color="red" />
        <StatsCard title="Terminés" value={String(stats.termines)} icon={CheckCircle} color="emerald" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un élève ou un ouvrage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">Tous les statuts</option>
            <option value="en_cours">En cours</option>
            <option value="en_retard">En retard</option>
            <option value="termine">Terminé</option>
          </select>
        </div>
      </Card>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <BookMarked className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucun emprunt trouvé</p>
            </div>
          </Card>
        )}
        {filtered.map((e) => (
          <Card key={e.id} hover>
            <div className="flex items-start gap-4">
              <div className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center shrink-0',
                e.statut === 'en_retard' ? 'bg-red-100 dark:bg-red-900/20' :
                e.statut === 'termine' ? 'bg-emerald-100 dark:bg-emerald-900/20' :
                'bg-amber-100 dark:bg-amber-900/20'
              )}>
                <BookMarked className={cn(
                  'h-6 w-6',
                  e.statut === 'en_retard' ? 'text-red-500' :
                  e.statut === 'termine' ? 'text-emerald-500' :
                  'text-amber-500'
                )} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">{e.ouvrage}</span>
                  <Badge variant={getStatutVariant(e.statut)} size="sm">{getStatutLabel(e.statut)}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {e.eleve} · {e.classe}
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    Emprunt: {formatDate(e.dateEmprunt)}
                  </span>
                  <span className={cn(
                    'flex items-center gap-1',
                    e.statut === 'en_retard' ? 'text-red-600 font-medium' : ''
                  )}>
                    <Calendar className="h-3 w-3" />
                    Retour prévu: {formatDate(e.dateRetourPrevue)}
                  </span>
                  {e.dateRetour && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle className="h-3 w-3" />
                      Retourné: {formatDate(e.dateRetour)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {e.statut !== 'termine' && (
                  <Button variant="outline" size="sm">Marquer retour</Button>
                )}
                <Button variant="ghost" size="sm">Détails</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
