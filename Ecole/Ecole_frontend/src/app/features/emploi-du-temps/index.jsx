/**
 * EmploiDuTemps — Page de gestion des emplois du temps
 *
 * Fonctions : Calendrier hebdomadaire, création/modification de créneaux
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Clock,
  BookOpen,
  MapPin,
  Users,
  Edit,
  Trash2,
  Filter,
  GraduationCap,
} from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';

const CLASSES = ['6ème A', '6ème B', '5ème A', '5ème B', '4ème A', '4ème B', '3ème A', '3ème B', '2nde A', '2nde B', '1ère A', '1ère B', 'Tle A', 'Tle B'];

const COURS = [
  { id: 1, jour: 1, heureDebut: '08:00', heureFin: '09:00', matiere: 'Mathématiques', enseignant: 'M. Koffi', salle: 'Salle 12', classe: '4ème A', type: 'Cours' },
  { id: 2, jour: 1, heureDebut: '09:00', heureFin: '10:00', matiere: 'Français', enseignant: 'Mme. Dossa', salle: 'Salle 08', classe: '4ème A', type: 'Cours' },
  { id: 3, jour: 1, heureDebut: '10:15', heureFin: '11:15', matiere: 'Anglais', enseignant: 'M. Mensah', salle: 'Salle 05', classe: '4ème A', type: 'TD' },
  { id: 4, jour: 1, heureDebut: '11:15', heureFin: '12:15', matiere: 'Physique-Chimie', enseignant: 'Mme. Bamba', salle: 'Labo 1', classe: '4ème A', type: 'TP' },
  { id: 5, jour: 2, heureDebut: '08:00', heureFin: '10:00', matiere: 'SVT', enseignant: 'M. Ouattara', salle: 'Salle 12', classe: '4ème A', type: 'Cours' },
  { id: 6, jour: 2, heureDebut: '10:15', heureFin: '11:15', matiere: 'Histoire-Géo', enseignant: 'M. Koné', salle: 'Salle 12', classe: '4ème A', type: 'Cours' },
  { id: 7, jour: 2, heureDebut: '11:15', heureFin: '12:15', matiere: 'EPS', enseignant: 'M. Akakpo', salle: 'Terrain', classe: '4ème A', type: 'Sport' },
  { id: 8, jour: 3, heureDebut: '08:00', heureFin: '09:00', matiere: 'Mathématiques', enseignant: 'M. Koffi', salle: 'Salle 12', classe: '4ème A', type: 'Cours' },
  { id: 9, jour: 3, heureDebut: '09:00', heureFin: '10:00', matiere: 'Anglais', enseignant: 'M. Mensah', salle: 'Salle 05', classe: '4ème A', type: 'Cours' },
  { id: 10, jour: 3, heureDebut: '10:15', heureFin: '11:15', matiere: 'Philosophie', enseignant: 'Mme. Dossa', salle: 'Salle 12', classe: '4ème A', type: 'Cours' },
  { id: 11, jour: 4, heureDebut: '08:00', heureFin: '10:00', matiere: 'Français', enseignant: 'Mme. Dossa', salle: 'Salle 08', classe: '4ème A', type: 'TD' },
  { id: 12, jour: 4, heureDebut: '10:15', heureFin: '11:15', matiere: 'Mathématiques', enseignant: 'M. Koffi', salle: 'Salle 12', classe: '4ème A', type: 'Cours' },
  { id: 13, jour: 5, heureDebut: '08:00', heureFin: '09:00', matiere: 'Histoire-Géo', enseignant: 'M. Koné', salle: 'Salle 12', classe: '4ème A', type: 'Cours' },
  { id: 14, jour: 5, heureDebut: '09:00', heureFin: '10:00', matiere: 'SVT', enseignant: 'M. Ouattara', salle: 'Labo 2', classe: '4ème A', type: 'TP' },
  { id: 15, jour: 5, heureDebut: '10:15', heureFin: '11:15', matiere: 'Physique-Chimie', enseignant: 'Mme. Bamba', salle: 'Labo 1', classe: '4ème A', type: 'Cours' },
];

const CRENEAUX = ['08:00', '09:00', '10:15', '11:15', '14:00', '15:00', '16:00'];
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const TYPE_COLORS = {
  'Cours': 'bg-[var(--primary-subtle)] border-[var(--accent)]/30 dark:border-[var(--accent)]/30 text-[var(--accent)] dark:text-[var(--accent)]',
  'TD': 'bg-emerald-100 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
  'TP': 'bg-amber-100 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-300',
  'Sport': 'bg-sky-100 dark:bg-sky-500/15 border-sky-300 dark:border-sky-500/30 text-sky-700 dark:text-sky-300',
};

export default function EmploiDuTemps() {
  const [selectedClasse, setSelectedClasse] = useState('4ème A');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const prevWeek = () => setWeekStart(prev => subWeeks(prev, 1));
  const nextWeek = () => setWeekStart(prev => addWeeks(prev, 1));

  const days = eachDayOfInterval({ start: weekStart, end: new Date(weekStart.getTime() + 4 * 86400000) });

  const getCoursForJourHeure = (jourIndex, heure) => {
    return COURS.filter(c => c.classe === selectedClasse && c.jour === jourIndex + 1 && c.heureDebut === heure);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Emploi du Temps</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Planning hebdomadaire des cours
          </p>
        </motion.div>
        <div className="flex items-center gap-2">
          <select value={selectedClasse} onChange={e => setSelectedClasse(e.target.value)}
            className="h-10 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]">
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>
          <Button variant="ghost" size="sm"><Download className="h-4 w-4 mr-1" /> Exporter</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Créneau</Button>
        </div>
      </div>

      {/* Navigation semaine */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={prevWeek}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Semaine précédente
        </Button>
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {format(weekStart, 'dd MMMM', { locale: fr })} — {format(days[4], 'dd MMMM yyyy', { locale: fr })}
        </span>
        <Button variant="ghost" size="sm" onClick={nextWeek}>
          Semaine suivante <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Grille horaire */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* En-têtes des jours */}
          <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-px bg-neutral-200 dark:bg-neutral-800 rounded-t-2xl overflow-hidden">
            <div className="bg-neutral-50 dark:bg-neutral-900/50 p-3" />
            {days.map((day, i) => (
              <div key={i} className="bg-neutral-50 dark:bg-neutral-900/50 p-3 text-center">
                <p className="text-xs font-semibold text-neutral-500 uppercase">{JOURS[i]}</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">{format(day, 'dd')}</p>
              </div>
            ))}
          </div>

          {/* Créneaux */}
          {CRENEAUX.map((heure, rowIdx) => (
            <div key={heure} className={cn(
              'grid grid-cols-[80px_repeat(5,1fr)] gap-px bg-neutral-200 dark:bg-neutral-800',
              rowIdx === CRENEAUX.length - 1 && 'rounded-b-2xl'
            )}>
              <div className="bg-white dark:bg-neutral-900 p-2 flex items-center justify-center">
                <span className="text-xs font-medium text-neutral-500">{heure}</span>
              </div>
              {[0, 1, 2, 3, 4].map(jourIdx => {
                const coursList = getCoursForJourHeure(jourIdx, heure);
                return (
                  <div key={jourIdx} className={cn(
                    'bg-white dark:bg-neutral-900 p-1.5 min-h-[80px]',
                    rowIdx % 2 === 0 ? '' : 'bg-neutral-50/50 dark:bg-neutral-900/50'
                  )}>
                    {coursList.map(cours => (
                      <div key={cours.id} className={cn(
                        'rounded-lg border px-2 py-1.5 h-full text-xs cursor-pointer transition-all hover:shadow-md group relative',
                        TYPE_COLORS[cours.type] || TYPE_COLORS['Cours']
                      )}>
                        <p className="font-semibold truncate">{cours.matiere}</p>
                        <p className="opacity-70 truncate">{cours.enseignant}</p>
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] opacity-60">
                          <MapPin className="h-3 w-3" />
                          <span>{cours.salle}</span>
                        </div>
                        <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-0.5">
                          <button className="p-0.5 rounded hover:bg-black/10"><Edit className="h-3 w-3" /></button>
                          <button className="p-0.5 rounded hover:bg-black/10 text-red-500"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-6 text-sm text-neutral-500">
        <span className="text-xs font-medium">Légende :</span>
        {Object.entries(TYPE_COLORS).map(([type, cls]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={cn('w-3 h-3 rounded border', cls.split(' ')[0], cls.split(' ')[1])} />
            <span>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
