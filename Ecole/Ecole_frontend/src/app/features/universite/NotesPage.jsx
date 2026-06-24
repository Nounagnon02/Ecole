/**
 * NotesPage — Gestion des notes universitaires
 *
 * Module université : saisie et consultation des notes.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap, Search, Filter, Plus, Download, Clock, CheckCircle,
  AlertCircle, TrendingUp, Eye, FileText,
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const NOTES = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  etudiant: ['Diallo Amadou', 'Touré Fatou', 'Koné Moussa', 'Cissé Inza', 'Traoré Kadiatou', 'Sow Mariam', 'Diop Souleymane', 'Ndiaye Fatma', 'Ba Ousmane', 'Sylla Aïcha', 'Faye Cheikh', 'Gueye Ndeye'][i],
  matricule: `ETU${String(2024000 + i).slice(-6)}`,
  cours: ['Algèbre Linéaire', 'Algèbre Linéaire', 'Mécanique Quantique', 'Mécanique Quantique', 'Littérature Comparée', 'Littérature Comparée', 'Droit des Contrats', 'Droit des Contrats', 'Microéconomie', 'Microéconomie', 'Analyse Numérique', 'Analyse Numérique'][i],
  note: [14, 12, 16, 8, 15, 10, 13, 17, 11, 9, 15, 6][i],
  sur: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20][i],
  coefficient: [2, 2, 3, 3, 2, 2, 2, 2, 3, 3, 2, 2][i],
  semestre: 'S1',
  date: new Date(Date.now() - 86400000 * (5 + i * 2)),
  statut: ['validee', 'validee', 'validee', 'en_attente', 'validee', 'validee', 'validee', 'validee', 'en_attente', 'validee', 'validee', 'en_attente'][i],
}));

const getNoteColor = (note, sur) => {
  const pct = (note / sur) * 100;
  if (pct >= 70) return 'text-emerald-600';
  if (pct >= 50) return 'text-amber-600';
  return 'text-red-600';
};

export default function NotesPage() {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const stats = useMemo(() => {
    const validees = NOTES.filter((n) => n.statut === 'validee');
    const moyenne = validees.length > 0 ? validees.reduce((s, n) => s + (n.note / n.sur) * 100, 0) / validees.length : 0;
    return {
      total: NOTES.length,
      validees: validees.length,
      enAttente: NOTES.filter((n) => n.statut === 'en_attente').length,
      moyenne: moyenne.toFixed(1),
    };
  }, []);

  const filtered = useMemo(() =>
    NOTES.filter((n) => {
      if (search && !n.etudiant.toLowerCase().includes(search.toLowerCase()) && !n.cours.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatut && n.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterStatut]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Notes</h1>
          <p className="text-sm text-neutral-500">Saisie et consultation des notes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Download />}>Exporter</Button>
          <Button size="sm" icon={<Plus />}>Ajouter une note</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total Notes" value={String(stats.total)} icon={GraduationCap} color="indigo" />
        <StatsCard title="Validées" value={String(stats.validees)} icon={CheckCircle} color="emerald" />
        <StatsCard title="En attente" value={String(stats.enAttente)} icon={Clock} color="amber" />
        <StatsCard title="Moyenne" value={`${stats.moyenne}%`} icon={TrendingUp} color="sky" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher par étudiant ou cours..."
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
            <option value="validee">Validée</option>
            <option value="en_attente">En attente</option>
          </select>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Étudiant</th>
                <th className="pb-3 pr-4">Matricule</th>
                <th className="pb-3 pr-4">Cours</th>
                <th className="pb-3 pr-4">Note</th>
                <th className="pb-3 pr-4">Coefficient</th>
                <th className="pb-3 pr-4">Semestre</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Statut</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-neutral-500">
                    Aucune note trouvée
                  </td>
                </tr>
              )}
              {filtered.map((n) => (
                <tr key={n.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={n.etudiant} size="sm" />
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{n.etudiant}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">{n.matricule}</td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">{n.cours}</td>
                  <td className="py-3 pr-4">
                    <span className={cn('text-lg font-bold', getNoteColor(n.note, n.sur))}>
                      {n.note}
                    </span>
                    <span className="text-xs text-neutral-400">/{n.sur}</span>
                  </td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">x{n.coefficient}</td>
                  <td className="py-3 pr-4"><Badge variant="outline" size="sm">{n.semestre}</Badge></td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">{formatDate(n.date)}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={n.statut === 'validee' ? 'primary' : 'warning'} size="sm">
                      {n.statut === 'validee' ? 'Validée' : 'En attente'}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="sm" icon={<Eye />} title="Voir" />
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
