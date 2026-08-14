/**
 * BibliothecaireDashboard — Tableau de bord Bibliothécaire
 *
 * Sections : Aperçu | Catalogue | Emprunts
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useDashboardData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Users, Bookmark, Clock, BarChart3, Search, Library } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import { RefreshButton } from '@/shared/components/ui';
import { ErrorDisplay } from '@/shared/components/ui/EmptyState';

const TABS = [
  { id: 'apercu', label: 'Aperçu', icon: BarChart3 },
  { id: 'catalogue', label: 'Catalogue', icon: Library },
  { id: 'emprunts', label: 'Emprunts', icon: Bookmark },
];

const STATS_META = [
  { title: 'Total Ouvrages', icon: BookOpen, color: 'primary' },
  { title: 'Emprunts en Cours', icon: Bookmark, color: 'emerald' },
  { title: 'Retards', icon: Clock, color: 'red' },
  { title: 'Membres Actifs', icon: Users, color: 'sky' },
];

const CAT_COLORS = ['var(--accent)', 'var(--green)', 'var(--amber)', 'var(--red)', 'var(--primary)'];

function ApercuSection({ stats, activite, categories, emprunts, retardsListe, nouveautes, populaires }) {
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
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--text-tertiary)" />
                  <ReTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                  <Bar dataKey="emprunts" name="Emprunts" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="retours" name="Retours" fill="var(--green)" radius={[4, 4, 0, 0]} />
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
                  <ReTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Retards de Retour</Card.Title>
              {retardsListe.length > 0 && (
                <Badge variant="danger" size="sm">{retardsListe.length}</Badge>
              )}
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {retardsListe.length > 0 ? (
            <Table>
              <Table.Header>
                <Table.Head>Élève</Table.Head>
                <Table.Head>Ouvrage</Table.Head>
                <Table.Head>Retard</Table.Head>
              </Table.Header>
              <Table.Body>
                {retardsListe.map((r) => (
                  <Table.Row key={r.id}>
                    <Table.Cell><span className="font-medium text-neutral-900 dark:text-white">{r.eleve}</span></Table.Cell>
                    <Table.Cell className="max-w-[160px] truncate">{r.ouvrage}</Table.Cell>
                    <Table.Cell>
                      <Badge variant={r.jours_retard >= 7 ? 'danger' : 'warning'} size="sm">{r.jours_retard} j</Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
                <Clock className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Aucun retour en retard</p>
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Nouveautés</Card.Title>
            <Card.Description>Derniers ajouts au catalogue</Card.Description>
          </Card.Header>
          <Card.Body className="p-0">
            {nouveautes.length > 0 ? (
            <Table>
              <Table.Header>
                <Table.Head>Titre</Table.Head>
                <Table.Head>Auteur</Table.Head>
              </Table.Header>
              <Table.Body>
                {nouveautes.map((n) => (
                  <Table.Row key={n.id}>
                    <Table.Cell>
                      <span className="font-medium text-neutral-900 dark:text-white">{n.titre}</span>
                      <span className="block text-xs text-neutral-400">{n.categorie}</span>
                    </Table.Cell>
                    <Table.Cell>{n.auteur}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
                <BookOpen className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Aucune nouveauté récente</p>
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Les Plus Empruntés</Card.Title>
            <Card.Description>Ouvrages les plus lus</Card.Description>
          </Card.Header>
          <Card.Body>
            {populaires.length > 0 ? (
            <div className="space-y-3">
              {populaires.map((p, i) => {
                const max = Math.max(...populaires.map((x) => x.emprunts), 1);
                return (
                  <div key={p.titre} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400 truncate">{i + 1}. {p.titre}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(p.emprunts / max) * 100}%` }} />
                      </div>
                      <span className="w-6 text-right font-medium text-neutral-900 dark:text-white">{p.emprunts}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
                <Library className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Aucun emprunt enregistré</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default function BibliothecaireDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('apercu');
  const { data, loading, error, refetch } = useDashboardStats('bibliothecaire');

  const stats = data?.stats?.map((s, i) => ({ ...s, icon: STATS_META[i]?.icon, color: STATS_META[i]?.color })) || [];
  const activite = data?.activite || [];
  const categories = data?.categories || [];
  const emprunts = data?.emprunts || [];
  const retardsListe = data?.retards_liste || [];
  const nouveautes = data?.nouveautes || [];
  const populaires = data?.populaires || [];

  const handleTabClick = (tabId) => {
    if (tabId === 'apercu') { setActiveTab(tabId); return; }
    const routes = { catalogue: '/bibliothecaire/catalogue', emprunts: '/bibliothecaire/emprunts' };
    navigate(routes[tabId] || '/bibliothecaire/dashboard');
 };

  const renderSection = () => {
    switch (activeTab) {
      case 'apercu': return <ApercuSection stats={stats} activite={activite} categories={categories} emprunts={emprunts} retardsListe={retardsListe} nouveautes={nouveautes} populaires={populaires} />;
      default: return <ApercuSection stats={stats} activite={activite} categories={categories} emprunts={emprunts} retardsListe={retardsListe} nouveautes={nouveautes} populaires={populaires} />;
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
        <div className="flex items-center gap-2">
          <RefreshButton loading={loading} onRefresh={refetch} />
          <Button variant="ghost" size="sm"><Search className="h-4 w-4 mr-1" /> Recherche Rapide</Button>
        </div>
      </div>

      {error && (
        <ErrorDisplay message={error} onRetry={refetch} />
      )}

      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="flex gap-1 overflow-x-auto -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-[var(--accent)] text-[var(--accent)] dark:text-[var(--accent)]'
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
