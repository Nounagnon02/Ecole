/**
 * BibliothecaireDashboard — Tableau de bord Bibliothécaire
 *
 * Sections : Aperçu | Catalogue | Emprunts
 */

import { useState } from 'react';
import { useDashboardStats } from '../hooks/useDashboardData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Users, Bookmark, Clock, AlertTriangle, CheckCircle2,
  BarChart3, Search, Library, Plus, TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: BarChart3 },
  { id: 'catalogue', label: 'Catalogue', icon: Library },
  { id: 'emprunts', label: 'Emprunts', icon: Bookmark },
];

const STATS = [
  { title: 'Total Ouvrages', value: '3 240', icon: BookOpen, trend: 5.2, trendLabel: 'nouveautés', color: 'indigo' },
  { title: 'Emprunts en Cours', value: '142', icon: Bookmark, trend: 8, trendLabel: 'ce mois', color: 'emerald' },
  { title: 'Retards', value: '23', icon: Clock, trend: -15, trendLabel: 'vs mois dernier', color: 'red' },
  { title: 'Membres Actifs', value: '456', icon: Users, trend: 3.1, trendLabel: 'ce trimestre', color: 'sky' },
];

const DONNEES_EMPRUNTS = [
  { mois: 'Jan', emprunts: 185, retours: 170 },
  { mois: 'Fév', emprunts: 168, retours: 155 },
  { mois: 'Mar', emprunts: 210, retours: 195 },
  { mois: 'Avr', emprunts: 195, retours: 188 },
  { mois: 'Mai', emprunts: 225, retours: 210 },
  { mois: 'Juin', emprunts: 198, retours: 190 },
];

const CATEGORIES = [
  { name: 'Scolaire', value: 45 },
  { name: 'Littérature', value: 20 },
  { name: 'Sciences', value: 18 },
  { name: 'BD & Magazines', value: 12 },
  { name: 'Divers', value: 5 },
];

const CAT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const EMPRUNTS_RECENTS = [
  { id: 1, eleve: 'Hountondji Marcel', classe: '4e A', ouvrage: 'Mathématiques 4e', dateEmprunt: '2026-06-10', dateRetour: '2026-06-24', statut: 'En cours' },
  { id: 2, eleve: 'Kouassi Béatrice', classe: '5e B', ouvrage: 'Le Petit Prince', dateEmprunt: '2026-06-08', dateRetour: '2026-06-22', statut: 'En retard' },
  { id: 3, eleve: 'Adjanohoun Félix', classe: '3e C', ouvrage: 'Physique 3e', dateEmprunt: '2026-06-12', dateRetour: '2026-06-26', statut: 'En cours' },
  { id: 4, eleve: 'Tossou Grâce', classe: '6e A', ouvrage: 'Français 6e', dateEmprunt: '2026-06-05', dateRetour: '2026-06-19', statut: 'Retourné' },
  { id: 5, eleve: 'Loko Emmanuel', classe: '2nde B', ouvrage: 'SVT 2nde', dateEmprunt: '2026-06-03', dateRetour: '2026-06-17', statut: 'Retard' },
];

function ApercuSection({ stats, activite, categories, emprunts }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatsCard {...stat} className="h-full" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Activité de la Bibliothèque</Card.Title>
            <Card.Description>Emprunts et retours — 6 derniers mois</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activite}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <ReTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="emprunts" name="Emprunts" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="retours" name="Retours" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Catégories</Card.Title>
            <Card.Description>Répartition des ouvrages</Card.Description>
          </Card.Header>
          <Card.Body>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {categories.map((_, i) => (
                      <Cell key={i} fill={CAT_COLORS[i]} />
                    ))}
                  </Pie>
                  <ReTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-1.5">
              {categories.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CAT_COLORS[i] }} />
                    <span className="text-neutral-600 dark:text-neutral-400">{item.name}</span>
                  </div>
                  <span className="font-medium text-neutral-900 dark:text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>Emprunts en Cours</Card.Title>
            <div className="flex gap-2">
              <Badge variant="danger" size="sm">{emprunts.filter(e => e.statut === 'En retard' || e.statut === 'Retard').length} en retard</Badge>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table>
            <Table.Header>
              <Table.Head>Élève</Table.Head>
              <Table.Head>Classe</Table.Head>
              <Table.Head>Ouvrage</Table.Head>
              <Table.Head>Emprunt</Table.Head>
              <Table.Head>Retour Prévu</Table.Head>
              <Table.Head>Statut</Table.Head>
            </Table.Header>
            <Table.Body>
              {emprunts.map((e) => (
                <Table.Row key={e.id}>
                  <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{e.eleve}</span></Table.Cell>
                  <Table.Cell>{e.classe}</Table.Cell>
                  <Table.Cell className="max-w-[160px] truncate">{e.ouvrage}</Table.Cell>
                  <Table.Cell className="text-neutral-400">{e.dateEmprunt}</Table.Cell>
                  <Table.Cell className="text-neutral-400">{e.dateRetour}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={e.statut === 'Retourné' ? 'success' : e.statut === 'En cours' ? 'warning' : 'danger'} size="sm">
                      {e.statut}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

function CatalogueSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Catalogue</h2>
          <p className="text-sm text-neutral-500 mt-1">Gestion des ouvrages de la bibliothèque</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm"><Search className="h-4 w-4 mr-1" /> Rechercher</Button>
          <Button><Plus className="h-4 w-4 mr-1" /> Ajouter un Ouvrage</Button>
        </div>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
            Catalogue complet — recherche, catégories, stock, et nouveautés
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

function EmpruntsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Emprunts</h2>
          <p className="text-sm text-neutral-500 mt-1">Suivi des prêts et retours</p>
        </div>
        <Button variant="ghost" size="sm"><Bookmark className="h-4 w-4 mr-1" /> Historique</Button>
      </div>
      <Card>
        <Card.Body>
          <p className="text-neutral-500 text-center py-12">
              Interface de gestion des prêts — enregistrement, rappels, prolongations
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

export default function BibliothecaireDashboard() {
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading } = useDashboardStats('bibliothecaire');

  const stats = data?.stats?.map((s, i) => ({ ...s, icon: STATS[i]?.icon, color: STATS[i]?.color })) || STATS;
  const activite = data?.activite || DONNEES_EMPRUNTS;
  const categories = data?.categories || CATEGORIES;
  const emprunts = data?.emprunts || EMPRUNTS_RECENTS;

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection stats={stats} activite={activite} categories={categories} emprunts={emprunts} />;
      case 'catalogue': return <CatalogueSection />;
      case 'emprunts': return <EmpruntsSection />;
      default: return <ApercuSection stats={stats} activite={activite} categories={categories} emprunts={emprunts} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-neutral-900 dark:text-white"
          >
            Bibliothèque
          </motion.h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Gestion des ouvrages — {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <Button variant="ghost" size="sm"><Search className="h-4 w-4 mr-1" /> Recherche Rapide</Button>
      </div>

      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="flex gap-1 overflow-x-auto -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                )}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {renderSection()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
