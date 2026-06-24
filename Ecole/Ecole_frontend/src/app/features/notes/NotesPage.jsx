/**
 * NotesPage — Gestion des notes et évaluations
 *
 * Consultable par tous les rôles authentifiés.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Search, Filter, Download, Plus, BarChart3,
  TrendingUp, TrendingDown, Award, FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import Input from '@/shared/components/ui/Input';

const NOTES = Array.from({ length: 20 }, (_, i) => ({
  id: `N-${i + 1}`,
  eleve: ['Diallo Aminata', 'Touré Fatoumata', 'Koné Moussa', 'Traoré Kadiatou', 'Cissé Ibrahima'][i % 5],
  matiere: ['Mathématiques', 'Français', 'Anglais', 'Physique', 'SVT', 'Histoire', 'EPS'][i % 7],
  classe: ['6e A', '5e B', '4e A', '3e C'][i % 4],
  note: Math.round((5 + Math.random() * 15) * 10) / 10,
  coefficient: [2, 3, 2, 4, 2, 2, 1][i % 7],
  trimestre: '1er Trimestre',
  date: `2026-0${3 + (i % 3)}-${String(10 + (i % 15)).padStart(2, '0')}`,
  appreciation: ['Excellent travail', 'Bonnes capacités', 'Peut mieux faire', 'Efforts remarqués', 'Résultats satisfaisants'][i % 5],
}));

const MATIERES = [...new Set(NOTES.map((n) => n.matiere))];
const CLASSES = [...new Set(NOTES.map((n) => n.classe))];

export default function NotesPage() {
  const [search, setSearch] = useState('');
  const [filterMatiere, setFilterMatiere] = useState('');
  const [filterClasse, setFilterClasse] = useState('');

  const filtered = useMemo(() =>
    NOTES.filter((n) => {
      if (search && !n.eleve.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterMatiere && n.matiere !== filterMatiere) return false;
      if (filterClasse && n.classe !== filterClasse) return false;
      return true;
    }),
    [search, filterMatiere, filterClasse]
  );

  const moyenneGenerale = (NOTES.reduce((a, n) => a + n.note, 0) / NOTES.length).toFixed(1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Notes</h1>
          <p className="text-sm text-neutral-500">Consultez et gérez les notes des élèves</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<FileSpreadsheet />}>
            Importer
          </Button>
          <Button size="sm" icon={<Plus />}>
            Nouvelle Note
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Moyenne Générale" value={`${moyenneGenerale}/20`} icon={Award} trend={2.3} color="indigo" />
        <StatsCard title="Total Évaluations" value="1 432" icon={BookOpen} trend={15} color="emerald" />
        <StatsCard title="Taux de Réussite" value="76%" icon={TrendingUp} trend={4.1} color="sky" />
        <StatsCard title="Échecs" value="24%" icon={TrendingDown} trend={-3.5} color="red" />
      </div>

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
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-700 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">Toutes les classes</option>
            {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterMatiere}
            onChange={(e) => setFilterMatiere(e.target.value)}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-700 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">Toutes les matières</option>
            {MATIERES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </Card>

      <Card padding={false}>
        <Table>
          <Table.Header>
            <Table.Head>Élève</Table.Head>
            <Table.Head>Classe</Table.Head>
            <Table.Head>Matière</Table.Head>
            <Table.Head>Note</Table.Head>
            <Table.Head>Coeff.</Table.Head>
            <Table.Head>Appréciation</Table.Head>
            <Table.Head>Date</Table.Head>
          </Table.Header>
          <Table.Body>
            {filtered.length === 0 && (
              <Table.Row>
                <td colSpan={7} className="p-8 text-center text-sm text-neutral-500">
                  Aucune note trouvée
                </td>
              </Table.Row>
            )}
            {filtered.map((n) => (
              <Table.Row key={n.id}>
                <Table.Cell>
                  <span className="font-medium text-neutral-900 dark:text-white">{n.eleve}</span>
                </Table.Cell>
                <Table.Cell><Badge variant="outline">{n.classe}</Badge></Table.Cell>
                <Table.Cell>{n.matiere}</Table.Cell>
                <Table.Cell>
                  <span className={cn(
                    'font-semibold text-lg',
                    n.note >= 14 ? 'text-emerald-500' : n.note >= 10 ? 'text-amber-500' : 'text-red-500'
                  )}>
                    {n.note}
                  </span>
                </Table.Cell>
                <Table.Cell><span className="text-xs text-neutral-500">×{n.coefficient}</span></Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{n.appreciation}</span>
                </Table.Cell>
                <Table.Cell className="text-xs text-neutral-500">{n.date}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>
    </motion.div>
  );
}
