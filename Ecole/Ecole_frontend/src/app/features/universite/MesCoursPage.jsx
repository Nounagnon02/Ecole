/**
 * MesCoursPage — Mes cours (vue enseignant université)
 *
 * Module université : liste des cours assignés au professeur connecté.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Search, Filter, Clock, Users, Calendar, GraduationCap,
  FileText, Download, Eye, Video, MapPin,
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const MES_COURS = [
  { id: 1, intitule: 'Algèbre Linéaire', code: 'ALG201', niveau: 'L2', horaire: 'Lun 08h-10h', salle: 'Amphi A', etudiants: 45, progression: 65, prochainCours: '2026-06-20', statut: 'en_cours' },
  { id: 2, intitule: 'Analyse Numérique', code: 'AN301', niveau: 'L3', horaire: 'Mar 10h-12h', salle: 'Salle 201', etudiants: 28, progression: 42, prochainCours: '2026-06-21', statut: 'en_cours' },
  { id: 3, intitule: 'Statistiques', code: 'STAT201', niveau: 'L2', horaire: 'Mer 14h-16h', salle: 'Amphi B', etudiants: 38, progression: 30, prochainCours: '2026-06-22', statut: 'en_cours' },
  { id: 4, intitule: 'Mathématiques Financières', code: 'MATH301', niveau: 'L3', horaire: 'Jeu 08h-10h', salle: 'Salle 105', etudiants: 22, progression: 100, prochainCours: null, statut: 'termine' },
];

export default function MesCoursPage() {
  const [search, setSearch] = useState('');

  const stats = useMemo(() => ({
    total: MES_COURS.length,
    enCours: MES_COURS.filter((c) => c.statut === 'en_cours').length,
    termines: MES_COURS.filter((c) => c.statut === 'termine').length,
    totalEtudiants: MES_COURS.reduce((s, c) => s + c.etudiants, 0),
  }), []);

  const filtered = useMemo(() =>
    MES_COURS.filter((c) => {
      if (search && !c.intitule.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    [search]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Mes Cours</h1>
          <p className="text-sm text-neutral-500">Cours qui vous sont assignés</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total" value={String(stats.total)} icon={BookOpen} color="indigo" />
        <StatsCard title="En cours" value={String(stats.enCours)} icon={Clock} color="emerald" />
        <StatsCard title="Terminés" value={String(stats.termines)} icon={GraduationCap} color="sky" />
        <StatsCard title="Étudiants" value={String(stats.totalEtudiants)} icon={Users} color="amber" />
      </div>

      <Card>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Rechercher un cours..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <BookOpen className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucun cours trouvé</p>
            </div>
          </Card>
        )}
        {filtered.map((c) => (
          <Card key={c.id} hover>
            <div className="flex items-start gap-4">
              <div className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center shrink-0',
                c.statut === 'termine' ? 'bg-neutral-100 dark:bg-neutral-800' : 'bg-indigo-100 dark:bg-indigo-900/20'
              )}>
                <BookOpen className={cn('h-6 w-6', c.statut === 'termine' ? 'text-neutral-400' : 'text-indigo-500')} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">{c.intitule}</span>
                  <Badge variant="outline" size="sm">{c.code}</Badge>
                  <Badge variant={c.statut === 'termine' ? 'outline' : 'primary'} size="sm">
                    {c.statut === 'termine' ? 'Terminé' : 'En cours'}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {c.horaire}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.salle}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.etudiants} étudiants</span>
                  {c.prochainCours && (
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Prochain : {c.prochainCours}</span>
                  )}
                </div>

                {/* Barre de progression */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-500">Progression</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{c.progression}%</span>
                  </div>
                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        c.progression === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                      )}
                      style={{ width: `${c.progression}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" icon={<Eye />}>Détails</Button>
                <Button variant="ghost" size="sm" icon={<FileText />}>Notes</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
