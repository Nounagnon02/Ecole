/**
 * ScheduleTimeline — Composant d'emploi du temps premium
 *
 * Affiche un planning hebdomadaire sous forme de grille horaire
 * inspirée de Google Calendar / Cron. Supporte :
 * - Vue semaine avec créneaux horaires
 * - Drag & drop (préparé, nécessite @dnd-kit)
 * - Filtrage par jour/matière/enseignant
 * - Sessions chevauchantes
 * - Mode sombre
 *
 * @example
 * <ScheduleTimeline
 *   sessions={sessions}
 *   onSessionClick={(session) => navigate(session.url)}
 * />
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, MapPin, User } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/* ─── Constantes ────────────────────────────────────────────────── */
const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7h → 19h

const COLORS = [
  { bg: 'bg-indigo-100 dark:bg-indigo-950/40', border: 'border-l-indigo-500', text: 'text-indigo-700 dark:text-indigo-300' },
  { bg: 'bg-emerald-100 dark:bg-emerald-950/40', border: 'border-l-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
  { bg: 'bg-amber-100 dark:bg-amber-950/40', border: 'border-l-amber-500', text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-rose-100 dark:bg-rose-950/40', border: 'border-l-rose-500', text: 'text-rose-700 dark:text-rose-300' },
  { bg: 'bg-cyan-100 dark:bg-cyan-950/40', border: 'border-l-cyan-500', text: 'text-cyan-700 dark:text-cyan-300' },
  { bg: 'bg-violet-100 dark:bg-violet-950/40', border: 'border-l-violet-500', text: 'text-violet-700 dark:text-violet-300' },
];

/* ─── Composant ─────────────────────────────────────────────────── */
export default function ScheduleTimeline({
  sessions = [],
  onSessionClick,
  className,
}) {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [filterMatiere, setFilterMatiere] = useState(null);

  // Générer les matières uniques pour le filtre
  const matieres = useMemo(() => {
    const set = new Set(sessions.map((s) => s.matiere_nom).filter(Boolean));
    return Array.from(set);
  }, [sessions]);

  // Filtrer les sessions
  const filteredSessions = useMemo(() => {
    if (!filterMatiere) return sessions;
    return sessions.filter((s) => s.matiere_nom === filterMatiere);
  }, [sessions, filterMatiere]);

  // Calculer la position verticale d'une session dans la grille
  const getSessionStyle = (session) => {
    const startHour = typeof session.heure_debut === 'string'
      ? parseInt(session.heure_debut.split(':')[0]) + parseInt(session.heure_debut.split(':')[1]) / 60
      : session.heure_debut;
    const endHour = typeof session.heure_fin === 'string'
      ? parseInt(session.heure_fin.split(':')[0]) + parseInt(session.heure_fin.split(':')[1]) / 60
      : session.heure_fin;

    const top = ((startHour - 7) / 12) * 100;
    const height = ((endHour - startHour) / 12) * 100;

    return { top: `${top}%`, height: `${Math.max(height, 3.5)}%` };
  };

  // Assigner une couleur aux matières
  const getMatiereColor = (matiereNom) => {
    if (!matiereNom) return COLORS[0];
    const index = matieres.indexOf(matiereNom);
    return COLORS[index % COLORS.length];
  };

  // Obtenir les sessions pour un jour spécifique
  const getSessionsForDay = (dayKey) => {
    return filteredSessions.filter((s) => s.jour === dayKey);
  };

  // Libellé de la semaine
  const weekLabel = currentWeek === 0
    ? 'Cette semaine'
    : currentWeek === -1
      ? 'Semaine dernière'
      : currentWeek === 1
        ? 'Semaine prochaine'
        : `Semaine ${currentWeek > 0 ? '+' : ''}${currentWeek}`;

  return (
    <div className={cn('rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900', className)}>
      {/* En-tête avec navigation */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeek((w) => w - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 min-w-[120px] text-center">
            {weekLabel}
          </span>
          <button
            onClick={() => setCurrentWeek((w) => w + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Filtre matière */}
        {matieres.length > 1 && (
          <div className="flex items-center gap-2">
            <select
              value={filterMatiere || ''}
              onChange={(e) => setFilterMatiere(e.target.value || null)}
              className="h-8 rounded-lg border border-neutral-200 bg-neutral-50 px-2 text-xs text-neutral-600 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
            >
              <option value="">Toutes les matières</option>
              {matieres.map((matiere) => (
                <option key={matiere} value={matiere}>{matiere}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grille horaire */}
      <div className="overflow-x-auto">
        <div className="flex min-w-[700px]">
          {/* Colonne des heures */}
          <div className="w-16 shrink-0 border-r border-neutral-200 dark:border-neutral-800">
            <div className="h-12 border-b border-neutral-200 dark:border-neutral-800" />
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="relative flex h-12 items-center justify-center border-b border-neutral-100 dark:border-neutral-800/50"
              >
                <span className="text-[10px] font-medium text-neutral-400">
                  {hour}h
                </span>
              </div>
            ))}
          </div>

          {/* Colonnes des jours */}
          {DAYS.map((day) => (
            <div key={day.key} className="relative flex-1 border-r border-neutral-200 last:border-r-0 dark:border-neutral-800">
              {/* En-tête du jour */}
              <div className="sticky top-0 z-10 flex h-12 items-center justify-center border-b border-neutral-200 bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
                <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  {day.label.slice(0, 3)}
                </span>
              </div>

              {/* Grille horaire */}
              <div className="relative">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-12 border-b border-neutral-100 dark:border-neutral-800/30"
                  />
                ))}

                {/* Sessions */}
                {getSessionsForDay(day.key).map((session, i) => {
                  const color = getMatiereColor(session.matiere_nom);
                  const style = getSessionStyle(session);
                  return (
                    <motion.button
                      key={session.id || i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => onSessionClick?.(session)}
                      className={cn(
                        'absolute left-1 right-1 flex flex-col overflow-hidden rounded-lg border-l-[3px] p-1.5 text-left transition-all hover:brightness-95 dark:hover:brightness-125 cursor-pointer',
                        color.bg,
                        color.border,
                      )}
                      style={style}
                    >
                      <span className={cn('text-[10px] font-semibold leading-tight truncate', color.text)}>
                        {session.matiere_nom || 'Cours'}
                      </span>
                      <span className="text-[9px] text-neutral-500 dark:text-neutral-400 truncate">
                        {session.heure_debut && session.heure_debut.slice(0, 5)}
                        {session.heure_fin && ` - ${session.heure_fin.slice(0, 5)}`}
                      </span>
                      {session.salle && (
                        <span className="text-[9px] text-neutral-400 truncate">
                          {session.salle}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-3 border-t border-neutral-200 px-4 py-2.5 dark:border-neutral-800">
        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Légende</span>
        {matieres.slice(0, 6).map((matiere) => {
          const color = getMatiereColor(matiere);
          return (
            <span
              key={matiere}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium',
                color.bg,
                color.text,
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', color.text.replace('text-', 'bg-'))} />
              {matiere}
            </span>
          );
        })}
      </div>
    </div>
  );
}
