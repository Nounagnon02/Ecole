/**
 * EmploiDuTempsPage — Consultation des emplois du temps
 *
 * Vue centralisée pour tous les rôles. Chaque rôle voit son EDT selon ses permissions.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Filter,
  MapPin, User, BookOpen, Download, Plus,
} from 'lucide-react';
import { cn, formatTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';

/* ─── Jours et créneaux ───────────────────────────────────────────── */
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const CRENEAUX = [
  { heure: '08h00 - 09h00', label: '1ère heure' },
  { heure: '09h00 - 10h00', label: '2ème heure' },
  { heure: '10h00 - 11h00', label: '3ème heure' },
  { heure: '11h00 - 12h00', label: '4ème heure' },
  { heure: '12h00 - 13h00', label: 'Pause méridienne', pause: true },
  { heure: '13h00 - 14h00', label: '5ème heure' },
  { heure: '14h00 - 15h00', label: '6ème heure' },
  { heure: '15h00 - 16h00', label: '7ème heure' },
  { heure: '16h00 - 17h00', label: '8ème heure' },
];

/* ─── Mock data ───────────────────────────────────────────────────── */
const MATIERES = ['Mathématiques', 'Français', 'Anglais', 'Physique', 'SVT', 'Histoire', 'EPS', 'Philosophie'];
const PROFESSEURS = ['M. Diallo', 'Mme Touré', 'M. Koné', 'Mme Cissé', 'M. Traoré', 'Mme Sow'];
const SALLES = ['S101', 'S102', 'S103', 'S201', 'S202', 'Labo Physique', 'Labo SVT', 'Bibliothèque'];

function genererCours(jourIdx, creneauIdx) {
  // Pause méridienne
  if (creneauIdx === 4) return null;
  // Créneaux aléatoires mais déterministes
  const seed = (jourIdx * 13 + creneauIdx * 7) % 7;
  if (seed === 0) return null; // trou

  return {
    matiere: MATIERES[(seed + jourIdx) % MATIERES.length],
    professeur: PROFESSEURS[(seed + creneauIdx) % PROFESSEURS.length],
    salle: SALLES[(seed + jourIdx + creneauIdx) % SALLES.length],
    groupe: `4e ${String.fromCharCode(65 + seed % 4)}`,
  };
}

function buildEmploiDuTemps() {
  return JOURS.map((jour, jIdx) => ({
    jour,
    creneaux: CRENEAUX.map((c, cIdx) => ({
      ...c,
      cours: genererCours(jIdx, cIdx),
    })),
  }));
}

const MATIERES_FILTRE = ['Toutes', ...MATIERES];

export default function EmploiDuTempsPage() {
  const [semaine, setSemaine] = useState(0);
  const [filterMatiere, setFilterMatiere] = useState('Toutes');

  const edt = useMemo(() => buildEmploiDuTemps(), []);

  const filteredEdt = useMemo(() => {
    if (filterMatiere === 'Toutes') return edt;
    return edt.map((jour) => ({
      ...jour,
      creneaux: jour.creneaux.map((c) => ({
        ...c,
        cours: c.cours?.matiere === filterMatiere ? c.cours : null,
      })),
    }));
  }, [edt, filterMatiere]);

  const semaineLabel = `Semaine du ${17 + semaine * 7} au ${21 + semaine * 7} mars 2026`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Emploi du Temps</h1>
          <p className="text-sm text-neutral-500">Consultez les emplois du temps par classe</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download />}>
            Exporter
          </Button>
          <Button size="sm" icon={<Plus />}>
            Ajouter un Cours
          </Button>
        </div>
      </div>

      {/* Navigation et filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSemaine(Math.max(0, semaine - 1))}
              className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-900 dark:text-white">{semaineLabel}</p>
              <p className="text-xs text-neutral-500">Année scolaire 2025-2026</p>
            </div>
            <button
              onClick={() => setSemaine(Math.min(4, semaine + 1))}
              className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-400" />
            <select
              value={filterMatiere}
              onChange={(e) => setFilterMatiere(e.target.value)}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              {MATIERES_FILTRE.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Grille EDT */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* En-têtes des jours */}
          <div className="grid grid-cols-[100px_repeat(6,1fr)] gap-px bg-neutral-200 dark:bg-neutral-700 rounded-t-2xl overflow-hidden">
            <div className="bg-neutral-100 dark:bg-neutral-800 p-3" />
            {JOURS.map((jour) => (
              <div key={jour} className="bg-neutral-100 dark:bg-neutral-800 p-3 text-center">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{jour}</span>
              </div>
            ))}
          </div>

          {/* Créneaux */}
          {filteredEdt[0]?.creneaux.map((creneau, cIdx) => (
            <div
              key={cIdx}
              className={cn(
                'grid grid-cols-[100px_repeat(6,1fr)] gap-px bg-neutral-200 dark:bg-neutral-700',
                cIdx === filteredEdt[0].creneaux.length - 1 && 'rounded-b-2xl overflow-hidden'
              )}
            >
              {/* Colonne heure */}
              <div className={cn(
                'bg-white dark:bg-neutral-900 p-2 flex flex-col items-center justify-center',
                creneau.pause && 'bg-amber-50 dark:bg-amber-900/10'
              )}>
                <span className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200">{creneau.heure}</span>
                {creneau.pause && <span className="text-[10px] text-amber-600 mt-0.5">Pause</span>}
              </div>

              {/* Colonnes jours */}
              {filteredEdt.map((jour, jIdx) => {
                const cr = jour.creneaux[cIdx];
                if (cr.pause) {
                  return (
                    <div key={jIdx} className="bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center">
                      <span className="text-xs text-amber-500 italic">Pause</span>
                    </div>
                  );
                }
                if (!cr.cours) {
                  return (
                    <div key={jIdx} className="bg-white dark:bg-neutral-900" />
                  );
                }
                const { cours } = cr;
                return (
                  <div key={jIdx} className="bg-white dark:bg-neutral-900 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors cursor-pointer group">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 leading-tight">
                        {cours.matiere}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                        <User className="h-3 w-3" />
                        <span className="truncate">{cours.professeur}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                        <MapPin className="h-3 w-3" />
                        <span>{cours.salle}</span>
                      </div>
                      <Badge variant="outline" size="sm" className="text-[10px]">
                        {cours.groupe}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded bg-white dark:bg-neutral-900 border border-neutral-300" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded bg-amber-50 dark:bg-amber-900/10 border border-amber-200" />
          <span>Pause</span>
        </div>
      </div>
    </motion.div>
  );
}
