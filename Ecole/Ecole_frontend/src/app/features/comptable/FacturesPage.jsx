/**
 * FacturesPage — Gestion des factures
 *
 * Le comptable crée, suit et gère les factures.
 * Données dynamiques via API /comptable/paiements
 */

import { useState, useMemo } from 'react';
import { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { motion } from 'framer-motion';
import {
  FileText, Plus, Download, Eye, Send, Printer,
  Search, AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useTranslation } from '@/shared/i18n';

const getStatutVariant = (statut) => {
  switch (statut) {
    case 'paye':
    case 'payee': return 'primary';
    case 'en_attente':
    case 'partiel': return 'warning';
    case 'impaye':
    case 'echec': return 'danger';
    default: return 'outline';
  }
};

const STATUT_LABEL_KEYS = {
  paye: 'pages.comptable.factures.payee',
  payee: 'pages.comptable.factures.payee',
  en_attente: 'common.status.pending',
  partiel: 'pages.comptable.factures.partielle',
  impaye: 'pages.comptable.factures.impayee',
  echec: 'pages.comptable.factures.impayee',
};

export default function FacturesPage() {
  const { t } = useTranslation();
  const statutLabel = (v) => (STATUT_LABEL_KEYS[v] ? t(STATUT_LABEL_KEYS[v]) : (v || '—'));
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  // Le chargement passait par un `useState` doublé d'un `useEffect` de
  // premier rendu, sans cache ni déduplication : deux composants montés
  // ensemble lançaient deux requêtes, et un retour sur la page rechargeait
  // tout (cf. audit P4.1). `unwrapList` traverse les trois formes
  // d'enveloppe que renvoient les contrôleurs.
  const requete = useApiQuery(['comptable-paiements'], '/comptable/paiements');

  const factures = useMemo(
    () => (unwrapList(requete.data) ?? []).map((p, i) => ({
          ...p,
          numero: p.reference || `FAC-${String(2025000 + (p.id || i)).slice(-6)}`,
          client: p.eleve ? `${p.eleve.prenom || ''} ${p.eleve.nom || ''}`.trim() : 'N/A',
          motif: p.type_paiement || t('pages.comptable.factures.frais'),
          dateEmission: p.date_paiement || p.created_at,
          dateEcheance: p.date_paiement || p.created_at
        })),
    [requete.data, t],
  );
  const loading = requete.isPending;
  const error = requete.isError ? (requete.error?.message ?? t('common.load_error')) : null;

  const stats = useMemo(() => {
    const total = factures.reduce((s, f) => s + Number(f.montant || 0), 0);
    const payees = factures.filter((f) => f.statut === 'paye' || f.statut === 'payee').reduce((s, f) => s + Number(f.montant || 0), 0);
    const impayees = factures.filter((f) => f.statut === 'impaye' || f.statut === 'echec').reduce((s, f) => s + Number(f.montant || 0), 0);
    return { total, payees, impayees, nombre: factures.length };
  }, [factures]);

  const filtered = useMemo(() =>
    factures.filter((f) => {
      const q = search.toLowerCase();
      if (search && !f.client.toLowerCase().includes(q) && !f.numero.toLowerCase().includes(q)) return false;
      if (filterStatut && f.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterStatut, factures]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--text-secondary)]">
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
        <h1 className="text-2xl font-bold text-[var(--text-primary)] ">{t('pages.comptable.factures.title')}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{t('pages.comptable.factures.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title={t('pages.comptable.factures.total_facture')} value={formatCurrency(stats.total)} icon={FileText} color="primary" />
        <StatsCard title={t('pages.comptable.factures.paye')} value={formatCurrency(stats.payees)} icon={CheckCircle} color="emerald" />
        <StatsCard title={t('pages.comptable.factures.impaye')} value={formatCurrency(stats.impayees)} icon={AlertCircle} color="red" />
        <StatsCard title={t('pages.comptable.factures.taux_recouvrement')} value={`${stats.total > 0 ? Math.round((stats.payees / stats.total) * 100) : 0}%`} icon={FileText} color="sky" />
      </div>

      {/* Actions */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <Input
              placeholder={t('pages.comptable.factures.rechercher_une_facture')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              aria-label={t('common.filter_by_status')}
              className="h-10 rounded-xl border border-[var(--border-heavy)] bg-[var(--surface-raised)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40   "
            >
              <option value="">{t('common.all_statuses')}</option>
              <option value="paye">{t('pages.comptable.factures.payee')}</option>
              <option value="en_attente">{t('common.status.pending')}</option>
              <option value="echec">{t('pages.comptable.factures.impayee')}</option>
            </select>
            <Button variant="outline" size="sm" icon={<Download />}>{t('common.export')}</Button>
            <Button size="sm" icon={<Plus />}>{t('pages.comptable.factures.nouvelle_facture')}</Button>
          </div>
        </div>
      </Card>

      {/* Liste des factures */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]  text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                <th scope="col" className="pb-3 pr-4">{t('pages.comptable.factures.n_facture')}</th>
                <th scope="col" className="pb-3 pr-4">{t('pages.comptable.factures.client')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.reason')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.amount')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.date')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.status_label')}</th>
                <th scope="col" className="pb-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-[var(--text-secondary)]">
                    {t('pages.comptable.factures.aucune_facture_trouvee')}
                  </td>
                </tr>
              )}
              {filtered.map((fac) => (
                <tr key={fac.id} className="border-b border-[var(--border-light)] ">
                  <td className="py-3 pr-4">
                    <span className="text-xs font-mono text-[var(--text-secondary)]">{fac.numero}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm font-medium text-[var(--text-primary)] ">{fac.client}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-[var(--text-secondary)] ">{fac.motif}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm font-semibold text-[var(--text-primary)] ">{formatCurrency(fac.montant)}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-[var(--text-secondary)] ">
                      {fac.dateEmission ? formatDate(fac.dateEmission) : '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={getStatutVariant(fac.statut)} size="sm">
                      {statutLabel(fac.statut)}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" icon={<Eye />} title={t('common.view')} />
                      <Button variant="ghost" size="sm" icon={<Send />} title={t('pages.comptable.factures.envoyer')} />
                      <Button variant="ghost" size="sm" icon={<Printer />} title={t('pages.comptable.factures.imprimer')} />
                    </div>
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
