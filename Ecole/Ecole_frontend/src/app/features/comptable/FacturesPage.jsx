/**
 * FacturesPage — Gestion des factures
 *
 * Le comptable crée, suit et gère les factures de l'établissement.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Plus, Download, Eye, Send, Printer,
  Search, Filter, AlertCircle, CheckCircle, Clock, XCircle,
} from 'lucide-react';
import { cn, formatCurrency, formatDate, formatNumber } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const FACTURES = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  numero: `FAC-${String(2025000 + i).slice(-6)}`,
  client: ['Diallo Amadou', 'Touré Fatou', 'Koné Moussa', 'Cissé Inza', 'Traoré Kadiatou', 'Sow Mariam', 'Diop Souleymane', 'Ndiaye Fatma', 'Ba Ousmane', 'Sylla Aïcha', 'Faye Cheikh', 'Gueye Ndeye', 'Diallo Mariam', 'Touré Alpha', 'Koné Salif'][i],
  motif: ['Frais scolarité T1', 'Cantine mensuelle', 'Uniforme complet', 'Frais inscription', 'Transport trimestre', 'Scolarité T2', 'Bibliothèque annuelle', 'Manuels scolaires', 'Frais examen', 'Stage intensif', 'Transport mensuel', 'Fournitures', 'Scolarité T3', 'Activités sportives', 'Voyage scolaire'][i],
  montant: [150000, 25000, 35000, 75000, 30000, 150000, 5000, 45000, 10000, 20000, 30000, 12000, 150000, 35000, 50000][i],
  statut: ['payee', 'en_attente', 'payee', 'impayee', 'payee', 'en_attente', 'payee', 'payee', 'impayee', 'payee', 'payee', 'en_attente', 'payee', 'impayee', 'payee'][i],
  dateEmission: new Date(Date.now() - 86400000 * (i + 5)),
  dateEcheance: new Date(Date.now() + 86400000 * (i * 3 - 5)),
}));

const getStatutVariant = (statut) => {
  switch (statut) {
    case 'payee': return 'primary';
    case 'en_attente': return 'warning';
    case 'impayee': return 'danger';
    default: return 'outline';
  }
};

const getStatutIcon = (statut) => {
  switch (statut) {
    case 'payee': return <CheckCircle className="h-3 w-3" />;
    case 'en_attente': return <Clock className="h-3 w-3" />;
    case 'impayee': return <XCircle className="h-3 w-3" />;
    default: return null;
  }
};

const getStatutLabel = (statut) => {
  switch (statut) {
    case 'payee': return 'Payée';
    case 'en_attente': return 'En attente';
    case 'impayee': return 'Impayée';
    default: return statut;
  }
};

export default function FacturesPage() {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const stats = useMemo(() => {
    const total = FACTURES.reduce((s, f) => s + f.montant, 0);
    const payees = FACTURES.filter((f) => f.statut === 'payee').reduce((s, f) => s + f.montant, 0);
    const impayees = FACTURES.filter((f) => f.statut === 'impayee').reduce((s, f) => s + f.montant, 0);
    return { total, payees, impayees, nombre: FACTURES.length };
  }, []);

  const filtered = useMemo(() =>
    FACTURES.filter((f) => {
      if (search && !f.client.toLowerCase().includes(search.toLowerCase()) && !f.numero.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatut && f.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterStatut]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Factures</h1>
        <p className="text-sm text-neutral-500">Gérez les factures et les paiements</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total Facturé" value={formatCurrency(stats.total)} icon={FileText} color="indigo" />
        <StatsCard title="Payé" value={formatCurrency(stats.payees)} icon={CheckCircle} color="emerald" />
        <StatsCard title="Impayé" value={formatCurrency(stats.impayees)} icon={AlertCircle} color="red" />
        <StatsCard title="Taux Recouvrement" value={`${stats.total > 0 ? Math.round((stats.payees / stats.total) * 100) : 0}%`} icon={FileText} color="sky" />
      </div>

      {/* Actions */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher une facture..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Tous les statuts</option>
              <option value="payee">Payée</option>
              <option value="en_attente">En attente</option>
              <option value="impayee">Impayée</option>
            </select>
            <Button variant="outline" size="sm" icon={<Download />}>Exporter</Button>
            <Button size="sm" icon={<Plus />}>Nouvelle facture</Button>
          </div>
        </div>
      </Card>

      {/* Liste des factures */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">N° Facture</th>
                <th className="pb-3 pr-4">Client</th>
                <th className="pb-3 pr-4">Motif</th>
                <th className="pb-3 pr-4">Montant</th>
                <th className="pb-3 pr-4">Émission</th>
                <th className="pb-3 pr-4">Échéance</th>
                <th className="pb-3 pr-4">Statut</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-neutral-500">
                    Aucune facture trouvée
                  </td>
                </tr>
              )}
              {filtered.map((fac) => (
                <tr key={fac.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 pr-4">
                    <span className="text-xs font-mono text-neutral-500">{fac.numero}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{fac.client}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{fac.motif}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">{formatCurrency(fac.montant)}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{formatDate(fac.dateEmission)}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={cn(
                      'text-sm',
                      fac.dateEcheance < new Date() && fac.statut !== 'payee'
                        ? 'text-red-600 font-medium'
                        : 'text-neutral-600 dark:text-neutral-400'
                    )}>
                      {formatDate(fac.dateEcheance)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={getStatutVariant(fac.statut)} size="sm" icon={getStatutIcon(fac.statut)}>
                      {getStatutLabel(fac.statut)}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" icon={<Eye />} title="Voir" />
                      <Button variant="ghost" size="sm" icon={<Send />} title="Envoyer" />
                      <Button variant="ghost" size="sm" icon={<Printer />} title="Imprimer" />
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
