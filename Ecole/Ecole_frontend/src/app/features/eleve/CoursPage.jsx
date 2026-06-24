/**
 * CoursPage — Mes cours pour les élèves
 *
 * L'élève consulte ses cours, devoirs et ressources pédagogiques.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, FileText, Clock, Download, Eye,
  Play, ChevronRight, Search, Filter, Calendar,
  CheckCircle, AlertCircle,
} from 'lucide-react';
import { cn, formatDate, formatRelativeTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';

const COURS = [
  {
    id: 1,
    matiere: 'Mathématiques',
    prof: 'M. Diallo',
    chapitre: 'Équations du second degré',
    date: new Date(Date.now() - 86400000 * 1),
    duree: '2h',
    type: 'cours',
    status: 'termine',
    resume: 'Résolution des équations ax² + bx + c = 0 avec discriminant.',
    ressources: ['Cours PDF', 'Exercices corrigés', 'Vidéo explicative'],
  },
  {
    id: 2,
    matiere: 'Français',
    prof: 'Mme Touré',
    chapitre: 'Le roman africain',
    date: new Date(Date.now() - 86400000 * 2),
    duree: '1h30',
    type: 'cours',
    status: 'termine',
    resume: 'Analyse des thèmes principaux du roman africain contemporain.',
    ressources: ['Texte étudié', 'Analyse'],
  },
  {
    id: 3,
    matiere: 'Anglais',
    prof: 'M. Koné',
    chapitre: 'Past Perfect Tense',
    date: new Date(Date.now() + 86400000 * 1),
    duree: '1h',
    type: 'cours',
    status: 'prevue',
    resume: 'Usage du past perfect en anglais.',
    ressources: [],
  },
  {
    id: 4,
    matiere: 'Physique',
    prof: 'Mme Cissé',
    chapitre: 'Devoir sur les lentilles',
    date: new Date(Date.now() - 86400000 * 3),
    duree: '2h',
    type: 'devoir',
    status: 'rendu',
    note: 14,
    resume: 'Devoir sur les lentilles convergentes et divergentes.',
    ressources: ['Sujet', 'Correction'],
  },
  {
    id: 5,
    matiere: 'Histoire',
    prof: 'M. Traoré',
    chapitre: 'Exposé: indépendances africaines',
    date: new Date(Date.now() + 86400000 * 3),
    duree: '1h',
    type: 'devoir',
    status: 'a_rendre',
    resume: 'Préparer un exposé sur les indépendances africaines.',
    ressources: [],
  },
  {
    id: 6,
    matiere: 'SVT',
    prof: 'Mme Sow',
    chapitre: 'TP classification du vivant',
    date: new Date(Date.now() - 86400000 * 0.5),
    duree: '3h',
    type: 'tp',
    status: 'termine',
    resume: 'Travaux pratiques sur la classification des êtres vivants.',
    ressources: ['Protocole TP', 'Fiche de résultats'],
  },
];

const MATIERES = [...new Set(COURS.map((c) => c.matiere))];

export default function CoursPage() {
  const [search, setSearch] = useState('');
  const [filterMatiere, setFilterMatiere] = useState('');
  const [filterType, setFilterType] = useState('');

  const filtered = useMemo(() =>
    COURS.filter((c) => {
      if (search && !c.chapitre.toLowerCase().includes(search.toLowerCase()) && !c.matiere.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterMatiere && c.matiere !== filterMatiere) return false;
      if (filterType && c.type !== filterType) return false;
      return true;
    }),
    [search, filterMatiere, filterType]
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'termine': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'prevue': return <Calendar className="h-4 w-4 text-indigo-500" />;
      case 'rendu': return <FileText className="h-4 w-4 text-sky-500" />;
      case 'a_rendre': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default: return null;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'termine': return 'Terminé';
      case 'prevue': return 'À venir';
      case 'rendu': return 'Rendu';
      case 'a_rendre': return 'À rendre';
      default: return status;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Mes Cours</h1>
        <p className="text-sm text-neutral-500">Consultez vos cours, devoirs et ressources</p>
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un cours..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterMatiere}
            onChange={(e) => setFilterMatiere(e.target.value)}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">Toutes les matières</option>
            {MATIERES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">Tous les types</option>
            <option value="cours">Cours</option>
            <option value="devoir">Devoir</option>
            <option value="tp">TP</option>
          </select>
        </div>
      </Card>

      {/* Liste des cours */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <BookOpen className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucun cours trouvé</p>
            </div>
          </Card>
        )}
        {filtered.map((cours) => (
          <motion.div
            key={cours.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card hover>
              <div className="flex items-start gap-4">
                {/* Icône matière */}
                <div className={cn(
                  'h-12 w-12 rounded-xl flex items-center justify-center shrink-0',
                  cours.type === 'cours' ? 'bg-indigo-100 dark:bg-indigo-900/20' :
                  cours.type === 'devoir' ? 'bg-amber-100 dark:bg-amber-900/20' :
                  'bg-emerald-100 dark:bg-emerald-900/20'
                )}>
                  {cours.type === 'cours' ? <BookOpen className="h-6 w-6 text-indigo-500" /> :
                   cours.type === 'devoir' ? <FileText className="h-6 w-6 text-amber-500" /> :
                   <Play className="h-6 w-6 text-emerald-500" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="primary" size="sm">{cours.matiere}</Badge>
                    <span className="text-xs text-neutral-500 capitalize">
                      {cours.type === 'tp' ? 'TP' : cours.type}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-neutral-400">
                      <Clock className="h-3 w-3" />
                      {cours.duree}
                    </div>
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-neutral-900 dark:text-white">
                    {cours.chapitre}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">{cours.resume}</p>

                  <div className="mt-3 flex items-center gap-4">
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {cours.date > new Date() ? 'Prévu le ' : 'Le '}
                      {formatDate(cours.date)}
                    </span>
                    <span className="text-xs text-neutral-500">{cours.prof}</span>
                  </div>

                  {/* Ressources */}
                  {cours.ressources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cours.ressources.map((r) => (
                        <button key={r} className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 transition-colors">
                          <Download className="h-3 w-3" />
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    {getStatusIcon(cours.status)}
                    <span className={cn(
                      cours.status === 'termine' && 'text-emerald-600',
                      cours.status === 'prevue' && 'text-indigo-600',
                      cours.status === 'rendu' && 'text-sky-600',
                      cours.status === 'a_rendre' && 'text-amber-600',
                    )}>
                      {getStatusLabel(cours.status)}
                    </span>
                  </div>
                  {cours.note && (
                    <span className="text-lg font-bold text-indigo-600">{cours.note}/20</span>
                  )}
                  <Button variant="ghost" size="sm" icon={<Eye />}>
                    Voir
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
