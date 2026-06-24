/**
 * EcolesPage — Gestion des écoles (Super Admin)
 *
 * Module admin : vue d'ensemble et gestion des établissements.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Plus, Search, Filter, MapPin, Phone, Mail, Users,
  BookOpen, GraduationCap, CheckCircle, AlertCircle, XCircle, Eye,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const ECOLES = [
  { id: 1, nom: 'Groupe Scolaire Les Palmiers', code: 'GSLP001', adresse: '15 Rue des Écoles, Cocody', telephone: '+225 01 02 03 04', email: 'contact@palmiers.ci', directeur: 'Pr. Koné Mamadou', effectifs: 1240, enseignants: 48, classes: 32, statut: 'actif' },
  { id: 2, nom: 'Collège Privé Saint-Jean', code: 'CPSJ002', adresse: '08 Avenue de la Paix, Marcory', telephone: '+225 05 06 07 08', email: 'info@saintjean.ci', directeur: 'Dr. Touré Amina', effectifs: 890, enseignants: 32, classes: 24, statut: 'actif' },
  { id: 3, nom: 'Lycée Moderne d\'Abobo', code: 'LMAB003', adresse: 'Boulevard Principal, Abobo', telephone: '+225 09 10 11 12', email: 'lycee@abobo.ci', directeur: 'M. Diallo Ousmane', effectifs: 2100, enseignants: 72, classes: 48, statut: 'actif' },
  { id: 4, nom: 'École Primaire Les Papillons', code: 'EPLP004', adresse: 'Quartier Résidentiel, Angré', telephone: '+225 13 14 15 16', email: 'papillons@ecole.ci', directeur: 'Mme N\'Diaye Fatou', effectifs: 320, enseignants: 14, classes: 10, statut: 'actif' },
  { id: 5, nom: 'Institut Supérieur de l\'Éducation', code: 'ISE005', adresse: 'Campus Universitaire, Bingerville', telephone: '+225 17 18 19 20', email: 'ise@education.ci', directeur: 'Pr. Cissé Ibrahim', effectifs: 3500, enseignants: 120, classes: 75, statut: 'actif' },
  { id: 6, nom: 'Complexe Scolaire La Renaissance', code: 'CSLR006', adresse: 'Rue Principale, Yopougon', telephone: '+225 21 22 23 24', email: 'renaissance@ecole.ci', directeur: 'M. Traoré Moussa', effectifs: 1560, enseignants: 55, classes: 36, statut: 'actif' },
  { id: 7, nom: 'École Maternelle Les Boutons d\'Or', code: 'EMLB007', adresse: 'Avenue des Fleurs, Deux-Plateaux', telephone: '+225 25 26 27 28', email: 'boutonsdor@ecole.ci', directeur: 'Mme Sylla Aïcha', effectifs: 180, enseignants: 10, classes: 6, statut: 'inactif' },
  { id: 8, nom: 'Collège International d\'Abidjan', code: 'CIA008', adresse: 'Route de l\'Aéroport, Port-Bouët', telephone: '+225 29 30 31 32', email: 'cia@international.ci', directeur: 'Pr. Bailly Jean', effectifs: 1800, enseignants: 68, classes: 40, statut: 'actif' },
];

const STATUT_CONFIG = {
  actif: { variant: 'primary', label: 'Actif' },
  inactif: { variant: 'outline', label: 'Inactif' },
};

export default function EcolesPage() {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const stats = useMemo(() => ({
    total: ECOLES.length,
    actifs: ECOLES.filter((e) => e.statut === 'actif').length,
    inactifs: ECOLES.filter((e) => e.statut === 'inactif').length,
    totalEffectifs: ECOLES.reduce((s, e) => s + e.effectifs, 0),
  }), []);

  const filtered = useMemo(() =>
    ECOLES.filter((e) => {
      if (search && !e.nom.toLowerCase().includes(search.toLowerCase()) && !e.code.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatut && e.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterStatut]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Écoles</h1>
          <p className="text-sm text-neutral-500">Gestion des établissements scolaires</p>
        </div>
        <Button size="sm" icon={<Plus />}>Ajouter une école</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total" value={String(stats.total)} icon={Building2} color="indigo" />
        <StatsCard title="Actives" value={String(stats.actifs)} icon={CheckCircle} color="emerald" />
        <StatsCard title="Inactives" value={String(stats.inactifs)} icon={XCircle} color="red" />
        <StatsCard title="Effectifs" value={String(stats.totalEffectifs)} icon={Users} color="sky" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher une école..."
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
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.length === 0 && (
          <div className="sm:col-span-2">
            <Card>
              <div className="text-center py-8 text-neutral-500">
                <Building2 className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">Aucune école trouvée</p>
              </div>
            </Card>
          </div>
        )}
        {filtered.map((e) => (
          <Card key={e.id} hover>
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">{e.nom}</span>
                  <Badge variant="outline" size="sm">{e.code}</Badge>
                  <Badge variant={STATUT_CONFIG[e.statut].variant} size="sm">{STATUT_CONFIG[e.statut].label}</Badge>
                </div>
                <div className="mt-2 flex flex-col gap-1 text-xs text-neutral-500">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.adresse}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {e.telephone}</span>
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {e.email}</span>
                  <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300"><Users className="h-3 w-3" /> Directeur : {e.directeur}</span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {e.effectifs} élèves</span>
                  <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {e.enseignants} ens.</span>
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {e.classes} classes</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" icon={<Eye />} title="Voir" />
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
