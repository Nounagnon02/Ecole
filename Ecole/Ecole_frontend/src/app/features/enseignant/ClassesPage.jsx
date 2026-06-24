/**
 * ClassesPage — Gestion des classes pour les enseignants
 *
 * L'enseignant consulte ses classes, voit les élèves et saisit les notes.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Users, Search, Filter, GraduationCap,
  BarChart3, FileText, ArrowRight, Clock,
} from 'lucide-react';
import { cn, formatNumber } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import StatsCard from '@/shared/components/ui/StatsCard';
import Input from '@/shared/components/ui/Input';

const MES_CLASSES = [
  { id: 1, nom: '4e A', niveau: 'Collège', effectif: 42, moyenne: 13.2, matieres: ['Mathématiques', 'Physique'], salle: 'S101' },
  { id: 2, nom: '4e B', niveau: 'Collège', effectif: 38, moyenne: 11.8, matieres: ['Mathématiques', 'Physique'], salle: 'S102' },
  { id: 3, nom: '3e A', niveau: 'Collège', effectif: 35, moyenne: 14.1, matieres: ['Mathématiques'], salle: 'S103' },
  { id: 4, nom: '5e A', niveau: 'Collège', effectif: 40, moyenne: 12.5, matieres: ['Mathématiques', 'Physique'], salle: 'S104' },
];

const ELEVES_PAR_CLASSE = {
  '4e A': [
    { id: 1, nom: 'Diallo Amadou', moyenne: 14.5, absences: 2, rang: 5 },
    { id: 2, nom: 'Touré Fatou', moyenne: 16.2, absences: 0, rang: 2 },
    { id: 3, nom: 'Koné Moussa', moyenne: 11.0, absences: 5, rang: 15 },
    { id: 4, nom: 'Cissé Inza', moyenne: 9.5, absences: 8, rang: 22 },
    { id: 5, nom: 'Traoré Kadiatou', moyenne: 17.8, absences: 1, rang: 1 },
    { id: 6, nom: 'Sow Mariam', moyenne: 12.3, absences: 3, rang: 12 },
  ],
  '4e B': [
    { id: 7, nom: 'Diop Souleymane', moyenne: 10.5, absences: 4, rang: 18 },
    { id: 8, nom: 'Ndiaye Fatma', moyenne: 15.0, absences: 1, rang: 3 },
  ],
  '3e A': [
    { id: 9, nom: 'Ba Ousmane', moyenne: 13.8, absences: 2, rang: 6 },
    { id: 10, nom: 'Sylla Aïcha', moyenne: 16.5, absences: 0, rang: 1 },
  ],
  '5e A': [
    { id: 11, nom: 'Faye Cheikh', moyenne: 12.0, absences: 3, rang: 10 },
    { id: 12, nom: 'Gueye Ndeye', moyenne: 14.2, absences: 1, rang: 4 },
  ],
};

export default function ClassesPage() {
  const [selectedClasse, setSelectedClasse] = useState(MES_CLASSES[0]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('liste'); // 'liste' | 'grille'

  const eleves = ELEVES_PAR_CLASSE[selectedClasse.nom] || [];

  const filteredEleves = useMemo(() =>
    eleves.filter((e) => e.nom.toLowerCase().includes(search.toLowerCase())),
    [eleves, search]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Mes Classes</h1>
          <p className="text-sm text-neutral-500">Gérez vos classes et suivez vos élèves</p>
        </div>
      </div>

      {/* Cartes Classes */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MES_CLASSES.map((classe) => (
          <button
            key={classe.id}
            onClick={() => setSelectedClasse(classe)}
            className={cn(
              'rounded-2xl border-2 p-4 text-left transition-all',
              selectedClasse.id === classe.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/5 dark:border-indigo-400'
                : 'border-neutral-200 bg-white hover:border-indigo-200 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-indigo-600'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <Badge variant="primary" size="sm">{classe.niveau}</Badge>
              <GraduationCap className="h-5 w-5 text-indigo-400" />
            </div>
            <p className="text-lg font-bold text-neutral-900 dark:text-white">{classe.nom}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {classe.effectif}
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 className="h-3.5 w-3.5" />
                Ø {classe.moyenne}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {classe.matieres.length} mat.
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Détail de la classe sélectionnée */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Classe de {selectedClasse.nom}
            </h2>
            <p className="text-sm text-neutral-500">
              {selectedClasse.effectif} élèves · Salle {selectedClasse.salle} · {selectedClasse.matieres.join(', ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Rechercher un élève..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex rounded-lg border border-neutral-300 dark:border-neutral-700 overflow-hidden">
              <button
                onClick={() => setViewMode('liste')}
                className={cn('px-3 py-1.5 text-xs font-medium transition-colors',
                  viewMode === 'liste' ? 'bg-indigo-500 text-white' : 'text-neutral-600 dark:text-neutral-400'
                )}
              >
                Liste
              </button>
              <button
                onClick={() => setViewMode('grille')}
                className={cn('px-3 py-1.5 text-xs font-medium transition-colors',
                  viewMode === 'grille' ? 'bg-indigo-500 text-white' : 'text-neutral-600 dark:text-neutral-400'
                )}
              >
                Grille
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'liste' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Élève</th>
                  <th className="pb-3 pr-4">Moyenne</th>
                  <th className="pb-3 pr-4">Absences</th>
                  <th className="pb-3 pr-4">Rang</th>
                  <th className="pb-3 pr-4">Appréciation</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEleves.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-neutral-500">
                      Aucun élève trouvé
                    </td>
                  </tr>
                )}
                {filteredEleves.map((eleve, idx) => (
                  <tr key={eleve.id} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-400 w-5">{idx + 1}</span>
                        <Avatar name={eleve.nom} size="sm" />
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">{eleve.nom}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={cn(
                        'text-sm font-semibold',
                        eleve.moyenne >= 14 ? 'text-emerald-600' : eleve.moyenne >= 10 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {eleve.moyenne.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={cn('text-sm', eleve.absences > 5 ? 'text-red-600 font-medium' : 'text-neutral-600 dark:text-neutral-400')}>
                        {eleve.absences}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={eleve.rang <= 3 ? 'primary' : eleve.rang <= 10 ? 'outline' : 'ghost'} size="sm">
                        {eleve.rang}e
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        eleve.moyenne >= 14 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                        eleve.moyenne >= 10 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      )}>
                        {eleve.moyenne >= 14 ? 'Excellent' : eleve.moyenne >= 10 ? 'Passable' : 'Insuffisant'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="sm" icon={<FileText />} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEleves.map((eleve) => (
              <div key={eleve.id} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={eleve.nom} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{eleve.nom}</p>
                    <p className="text-xs text-neutral-500">Rang: {eleve.rang}e</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Moyenne:</span>
                  <span className={cn(
                    'font-semibold',
                    eleve.moyenne >= 14 ? 'text-emerald-600' : eleve.moyenne >= 10 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {eleve.moyenne.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-neutral-500">Absences:</span>
                  <span className="text-neutral-900 dark:text-white">{eleve.absences}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
