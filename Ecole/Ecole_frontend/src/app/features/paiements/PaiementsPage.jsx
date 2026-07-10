/**
 * PaiementsPage — données réelles depuis l'API
 *
 * Fonctions : liste, filtre, stats, reçu PDF, échéancier élèves
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Search, Download, Plus, CreditCard,
  TrendingUp, TrendingDown, Receipt, RefreshCw, Calendar, Eye,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { formatCurrency } from '@/shared/lib/utils';
import { useApiQuery, api } from '@/shared/lib/api-client';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import Input from '@/shared/components/ui/Input';
import { Skeleton } from '@/shared/components/ui/Skeleton';

const STATUT_COLORS = {
  paye: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  payé: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  en_attente: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  'en attente': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  echec: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  remboursé: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-400',
};

export default function PaiementsPage() {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [tab, setTab] = useState('paiements'); // 'paiements' | 'echeancier'
  const [echeanceSearch, setEcheanceSearch] = useState('');
  const [echeanceEleve, setEcheanceEleve] = useState(null);
  const [echeanceData, setEcheanceData] = useState(null);
  const [echeanceLoading, setEcheanceLoading] = useState(false);

  const { data: paiementsData, isLoading, error, refetch } = useApiQuery(
    ['paiements'],
    '/comptable/paiements',
  );

  const paiements = paiementsData?.data ?? paiementsData ?? [];

  const filtered = useMemo(() =>
    paiements.filter((p) => {
      const nomEleve = `${p.eleve?.user?.name ?? ''} ${p.eleve?.user?.prenom ?? ''}`.toLowerCase();
      if (search && !nomEleve.includes(search.toLowerCase())) return false;
      if (filterStatut && p.statut !== filterStatut) return false;
      return true;
    }),
    [paiements, search, filterStatut]
  );

  const totalPaye = paiements
    .filter((p) => ['paye', 'payé'].includes(p.statut))
    .reduce((a, p) => a + parseFloat(p.montant ?? 0), 0);

  const totalTransactions = paiements.length;
  const payes = paiements.filter((p) => ['paye', 'payé'].includes(p.statut)).length;
  const tauxEncaisse = totalTransactions > 0 ? Math.round((payes / totalTransactions) * 100) : 0;

  const handleRecu = (id) => {
    window.open(`/api/comptable/paiements/${id}/recu`, '_blank');
  };

  // Liste unique des élèves pour l'échéancier
  const eleveList = useMemo(() => {
    const map = new Map();
    paiements.forEach((p) => {
      const id = p.eleve?.id;
      const name = `${p.eleve?.user?.name ?? ''} ${p.eleve?.user?.prenom ?? ''}`.trim();
      if (id && name) map.set(id, { id, name, classe: p.eleve?.classe?.nom_classe ?? '' });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [paiements]);

  const filteredEleves = useMemo(() =>
    echeanceSearch
      ? eleveList.filter((e) => e.name.toLowerCase().includes(echeanceSearch.toLowerCase()))
      : eleveList,
    [eleveList, echeanceSearch]
  );

  const loadEcheancier = async (eleveId) => {
    setEcheanceEleve(eleveId);
    setEcheanceLoading(true);
    try {
      const res = await api.get(`/comptable/echeancier/${eleveId}`);
      setEcheanceData(res.data?.data ?? null);
    } catch {
      setEcheanceData(null);
    } finally {
      setEcheanceLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Paiements</h1>
          <p className="text-sm text-neutral-500">Gestion des transactions financières</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          <Button variant="outline" size="sm" icon={<Receipt />}>Factures</Button>
          <Button variant="outline" size="sm" icon={<Download />}>Exporter</Button>
          <Button size="sm" icon={<Plus />}>Nouveau Paiement</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Revenus Encaissés" value={formatCurrency(totalPaye)} icon={DollarSign} color="primary" />
        <StatsCard title="Transactions" value={String(totalTransactions)} icon={CreditCard} color="emerald" />
        <StatsCard title="Taux d'Encaisse" value={`${tauxEncaisse}%`} icon={TrendingUp} color="sky" />
        <StatsCard title="Impayés" value={`${100 - tauxEncaisse}%`} icon={TrendingDown} color="red" />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setTab('paiements')}
          className={cn(
            'pb-2 text-sm font-medium border-b-2 transition-colors',
            tab === 'paiements'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          )}
        >
          <CreditCard className="h-4 w-4 inline mr-1.5" />
          Paiements
        </button>
        <button
          onClick={() => setTab('echeancier')}
          className={cn(
            'pb-2 text-sm font-medium border-b-2 transition-colors',
            tab === 'echeancier'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          )}
        >
          <Calendar className="h-4 w-4 inline mr-1.5" />
          Échéancier
        </button>
      </div>

      {/* Tab: Paiements */}
      {tab === 'paiements' && (
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
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
              >
                <option value="">Tous les statuts</option>
                <option value="paye">Payé</option>
                <option value="en_attente">En attente</option>
                <option value="echec">Échec</option>
              </select>
            </div>
          </Card>

          {/* Table */}
          <Card padding={false}>
            {error && (
              <div className="p-6 text-center text-sm text-red-500">
                Erreur : {error.message ?? 'Impossible de récupérer les paiements'}
              </div>
            )}
            <Table>
              <Table.Header>
                <Table.Head>Référence</Table.Head>
                <Table.Head>Élève</Table.Head>
                <Table.Head>Type</Table.Head>
                <Table.Head>Montant</Table.Head>
                <Table.Head>Date</Table.Head>
                <Table.Head>Statut</Table.Head>
                <Table.Head className="text-right">Reçu</Table.Head>
              </Table.Header>
              <Table.Body>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                  <Table.Row key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <Table.Cell key={j}><Skeleton className="h-4 w-full" /></Table.Cell>
                    ))}
                  </Table.Row>
                ))}
                {!isLoading && filtered.length === 0 && (
                  <Table.Row>
                    <td colSpan={7} className="p-8 text-center text-sm text-neutral-500">
                      Aucun paiement trouvé
                    </td>
                  </Table.Row>
                )}
                {!isLoading && filtered.map((p) => (
                  <Table.Row key={p.id}>
                    <Table.Cell className="text-xs font-mono text-neutral-500">
                      {p.reference ?? `PAY-${p.id}`}
                    </Table.Cell>
                    <Table.Cell>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {p.eleve?.user?.name} {p.eleve?.user?.prenom}
                      </span>
                      <span className="ml-2 text-xs text-neutral-500">
                        {p.eleve?.classe?.nom_classe}
                      </span>
                    </Table.Cell>
                    <Table.Cell>{p.type_paiement}</Table.Cell>
                    <Table.Cell>
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {formatCurrency(p.montant)}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="text-xs text-neutral-500">{p.date_paiement}</Table.Cell>
                    <Table.Cell>
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        STATUT_COLORS[p.statut] ?? STATUT_COLORS.en_attente
                      )}>
                        {p.statut}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      <button
                        onClick={() => handleRecu(p.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
                        title="Voir le reçu"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Card>
        </>
      )}

      {/* Tab: Échéancier */}
      {tab === 'echeancier' && (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Liste des élèves */}
          <Card>
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Rechercher un élève..."
                  value={echeanceSearch}
                  onChange={(e) => setEcheanceSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {filteredEleves.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => loadEcheancier(e.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                      echeanceEleve === e.id
                        ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-medium'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    )}
                  >
                    {e.name}
                    <span className="ml-2 text-xs text-neutral-400">{e.classe}</span>
                  </button>
                ))}
                {filteredEleves.length === 0 && (
                  <p className="text-sm text-neutral-500 text-center py-4">Aucun élève trouvé</p>
                )}
              </div>
            </div>
          </Card>

          {/* Détail échéancier */}
          <Card>
            <div className="p-4">
              {!echeanceEleve && (
                <div className="py-16 text-center text-sm text-neutral-500">
                  Sélectionnez un élève pour voir son échéancier
                </div>
              )}

              {echeanceLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              )}

              {echeanceData && !echeanceLoading && (
                <div className="space-y-4">
                  {/* Résumé */}
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[140px] rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
                      <p className="text-xs text-neutral-500">Total dû</p>
                      <p className="text-lg font-bold text-neutral-900 dark:text-white">
                        {formatCurrency(echeanceData.resume.total_du)}
                      </p>
                    </div>
                    <div className="flex-1 min-w-[140px] rounded-xl border border-emerald-200 dark:border-emerald-800 p-3">
                      <p className="text-xs text-neutral-500">Payé</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {formatCurrency(echeanceData.resume.total_paye)}
                      </p>
                    </div>
                    <div className="flex-1 min-w-[140px] rounded-xl border border-amber-200 dark:border-amber-800 p-3">
                      <p className="text-xs text-neutral-500">Solde</p>
                      <p className="text-lg font-bold text-amber-600">
                        {formatCurrency(echeanceData.resume.solde)}
                      </p>
                    </div>
                    <div className="flex-1 min-w-[140px] rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
                      <p className="text-xs text-neutral-500">Échéances</p>
                      <p className="text-lg font-bold text-neutral-900 dark:text-white">
                        {echeanceData.resume.nb_payees}/{echeanceData.resume.nb_echeances}
                      </p>
                    </div>
                  </div>

                  {/* Info élève */}
                  <div className="text-sm">
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {echeanceData.eleve.nom}
                    </span>
                    <span className="ml-2 text-neutral-500">{echeanceData.eleve.classe}</span>
                    <span className="ml-2 text-xs text-neutral-400 font-mono">· {echeanceData.eleve.matricule}</span>
                  </div>

                  {/* Tableau des échéances */}
                  <Table>
                    <Table.Header>
                      <Table.Head>Référence</Table.Head>
                      <Table.Head>Type</Table.Head>
                      <Table.Head>Montant</Table.Head>
                      <Table.Head>Date</Table.Head>
                      <Table.Head>Statut</Table.Head>
                      <Table.Head className="text-right">Reçu</Table.Head>
                    </Table.Header>
                    <Table.Body>
                      {echeanceData.echeances.length === 0 && (
                        <Table.Row>
                          <td colSpan={6} className="p-8 text-center text-sm text-neutral-500">
                            Aucune échéance
                          </td>
                        </Table.Row>
                      )}
                      {echeanceData.echeances.map((e) => (
                        <Table.Row key={e.id}>
                          <Table.Cell className="text-xs font-mono text-neutral-500">{e.reference}</Table.Cell>
                          <Table.Cell>{e.type}</Table.Cell>
                          <Table.Cell className="font-semibold text-neutral-900 dark:text-white">
                            {formatCurrency(e.montant)}
                          </Table.Cell>
                          <Table.Cell className="text-xs text-neutral-500">{e.date}</Table.Cell>
                          <Table.Cell>
                            <span className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                              STATUT_COLORS[e.statut] ?? STATUT_COLORS.en_attente
                            )}>
                              {e.statut}
                            </span>
                          </Table.Cell>
                          <Table.Cell className="text-right">
                            <button
                              onClick={() => handleRecu(e.id)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
                              title="Voir le reçu"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
