/**
 * EtudiantsPage — Gestion des étudiants
 *
 * Module université : gestion des inscriptions et profils étudiants.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap, Plus, Search, Filter, Mail, Phone, Calendar,
  MapPin, BookOpen, User, Eye,
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const ETUDIANTS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  nom: ['Diallo Amadou', 'Touré Fatou', 'Koné Moussa', 'Cissé Inza', 'Traoré Kadiatou', 'Sow Mariam', 'Diop Souleymane', 'Ndiaye Fatma', 'Ba Ousmane', 'Sylla Aïcha', 'Faye Cheikh', 'Gueye Ndeye'][i],
  matricule: `ETU${String(2024000 + i).slice(-6)}`,
  niveau: ['L1', 'L2', 'L3', 'M1', 'M2', 'L1', 'L2', 'L3', 'M1', 'M2', 'L1', 'L2'][i],
  filiere: ['Mathématiques', 'Physique', 'Lettres Modernes', 'Anglais', 'Droit Privé', 'Économie', 'Gestion', 'Mathématiques', 'Physique', 'Lettres Modernes', 'Anglais', 'Économie'][i],
  faculte: ['FST', 'FST', 'FLSH', 'FLSH', 'FD', 'FSEG', 'FSEG', 'FST', 'FST', 'FLSH', 'FLSH', 'FSEG'][i],
  email: ['amadou.diallo@univ.edu', 'fatou.toure@univ.edu', 'moussa.kone@univ.edu', 'inza.cisse@univ.edu', 'kadiatou.traore@univ.edu', 'mariam.sow@univ.edu', 'souleymane.diop@univ.edu', 'fatma.ndiaye@univ.edu', 'ousmane.ba@univ.edu', 'aicha.sylla@univ.edu', 'cheikh.faye@univ.edu', 'ndeye.gueye@univ.edu'][i],
  telephone: ['+225 01 02 03 04 01', '+225 01 02 03 04 02', '+225 01 02 03 04 03', '+225 01 02 03 04 04', '+225 01 02 03 04 05', '+225 01 02 03 04 06', '+225 01 02 03 04 07', '+225 01 02 03 04 08', '+225 01 02 03 04 09', '+225 01 02 03 04 10', '+225 01 02 03 04 11', '+225 01 02 03 04 12'][i],
  dateInscription: new Date(Date.now() - 86400000 * (30 + i * 10)),
  statut: ['actif', 'actif', 'actif', 'actif', 'actif', 'actif', 'actif', 'suspendu', 'actif', 'actif', 'actif', 'suspendu'][i],
}));

const NIVEAUX = ['Tous', 'L1', 'L2', 'L3', 'M1', 'M2'];

export default function EtudiantsPage() {
  const [search, setSearch] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');

  const stats = useMemo(() => ({
    total: ETUDIANTS.length,
    actifs: ETUDIANTS.filter((e) => e.statut === 'actif').length,
    suspendus: ETUDIANTS.filter((e) => e.statut === 'suspendu').length,
    niveaux: new Set(ETUDIANTS.map((e) => e.niveau)).size,
  }), []);

  const filtered = useMemo(() =>
    ETUDIANTS.filter((e) => {
      if (search && !e.nom.toLowerCase().includes(search.toLowerCase()) && !e.matricule.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterNiveau && e.niveau !== filterNiveau) return false;
      return true;
    }),
    [search, filterNiveau]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Étudiants</h1>
          <p className="text-sm text-neutral-500">Gestion des inscriptions et profils étudiants</p>
        </div>
        <Button size="sm" icon={<Plus />}>Ajouter un étudiant</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total" value={String(stats.total)} icon={GraduationCap} color="indigo" />
        <StatsCard title="Actifs" value={String(stats.actifs)} icon={User} color="emerald" />
        <StatsCard title="Suspendus" value={String(stats.suspendus)} icon={User} color="red" />
        <StatsCard title="Niveaux" value={String(stats.niveaux)} icon={BookOpen} color="sky" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un étudiant..."
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

      {/* Tableau */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Étudiant</th>
                <th className="pb-3 pr-4">Matricule</th>
                <th className="pb-3 pr-4">Niveau</th>
                <th className="pb-3 pr-4">Filière</th>
                <th className="pb-3 pr-4">Faculté</th>
                <th className="pb-3 pr-4">Contact</th>
                <th className="pb-3 pr-4">Inscription</th>
                <th className="pb-3 pr-4">Statut</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-neutral-500">
                    Aucun étudiant trouvé
                  </td>
                </tr>
              )}
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={e.nom} size="sm" />
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{e.nom}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">{e.matricule}</td>
                  <td className="py-3 pr-4"><Badge variant="outline" size="sm">{e.niveau}</Badge></td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">{e.filiere}</td>
                  <td className="py-3 pr-4"><Badge variant="primary" size="sm">{e.faculte}</Badge></td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-col text-xs text-neutral-500">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {e.email}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">{formatDate(e.dateInscription)}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={e.statut === 'actif' ? 'primary' : 'danger'} size="sm">
                      {e.statut === 'actif' ? 'Actif' : 'Suspendu'}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="sm" icon={<Eye />} title="Voir" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
