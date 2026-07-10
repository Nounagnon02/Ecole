/**
 * AbsencesPage — Gestion des absences
 *
 * Le censeur suit et justifie les absences des élèves.
 * Données dynamiques via API /surveillant/absences
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle,
  Search, FileText, Loader2,
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useApi } from '@/hooks/useApi';

const getTypeLabel = (type) => {
  switch (type) {
    case 'absence': return 'Absence';
    case 'retard': return 'Retard';
    case 'maladie': return 'Maladie';
    case 'famille': return 'Familial';
    default: return type || 'Autres';
  }
};

export default function AbsencesPage() {
  const { loading, error, get } = useApi();
  const [absences, setAbsences] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/surveillant/absences');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setAbsences(items);
      } catch (e) {
        console.error('Erreur chargement absences:', e);
      }
    })();
  }, []);

  const stats = useMemo(() => ({
    total: absences.length,
    justifiees: absences.filter((a) => a.justifiee).length,
    nonJustifiees: absences.filter((a) => !a.justifiee).length,
  }), [absences]);

  // Extraire les classes uniques des absences pour le filtre
  const classesList = useMemo(() => {
    const set = new Set();
    absences.forEach((a) => {
      if (a.eleve?.classe?.nom_classe) set.add(a.eleve.classe.nom_classe);
    });
    return Array.from(set);
  }, [absences]);

  const filtered = useMemo(() =>
    absences.filter((a) => {
      const q = search.toLowerCase();
      if (search) {
        const nom = `${a.eleve?.prenom || ''} ${a.eleve?.nom || ''}`;
        if (!nom.toLowerCase().includes(q)) return false;
      }
      if (filterStatut === 'justifiee' && !a.justifiee) return false;
      if (filterStatut === 'non_justifiee' && a.justifiee) return false;
      return true;
    }),
    [search, filterStatut, absences]
  );

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
        <AlertCircle className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Absences</h1>
        <p className="text-sm text-neutral-500">Suivi et justification des absences</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total Absences" value={String(stats.total)} icon={Calendar} color="primary" />
        <StatsCard title="Justifiées" value={String(stats.justifiees)} icon={CheckCircle} color="emerald" />
        <StatsCard title="Non justifiées" value={String(stats.nonJustifiees)} icon={XCircle} color="red" />
        <StatsCard title="Élèves concernés" value={String(new Set(absences.map((a) => a.eleve_id)).size)} icon={Users} color="sky" />
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
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Toutes les absences</option>
              <option value="justifiee">Justifiées</option>
              <option value="non_justifiee">Non justifiées</option>
            </select>
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
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Justifiée</th>
                <th className="pb-3 pr-4">Motif</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-neutral-500">
                    Aucune absence trouvée
                  </td>
                </tr>
              )}
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${a.eleve?.prenom || ''} ${a.eleve?.nom || ''}`} size="sm" />
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        {a.eleve?.prenom} {a.eleve?.nom}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant="outline" size="sm">{a.eleve?.classe?.nom_classe || '—'}</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                      {a.date ? formatDate(a.date) : '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{getTypeLabel(a.type)}</span>
                  </td>
                  <td className="py-3 pr-4">
                    {a.justifiee ? (
                      <Badge variant="primary" size="sm">Justifiée</Badge>
                    ) : (
                      <Badge variant="danger" size="sm">Non justifiée</Badge>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{a.motif || '—'}</span>
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="sm" icon={<FileText />} title="Détails" />
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
