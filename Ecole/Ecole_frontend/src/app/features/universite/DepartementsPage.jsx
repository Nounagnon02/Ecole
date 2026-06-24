/**
 * DepartementsPage — Gestion des départements
 *
 * Module université : gestion des départements par faculté.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Plus, Search, Filter, Users, Building2,
  Calendar, User, GraduationCap,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const DEPARTEMENTS = [
  { id: 1, nom: 'Mathématiques', code: 'MATH', faculte: 'Faculté des Sciences', chef: 'Pr. Diallo Amadou', enseignants: 12, etudiants: 320, cours: 15 },
  { id: 2, nom: 'Physique', code: 'PHY', faculte: 'Faculté des Sciences', chef: 'Pr. Touré Fatou', enseignants: 10, etudiants: 280, cours: 12 },
  { id: 3, nom: 'Lettres Modernes', code: 'LM', faculte: 'Faculté des Lettres', chef: 'Pr. Koné Moussa', enseignants: 14, etudiants: 350, cours: 18 },
  { id: 4, nom: 'Anglais', code: 'ANG', faculte: 'Faculté des Lettres', chef: 'Pr. Cissé Inza', enseignants: 8, etudiants: 200, cours: 10 },
  { id: 5, nom: 'Droit Privé', code: 'DP', faculte: 'Faculté de Droit', chef: 'Pr. Traoré Kadiatou', enseignants: 10, etudiants: 400, cours: 14 },
  { id: 6, nom: 'Droit Public', code: 'DPU', faculte: 'Faculté de Droit', chef: 'Pr. Sow Mariam', enseignants: 8, etudiants: 380, cours: 11 },
  { id: 7, nom: 'Économie', code: 'ECO', faculte: 'Faculté des Sciences Économiques', chef: 'Pr. Diop Souleymane', enseignants: 12, etudiants: 450, cours: 16 },
  { id: 8, nom: 'Gestion', code: 'GES', faculte: 'Faculté des Sciences Économiques', chef: 'Pr. Ndiaye Fatma', enseignants: 10, etudiants: 440, cours: 14 },
];

const FACULTES = [...new Set(DEPARTEMENTS.map((d) => d.faculte))];

export default function DepartementsPage() {
  const [search, setSearch] = useState('');
  const [filterFaculte, setFilterFaculte] = useState('');

  const stats = useMemo(() => ({
    total: DEPARTEMENTS.length,
    enseignants: DEPARTEMENTS.reduce((s, d) => s + d.enseignants, 0),
    etudiants: DEPARTEMENTS.reduce((s, d) => s + d.etudiants, 0),
  }), []);

  const filtered = useMemo(() =>
    DEPARTEMENTS.filter((d) => {
      if (search && !d.nom.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterFaculte && d.faculte !== filterFaculte) return false;
      return true;
    }),
    [search, filterFaculte]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Départements</h1>
          <p className="text-sm text-neutral-500">Gestion des départements par faculté</p>
        </div>
        <Button size="sm" icon={<Plus />}>Nouveau département</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Départements" value={String(stats.total)} icon={BookOpen} color="indigo" />
        <StatsCard title="Enseignants" value={String(stats.enseignants)} icon={Users} color="emerald" />
        <StatsCard title="Étudiants" value={String(stats.etudiants)} icon={GraduationCap} color="amber" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un département..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterFaculte}
            onChange={(e) => setFilterFaculte(e.target.value)}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">Toutes facultés</option>
            {FACULTES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <BookOpen className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucun département trouvé</p>
            </div>
          </Card>
        )}
        {filtered.map((d) => (
          <Card key={d.id} hover>
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-sky-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">{d.nom}</span>
                  <Badge variant="primary" size="sm">{d.code}</Badge>
                  <Badge variant="outline" size="sm">{d.faculte}</Badge>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" /> Chef : {d.chef}</span>
                </div>
                <div className="mt-2 flex gap-3 text-xs">
                  <span className="text-neutral-600 dark:text-neutral-400"><strong>{d.enseignants}</strong> enseignants</span>
                  <span className="text-neutral-600 dark:text-neutral-400"><strong>{d.etudiants}</strong> étudiants</span>
                  <span className="text-neutral-600 dark:text-neutral-400"><strong>{d.cours}</strong> cours</span>
                </div>
              </div>
              <Button variant="ghost" size="sm">Gérer</Button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
