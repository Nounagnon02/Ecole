/**
 * FacultesPage — Gestion des facultés
 *
 * Module université : gestion des facultés et départements associés.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Plus, Search, Users, BookOpen, Calendar,
  MapPin, Phone, Mail, Globe,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const FACULTES = [
  { id: 1, nom: 'Faculté des Sciences', code: 'FST', doyen: 'Pr. Koné Mamadou', departements: 5, enseignants: 45, etudiants: 1200, email: 'fst@univ.edu', tel: '+225 01 23 45 67 01' },
  { id: 2, nom: 'Faculté des Lettres', code: 'FLSH', doyen: 'Pr. Touré Aminata', departements: 4, enseignants: 38, etudiants: 950, email: 'flsh@univ.edu', tel: '+225 01 23 45 67 02' },
  { id: 3, nom: 'Faculté de Droit', code: 'FD', doyen: 'Pr. Diop Ousmane', departements: 3, enseignants: 28, etudiants: 780, email: 'fd@univ.edu', tel: '+225 01 23 45 67 03' },
  { id: 4, nom: 'Faculté des Sciences Économiques', code: 'FSEG', doyen: 'Pr. Ndiaye Fatou', departements: 4, enseignants: 32, etudiants: 890, email: 'fseg@univ.edu', tel: '+225 01 23 45 67 04' },
  { id: 5, nom: 'Faculté de Médecine', code: 'FM', doyen: 'Pr. Gueye Amadou', departements: 6, enseignants: 52, etudiants: 650, email: 'fm@univ.edu', tel: '+225 01 23 45 67 05' },
  { id: 6, nom: 'Faculté des Sciences de l\'Ingénieur', code: 'FSI', doyen: 'Pr. Sylla Mariam', departements: 5, enseignants: 40, etudiants: 720, email: 'fsi@univ.edu', tel: '+225 01 23 45 67 06' },
];

export default function FacultesPage() {
  const [search, setSearch] = useState('');

  const stats = useMemo(() => ({
    total: FACULTES.length,
    departements: FACULTES.reduce((s, f) => s + f.departements, 0),
    enseignants: FACULTES.reduce((s, f) => s + f.enseignants, 0),
    etudiants: FACULTES.reduce((s, f) => s + f.etudiants, 0),
  }), []);

  const filtered = useMemo(() =>
    FACULTES.filter((f) => {
      if (search && !f.nom.toLowerCase().includes(search.toLowerCase()) && !f.code.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    [search]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Facultés</h1>
          <p className="text-sm text-neutral-500">Gestion des facultés de l'université</p>
        </div>
        <Button size="sm" icon={<Plus />}>Ajouter une faculté</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Facultés" value={String(stats.total)} icon={Building2} color="indigo" />
        <StatsCard title="Départements" value={String(stats.departements)} icon={BookOpen} color="sky" />
        <StatsCard title="Enseignants" value={String(stats.enseignants)} icon={Users} color="emerald" />
        <StatsCard title="Étudiants" value={String(stats.etudiants)} icon={Users} color="amber" />
      </div>

      <Card>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Rechercher une faculté..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <Card>
              <div className="text-center py-8 text-neutral-500">
                <Building2 className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">Aucune faculté trouvée</p>
              </div>
            </Card>
          </div>
        )}
        {filtered.map((f) => (
          <Card key={f.id} hover>
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-indigo-500" />
              </div>
              <Badge variant="primary" size="sm">{f.code}</Badge>
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">{f.nom}</h3>
            <p className="text-xs text-neutral-500 mb-3">Doyen : {f.doyen}</p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2">
                <span className="block font-bold text-neutral-900 dark:text-white">{f.departements}</span>
                <span className="text-neutral-500">Dépt.</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2">
                <span className="block font-bold text-neutral-900 dark:text-white">{f.enseignants}</span>
                <span className="text-neutral-500">Ens.</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2">
                <span className="block font-bold text-neutral-900 dark:text-white">{f.etudiants}</span>
                <span className="text-neutral-500">Étud.</span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-neutral-500">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {f.email}</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {f.tel}</span>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
