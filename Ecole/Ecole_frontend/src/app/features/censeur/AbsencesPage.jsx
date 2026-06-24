/**
 * AbsencesPage — Gestion des absences
 *
 * Le censeur suit et justifie les absences des élèves.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle,
  Search, Filter, Download, MessageSquare, FileText,
} from 'lucide-react';
import { cn, formatDate, formatRelativeTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const CLASSES = ['4e A', '4e B', '3e A', '5e A', '6e B'];

const ABSENCES = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  eleve: ['Diallo Amadou', 'Touré Fatou', 'Koné Moussa', 'Cissé Inza', 'Traoré Kadiatou', 'Sow Mariam', 'Diop Souleymane', 'Ndiaye Fatma', 'Ba Ousmane', 'Sylla Aïcha', 'Faye Cheikh', 'Gueye Ndeye', 'Diallo Mariam', 'Koné Salif'][i],
  classe: CLASSES[i % CLASSES.length],
  dateDebut: new Date(Date.now() - 86400000 * (Math.floor(i / 2) + 1)),
  dateFin: new Date(Date.now() - 86400000 * (Math.floor(i / 2) - 1)),
  type: ['maladie', 'famille', 'retard', 'autres', 'maladie', 'famille', 'autres', 'maladie', 'retard', 'famille', 'maladie', 'autres', 'retard', 'famille'][i],
  justifiee: i % 3 !== 0,
  justificatif: i % 3 !== 0 ? 'Certificat médical' : '',
  coursManques: Math.floor(Math.random() * 6) + 1,
  statut: ['en_attente', 'validee', 'validee', 'en_attente', 'validee', 'en_attente', 'validee', 'validee', 'refusee', 'validee', 'en_attente', 'validee', 'validee', 'refusee'][i],
}));

const getTypeLabel = (type) => {
  switch (type) {
    case 'maladie': return 'Maladie';
    case 'famille': return 'Familial';
    case 'retard': return 'Retard';
    case 'autres': return 'Autres';
    default: return type;
  }
};

const getStatutVariant = (statut) => {
  switch (statut) {
    case 'validee': return 'primary';
    case 'en_attente': return 'warning';
    case 'refusee': return 'danger';
    default: return 'outline';
  }
};

const getStatutLabel = (statut) => {
  switch (statut) {
    case 'validee': return 'Validée';
    case 'en_attente': return 'En attente';
    case 'refusee': return 'Refusée';
    default: return statut;
  }
};

export default function AbsencesPage() {
  const [search, setSearch] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const stats = useMemo(() => ({
    total: ABSENCES.length,
    justifiees: ABSENCES.filter((a) => a.justifiee).length,
    nonJustifiees: ABSENCES.filter((a) => !a.justifiee).length,
    enAttente: ABSENCES.filter((a) => a.statut === 'en_attente').length,
  }), []);

  const filtered = useMemo(() =>
    ABSENCES.filter((a) => {
      if (search && !a.eleve.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterClasse && a.classe !== filterClasse) return false;
      if (filterStatut && a.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterClasse, filterStatut]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Absences</h1>
        <p className="text-sm text-neutral-500">Suivi et justification des absences</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total Absences" value={String(stats.total)} icon={Calendar} color="indigo" />
        <StatsCard title="Justifiées" value={String(stats.justifiees)} icon={CheckCircle} color="emerald" />
        <StatsCard title="Non justifiées" value={String(stats.nonJustifiees)} icon={XCircle} color="red" />
        <StatsCard title="En attente" value={String(stats.enAttente)} icon={AlertCircle} color="amber" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un élève..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterClasse}
              onChange={(e) => setFilterClasse(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Toutes les classes</option>
              {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Tous les statuts</option>
              <option value="validee">Validée</option>
              <option value="en_attente">En attente</option>
              <option value="refusee">Refusée</option>
            </select>
            <Button variant="outline" size="sm" icon={<Download />}>Exporter</Button>
          </div>
        </div>
      </Card>

      {/* Tableau */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Élève</th>
                <th className="pb-3 pr-4">Classe</th>
                <th className="pb-3 pr-4">Période</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Cours manqués</th>
                <th className="pb-3 pr-4">Justificatif</th>
                <th className="pb-3 pr-4">Statut</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-neutral-500">
                    Aucune absence trouvée
                  </td>
                </tr>
              )}
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={a.eleve} size="sm" />
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{a.eleve}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant="outline" size="sm">{a.classe}</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                      {formatDate(a.dateDebut)} — {formatDate(a.dateFin)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{getTypeLabel(a.type)}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{a.coursManques} cours</span>
                  </td>
                  <td className="py-3 pr-4">
                    {a.justificatif ? (
                      <span className="inline-flex items-center gap-1 text-xs text-indigo-600">
                        <FileText className="h-3 w-3" />
                        {a.justificatif}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={getStatutVariant(a.statut)} size="sm">{getStatutLabel(a.statut)}</Badge>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" icon={<FileText />} title="Détails" />
                      <Button variant="ghost" size="sm" icon={<MessageSquare />} title="Contacter" />
                    </div>
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
