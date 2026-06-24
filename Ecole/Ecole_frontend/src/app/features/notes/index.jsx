/**
 * GestionNotes — Page de gestion des notes et évaluations
 *
 * Fonctions : Saisie, consultation, filtres par classe/matière/période
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  BarChart3,
  Download,
  Plus,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  FileText,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Avatar from '@/shared/components/ui/Avatar';
import Table from '@/shared/components/ui/Table';
import StatsCard from '@/shared/components/ui/StatsCard';

const CLASSES = ['Toutes', '6ème A', '6ème B', '5ème A', '5ème B', '4ème A', '4ème B', '3ème A', '3ème B', '2nde A', '2nde B', '1ère A', '1ère B', 'Tle A', 'Tle B'];
const MATIERES = ['Toutes', 'Mathématiques', 'Français', 'Anglais', 'Physique-Chimie', 'SVT', 'Histoire-Géo', 'Philosophie', 'EPS'];
const PERIODES = ['1er Trimestre', '2ème Trimestre', '3ème Trimestre', 'Annuelle'];

const NOTES_MOCK = [
  { id: 1, eleve: 'Jean Mensah', classe: '4ème A', matiere: 'Mathématiques', note: 16, sur: 20, coeff: 4, date: '2024-10-15', type: 'Devoir', appreciation: 'Très bon travail' },
  { id: 2, eleve: 'Ama Koffi', classe: '4ème A', matiere: 'Français', note: 14, sur: 20, coeff: 3, date: '2024-10-14', type: 'Composition', appreciation: 'Bien' },
  { id: 3, eleve: 'Koffi Dossa', classe: '4ème B', matiere: 'Anglais', note: 8, sur: 20, coeff: 2, date: '2024-10-14', type: 'Devoir', appreciation: 'Peut mieux faire' },
  { id: 4, eleve: 'Sarah Koné', classe: '5ème A', matiere: 'Mathématiques', note: 18, sur: 20, coeff: 4, date: '2024-10-13', type: 'Composition', appreciation: 'Excellent' },
  { id: 5, eleve: 'Paul Bamba', classe: '2nde A', matiere: 'Physique-Chimie', note: 11, sur: 20, coeff: 3, date: '2024-10-12', type: 'Devoir', appreciation: 'Moyen' },
  { id: 6, eleve: 'Grace Ouattara', classe: 'Tle A', matiere: 'Philosophie', note: 15, sur: 20, coeff: 2, date: '2024-10-11', type: 'Composition', appreciation: 'Bien' },
  { id: 7, eleve: 'David Amégnigban', classe: '3ème B', matiere: 'SVT', note: 7, sur: 20, coeff: 2, date: '2024-10-10', type: 'Devoir', appreciation: 'Insuffisant' },
  { id: 8, eleve: 'Mwana Akakpo', classe: '3ème A', matiere: 'Histoire-Géo', note: 17, sur: 20, coeff: 3, date: '2024-10-09', type: 'Composition', appreciation: 'Très bien' },
];

const STATS_NOTES = [
  { title: 'Moyenne Générale', value: '13.2/20', icon: TrendingUp, trend: 0.8, trendLabel: 'vs trimestre dernier', color: 'emerald' },
  { title: 'Taux de Réussite', value: '78%', icon: Award, trend: 5, trendLabel: 'en progression', color: 'indigo' },
  { title: 'Devoirs notés', value: '48', icon: FileText, trend: 12, trendLabel: 'ce mois', color: 'sky' },
  { title: 'Matières en alerte', value: '2', icon: AlertCircle, trend: -1, trendLabel: 'vs mois dernier', color: 'red' },
];

const MOYENNES_MATIERES = [
  { matiere: 'Mathématiques', moyenne: 12.5, max: 18 },
  { matiere: 'Français', moyenne: 11.8, max: 16 },
  { matiere: 'Anglais', moyenne: 13.2, max: 17 },
  { matiere: 'Physique-Chimie', moyenne: 10.5, max: 15 },
  { matiere: 'SVT', moyenne: 14.1, max: 19 },
  { matiere: 'Histoire-Géo', moyenne: 12.9, max: 17 },
  { matiere: 'Philosophie', moyenne: 11.0, max: 15 },
  { matiere: 'EPS', moyenne: 15.5, max: 20 },
];

const TABS = [
  { id: 'saisie', label: 'Saisie des Notes', icon: Edit },
  { id: 'consultation', label: 'Consultation', icon: Eye },
  { id: 'stats', label: 'Statistiques', icon: BarChart3 },
];

export default function GestionNotes() {
  const [activeTab, setActiveTab] = useState('consultation');
  const [search, setSearch] = useState('');
  const [classeFilter, setClasseFilter] = useState('Toutes');
  const [matiereFilter, setMatiereFilter] = useState('Toutes');
  const [periodeFilter, setPeriodeFilter] = useState('Annuelle');

  const filtered = NOTES_MOCK.filter(n =>
    (classeFilter === 'Toutes' || n.classe === classeFilter) &&
    (matiereFilter === 'Toutes' || n.matiere === matiereFilter) &&
    (n.eleve.toLowerCase().includes(search.toLowerCase()) ||
     n.matiere.toLowerCase().includes(search.toLowerCase()))
  );

  const getNoteColor = (note, sur) => {
    const pct = note / sur;
    if (pct >= 0.8) return 'text-emerald-600 dark:text-emerald-400';
    if (pct >= 0.6) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'saisie':
        return (
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <div>
                    <Card.Title>Saisie rapide</Card.Title>
                    <Card.Description>Sélectionnez une classe et une matière pour saisir les notes</Card.Description>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm">
                      {CLASSES.filter(c => c !== 'Toutes').map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <select className="h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm">
                      {MATIERES.filter(m => m !== 'Toutes').map(m => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <p className="text-neutral-500 text-center py-12">
                  Interface de saisie de notes — grille élève × évaluation avec validation automatique
                </p>
              </Card.Body>
            </Card>
          </div>
        );
      case 'consultation':
        return (
          <div className="space-y-6">
            {/* Filtres */}
            <Card>
              <Card.Body className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder="Rechercher par élève ou matière..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      icon={Search}
                    />
                  </div>
                  <select
                    value={classeFilter}
                    onChange={e => setClasseFilter(e.target.value)}
                    className="h-10 px-4 pr-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {CLASSES.map(c => (
                      <option key={c} value={c}>{c === 'Toutes' ? 'Toutes les classes' : c}</option>
                    ))}
                  </select>
                  <select
                    value={matiereFilter}
                    onChange={e => setMatiereFilter(e.target.value)}
                    className="h-10 px-4 pr-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {MATIERES.map(m => (
                      <option key={m} value={m}>{m === 'Toutes' ? 'Toutes les matières' : m}</option>
                    ))}
                  </select>
                  <select
                    value={periodeFilter}
                    onChange={e => setPeriodeFilter(e.target.value)}
                    className="h-10 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {PERIODES.map(p => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </Card.Body>
            </Card>

            {/* Tableau des notes */}
            <Card>
              <Card.Body className="p-0">
                <Table>
                  <Table.Header>
                    <Table.Head>Élève</Table.Head>
                    <Table.Head>Classe</Table.Head>
                    <Table.Head>Matière</Table.Head>
                    <Table.Head>Note</Table.Head>
                    <Table.Head>Type</Table.Head>
                    <Table.Head>Date</Table.Head>
                    <Table.Head>Appréciation</Table.Head>
                    <Table.Head className="text-right">Actions</Table.Head>
                  </Table.Header>
                  <Table.Body>
                    {filtered.map((note) => (
                      <Table.Row key={note.id}>
                        <Table.Cell>
                          <div className="flex items-center gap-2">
                            <Avatar name={note.eleve} size="sm" />
                            <span className="font-medium text-neutral-900 dark:text-white">{note.eleve}</span>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge variant="info" size="sm">{note.classe}</Badge>
                        </Table.Cell>
                        <Table.Cell className="text-neutral-700 dark:text-neutral-300">{note.matiere}</Table.Cell>
                        <Table.Cell>
                          <span className={cn('font-semibold text-sm', getNoteColor(note.note, note.sur))}>
                            {note.note}/{note.sur}
                          </span>
                          <span className="text-xs text-neutral-400 ml-1">coeff {note.coeff}</span>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge variant={note.type === 'Composition' ? 'primary' : 'neutral'} size="sm">
                            {note.type}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell className="text-neutral-400 text-xs">{note.date}</Table.Cell>
                        <Table.Cell className="text-neutral-500 text-xs max-w-[150px] truncate">{note.appreciation}</Table.Cell>
                        <Table.Cell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-colors">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-neutral-400 hover:text-red-500 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </Card.Body>
              <Card.Footer>
                <span className="text-sm text-neutral-500">{filtered.length} notes</span>
              </Card.Footer>
            </Card>
          </div>
        );
      case 'stats':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS_NOTES.map((stat, i) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <StatsCard {...stat} className="h-full" />
                </motion.div>
              ))}
            </div>

            <Card>
              <Card.Header>
                <Card.Title>Moyennes par Matière</Card.Title>
                <Card.Description>Comparaison des moyennes générales et maximales</Card.Description>
              </Card.Header>
              <Card.Body>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOYENNES_MATIERES}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="matiere" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                      <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <ReTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                      <Bar dataKey="max" fill="rgba(99,102,241,0.15)" name="Note max" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="moyenne" fill="#6366f1" name="Moyenne" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>
          </div>
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
        Gestion des Notes
      </motion.h1>

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="flex gap-1 overflow-x-auto -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
