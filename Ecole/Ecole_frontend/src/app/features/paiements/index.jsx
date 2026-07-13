/**
 * GestionPaiements — Page de gestion des paiements et frais scolaires
 *
 * Fonctions : Échéances, historique, factures, relances
 * Données dynamiques via API /api/paiements
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Plus,
  DollarSign,
  CreditCard,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  Printer,
  Send,
  MoreHorizontal,
  TrendingUp,
  Users,
  Wallet,
  Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { cn, formatNumber } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Avatar from '@/shared/components/ui/Avatar';
import Table from '@/shared/components/ui/Table';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useApi } from '@/hooks/useApi';

export default function GestionPaiements() {
  const { loading, error, get, post, put } = useApi();
  const [activeTab, setActiveTab] = useState('apercu');
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('Tous');
  const [periodeFilter, setPeriodeFilter] = useState('');
  const [paiements, setPaiements] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [typesFrais, setTypesFrais] = useState([]);
  const [revenusMensuels, setRevenusMensuels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [paiementsRes, elevesRes, periodesRes, typesRes, revenusRes] = await Promise.allSettled([
          get('/paiements'),
          get('/eleves'),
          get('/periodes'),
          get('/types-frais'),
          get('/paiements/revenus-mensuels'),
        ]);

        const paiementsData = paiementsRes.status === 'fulfilled'
          ? (Array.isArray(paiementsRes.value?.data?.data) ? paiementsRes.value.data.data
            : Array.isArray(paiementsRes.value?.data) ? paiementsRes.value.data
            : Array.isArray(paiementsRes.value) ? paiementsRes.value : [])
          : [];
        setPaiements(paiementsData);

        const elevesData = elevesRes.status === 'fulfilled'
          ? (Array.isArray(elevesRes.value?.data?.data) ? elevesRes.value.data.data
            : Array.isArray(elevesRes.value?.data) ? elevesRes.value.data
            : Array.isArray(elevesRes.value) ? elevesRes.value : [])
          : [];
        setEleves(elevesData);

        const periodesData = periodesRes.status === 'fulfilled'
          ? (Array.isArray(periodesRes.value?.data?.data) ? periodesRes.value.data.data
            : Array.isArray(periodesRes.value?.data) ? periodesRes.value.data
            : Array.isArray(periodesRes.value) ? periodesRes.value : [])
          : ['2024-2025', '2023-2024', '2022-2023'];
        setPeriodes(periodesData.map(p => p.nom || p.libelle || p).filter(Boolean));

        const typesData = typesRes.status === 'fulfilled'
          ? (Array.isArray(typesRes.value?.data?.data) ? typesRes.value.data.data
            : Array.isArray(typesRes.value?.data) ? typesRes.value.data
            : Array.isArray(typesRes.value) ? typesRes.value : [])
          : ['Scolarité', 'Pension', 'Fournitures', 'Activités', 'Transport'];
        setTypesFrais(typesData.map(t => t.nom || t.libelle || t).filter(Boolean));

        const revenusData = revenusRes.status === 'fulfilled'
          ? (Array.isArray(revenusRes.value?.data?.data) ? revenusRes.value.data.data
            : Array.isArray(revenusRes.value?.data) ? revenusRes.value.data
            : Array.isArray(revenusRes.value) ? revenusRes.value : [])
          : [];
        setRevenusMensuels(revenusData);
      } catch (e) {
        console.error('Erreur chargement paiements:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [get]);

  const STATUTS_PAIEMENT = ['Tous', 'Payé', 'En attente', 'En retard', 'Partiel'];
  const PERIODES_DISPLAY = periodes.length > 0 ? periodes : ['2024-2025', '2023-2024', '2022-2023'];
  const TYPES_FRAIS_DISPLAY = typesFrais.length > 0 ? typesFrais : ['Scolarité', 'Pension', 'Fournitures', 'Activités', 'Transport'];

  const filtered = useMemo(() =>
    paiements.filter(p =>
      (statutFilter === 'Tous' || p.statut === statutFilter) &&
      (periodeFilter === '' || p.periode === periodeFilter) &&
      (p.eleve?.toLowerCase().includes(search.toLowerCase()) ||
       p.matricule?.toLowerCase().includes(search.toLowerCase()))
    ),
    [paiements, search, statutFilter, periodeFilter]
  );

  const badgeForStatus = (statut) => {
    switch (statut) {
      case 'Payé': return 'success';
      case 'Partiel': return 'warning';
      case 'En attente': return 'neutral';
      case 'En retard': return 'danger';
      default: return 'neutral';
    }
  };

  const stats = useMemo(() => ({
    revenusMois: paiements.filter(p => p.statut === 'Payé' && p.date_paiement).reduce((s, p) => s + Number(p.montant || 0), 0),
    impayes: paiements.filter(p => p.statut === 'En retard' || p.statut === 'En attente').reduce((s, p) => s + Number(p.reste || p.montant - p.paye || 0), 0),
    tauxRecouvrement: paiements.length > 0
      ? Math.round((paiements.filter(p => p.statut === 'Payé').length / paiements.length) * 1000) / 10
      : 0,
    echeancesVenir: paiements.filter(p => p.statut !== 'Payé' && p.echeance && new Date(p.echeance) >= new Date()).length,
  }), [paiements]);

  const renderContent = () => {
    const formatMontant = (m) => formatNumber(m) + ' FCFA';

    switch (activeTab) {
      case 'apercu':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: 'Revenus du Mois', value: formatMontant(stats.revenusMois), icon: TrendingUp, trend: 12.5, trendLabel: 'vs mois dernier', color: 'emerald' },
                { title: 'Impayés', value: formatMontant(stats.impayes), icon: AlertTriangle, trend: -5.2, trendLabel: 'en baisse', color: 'red' },
                { title: 'Taux de Recouvrement', value: `${stats.tauxRecouvrement}%`, icon: CheckCircle2, trend: 3.1, trendLabel: 'ce trimestre', color: 'sky' },
                { title: 'Échéances à Venir', value: String(stats.echeancesVenir), icon: Clock, trend: 0, trendLabel: 'dans les 30 jours', color: 'amber' },
              ].map((stat, i) => (
                <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <StatsCard {...stat} className="h-full" />
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Évolution des Revenus</h3>
                  <p className="text-xs text-neutral-500">6 derniers mois</p>
                </div>
                <div className="p-4">
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenusMensuels.length > 0 ? revenusMensuels : [
                        { mois: 'Jan', revenus: 0, impayes: 0 },
                        { mois: 'Fév', revenus: 0, impayes: 0 },
                        { mois: 'Mar', revenus: 0, impayes: 0 },
                        { mois: 'Avr', revenus: 0, impayes: 0 },
                        { mois: 'Mai', revenus: 0, impayes: 0 },
                        { mois: 'Juin', revenus: 0, impayes: 0 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <ReTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                        <Bar dataKey="revenus" fill="#6366f1" name="Revenus" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="impayes" fill="#ef4444" name="Impayés" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Répartition par Type</h3>
                  <p className="text-xs text-neutral-500">Frais de scolarité</p>
                </div>
                <div className="p-4 space-y-4">
                  {[
                    { label: 'Scolarité', montant: 0, pct: 0, color: 'bg-[var(--accent-subtle)]0' },
                    { label: 'Pension', montant: 0, pct: 0, color: 'bg-emerald-500' },
                    { label: 'Fournitures', montant: 0, pct: 0, color: 'bg-amber-500' },
                    { label: 'Activités', montant: 0, pct: 0, color: 'bg-sky-500' },
                    { label: 'Transport', montant: 0, pct: 0, color: 'bg-purple-500' },
                  ].map((item) => {
                    // Calculate from actual data
                    const total = paiements.reduce((s, p) => s + Number(p.montant || 0), 0);
                    const typeTotal = paiements
                      .filter(p => p.type_frais === item.label || p.frais === item.label)
                      .reduce((s, p) => s + Number(p.montant || 0), 0);
                    const pct = total > 0 ? Math.round((typeTotal / total) * 100) : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1 text-sm">
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">{item.label}</span>
                          <span className="text-neutral-500">{formatMontant(typeTotal)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                          <div className={cn('h-full rounded-full', item.color)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        );
      case 'paiments':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input placeholder="Rechercher par élève ou matricule..." value={search} onChange={e => setSearch(e.target.value)} icon={Search} />
              </div>
              <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)}
                className="h-10 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]">
                {STATUTS_PAIEMENT.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={periodeFilter} onChange={e => setPeriodeFilter(e.target.value)}
                className="h-10 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]">
                <option value="">Toutes les périodes</option>
                {PERIODES_DISPLAY.map(p => <option key={p}>{p}</option>)}
              </select>
              <Button variant="ghost" size="sm"><Download className="h-4 w-4 mr-1" /> Exporter</Button>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nouveau</Button>
            </div>

            <Card>
              <div className="p-0">
                <Table>
                  <Table.Header>
                    <Table.Head>Élève</Table.Head>
                    <Table.Head>Frais</Table.Head>
                    <Table.Head>Montant</Table.Head>
                    <Table.Head>Payé</Table.Head>
                    <Table.Head>Reste</Table.Head>
                    <Table.Head>Échéance</Table.Head>
                    <Table.Head>Statut</Table.Head>
                    <Table.Head className="text-right">Actions</Table.Head>
                  </Table.Header>
                  <Table.Body>
                    {isLoading && Array.from({ length: 5 }).map((_, i) => (
                      <Table.Row key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <Table.Cell key={j}><div className="h-4 w-full bg-neutral-200 animate-pulse dark:bg-neutral-700 rounded" /></Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
                    {!isLoading && filtered.length === 0 && (
                      <Table.Row>
                        <td colSpan={8} className="p-8 text-center text-sm text-neutral-500">Aucun paiement trouvé</td>
                      </Table.Row>
                    )}
                    {!isLoading && filtered.map((p) => (
                      <Table.Row key={p.id}>
                        <Table.Cell>
                          <div className="flex items-center gap-2">
                            <Avatar name={p.eleve} size="sm" />
                            <div>
                              <span className="font-medium text-neutral-900 dark:text-white">{p.eleve}</span>
                              <span className="text-xs text-neutral-400 ml-1">{p.classe}</span>
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell><Badge variant="primary" size="sm">{p.type_frais || p.frais}</Badge></Table.Cell>
                        <Table.Cell className="font-medium">{formatMontant(p.montant)}</Table.Cell>
                        <Table.Cell className="text-emerald-600 dark:text-emerald-400 font-medium">{formatMontant(p.paye || 0)}</Table.Cell>
                        <Table.Cell className={cn('font-medium', (p.montant - (p.paye || 0)) > 0 ? 'text-red-500' : 'text-neutral-400')}>
                          {formatMontant(p.montant - (p.paye || 0))}
                        </Table.Cell>
                        <Table.Cell className="text-xs text-neutral-400">{p.echeance || p.date_echeance}</Table.Cell>
                        <Table.Cell><Badge variant={badgeForStatus(p.statut)} size="sm">{p.statut}</Badge></Table.Cell>
                        <Table.Cell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-colors"><Receipt className="h-4 w-4" /></button>
                            <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-colors"><Printer className="h-4 w-4" /></button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
              <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
                <span className="text-sm text-neutral-500">{filtered.length} paiements</span>
              </div>
            </Card>
          </div>
        );
      case 'factures':
      case 'relances':
        return (
          <Card>
            <div className="p-8 text-center">
              <p className="text-neutral-500">
                {activeTab === 'factures'
                  ? 'Génération et gestion des factures individuelles et groupées'
                  : 'Relances automatiques et suivi des impayés'}
              </p>
            </div>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-neutral-900 dark:text-white"
      >
        Gestion des Paiements
      </motion.h1>

      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="flex gap-1 overflow-x-auto -mb-px">
          {[
            { id: 'apercu', label: 'Aperçu', icon: DollarSign },
            { id: 'paiments', label: 'Paiements', icon: CreditCard },
            { id: 'factures', label: 'Factures', icon: FileText },
            { id: 'relances', label: 'Relances', icon: Send },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id ? 'border-[var(--accent)] text-[var(--accent)] dark:text-[var(--accent)]' : 'border-transparent text-neutral-500 hover:text-neutral-700'
                )}>
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}