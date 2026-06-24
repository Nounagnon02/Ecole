/**
 * GestionPaiements — Page de gestion des paiements et frais scolaires
 *
 * Fonctions : Échéances, historique, factures, relances
 */

import { useState } from 'react';
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
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Avatar from '@/shared/components/ui/Avatar';
import Table from '@/shared/components/ui/Table';
import StatsCard from '@/shared/components/ui/StatsCard';

const STATUTS_PAIEMENT = ['Tous', 'Payé', 'En attente', 'En retard', 'Partiel'];
const PERIODES = ['2024-2025', '2023-2024', '2022-2023'];
const TYPES_FRAIS = ['Scolarité', 'Pension', 'Fournitures', 'Activités', 'Transport'];

const STATS = [
  { title: 'Revenus du Mois', value: '8 450 000 FCFA', icon: TrendingUp, trend: 12.5, trendLabel: 'vs mois dernier', color: 'emerald' },
  { title: 'Impayés', value: '1 280 000 FCFA', icon: AlertTriangle, trend: -5.2, trendLabel: 'en baisse', color: 'red' },
  { title: 'Taux de Recouvrement', value: '94.2%', icon: CheckCircle2, trend: 3.1, trendLabel: 'ce trimestre', color: 'sky' },
  { title: 'Échéances à Venir', value: '34', icon: Clock, trend: 0, trendLabel: 'dans les 30 jours', color: 'amber' },
];

const PAIEMENTS_MOCK = [
  { id: 1, eleve: 'Jean Mensah', classe: '4ème A', matricule: 'EL-2024-001', frais: 'Scolarité', montant: 150000, paye: 150000, date: '2024-10-01', echeance: '2024-10-15', statut: 'Payé', mode: 'Mobile Money' },
  { id: 2, eleve: 'Ama Koffi', classe: '4ème A', matricule: 'EL-2024-002', frais: 'Pension', montant: 75000, paye: 50000, date: '2024-09-28', echeance: '2024-10-10', statut: 'Partiel', mode: 'Espèces' },
  { id: 3, eleve: 'Koffi Dossa', classe: '4ème B', matricule: 'EL-2024-003', frais: 'Scolarité', montant: 150000, paye: 0, date: null, echeance: '2024-10-05', statut: 'En retard', mode: null },
  { id: 4, eleve: 'Sarah Koné', classe: '5ème A', matricule: 'EL-2024-004', frais: 'Transport', montant: 25000, paye: 25000, date: '2024-10-02', echeance: '2024-10-02', statut: 'Payé', mode: 'Carte Bancaire' },
  { id: 5, eleve: 'Paul Bamba', classe: '2nde A', matricule: 'EL-2023-020', frais: 'Scolarité', montant: 200000, paye: 150000, date: '2024-09-15', echeance: '2024-09-30', statut: 'Partiel', mode: 'Virement' },
  { id: 6, eleve: 'Grace Ouattara', classe: 'Tle A', matricule: 'EL-2022-008', frais: 'Fournitures', montant: 35000, paye: 0, date: null, echeance: '2024-10-20', statut: 'En attente', mode: null },
  { id: 7, eleve: 'David Amégnigban', classe: '3ème B', matricule: 'EL-2023-016', frais: 'Scolarité', montant: 150000, paye: 150000, date: '2024-09-30', echeance: '2024-10-01', statut: 'Payé', mode: 'Mobile Money' },
  { id: 8, eleve: 'Mwana Akakpo', classe: '3ème A', matricule: 'EL-2023-015', frais: 'Activités', montant: 15000, paye: 15000, date: '2024-10-03', echeance: '2024-10-15', statut: 'Payé', mode: 'Espèces' },
];

