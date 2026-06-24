/**
 * CoursPage — Gestion des cours universitaires
 *
 * Module université : planification et gestion des cours.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Plus, Search, Filter, Clock, Users, Calendar,
  GraduationCap, Building2, Eye,
} from 'lucide-react';
import { cn, formatDate, formatTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const COURS = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  intitule: [
    'Algèbre Linéaire', 'Mécanique Quantique', 'Littérature Comparée', 'Civilisation Américaine',
    'Droit des Contrats', 'Microéconomie', 'Comptabilité Financière', 'Analyse Numérique',
    'Thermodynamique', 'Grammaire Avancée',
  ][i],
  code: ['ALG201', 'MQ301', 'LC401', 'CA101', 'DC301', 'MIC201', 'CF101', 'AN301', 'TH201', 'GA401'][i],
  professeur: ['Pr. Diallo', 'Pr. Touré', 'Pr. Koné', 'Pr. Cissé', 'Pr. Traoré', 'Pr. Sow', 'Pr. Diop', 'Pr. Ndiaye', 'Pr. Ba', 'Pr. Sylla'][i],
  niveau: ['L2', 'L3', 'M1', 'L1', 'L3', 'L2', 'L1', 'L3', 'L2', 'M1'][i],
  filiere: ['Mathématiques', 'Physique', 'Lettres', 'Anglais', 'Droit', 'Économie', 'Gestion', 'Mathématiques', 'Physique', 'Lettres'][i],
  credits: [4, 5, 3, 2, 4, 4, 3, 5, 4, 3][i],
  heures: [36, 45, 24, 18, 36, 36, 24, 45, 36, 24][i],
  etudiants: [45, 32, 18, 56, 40, 48, 52, 28, 35, 20][i],
  semestre: ['S1', 'S2', 'S1', 'S2', 'S1', 'S2', 'S1', 'S2', 'S1', 'S2'][i],
  statut: ['actif', 'actif', 'actif', 'actif', 'actif', 'actif', 'actif', 'termine', 'actif', 'termine'][i],
}));

const NIVEAUX = ['Tous', 'L1', 'L2', 'L3', 'M1', 'M2'];

export default function CoursPage() {
  const [search, setSearch] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');

  const stats = useMemo(() => ({
    total: COURS.length,
    actifs: COURS.filter((c) => c.statut === 'actif').length,
    termines: COURS.filter((c) => c.statut === 'termine').length,
    creditsTotal: COURS.reduce((s, c) => s + c.credits, 0),
  }), []);

  const filtered = useMemo(() =>
    COURS.filter((c) => {
      if (search && !c.intitule.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterNiveau && c.niveau !== filterNiveau) return false;
      return true;
    }),
    [search, filterNiveau]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Cours</h1>
          <p className="text-sm text-neutral-500">Planification et gestion des cours universitaires</p>
        </div>
        <Button size="sm" icon={<Plus />}>Ajouter un cours</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total Cours" value={String(stats.total)} icon={BookOpen} color="indigo" />
        <StatsCard title="En cours" value={String(stats.actifs)} icon={Clock} color="emerald" />
        <StatsCard title="Terminés" value={String(stats.termines)} icon={GraduationCap} color="sky" />
        <StatsCard title="Crédits" value={String(stats.creditsTotal)} icon={Building2} color="amber" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un cours..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {NIVEAUX.map((n) => (
              <button
                key={n}
                onClick={() => setFilterNiveau(n === 'Tous' ? '' : n)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filterNiveau === (n === 'Tous' ? '' : n)
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <Card>
              <div className="text-center py-8 text-neutral-500">
                <BookOpen className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">Aucun cours trouvé</p>
              </div>
            </Card>
          </div>
        )}
        {filtered.map((c) => (
          <Card key={c.id} hover>
            <div className="flex items-start justify-between mb-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-emerald-500" />
              </div>
              <Badge variant={c.statut === 'actif' ? 'primary' : 'outline'} size="sm">
                {c.statut === 'actif' ? 'En cours' : 'Terminé'}
              </Badge>
            </div>
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">{c.intitule}</h3>
            <p className="text-xs text-neutral-500 mb-1">{c.code} · {c.professeur}</p>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" size="sm">{c.niveau}</Badge>
              <Badge variant="outline" size="sm">{c.semestre}</Badge>
              <span className="text-xs text-neutral-400">{c.filiere}</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {c.credits} crédits</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {c.heures}h</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.etudiants}</span>
            </div>
            <div className="mt-3">
              <Button variant="outline" size="sm" icon={<Eye />}>Détails</Button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
