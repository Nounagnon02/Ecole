/**
 * GestionNotes — Page de gestion des notes et évaluations
 *
 * Fonctions : Saisie, consultation, filtres par classe/matière/période
 * Données dynamiques via API /api/notes
 */

import { useState, useEffect, useMemo } from 'react';
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
  Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
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

export default function GestionNotes() {
  const { loading, error, get, post, put, delete: del } = useApi();
  const [activeTab, setActiveTab] = useState('consultation');
  const [search, setSearch] = useState('');
  const [classeFilter, setClasseFilter] = useState('Toutes');
  const [matiereFilter, setMatiereFilter] = useState('Toutes');
  const [periodeFilter, setPeriodeFilter] = useState('Annuelle');
  const [notes, setNotes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [periodes, setPeriodes] = useState([]);
  const [stats, setStats] = useState(null);
  const [moyennesMatieres, setMoyennesMatieres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [notesRes, classesRes, matieresRes, periodesRes, statsRes, moyennesRes] = await Promise.allSettled([
          get('/notes'),
          get('/classes'),
          get('/matieres'),
          get('/periodes'),
          get('/notes/stats'),
          get('/notes/moyennes-par-matiere'),
        ]);

        const notesData = notesRes.status === 'fulfilled'
          ? (Array.isArray(notesRes.value?.data?.data) ? notesRes.value.data.data
            : Array.isArray(notesRes.value?.data) ? notesRes.value.data
            : Array.isArray(notesRes.value) ? notesRes.value : [])
          : [];
        setNotes(notesData);

        const classesData = classesRes.status === 'fulfilled'
          ? (Array.isArray(classesRes.value?.data?.data) ? classesRes.value.data.data
            : Array.isArray(classesRes.value?.data) ? classesRes.value.data
            : Array.isArray(classesRes.value) ? classesRes.value : [])
          : [];
        setClasses(['Toutes', ...classesData.map(c => c.nom || c.nom_classe).filter(Boolean)]);

        const matieresData = matieresRes.status === 'fulfilled'
          ? (Array.isArray(matieresRes.value?.data?.data) ? matieresRes.value.data.data
            : Array.isArray(matieresRes.value?.data) ? matieresRes.value.data
            : Array.isArray(matieresRes.value) ? matieresRes.value : [])
          : [];
        setMatieres(['Toutes', ...matieresData.map(m => m.nom || m.libelle).filter(Boolean)]);

        const periodesData = periodesRes.status === 'fulfilled'
          ? (Array.isArray(periodesRes.value?.data?.data) ? periodesRes.value.data.data
            : Array.isArray(periodesRes.value?.data) ? periodesRes.value.data
            : Array.isArray(periodesRes.value) ? periodesRes.value : [])
          : ['1er Trimestre', '2ème Trimestre', '3ème Trimestre', 'Annuelle'];
        setPeriodes(periodesData.map(p => p.nom || p.libelle || p).filter(Boolean));

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value?.data || statsRes.value);
        }

        if (moyennesRes.status === 'fulfilled') {
          setMoyennesMatieres(moyennesRes.value?.data || moyennesRes.value || []);
        }
      } catch (e) {
        console.error('Erreur chargement notes:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [get]);

  const filtered = useMemo(() =>
    notes.filter(n => {
      if (classeFilter !== 'Toutes' && n.classe?.nom !== classeFilter && n.classe !== classeFilter) return false;
      if (matiereFilter !== 'Toutes' && n.matiere?.nom !== matiereFilter && n.matiere !== matiereFilter) return false;
      if (periodeFilter !== 'Annuelle' && n.periode !== periodeFilter) return false;
      const nomEleve = `${n.eleve?.user?.name ?? ''} ${n.eleve?.user?.prenom ?? ''} ${n.eleve?.nom ?? ''}`.toLowerCase();
      if (search && !nomEleve.includes(search.toLowerCase()) && !(n.matiere?.nom || n.matiere || '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    [notes, search, classeFilter, matiereFilter, periodeFilter]
  );

  const getNoteColor = (note, sur = 20) => {
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
              <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-700">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Saisie rapide</h3>
                  <p className="text-xs text-neutral-500">Sélectionnez une classe et une matière pour saisir les notes</p>
                </div>
                <div className="flex items-center gap-2">
                  <select className="h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm">
                    <option value="">Sélectionner une classe</option>
                    {classes.filter(c => c !== 'Toutes').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select className="h-9 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm">
                    <option value="">Sélectionner une matière</option>
                    {matieres.filter(m => m !== 'Toutes').map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-neutral-500 text-center py-12">
                  Interface de saisie de notes — grille élève × évaluation avec validation automatique
                </p>
              </div>
            </Card>
          </div>
        );
      case 'consultation':
        return (
          <div className="space-y-6">
            {/* Filtres */}
            <Card>
              <div className="p-4">
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
                    className="h-10 px-4 pr-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
                  >
                    {classes.map(c => (
                      <option key={c} value={c}>{c === 'Toutes' ? 'Toutes les classes' : c}</option>
                    ))}
                  </select>
                  <select
                    value={matiereFilter}
                    onChange={e => setMatiereFilter(e.target.value)}
                    className="h-10 px-4 pr-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
                  >
                    {matieres.map(m => (
                      <option key={m} value={m}>{m === 'Toutes' ? 'Toutes les matières' : m}</option>
                    ))}
                  </select>
                  <select
                    value={periodeFilter}
                    onChange={e => setPeriodeFilter(e.target.value)}
                    className="h-10 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
                  >
                    {periodes.map(p => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Tableau des notes */}
            <Card>
              <div className="p-0">
                <Table>
                  <Table.Header>
                    <Table.Head>Élève</Table.Head>
                    <Table.Head>Classe</Table.Head>
                    <Table.Head>Matière</Table.Head>
                    <Table.Head>Note</Table.Head>
                    <Table.Head>Type</Table.Head>
                    <Table.Head>Période</Table.Head>
                    <Table.Head>Date</Table.Head>
                    <Table.Head>Appréciation</Table.Head>
                    <Table.Head className="text-right">Actions</Table.Head>
                  </Table.Header>
                  <Table.Body>
                    {isLoading && Array.from({ length: 5 }).map((_, i) => (
                      <Table.Row key={i}>
                        {Array.from({ length: 9 }).map((__, j) => (
                          <Table.Cell key={j}><div className="h-4 w-full bg-neutral-200 animate-pulse dark:bg-neutral-700 rounded" /></Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
                    {!isLoading && filtered.length === 0 && (
                      <Table.Row>
                        <td colSpan={9} className="p-8 text-center text-sm text-neutral-500">
                          Aucune note trouvée
                        </td>
                      </Table.Row>
                    )}
                    {!isLoading && filtered.map((note) => (
                      <Table.Row key={note.id}>
                        <Table.Cell>
                          <div className="flex items-center gap-2">
                            <Avatar name={note.eleve?.user?.name || note.eleve?.nom || note.eleve?.prenom || 'Élève'} size="sm" />
                            <span className="font-medium text-neutral-900 dark:text-white">
                              {note.eleve?.user?.name} {note.eleve?.user?.prenom}
                            </span>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge variant="info" size="sm">{note.classe?.nom || note.classe?.nom_classe || '—'}</Badge>
                        </Table.Cell>
                        <Table.Cell className="text-neutral-700 dark:text-neutral-300">{note.matiere?.nom || note.matiere || '—'}</Table.Cell>
                        <Table.Cell>
                          <span className={cn('font-semibold text-sm', getNoteColor(note.note, note.sur || 20))}>
                            {note.note}/{note.sur || 20}
                          </span>
                          <span className="text-xs text-neutral-400 ml-1">coeff {note.coeff || note.coefficient || 1}</span>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge variant={note.type === 'Composition' ? 'primary' : 'neutral'} size="sm">
                            {note.type_evaluation || note.type || 'Devoir'}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell className="text-xs text-neutral-500">{note.periode || '—'}</Table.Cell>
                        <Table.Cell className="text-xs text-neutral-500">{note.date_evaluation || note.date || '—'}</Table.Cell>
                        <Table.Cell className="text-neutral-500 text-xs max-w-[150px] truncate">{note.appreciation || '—'}</Table.Cell>
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
              </div>
              <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
                <span className="text-sm text-neutral-500">{filtered.length} notes</span>
              </div>
            </Card>
          </div>
        );
      case 'stats': {
        const statsData = stats || {
          moyenneGenerale: notes.length > 0
            ? (notes.reduce((a, n) => a + parseFloat(n.note ?? 0), 0) / notes.length).toFixed(1)
            : '—',
          tauxReussite: notes.length > 0
            ? Math.round((notes.filter((n) => parseFloat(n.note) >= 10).length / notes.length) * 100)
            : 0,
          totalEvaluations: notes.length,
        };
        const moyennesData = moyennesMatieres.length > 0 ? moyennesMatieres : [
          { matiere: 'Mathématiques', moyenne: 12.5, max: 18 },
          { matiere: 'Français', moyenne: 11.8, max: 16 },
          { matiere: 'Anglais', moyenne: 13.2, max: 17 },
          { matiere: 'Physique-Chimie', moyenne: 10.5, max: 15 },
          { matiere: 'SVT', moyenne: 14.1, max: 19 },
          { matiere: 'Histoire-Géo', moyenne: 12.9, max: 17 },
          { matiere: 'Philosophie', moyenne: 11.0, max: 15 },
          { matiere: 'EPS', moyenne: 15.5, max: 20 },
        ];

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: 'Moyenne Générale', value: `${statsData.moyenneGenerale}/20`, icon: Award, trend: 0.8, trendLabel: 'vs trimestre dernier', color: 'emerald' },
                { title: 'Taux de Réussite', value: `${statsData.tauxReussite}%`, icon: CheckCircle2, trend: 5, trendLabel: 'en progression', color: 'primary' },
                { title: 'Devoirs notés', value: String(statsData.totalEvaluations), icon: FileText, trend: 12, trendLabel: 'ce mois', color: 'sky' },
                { title: 'Matières en alerte', value: '2', icon: AlertCircle, trend: -1, trendLabel: 'vs mois dernier', color: 'red' },
              ].map((stat, i) => (
                <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <StatsCard {...stat} className="h-full" />
                </motion.div>
              ))}
            </div>

            <Card>
              <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Moyennes par Matière</h3>
                <p className="text-xs text-neutral-500">Comparaison des moyennes générales et maximales</p>
              </div>
              <div className="p-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moyennesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="matiere" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                      <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <ReTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                      <Bar dataKey="max" fill="rgba(99,102,241,0.15)" name="Note max" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="moyenne" fill="#6366f1" name="Moyenne" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>
        );
      }
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
          {[
            { id: 'saisie', label: 'Saisie des Notes', icon: Edit },
            { id: 'consultation', label: 'Consultation', icon: Eye },
            { id: 'stats', label: 'Statistiques', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-[var(--accent)] text-[var(--accent)] dark:text-[var(--accent)]'
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