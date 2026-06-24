/**
 * DossiersPage — Gestion des dossiers médicaux
 *
 * L'infirmier consulte et gère les dossiers médicaux des élèves.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Search, Filter, Plus, AlertCircle, Clock, Shield,
  Calendar, User, Phone, Droplets, Bug,
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const DOSSIERS = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  eleve: ['Diallo Amadou', 'Touré Fatou', 'Koné Moussa', 'Cissé Inza', 'Traoré Kadiatou', 'Sow Mariam', 'Diop Souleymane', 'Ndiaye Fatma', 'Ba Ousmane', 'Sylla Aïcha'][i],
  classe: ['4e A', '4e A', '4e A', '4e A', '4e A', '4e A', '4e B', '4e B', '3e A', '3e A'][i],
  groupeSanguin: ['A+', 'O+', 'B+', 'AB+', 'O-', 'A+', 'B+', 'O+', 'A-', 'AB-'][i],
  allergies: ['Aucune', 'Arachides', 'Aucune', 'Pollen', 'Pénicilline', 'Aucune', 'Aucune', 'Sulfamides', 'Aucune', 'Latex'][i],
  vaccins: ['À jour', 'À jour', 'Rappel diphtérie', 'À jour', 'À jour', 'BCG manquant', 'À jour', 'À jour', 'Rappel tétanos', 'À jour'][i],
  visiteMedicale: new Date(Date.now() - 86400000 * (30 + i * 15)),
  observations: i % 2 === 0 ? 'Élève en bonne santé' : 'Suivi ophtalmologique recommandé',
}));

export default function DossiersPage() {
  const [search, setSearch] = useState('');
  const [filterAllergie, setFilterAllergie] = useState('');

  const stats = useMemo(() => ({
    total: DOSSIERS.length,
    allergieConnues: DOSSIERS.filter((d) => d.allergies !== 'Aucune').length,
    vaccinsNonJour: DOSSIERS.filter((d) => !d.vaccins.includes('À jour')).length,
    visitesRecentes: DOSSIERS.filter((d) => d.visiteMedicale > new Date(Date.now() - 86400000 * 60)).length,
  }), []);

  const filtered = useMemo(() =>
    DOSSIERS.filter((d) => {
      if (search && !d.eleve.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterAllergie && d.allergies === 'Aucune') return false;
      return true;
    }),
    [search, filterAllergie]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Dossiers Médicaux</h1>
          <p className="text-sm text-neutral-500">Gestion des dossiers médicaux des élèves</p>
        </div>
        <Button size="sm" icon={<Plus />}>Nouveau dossier</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total Dossiers" value={String(stats.total)} icon={FileText} color="indigo" />
        <StatsCard title="Allergies connues" value={String(stats.allergieConnues)} icon={AlertCircle} color="amber" />
        <StatsCard title="Vaccins non à jour" value={String(stats.vaccinsNonJour)} icon={Bug} color="red" />
        <StatsCard title="Visites récentes" value={String(stats.visitesRecentes)} icon={Calendar} color="emerald" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Rechercher un élève..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Liste */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.length === 0 && (
          <div className="md:col-span-2">
            <Card>
              <div className="text-center py-8 text-neutral-500">
                <FileText className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">Aucun dossier trouvé</p>
              </div>
            </Card>
          </div>
        )}
        {filtered.map((d) => (
          <Card key={d.id} hover>
            <div className="flex items-start gap-3 mb-4">
              <Avatar name={d.eleve} size="md" />
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">{d.eleve}</h3>
                <p className="text-xs text-neutral-500">{d.classe}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                  <Droplets className="h-3 w-3" /> Groupe sanguin
                </span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{d.groupeSanguin}</span>
              </div>
              <div>
                <span className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                  <AlertCircle className="h-3 w-3" /> Allergies
                </span>
                <span className={cn(
                  'font-medium',
                  d.allergies !== 'Aucune' ? 'text-amber-600' : 'text-neutral-700 dark:text-neutral-300'
                )}>
                  {d.allergies}
                </span>
              </div>
              <div>
                <span className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                  <Shield className="h-3 w-3" /> Vaccins
                </span>
                <span className={cn(
                  'font-medium text-sm',
                  !d.vaccins.includes('À jour') ? 'text-red-600' : 'text-emerald-600'
                )}>
                  {d.vaccins}
                </span>
              </div>
              <div>
                <span className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                  <Calendar className="h-3 w-3" /> Dernière visite
                </span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatDate(d.visiteMedicale)}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-xs text-neutral-500 italic">{d.observations}</p>
            </div>

            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" icon={<FileText />}>Consulter</Button>
              <Button variant="ghost" size="sm">Modifier</Button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