const REVENUS_MENSUELS = [
  { mois: 'Avr', revenus: 7200000, impayes: 1200000 },
  { mois: 'Mai', revenus: 8100000, impayes: 980000 },
  { mois: 'Juin', revenus: 7800000, impayes: 1100000 },
  { mois: 'Juil', revenus: 6900000, impayes: 1350000 },
  { mois: 'Août', revenus: 5400000, impayes: 980000 },
  { mois: 'Sep', revenus: 8450000, impayes: 1280000 },
];

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: DollarSign },
  { id: 'paiments', label: 'Paiements', icon: CreditCard },
  { id: 'factures', label: 'Factures', icon: FileText },
  { id: 'relances', label: 'Relances', icon: Send },
];

function formatMontant(m) {
  return m.toLocaleString('fr-FR') + ' FCFA';
}

export default function GestionPaiements() {
  const [activeTab, setActiveTab] = useState('apercu');
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('Tous');

  const filtered = PAIEMENTS_MOCK.filter(p =>
    (statutFilter === 'Tous' || p.statut === statutFilter) &&
    (p.eleve.toLowerCase().includes(search.toLowerCase()) ||
     p.matricule.toLowerCase().includes(search.toLowerCase()))
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

  const renderContent = () => {
    switch (activeTab) {
      case 'apercu':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map((stat, i) => (
                <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <StatsCard {...stat} className="h-full" />
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <Card.Header>
                  <Card.Title>Évolution des Revenus</Card.Title>
                  <Card.Description>6 derniers mois</Card.Description>
                </Card.Header>
                <Card.Body>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={REVENUS_MENSUELS}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <ReTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                        <Bar dataKey="revenus" fill="#6366f1" name="Revenus" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="impayes" fill="#ef4444" name="Impayés" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <Card.Title>Répartition par Type</Card.Title>
                  <Card.Description>Frais de scolarité</Card.Description>
                </Card.Header>
                <Card.Body className="space-y-4">
                  {[
                    { label: 'Scolarité', montant: 4500000, pct: 53, color: 'bg-indigo-500' },
                    { label: 'Pension', montant: 1800000, pct: 21, color: 'bg-emerald-500' },
                    { label: 'Fournitures', montant: 950000, pct: 11, color: 'bg-amber-500' },
                    { label: 'Activités', montant: 720000, pct: 9, color: 'bg-sky-500' },
                    { label: 'Transport', montant: 480000, pct: 6, color: 'bg-purple-500' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">{item.label}</span>
                        <span className="text-neutral-500">{formatMontant(item.montant)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div className={cn('h-full rounded-full', item.color)} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </Card.Body>
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
                className="h-10 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                {STATUTS_PAIEMENT.map(s => <option key={s}>{s}</option>)}
              </select>
              <Button variant="ghost" size="sm"><Download className="h-4 w-4 mr-1" /> Exporter</Button>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nouveau</Button>
            </div>

            <Card>
              <Card.Body className="p-0">
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
                    {filtered.map((p) => (
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
                        <Table.Cell><Badge variant="primary" size="sm">{p.frais}</Badge></Table.Cell>
                        <Table.Cell className="font-medium">{formatMontant(p.montant)}</Table.Cell>
                        <Table.Cell className="text-emerald-600 dark:text-emerald-400 font-medium">{formatMontant(p.paye)}</Table.Cell>
                        <Table.Cell className={cn('font-medium', p.montant - p.paye > 0 ? 'text-red-500' : 'text-neutral-400')}>
                          {formatMontant(p.montant - p.paye)}
                        </Table.Cell>
                        <Table.Cell className="text-xs text-neutral-400">{p.echeance}</Table.Cell>
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
              </Card.Body>
              <Card.Footer>
                <span className="text-sm text-neutral-500">{filtered.length} paiements</span>
              </Card.Footer>
            </Card>
          </div>
        );
      case 'factures':
      case 'relances':
        return (
          <Card>
            <Card.Body>
              <p className="text-neutral-500 text-center py-12">
                {activeTab === 'factures' ? 'Génération et gestion des factures individuelles et groupées' : 'Relances automatiques et suivi des impayés'}
              </p>
            </Card.Body>
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
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-neutral-500 hover:text-neutral-700'
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
