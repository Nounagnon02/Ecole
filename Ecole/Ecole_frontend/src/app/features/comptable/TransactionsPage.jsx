/**
 * TransactionsPage — Gestion des transactions financières
 *
 * Le comptable consulte et gère toutes les transactions de l'établissement.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Search, Filter, Download, Eye, FileText,
} from 'lucide-react';
import { cn, formatCurrency, formatDate, formatNumber } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const TRANSACTIONS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  reference: `TRX-${String(2025000 + i).slice(-6)}`,
  libelle: [
    'Frais scolarité Diallo A.',
    'Paiement cantine Touré F.',
    'Vente uniformes Koné M.',
    'Frais inscription Cissé I.',
    'Abonnement transport Traoré K.',
    'Frais scolarité Sow M.',
    'Paiement bibliothèque Diop S.',
    'Vente manuels Ndiaye F.',
    'Frais examen Ba O.',
    'Donation Association Parents',
    'Frais scolarité Sylla A.',
    'Location salle polyvalente',
    'Paiement stage Faye C.',
    'Frais transport Gueye N.',
    'Vente fournitures Diallo M.',
    'Frais inscription nouvelle élève',
    'Paiement cantine Touré A.',
    'Frais scolarité Koné S.',
    'Abonnement sportif Cissé M.',
    'Donation fondation école',
  ][i],
  montant: [150000, 25000, 35000, 75000, 30000, 150000, 5000, 45000, 10000, 200000, 150000, 50000, 20000, 30000, 12000, 75000, 25000, 150000, 35000, 500000][i],
  type: i < 15 ? 'recette' : 'depense',
  methode: ['Espèces', 'Mobile Money', 'Virement', 'Carte'][i % 4],
  date: new Date(Date.now() - 86400000 * i),
  statut: ['payee', 'payee', 'en_attente', 'payee', 'echec', 'payee', 'payee', 'payee', 'rembourse', 'payee', 'payee', 'en_attente', 'payee', 'payee', 'payee', 'payee', 'payee', 'echec', 'payee', 'payee'][i],
}));

const getStatutColor = (statut) => {
  switch (statut) {
    case 'payee': return 'primary';
    case 'en_attente': return 'warning';
    case 'echec': return 'danger';
    case 'rembourse': return 'ghost';
    default: return 'outline';
  }
};

const getStatutLabel = (statut) => {
  switch (statut) {
    case 'payee': return 'Payée';
    case 'en_attente': return 'En attente';
    case 'echec': return 'Échec';
    case 'rembourse': return 'Remboursé';
    default: return statut;
  }
};

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const stats = useMemo(() => {
    const recettes = TRANSACTIONS.filter((t) => t.type === 'recette' && t.statut === 'payee');
    const depenses = TRANSACTIONS.filter((t) => t.type === 'depense' && t.statut === 'payee');
    const totalRecettes = recettes.reduce((s, t) => s + t.montant, 0);
    const totalDepenses = depenses.reduce((s, t) => s + t.montant, 0);
    return { totalRecettes, totalDepenses, solde: totalRecettes - totalDepenses, transactions: TRANSACTIONS.length };
  }, []);

  const filtered = useMemo(() =>
    TRANSACTIONS.filter((t) => {
      if (search && !t.libelle.toLowerCase().includes(search.toLowerCase()) && !t.reference.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && t.type !== filterType) return false;
      if (filterStatut && t.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterType, filterStatut]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Transactions</h1>
        <p className="text-sm text-neutral-500">Toutes les transactions financières de l'établissement</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Recettes" value={formatCurrency(stats.totalRecettes)} icon={TrendingUp} color="emerald" />
        <StatsCard title="Dépenses" value={formatCurrency(stats.totalDepenses)} icon={TrendingDown} color="red" />
        <StatsCard title="Solde" value={formatCurrency(stats.solde)} icon={DollarSign} color={stats.solde >= 0 ? 'indigo' : 'red'} />
        <StatsCard title="Transactions" value={formatNumber(stats.transactions)} icon={FileText} color="sky" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher une transaction..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Tous les types</option>
              <option value="recette">Recettes</option>
              <option value="depense">Dépenses</option>
            </select>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Tous les statuts</option>
              <option value="payee">Payée</option>
              <option value="en_attente">En attente</option>
              <option value="echec">Échec</option>
              <option value="rembourse">Remboursé</option>
            </select>
            <Button variant="outline" size="sm" icon={<Download />}>Exporter</Button>
          </div>
        </div>
      </Card>

      {/* Tableau */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Référence</th>
                <th className="pb-3 pr-4">Libellé</th>
                <th className="pb-3 pr-4">Montant</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Méthode</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Statut</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-neutral-500">
                    Aucune transaction trouvée
                  </td>
                </tr>
              )}
              {filtered.map((trx) => (
                <tr key={trx.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 pr-4">
                    <span className="text-xs font-mono text-neutral-500">{trx.reference}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{trx.libelle}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={cn(
                      'text-sm font-semibold',
                      trx.type === 'recette' ? 'text-emerald-600' : 'text-red-600'
                    )}>
                      {trx.type === 'recette' ? '+' : '-'}{formatCurrency(trx.montant)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                      trx.type === 'recette' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    )}>
                      {trx.type === 'recette' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {trx.type === 'recette' ? 'Recette' : 'Dépense'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{trx.methode}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{formatDate(trx.date)}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={getStatutColor(trx.statut)} size="sm">{getStatutLabel(trx.statut)}</Badge>
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="sm" icon={<Eye />} />
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
