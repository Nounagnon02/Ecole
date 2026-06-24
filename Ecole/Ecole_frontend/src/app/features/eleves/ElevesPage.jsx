/**
 * ElevesPage — Gestion des élèves
 *
 * Vue centralisée pour tous les rôles autorisés (direction, enseignants, staff, parents).
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Search, Filter, Download, Plus, ChevronDown,
  GraduationCap, MoreHorizontal, Mail, Phone, Calendar,
  ArrowUpDown, UserCheck, UserX,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import Input from '@/shared/components/ui/Input';

/* ─── Mock data ──────────────────────────────────────────────────── */
const ELEVES = Array.from({ length: 24 }, (_, i) => ({
  id: `EL-${2024}${String(i + 1).padStart(4, '0')}`,
  nom: ['Diallo', 'Touré', 'Koné', 'Traoré', 'Cissé', 'Sow', 'N\'Diaye', 'Bah', 'Barry', 'Sidibé', 'Camara', 'Fofana'][i % 12],
  prenom: ['Aminata', 'Fatoumata', 'Moussa', 'Kadiatou', 'Ibrahima', 'Aïssatou', 'Oumar', 'Mariam', 'Souleymane', 'Hawa', 'Adama', 'Rokia'][i % 12],
  classe: ['6e A', '5e B', '4e A', '3e C', '2nde A', '1re D', 'Tle A', '6e B', '5e A', '4e B', '3e A', 'Tle C'][i % 12],
  sexe: i % 3 === 0 ? 'F' : i % 3 === 1 ? 'M' : 'F',
  dateNaissance: `20${10 + (i % 10)}-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`,
  parent: 'M. Koné',
  telephone: '+225 07 01 02 03 04',
  email: `eleve${i + 1}@ecole.ci`,
  statut: ['actif', 'actif', 'actif', 'inactif', 'suspendu'][i % 5],
  moyenne: Math.round((10 + Math.random() * 10) * 10) / 10,
}));

const STATS = [
  { title: 'Total Élèves', value: '1 284', icon: Users, trend: 12, trendLabel: 'vs année dernière', color: 'indigo' },
  { title: 'Actifs', value: '1 247', icon: UserCheck, trend: 3.2, trendLabel: 'ce trimestre', color: 'emerald' },
  { title: 'Inactifs', value: '37', icon: UserX, trend: -8.1, trendLabel: 'en baisse', color: 'amber' },
  { title: 'Moyenne Générale', value: '13,7/20', icon: GraduationCap, trend: 0.8, trendLabel: 'vs trimestre dernier', color: 'sky' },
];

const STATUT_COLORS = {
  actif: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  inactif: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-400',
  suspendu: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

export default function ElevesPage() {
  const [search, setSearch] = useState('');
  const [filterClasse, setFilterClasse] = useState('');

  const filtered = useMemo(() =>
    ELEVES.filter((e) => {
      if (search && !`${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterClasse && e.classe !== filterClasse) return false;
      return true;
    }),
    [search, filterClasse]
  );

  const classes = useMemo(() => [...new Set(ELEVES.map((e) => e.classe))], []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Élèves</h1>
          <p className="text-sm text-neutral-500">Gérez l'ensemble des élèves inscrits</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download />}>
            Exporter
          </Button>
          <Button size="sm" icon={<Plus />}>
            Nouvel Élève
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Filters */}
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
          <div className="flex items-center gap-2">
            <select
              value={filterClasse}
              onChange={(e) => setFilterClasse(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-700 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Toutes les classes</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <Table>
          <Table.Header>
            <Table.Head>Élève</Table.Head>
            <Table.Head>Classe</Table.Head>
            <Table.Head>Contact</Table.Head>
            <Table.Head>Moyenne</Table.Head>
            <Table.Head>Statut</Table.Head>
            <Table.Head className="text-right">Actions</Table.Head>
          </Table.Header>
          <Table.Body>
            {filtered.length === 0 && (
              <Table.Row>
                <td colSpan={6} className="p-8 text-center text-sm text-neutral-500">
                  Aucun élève trouvé
                </td>
              </Table.Row>
            )}
            {filtered.map((eleve) => (
              <Table.Row key={eleve.id}>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    <Avatar name={`${eleve.nom} ${eleve.prenom}`} size="sm" />
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {eleve.nom} {eleve.prenom}
                      </p>
                      <p className="text-xs text-neutral-500">{eleve.id}</p>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="outline">{eleve.classe}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="space-y-0.5">
                    <p className="text-xs text-neutral-500">{eleve.telephone}</p>
                    <p className="text-xs text-neutral-400">{eleve.email}</p>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <span className={cn(
                    'font-semibold',
                    eleve.moyenne >= 14 ? 'text-emerald-500' : eleve.moyenne >= 10 ? 'text-amber-500' : 'text-red-500'
                  )}>
                    {eleve.moyenne}/20
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', STATUT_COLORS[eleve.statut])}>
                    {eleve.statut}
                  </span>
                </Table.Cell>
                <Table.Cell className="text-right">
                  <Button variant="ghost" size="sm" icon={<MoreHorizontal />} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>
    </motion.div>
  );
}
