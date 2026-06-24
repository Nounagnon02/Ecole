/**
 * PresencesPage — Gestion des présences
 *
 * Le surveillant enregistre et consulte les présences des élèves.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck, Users, Clock, AlertTriangle, CheckCircle, XCircle,
  Search, Filter, Calendar, Download,
} from 'lucide-react';
import { cn, formatDate, formatTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const CLASSES = ['4e A', '4e B', '3e A', '5e A', '6e B'];

const PRESENCES = [
  { id: 1, nom: 'Diallo Amadou', classe: '4e A', statut: 'present', heureArrivee: '07:45', motif: '' },
  { id: 2, nom: 'Touré Fatou', classe: '4e A', statut: 'present', heureArrivee: '07:50', motif: '' },
  { id: 3, nom: 'Koné Moussa', classe: '4e A', statut: 'retard', heureArrivee: '08:20', motif: 'Transport' },
  { id: 4, nom: 'Cissé Inza', classe: '4e A', statut: 'absent', heureArrivee: '', motif: 'Maladie' },
  { id: 5, nom: 'Traoré Kadiatou', classe: '4e A', statut: 'present', heureArrivee: '07:42', motif: '' },
  { id: 6, nom: 'Sow Mariam', classe: '4e A', statut: 'present', heureArrivee: '07:55', motif: '' },
  { id: 7, nom: 'Diop Souleymane', classe: '4e B', statut: 'retard', heureArrivee: '08:30', motif: 'Bouchon' },
  { id: 8, nom: 'Ndiaye Fatma', classe: '4e B', statut: 'present', heureArrivee: '07:48', motif: '' },
  { id: 9, nom: 'Ba Ousmane', classe: '3e A', statut: 'absent', heureArrivee: '', motif: 'Convocation' },
  { id: 10, nom: 'Sylla Aïcha', classe: '3e A', statut: 'present', heureArrivee: '07:44', motif: '' },
];

const getStatutIcon = (statut) => {
  switch (statut) {
    case 'present': return <CheckCircle className="h-4 w-4" />;
    case 'retard': return <Clock className="h-4 w-4" />;
    case 'absent': return <XCircle className="h-4 w-4" />;
    default: return null;
  }
};

const getStatutClass = (statut) => {
  switch (statut) {
    case 'present': return 'text-emerald-600';
    case 'retard': return 'text-amber-600';
    case 'absent': return 'text-red-600';
    default: return '';
  }
};

export default function PresencesPage() {
  const [search, setSearch] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const today = new Date();

  const stats = useMemo(() => ({
    total: PRESENCES.length,
    presents: PRESENCES.filter((p) => p.statut === 'present').length,
    retards: PRESENCES.filter((p) => p.statut === 'retard').length,
    absents: PRESENCES.filter((p) => p.statut === 'absent').length,
  }), []);

  const filtered = useMemo(() =>
    PRESENCES.filter((p) => {
      if (search && !p.nom.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterClasse && p.classe !== filterClasse) return false;
      if (filterStatut && p.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterClasse, filterStatut]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Présences</h1>
          <p className="text-sm text-neutral-500">Suivi des présences du {formatDate(today)}</p>
        </div>
        <Button variant="outline" size="sm" icon={<Download />}>Exporter</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total" value={String(stats.total)} icon={Users} color="indigo" />
        <StatsCard title="Présents" value={String(stats.presents)} icon={CheckCircle} color="emerald" />
        <StatsCard title="Retards" value={String(stats.retards)} icon={Clock} color="amber" />
        <StatsCard title="Absents" value={String(stats.absents)} icon={XCircle} color="red" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un élève..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterClasse}
            onChange={(e) => setFilterClasse(e.target.value)}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">Toutes les classes</option>
            {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">Tous les statuts</option>
            <option value="present">Présent</option>
            <option value="retard">Retard</option>
            <option value="absent">Absent</option>
          </select>
        </div>
      </Card>

      {/* Tableau */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Élève</th>
                <th className="pb-3 pr-4">Classe</th>
                <th className="pb-3 pr-4">Statut</th>
                <th className="pb-3 pr-4">Heure</th>
                <th className="pb-3 pr-4">Motif</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-neutral-500">
                    Aucune présence trouvée
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.nom} size="sm" />
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{p.nom}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant="outline" size="sm">{p.classe}</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={cn('inline-flex items-center gap-1 text-sm font-medium', getStatutClass(p.statut))}>
                      {getStatutIcon(p.statut)}
                      <span className="capitalize">{p.statut === 'retard' ? 'Retard' : p.statut}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {p.heureArrivee || '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-500 italic">{p.motif || '—'}</span>
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="sm">Modifier</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
