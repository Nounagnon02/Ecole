/**
 * TachesPage — Gestion des tâches et assignments
 *
 * Module université : suivi des tâches, devoirs et projets.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare, Plus, Search, Filter, Clock, AlertCircle, CheckCircle,
  Calendar, Users, FileText, Paperclip,
} from 'lucide-react';
import { cn, formatDate, formatRelativeTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const TACHES = [
  { id: 1, titre: 'Rapport de stage L3', cours: 'Analyse Numérique', type: 'devoir', dateLimite: new Date(Date.now() + 86400000 * 5), priorite: 'haute', statut: 'en_cours', soumissions: 12, totalEtudiants: 28 },
  { id: 2, titre: 'Projet algorithmique', cours: 'Algèbre Linéaire', type: 'projet', dateLimite: new Date(Date.now() + 86400000 * 14), priorite: 'moyenne', statut: 'en_cours', soumissions: 5, totalEtudiants: 45 },
  { id: 3, titre: 'Examen partiel S1', cours: 'Mécanique Quantique', type: 'examen', dateLimite: new Date(Date.now() - 86400000 * 3), priorite: 'haute', statut: 'termine', soumissions: 32, totalEtudiants: 32 },
  { id: 4, titre: 'Dissertation littéraire', cours: 'Littérature Comparée', type: 'devoir', dateLimite: new Date(Date.now() + 86400000 * 7), priorite: 'basse', statut: 'en_cours', soumissions: 3, totalEtudiants: 18 },
  { id: 5, titre: 'Cas pratique droit des contrats', cours: 'Droit des Contrats', type: 'exercice', dateLimite: new Date(Date.now() + 86400000 * 2), priorite: 'haute', statut: 'en_cours', soumissions: 20, totalEtudiants: 40 },
  { id: 6, titre: 'Analyse de marché', cours: 'Microéconomie', type: 'projet', dateLimite: new Date(Date.now() - 86400000 * 1), priorite: 'moyenne', statut: 'termine', soumissions: 48, totalEtudiants: 48 },
  { id: 7, titre: 'Exercices comptables', cours: 'Comptabilité Financière', type: 'exercice', dateLimite: new Date(Date.now() + 86400000 * 3), priorite: 'moyenne', statut: 'en_cours', soumissions: 15, totalEtudiants: 52 },
  { id: 8, titre: 'Rapport de laboratoire', cours: 'Thermodynamique', type: 'rapport', dateLimite: new Date(Date.now() + 86400000 * 10), priorite: 'basse', statut: 'en_cours', soumissions: 0, totalEtudiants: 35 },
];

const PRIORITE_CONFIG = {
  haute: { variant: 'danger', label: 'Haute' },
  moyenne: { variant: 'warning', label: 'Moyenne' },
  basse: { variant: 'outline', label: 'Basse' },
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'devoir': return <FileText className="h-4 w-4" />;
    case 'projet': return <Users className="h-4 w-4" />;
    case 'examen': return <AlertCircle className="h-4 w-4" />;
    case 'exercice': return <Paperclip className="h-4 w-4" />;
    case 'rapport': return <FileText className="h-4 w-4" />;
    default: return <CheckSquare className="h-4 w-4" />;
  }
};

export default function TachesPage() {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const stats = useMemo(() => ({
    total: TACHES.length,
    enCours: TACHES.filter((t) => t.statut === 'en_cours').length,
    termines: TACHES.filter((t) => t.statut === 'termine').length,
    urgentes: TACHES.filter((t) => t.priorite === 'haute' && t.statut === 'en_cours').length,
  }), []);

  const filtered = useMemo(() =>
    TACHES.filter((t) => {
      if (search && !t.titre.toLowerCase().includes(search.toLowerCase()) && !t.cours.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatut && t.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterStatut]
  );

  const daysUntilDeadline = (date) => {
    const diff = Math.ceil((date - new Date()) / 86400000);
    if (diff < 0) return 'Dépassée';
    if (diff === 0) return 'Aujourd\'hui';
    if (diff === 1) return 'Demain';
    return `Dans ${diff} jours`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Tâches</h1>
          <p className="text-sm text-neutral-500">Suivi des devoirs, projets et examens</p>
        </div>
        <Button size="sm" icon={<Plus />}>Nouvelle tâche</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total" value={String(stats.total)} icon={CheckSquare} color="indigo" />
        <StatsCard title="En cours" value={String(stats.enCours)} icon={Clock} color="amber" />
        <StatsCard title="Terminées" value={String(stats.termines)} icon={CheckCircle} color="emerald" />
        <StatsCard title="Urgentes" value={String(stats.urgentes)} icon={AlertCircle} color="red" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher une tâche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">Tous les statuts</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
          </select>
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <CheckSquare className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucune tâche trouvée</p>
            </div>
          </Card>
        )}
        {filtered.map((t) => {
          const isOverdue = t.dateLimite < new Date() && t.statut !== 'termine';
          return (
            <Card key={t.id} hover>
              <div className="flex items-start gap-4">
                <div className={cn(
                  'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                  t.statut === 'termine' ? 'bg-emerald-100 dark:bg-emerald-900/20' :
                  isOverdue ? 'bg-red-100 dark:bg-red-900/20' :
                  'bg-amber-100 dark:bg-amber-900/20'
                )}>
                  {t.statut === 'termine'
                    ? <CheckCircle className="h-5 w-5 text-emerald-500" />
                    : getTypeIcon(t.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">{t.titre}</span>
                    <Badge variant={t.statut === 'termine' ? 'primary' : 'warning'} size="sm">
                      {t.statut === 'termine' ? 'Terminée' : 'En cours'}
                    </Badge>
                    <Badge variant={PRIORITE_CONFIG[t.priorite].variant} size="sm">
                      {PRIORITE_CONFIG[t.priorite].label}
                    </Badge>
                    <Badge variant="outline" size="sm" className="capitalize">{t.type}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {t.cours}</span>
                    <span className={cn(
                      'flex items-center gap-1',
                      isOverdue ? 'text-red-600 font-medium' : ''
                    )}>
                      <Calendar className="h-3 w-3" />
                      {daysUntilDeadline(t.dateLimite)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {t.soumissions}/{t.totalEtudiants} soumissions
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">Gérer</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}
