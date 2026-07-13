/**
 * ElevesPage — données réelles depuis l'API
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Search, Download, Plus, GraduationCap,
  MoreHorizontal, UserCheck, UserX, RefreshCw,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useApiQuery } from '@/shared/lib/api-client';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import Input from '@/shared/components/ui/Input';
import { Skeleton } from '@/shared/components/ui/Skeleton';

const STATUT_COLORS = {
  actif: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  inactif: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-400',
  suspendu: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

export default function ElevesPage() {
  const [search, setSearch] = useState('');
  const [filterClasse, setFilterClasse] = useState('');

  const { data: elevesData, isLoading, error, refetch } = useApiQuery(
    ['eleves'],
    '/eleves',
  );

  const eleves = elevesData?.data ?? elevesData ?? [];

  const classes = useMemo(() => [...new Set(eleves.map((e) => e.classe?.nom_classe).filter(Boolean))], [eleves]);

  const filtered = useMemo(() =>
    eleves.filter((e) => {
      const nom = `${e.user?.name ?? ''} ${e.user?.prenom ?? ''}`.toLowerCase();
      if (search && !nom.includes(search.toLowerCase())) return false;
      if (filterClasse && e.classe?.nom_classe !== filterClasse) return false;
      return true;
    }),
    [eleves, search, filterClasse]
  );

  const actifs = eleves.filter((e) => e.user?.is_active !== false).length;
  const inactifs = eleves.length - actifs;
  const moyenneGenerale = eleves.length > 0
    ? (eleves.reduce((acc, e) => acc + (e.moyenne ?? 0), 0) / eleves.length).toFixed(1)
    : '—';

  const STATS = [
    { title: 'Total Élèves', value: String(eleves.length), icon: Users, color: 'primary' },
    { title: 'Actifs', value: String(actifs), icon: UserCheck, color: 'emerald' },
    { title: 'Inactifs', value: String(inactifs), icon: UserX, color: 'amber' },
    { title: 'Moyenne Générale', value: `${moyenneGenerale}/20`, icon: GraduationCap, color: 'sky' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Élèves</h1>
          <p className="text-sm text-neutral-500">Gérez l'ensemble des élèves inscrits</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-1', isLoading && 'animate-spin')} />
          </Button>
          <Button variant="outline" size="sm" icon={<Download />}>Exporter</Button>
          <Button size="sm" icon={<Plus />}>Nouvel Élève</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

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
          <select
            value={filterClasse}
            onChange={(e) => setFilterClasse(e.target.value)}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-700 outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">Toutes les classes</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </Card>

      <Card padding={false}>
        {error && (
          <div className="p-6 text-center text-sm text-red-500">
            Erreur de chargement : {error.message ?? 'Impossible de récupérer les élèves'}
          </div>
        )}
        <Table>
          <Table.Header>
            <Table.Head>Élève</Table.Head>
            <Table.Head>Classe</Table.Head>
            <Table.Head>Matricule</Table.Head>
            <Table.Head>Statut</Table.Head>
            <Table.Head className="text-right">Actions</Table.Head>
          </Table.Header>
          <Table.Body>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <Table.Row key={i}>
                {Array.from({ length: 5 }).map((__, j) => (
                  <Table.Cell key={j}><Skeleton className="h-4 w-full" /></Table.Cell>
                ))}
              </Table.Row>
            ))}
            {!isLoading && filtered.length === 0 && (
              <Table.Row>
                <td colSpan={5} className="p-8 text-center text-sm text-neutral-500">
                  Aucun élève trouvé
                </td>
              </Table.Row>
            )}
            {!isLoading && filtered.map((eleve) => (
              <Table.Row key={eleve.id}>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    <Avatar name={`${eleve.user?.name ?? ''} ${eleve.user?.prenom ?? ''}`} size="sm" />
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {eleve.user?.name} {eleve.user?.prenom}
                      </p>
                      <p className="text-xs text-neutral-500">{eleve.user?.email}</p>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="outline">{eleve.classe?.nom_classe ?? '—'}</Badge>
                </Table.Cell>
                <Table.Cell className="text-xs font-mono text-neutral-500">
                  {eleve.numero_matricule ?? '—'}
                </Table.Cell>
                <Table.Cell>
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    eleve.user?.is_active !== false ? STATUT_COLORS.actif : STATUT_COLORS.inactif
                  )}>
                    {eleve.user?.is_active !== false ? 'actif' : 'inactif'}
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
