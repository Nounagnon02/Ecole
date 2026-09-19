/**
 * TransactionsPage — Gestion des transactions financières
 *
 * Le comptable consulte et gère toutes les transactions de l'établissement.
 * Données dynamiques via API /comptable/paiements
 */

import { useState, useMemo } from 'react';
import { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight,   Search, Download, Eye, FileText, Loader2, AlertCircle
} from 'lucide-react';
import { cn, formatCurrency, formatDate, formatNumber } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useTranslation } from '@/shared/i18n';

const getStatutColor = (statut) => {
  switch (statut) {
    case 'paye':
    case 'payee': return 'primary';
    case 'en_attente':
    case 'partiel': return 'warning';
    case 'echec': return 'danger';
    case 'rembourse': return 'info';
    default: return 'default';
  }
};

const STATUT_LABEL_KEYS = {
  paye: 'pages.comptable.transactions.payee',
  payee: 'pages.comptable.transactions.payee',
  en_attente: 'common.status.pending',
  partiel: 'pages.comptable.transactions.partielle',
  echec: 'pages.comptable.transactions.echec',
  rembourse: 'pages.comptable.transactions.rembourse',
};

export default function TransactionsPage() {
  const { t } = useTranslation();
  const statutLabel = (v) => (STATUT_LABEL_KEYS[v] ? t(STATUT_LABEL_KEYS[v]) : (v || '—'));
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  // Le chargement passait par un `useState` doublé d'un `useEffect` de
  // premier rendu, sans cache ni déduplication : deux composants montés
  // ensemble lançaient deux requêtes, et un retour sur la page rechargeait
  // tout (cf. audit P4.1). `unwrapList` traverse les trois formes
  // d'enveloppe que renvoient les contrôleurs.
  const requete = useApiQuery(['comptable-paiements'], '/comptable/paiements');

  const transactions = useMemo(() => unwrapList(requete.data) ?? [], [requete.data]);
  const loading = requete.isPending;
  const error = requete.isError ? (requete.error?.message ?? t('common.load_error')) : null;

  const stats = useMemo(() => {
    const recettes = transactions.filter((t) => t.statut === 'paye' || t.statut === 'payee');
    const totalRecettes = recettes.reduce((s, t) => s + Number(t.montant || 0), 0);
    return {
      totalRecettes,
      totalDepenses: 0,
      solde: totalRecettes,
      transactions: transactions.length
    };
  }, [transactions]);

  const filtered = useMemo(() =>
    transactions.filter((t) => {
      const q = search.toLowerCase();
      if (search) {
        const match = (t.reference || '').toLowerCase().includes(q)
          || (t.eleve?.nom || '').toLowerCase().includes(q)
          || (t.eleve?.prenom || '').toLowerCase().includes(q)
          || (t.type_paiement || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterType && t.type_paiement !== filterType) return false;
      if (filterStatut && t.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterType, filterStatut, transactions]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
        <AlertCircle className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pages.comptable.transactions.title')}</h1>
        <p className="text-sm text-neutral-500">{t('pages.comptable.transactions.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title={t('pages.comptable.transactions.recettes')} value={formatCurrency(stats.totalRecettes)} icon={TrendingUp} color="emerald" />
        <StatsCard title={t('pages.comptable.transactions.depenses')} value={formatCurrency(stats.totalDepenses)} icon={TrendingDown} color="red" />
        <StatsCard title={t('common.balance')} value={formatCurrency(stats.solde)} icon={DollarSign} color={stats.solde >= 0 ? 'primary' : 'red'} />
        <StatsCard title={t('pages.comptable.transactions.transactions')} value={formatNumber(stats.transactions)} icon={FileText} color="sky" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder={t('pages.comptable.transactions.rechercher_une_transaction')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label={t('pages.comptable.transactions.filtrer_par_type')}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">{t('common.all_types')}</option>
              <option value="scolarite">{t('pages.comptable.transactions.scolarite')}</option>
              <option value="cantine">{t('pages.comptable.transactions.cantine')}</option>
              <option value="transport">{t('pages.comptable.transactions.transport')}</option>
              <option value="inscription">{t('pages.comptable.transactions.inscription')}</option>
              <option value="bibliotheque">{t('pages.comptable.transactions.bibliotheque')}</option>
            </select>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              aria-label={t('common.filter_by_status')}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">{t('common.all_statuses')}</option>
              <option value="paye">{t('pages.comptable.transactions.payee')}</option>
              <option value="en_attente">{t('common.status.pending')}</option>
              <option value="echec">{t('pages.comptable.transactions.echec')}</option>
            </select>
            <Button variant="outline" size="sm" icon={<Download />}>{t('common.export')}</Button>
          </div>
        </div>
      </Card>

      {/* Tableau */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <th scope="col" className="pb-3 pr-4">{t('pages.comptable.transactions.reference')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.student')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.amount')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.type')}</th>
                <th scope="col" className="pb-3 pr-4">{t('pages.comptable.transactions.methode')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.date')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.status_label')}</th>
                <th scope="col" className="pb-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-neutral-500">
                    {t('pages.comptable.transactions.aucune_transaction_trouvee')}
                  </td>
                </tr>
              )}
              {filtered.map((trx) => (
                <tr key={trx.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 pr-4">
                    <span className="text-xs font-mono text-neutral-500">{trx.reference || `#${trx.id}`}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                      {trx.eleve?.prenom} {trx.eleve?.nom}
                    </span>
                    {trx.eleve?.classe?.nom_classe && (
                      <span className="text-xs text-neutral-400 ml-1">({trx.eleve.classe.nom_classe})</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm font-semibold text-emerald-600">
                      {formatCurrency(trx.montant)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    )}>
                      <ArrowUpRight className="h-3 w-3" />
                      {trx.type_paiement || t('pages.comptable.transactions.paiement')}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{trx.mode_paiement || trx.methode_paiement || '—'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {trx.date_paiement ? formatDate(trx.date_paiement) : '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={getStatutColor(trx.statut)} size="sm">{statutLabel(trx.statut)}</Badge>
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
