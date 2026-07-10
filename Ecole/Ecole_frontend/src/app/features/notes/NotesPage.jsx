/**
 * NotesPage — données réelles depuis l'API
 *
 * Fonctions : liste, filtres, stats, export XLSX, verrouillage, classement
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Search, Download, Plus, TrendingUp, TrendingDown, Award,
  FileSpreadsheet, RefreshCw, Lock, Unlock, Trophy,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useApiQuery, api } from '@/shared/lib/api-client';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import Input from '@/shared/components/ui/Input';
import { Skeleton } from '@/shared/components/ui/Skeleton';

export default function NotesPage() {
  const [search, setSearch] = useState('');
  const [filterMatiere, setFilterMatiere] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [tab, setTab] = useState('notes'); // 'notes' | 'classement'
  const [classementClasse, setClassementClasse] = useState('');
  const [classementPeriode, setClassementPeriode] = useState('Semestre 1');

  const { data: notesData, isLoading, error, refetch } = useApiQuery(
    ['notes'],
    '/notes/eleve',
  );

  const classementClasseId = classementClasse ? classMap.get(classementClasse) : null;

  const { data: classementData, isLoading: classementLoading, refetch: refetchClassement } = useApiQuery(
    ['classement', classementClasseId, classementPeriode],
    classementClasseId ? `/notes/classement/${classementClasseId}/${classementPeriode}` : null,
    { queryOptions: { enabled: !!classementClasseId } },
  );

  const notes = notesData?.data ?? notesData ?? [];

  const matiereMap = useMemo(() => {
    const map = new Map();
    notes.forEach((n) => {
      if (n.matiere?.id && n.matiere?.nom) {
        map.set(n.matiere.nom, n.matiere.id);
      }
    });
    return map;
  }, [notes]);
  const matieres = useMemo(() => [...matiereMap.keys()], [matiereMap]);
  const classMap = useMemo(() => {
    const map = new Map();
    notes.forEach((n) => {
      if (n.classe?.id && n.classe?.nom_classe) {
        map.set(n.classe.nom_classe, n.classe.id);
      }
    });
    return map;
  }, [notes]);
  const classes = useMemo(() => [...classMap.keys()], [classMap]);

  const filtered = useMemo(() =>
    notes.filter((n) => {
      const nomEleve = `${n.eleve?.user?.name ?? ''} ${n.eleve?.user?.prenom ?? ''}`.toLowerCase();
      if (search && !nomEleve.includes(search.toLowerCase())) return false;
      if (filterMatiere && n.matiere?.nom !== filterMatiere) return false;
      if (filterClasse && n.classe?.nom_classe !== filterClasse) return false;
      return true;
    }),
    [notes, search, filterMatiere, filterClasse]
  );

  const moyenneGenerale = notes.length > 0
    ? (notes.reduce((a, n) => a + parseFloat(n.note ?? 0), 0) / notes.length).toFixed(1)
    : '—';

  const tauxReussite = notes.length > 0
    ? Math.round((notes.filter((n) => parseFloat(n.note) >= 10).length / notes.length) * 100)
    : 0;

  const handleExport = () => {
    const params = new URLSearchParams();
    const filterClasseId = filterClasse ? classMap.get(filterClasse) : null;
    const filterMatiereId = filterMatiere ? matiereMap.get(filterMatiere) : null;
    if (filterClasseId) params.set('classe_id', filterClasseId);
    if (filterMatiereId) params.set('matiere_id', filterMatiereId);
    const qs = params.toString();
    window.open(`/api/notes/export${qs ? `?${qs}` : ''}`, '_blank');
  };

  const handleLock = async (id, currentlyLocked) => {
    try {
      await api.post(`/notes/${id}/${currentlyLocked ? 'unlock' : 'lock'}`);
      refetch();
    } catch {
      // handled by toast or interceptor
    }
  };

  const classement = classementData?.data;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Notes</h1>
          <p className="text-sm text-neutral-500">Consultez et gérez les notes des élèves</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          <Button variant="outline" size="sm" icon={<FileSpreadsheet />} onClick={handleExport}>
            Exporter
          </Button>
          <Button variant="outline" size="sm" icon={<Download />}>Importer</Button>
          <Button size="sm" icon={<Plus />}>Nouvelle Note</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Moyenne Générale" value={`${moyenneGenerale}/20`} icon={Award} color="primary" />
        <StatsCard title="Total Évaluations" value={String(notes.length)} icon={BookOpen} color="emerald" />
        <StatsCard title="Taux de Réussite" value={`${tauxReussite}%`} icon={TrendingUp} color="sky" />
        <StatsCard title="Échecs" value={`${100 - tauxReussite}%`} icon={TrendingDown} color="red" />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setTab('notes')}
          className={cn(
            'pb-2 text-sm font-medium border-b-2 transition-colors',
            tab === 'notes'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          )}
        >
          <BookOpen className="h-4 w-4 inline mr-1.5" />
          Notes
        </button>
        <button
          onClick={() => setTab('classement')}
          className={cn(
            'pb-2 text-sm font-medium border-b-2 transition-colors',
            tab === 'classement'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          )}
        >
          <Trophy className="h-4 w-4 inline mr-1.5" />
          Classement
        </button>
      </div>

      {/* Tab: Notes */}
      {tab === 'notes' && (
        <>
          {/* Filters */}
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
                className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-700 outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
              >
                <option value="">Toutes les classes</option>
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={filterMatiere}
                onChange={(e) => setFilterMatiere(e.target.value)}
                className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-700 outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
              >
                <option value="">Toutes les matières</option>
                {matieres.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </Card>

          {/* Table */}
          <Card padding={false}>
            {error && (
              <div className="p-6 text-center text-sm text-red-500">
                Erreur : {error.message ?? 'Impossible de récupérer les notes'}
              </div>
            )}
            <Table>
              <Table.Header>
                <Table.Head>Élève</Table.Head>
                <Table.Head>Classe</Table.Head>
                <Table.Head>matière</Table.Head>
                <Table.Head>Note</Table.Head>
                <Table.Head>Type</Table.Head>
                <Table.Head>Période</Table.Head>
                <Table.Head>Date</Table.Head>
                <Table.Head className="text-center">Statut</Table.Head>
                <Table.Head className="text-right">Action</Table.Head>
              </Table.Header>
              <Table.Body>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                  <Table.Row key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <Table.Cell key={j}><Skeleton className="h-4 w-full" /></Table.Cell>
                    ))}
                  </Table.Row>
                ))}
                {!isLoading && filtered.length === 0 && (
                  <Table.Row>
                    <td colSpan={9} className="p-8 text-center text-sm text-neutral-500">
                      Aucune note trouvée
                    </td>
                  </Table.Row>
                )}
                {!isLoading && filtered.map((n) => (
                  <Table.Row key={n.id}>
                    <Table.Cell>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {n.eleve?.user?.name} {n.eleve?.user?.prenom}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant="outline">{n.classe?.nom_classe ?? '—'}</Badge>
                    </Table.Cell>
                    <Table.Cell>{n.matiere?.nom ?? '—'}</Table.Cell>
                    <Table.Cell>
                      <span className={cn(
                        'font-semibold text-lg',
                        parseFloat(n.note) >= 14 ? 'text-emerald-500'
                          : parseFloat(n.note) >= 10 ? 'text-amber-500'
                          : 'text-red-500'
                      )}>
                        {n.note}/{n.note_sur ?? 20}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant="info" size="sm">{n.type_evaluation}</Badge>
                    </Table.Cell>
                    <Table.Cell className="text-xs text-neutral-500">{n.periode}</Table.Cell>
                    <Table.Cell className="text-xs text-neutral-500">{n.date_evaluation}</Table.Cell>
                    <Table.Cell className="text-center">
                      {n.locked ? (
                        <Lock className="h-4 w-4 text-amber-500 mx-auto" title="Verrouillée" />
                      ) : (
                        <Unlock className="h-4 w-4 text-neutral-300 mx-auto" title="Déverrouillée" />
                      )}
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      <button
                        onClick={() => handleLock(n.id, n.locked)}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          n.locked
                            ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                            : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        )}
                        title={n.locked ? 'Déverrouiller' : 'Verrouiller'}
                      >
                        {n.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Card>
        </>
      )}

      {/* Tab: Classement */}
      {tab === 'classement' && (
        <Card>
          <div className="p-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                <Trophy className="h-5 w-5 inline mr-2 text-amber-500" />
                Classement des élèves
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={classementClasse}
                  onChange={(e) => setClassementClasse(e.target.value)}
                  className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-700 outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={classementPeriode}
                  onChange={(e) => setClassementPeriode(e.target.value)}
                  className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-700 outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                >
                  <option value="Semestre 1">Semestre 1</option>
                  <option value="Semestre 2">Semestre 2</option>
                </select>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={refetchClassement}
                  disabled={!classementClasse || classementLoading}
                >
                  <RefreshCw className={cn('h-4 w-4', classementLoading && 'animate-spin')} />
                </Button>
              </div>
            </div>

            {!classementClasse && (
              <div className="py-12 text-center text-sm text-neutral-500">
                Sélectionnez une classe et une période pour voir le classement
              </div>
            )}

            {classementLoading && (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            )}

            {classement && !classementLoading && (
              <>
                <div className="text-sm text-neutral-500 mb-2">
                  {classement.classe} · {classement.periode} · {classement.effectif} élèves
                </div>
                <Table>
                  <Table.Header>
                    <Table.Head className="w-12">Rang</Table.Head>
                    <Table.Head>Élève</Table.Head>
                    <Table.Head>Matricule</Table.Head>
                    <Table.Head className="text-right">Moyenne</Table.Head>
                    <Table.Head className="text-right">Notes</Table.Head>
                  </Table.Header>
                  <Table.Body>
                    {classement.classement?.map((row) => (
                      <Table.Row
                        key={row.eleve_id}
                        className={cn(
                          row.rang === 1 && 'bg-amber-50 dark:bg-amber-900/10',
                          row.rang === 2 && 'bg-neutral-50 dark:bg-neutral-800/30',
                          row.rang === 3 && 'bg-orange-50 dark:bg-orange-900/10',
                        )}
                      >
                        <Table.Cell>
                          <span className={cn(
                            'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                            row.rang === 1 ? 'bg-amber-200 text-amber-800 dark:bg-amber-600 dark:text-amber-100'
                              : row.rang === 2 ? 'bg-neutral-300 text-neutral-800 dark:bg-neutral-600 dark:text-neutral-100'
                              : row.rang === 3 ? 'bg-orange-200 text-orange-800 dark:bg-orange-600 dark:text-orange-100'
                              : 'text-neutral-500'
                          )}>
                            {row.rang}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="font-medium text-neutral-900 dark:text-white">
                            {row.nom} {row.prenom}
                          </span>
                        </Table.Cell>
                        <Table.Cell className="text-xs text-neutral-400 font-mono">{row.matricule}</Table.Cell>
                        <Table.Cell className="text-right">
                          <span className={cn(
                            'font-bold text-lg',
                            row.moyenne >= 14 ? 'text-emerald-500'
                              : row.moyenne >= 10 ? 'text-amber-500'
                              : 'text-red-500'
                          )}>
                            {row.moyenne.toFixed(2)}
                          </span>
                        </Table.Cell>
                        <Table.Cell className="text-right text-sm text-neutral-500">{row.total_notes}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </>
            )}
          </div>
        </Card>
      )}
    </motion.div>
  );
}
