/**
 * DisciplinePage — Gestion de la discipline
 *
 * Le censeur enregistre et suit les sanctions et incidents disciplinaires.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Scale, AlertTriangle, FileText, Search, Filter, Plus,
  Clock, User, MessageSquare, ThumbsDown, CheckCircle,
} from 'lucide-react';
import { cn, formatDate, formatRelativeTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const INCIDENTS = [
  { id: 1, eleve: 'Koné Moussa', classe: '4e A', type: 'Retard répété', date: new Date(Date.now() - 86400000 * 1), gravite: 'legere', statut: 'traitee', sanction: 'Avertissement verbal', rapportePar: 'M. Diallo' },
  { id: 2, eleve: 'Cissé Inza', classe: '4e A', type: 'Absence non justifiée', date: new Date(Date.now() - 86400000 * 3), gravite: 'moyenne', statut: 'traitee', sanction: 'Retenue', rapportePar: 'Mme Touré' },
  { id: 3, eleve: 'Diop Souleymane', classe: '4e B', type: 'Bagarre', date: new Date(Date.now() - 86400000 * 0.5), gravite: 'grave', statut: 'en_cours', sanction: 'En attente de décision', rapportePar: 'M. Koné' },
  { id: 4, eleve: 'Ba Ousmane', classe: '3e A', type: 'Non-respect du règlement', date: new Date(Date.now() - 86400000 * 5), gravite: 'legere', statut: 'traitee', sanction: 'Lettre d\'excuses', rapportePar: 'Mme Cissé' },
  { id: 5, eleve: 'Sylla Aïcha', classe: '3e A', type: 'Tricherie', date: new Date(Date.now() - 86400000 * 2), gravite: 'grave', statut: 'en_cours', sanction: 'Conseil de discipline', rapportePar: 'M. Traoré' },
  { id: 6, eleve: 'Faye Cheikh', classe: '5e A', type: 'Dégradation matérielle', date: new Date(Date.now() - 86400000 * 7), gravite: 'moyenne', statut: 'traitee', sanction: 'Réparation + retenue', rapportePar: 'Mme Sow' },
  { id: 7, eleve: 'Touré Fatou', classe: '4e A', type: 'Comportement inapproprié', date: new Date(Date.now() - 86400000 * 4), gravite: 'moyenne', statut: 'en_cours', sanction: 'Entretien avec les parents', rapportePar: 'M. Diallo' },
  { id: 8, eleve: 'Ndiaye Fatma', classe: '4e B', type: 'Retard répété', date: new Date(Date.now() - 86400000 * 6), gravite: 'legere', statut: 'traitee', sanction: 'Avertissement écrit', rapportePar: 'M. Koné' },
];

const getGraviteVariant = (g) => {
  switch (g) {
    case 'legere': return 'outline';
    case 'moyenne': return 'warning';
    case 'grave': return 'danger';
    default: return 'outline';
  }
};

const getGraviteLabel = (g) => {
  switch (g) {
    case 'legere': return 'Légère';
    case 'moyenne': return 'Moyenne';
    case 'grave': return 'Grave';
    default: return g;
  }
};

export default function DisciplinePage() {
  const [search, setSearch] = useState('');
  const [filterGravite, setFilterGravite] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const stats = useMemo(() => ({
    total: INCIDENTS.length,
    enCours: INCIDENTS.filter((i) => i.statut === 'en_cours').length,
    traitees: INCIDENTS.filter((i) => i.statut === 'traitee').length,
    graves: INCIDENTS.filter((i) => i.gravite === 'grave').length,
  }), []);

  const filtered = useMemo(() =>
    INCIDENTS.filter((i) => {
      if (search && !i.eleve.toLowerCase().includes(search.toLowerCase()) && !i.type.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterGravite && i.gravite !== filterGravite) return false;
      if (filterStatut && i.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterGravite, filterStatut]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Discipline</h1>
        <p className="text-sm text-neutral-500">Gestion des incidents et sanctions disciplinaires</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total Incidents" value={String(stats.total)} icon={AlertTriangle} color="indigo" />
        <StatsCard title="En cours" value={String(stats.enCours)} icon={Clock} color="amber" />
        <StatsCard title="Traités" value={String(stats.traitees)} icon={CheckCircle} color="emerald" />
        <StatsCard title="Cas graves" value={String(stats.graves)} icon={ThumbsDown} color="red" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un élève ou un type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterGravite}
              onChange={(e) => setFilterGravite(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Toutes les gravités</option>
              <option value="legere">Légère</option>
              <option value="moyenne">Moyenne</option>
              <option value="grave">Grave</option>
            </select>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Tous les statuts</option>
              <option value="en_cours">En cours</option>
              <option value="traitee">Traitée</option>
            </select>
            <Button size="sm" icon={<Plus />}>Nouvel incident</Button>
          </div>
        </div>
      </Card>

      {/* Liste des incidents */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <Scale className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucun incident trouvé</p>
            </div>
          </Card>
        )}
        {filtered.map((incident) => (
          <Card key={incident.id} hover>
            <div className="flex items-start gap-4">
              <div className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center shrink-0',
                incident.gravite === 'grave' ? 'bg-red-100 dark:bg-red-900/20' :
                incident.gravite === 'moyenne' ? 'bg-amber-100 dark:bg-amber-900/20' :
                'bg-neutral-100 dark:bg-neutral-800'
              )}>
                <AlertTriangle className={cn(
                  'h-6 w-6',
                  incident.gravite === 'grave' ? 'text-red-500' :
                  incident.gravite === 'moyenne' ? 'text-amber-500' :
                  'text-neutral-400'
                )} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">{incident.type}</span>
                  <Badge variant={getGraviteVariant(incident.gravite)} size="sm">{getGraviteLabel(incident.gravite)}</Badge>
                  <Badge variant={incident.statut === 'traitee' ? 'primary' : 'warning'} size="sm">
                    {incident.statut === 'traitee' ? 'Traitée' : 'En cours'}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {incident.eleve} · {incident.classe}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(incident.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Rapporté par {incident.rapportePar}
                  </span>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-neutral-500">Sanction: </span>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">{incident.sanction}</span>
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
