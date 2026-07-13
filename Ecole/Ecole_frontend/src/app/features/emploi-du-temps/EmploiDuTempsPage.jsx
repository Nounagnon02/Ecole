/**
 * EmploiDuTempsPage — Consultation des emplois du temps
 *
 * Vue centralisée pour tous les rôles. Chaque rôle voit son EDT selon ses permissions.
 * Données dynamiques via API /api/emploi-du-temps
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Filter,
  MapPin, User, BookOpen, Download, Plus, Loader2,
} from 'lucide-react';
import { cn, formatTime } from '@/shared/lib/utils';
import logger from '@/shared/lib/logger';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import { useApi } from '@/hooks/useApi';

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

export default function EmploiDuTempsPage() {
  const { loading, error, get } = useApi();
  const [edt, setEdt] = useState({});
  const [semaine, setSemaine] = useState(0);
  const [filterMatiere, setFilterMatiere] = useState('Toutes');
  const [filterClasse, setFilterClasse] = useState('Toutes');
  const [filterEnseignant, setFilterEnseignant] = useState('Toutes');

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/emploi-du-temps');
        const raw = res?.data?.data || res?.data || res || [];
        const items = Array.isArray(raw) ? raw : [];

        // Construire la structure EDT par jour et créneau
        const structure = {};
        JOURS.forEach(j => { structure[j] = []; });

        items.forEach(cours => {
          const jour = cours.jour || cours.jour_semaine;
          if (!structure[jour]) structure[jour] = [];
          structure[jour].push(cours);
        });

        // Trier par heure de début
        Object.keys(structure).forEach(j => {
          structure[j].sort((a, b) => {
            const ha = (a.heure_debut || '00:00').split(':')[0];
            const hb = (b.heure_debut || '00:00').split(':')[0];
            return parseInt(ha) - parseInt(hb);
          });
        });

        setEdt(structure);

        // Extraire les valeurs uniques pour les filtres
        const matieres = ['Toutes', ...new Set(items.map(c => c.matiere?.nom || c.matiere).filter(Boolean))];
        const classes = ['Toutes', ...new Set(items.map(c => c.classe?.nom || c.classe_nom).filter(Boolean))];
        const enseignants = ['Toutes', ...new Set(items.map(c => c.enseignant?.nom || c.enseignant_nom).filter(Boolean))];
      } catch (e) {
        logger.error('Erreur chargement EDT:', e);
      }
    })();
  }, [get]);

  // Données de démo si pas de données API
  const hasData = useMemo(() => Object.values(edt).some(arr => arr.length > 0), [edt]);

  const mockEdt = useMemo(() => {
    const matieres = ['Mathématiques', 'Français', 'Anglais', 'Physique', 'SVT', 'Histoire', 'EPS', 'Philosophie'];
    const profs = ['M. Diallo', 'Mme Touré', 'M. Koné', 'Mme Cissé', 'M. Traoré', 'Mme Sow'];
    const salles = ['S101', 'S102', 'S103', 'S201', 'S202', 'Labo Physique', 'Labo SVT', 'Bibliothèque'];
    const groupes = ['4e A', '4e B', '4e C', '4e D'];

    const structure = {};
    JOURS.forEach((jour, jIdx) => {
      structure[jour] = CRENEAUX.map((c, cIdx) => {
        if (cIdx === 4) return null; // pause
        const seed = (jIdx * 13 + cIdx * 7) % 7;
        if (seed === 0) return null;
        return {
          matiere: matieres[(seed + jIdx) % matieres.length],
          professeur: profs[(seed + cIdx) % profs.length],
          salle: salles[(seed + jIdx + cIdx) % salles.length],
          groupe: groupes[seed % groupes.length],
        };
      }).filter(Boolean);
    });
    return structure;
  }, []);

  const displayEdt = useMemo(() => {
    const source = hasData ? edt : mockEdt;
    if (filterMatiere === 'Toutes' && filterClasse === 'Toutes' && filterEnseignant === 'Toutes') {
      return source;
    }
    const filtered = {};
    Object.entries(source).forEach(([jour, cours]) => {
      filtered[jour] = cours.filter(c => {
        if (filterMatiere !== 'Toutes' && c.matiere !== filterMatiere) return false;
        if (filterClasse !== 'Toutes' && c.groupe !== filterClasse) return false;
        if (filterEnseignant !== 'Toutes' && c.professeur !== filterEnseignant) return false;
        return true;
      });
    });
    return filtered;
  }, [edt, filterMatiere, filterClasse, filterEnseignant, hasData]);

  const matieresList = useMemo(() => ['Toutes', ...new Set(Object.values(displayEdt).flat().map(c => c.matiere).filter(Boolean))], [displayEdt]);
  const classesList = useMemo(() => ['Toutes', ...new Set(Object.values(displayEdt).flat().map(c => c.groupe).filter(Boolean))], [displayEdt]);
  const enseignantsList = useMemo(() => ['Toutes', ...new Set(Object.values(displayEdt).flat().map(c => c.professeur).filter(Boolean))], [displayEdt]);

  const semaineLabel = `Semaine du ${17 + semaine * 7} au ${21 + semaine * 7} mars 2026`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
        <Clock className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

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
              className="h-9 rounded-lg border border-neutral-300 bg-white px-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              {matieresList.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={filterClasse}
              onChange={(e) => setFilterClasse(e.target.value)}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              {classesList.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterEnseignant}
              onChange={(e) => setFilterEnseignant(e.target.value)}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              {enseignantsList.map((e) => <option key={e} value={e}>{e}</option>)}
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
          {CRENEAUX.map((creneau, cIdx) => (
            <div
              key={cIdx}
              className={cn(
                'grid grid-cols-[100px_repeat(6,1fr)] gap-px bg-neutral-200 dark:bg-neutral-700',
                cIdx === CRENEAUX.length - 1 && 'rounded-b-2xl overflow-hidden'
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
              {JOURS.map((jour, jIdx) => {
                const coursJour = displayEdt[jour] || [];
                // Trouver le cours pour ce créneau (index basé sur l'ordre)
                const nonPauseBefore = CRENEAUX.slice(0, cIdx).filter(c => !c.pause).length;
                const cr = coursJour[nonPauseBefore];

                if (creneau.pause) {
                  return (
                    <div key={jIdx} className="bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center">
                      <span className="text-xs text-amber-500 italic">Pause</span>
                    </div>
                  );
                }
                if (!cr) {
                  return <div key={jIdx} className="bg-white dark:bg-neutral-900" />;
                }
                return (
                  <div key={jIdx} className="bg-white dark:bg-neutral-900 p-2 hover:bg-[var(--accent-subtle)] hover:bg-[var(--accent-subtle)] transition-colors cursor-pointer group">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-[var(--accent)] dark:text-[var(--accent)] leading-tight">
                        {cr.matiere}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                        <User className="h-3 w-3" />
                        <span className="truncate">{cr.professeur}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                        <MapPin className="h-3 w-3" />
                        <span>{cr.salle}</span>
                      </div>
                      <Badge variant="outline" size="sm" className="text-[10px]">
                        {cr.groupe}
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
        {hasData && <span className="text-amber-500 text-xs">Données chargées depuis l'API</span>}
        {!hasData && <span className="text-neutral-400 text-xs">Mode démo (API indisponible)</span>}
      </div>
    </motion.div>
  );
}