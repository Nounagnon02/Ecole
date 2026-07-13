/**
 * NotesPage — Gestion des notes universitaires
 *
 * Module université : saisie et consultation des notes.
 * Données dynamiques via API /api/universite/notes
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap, Search, Filter, Plus, Download, Clock, CheckCircle,
  AlertCircle, TrendingUp, Eye, FileText, Loader2,
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useApi } from '@/hooks/useApi';

export default function NotesPage() {
  const { loading, error, get } = useApi();
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/universite/notes');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setNotes(items.map((n) => ({
          ...n,
          etudiant: n.etudiant?.nom || n.etudiant?.prenom ? `${n.etudiant?.prenom || ''} ${n.etudiant?.nom || ''}`.trim() : n.etudiant_nom || 'Étudiant',
          matricule: n.etudiant?.matricule || n.matricule || '—',
          cours: n.cours?.intitule || n.cours?.nom || n.cours_nom || 'Cours',
          note: n.note || n.valeur || 0,
          sur: n.sur || n.note_sur || 20,
          coefficient: n.coefficient || n.coef || 1,
          semestre: n.semestre || 'S1',
          date: n.date || n.created_at || null,
          statut: n.statut || 'validee',
        })));
      } catch (e) {
        console.error('Erreur chargement notes:', e);
      }
    })();
  }, [get]);

  const getNoteColor = (note, sur) => {
    const pct = (note / sur) * 100;
    if (pct >= 70) return 'text-emerald-600';
    if (pct >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const stats = useMemo(() => {
    const validees = notes.filter((n) => n.statut === 'validee');
    const moyenne = validees.length > 0 ? validees.reduce((s, n) => s + (n.note / n.sur) * 100, 0) / validees.length : 0;
    return {
      total: notes.length,
      validees: validees.length,
      enAttente: notes.filter((n) => n.statut === 'en_attente').length,
      moyenne: moyenne.toFixed(1),
    };
  }, [notes]);

  const filtered = useMemo(() =>
    notes.filter((n) => {
      if (search && !n.etudiant?.toLowerCase().includes(search.toLowerCase()) && !n.cours?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatut && n.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterStatut, notes]
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
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Notes</h1>
          <p className="text-sm text-neutral-500">Saisie et consultation des notes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Download />}>Exporter</Button>
          <Button size="sm" icon={<Plus />}>Ajouter une note</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total Notes" value={String(stats.total)} icon={GraduationCap} color="primary" />
        <StatsCard title="Validées" value={String(stats.validees)} icon={CheckCircle} color="emerald" />
        <StatsCard title="En attente" value={String(stats.enAttente)} icon={Clock} color="amber" />
        <StatsCard title="Moyenne" value={`${stats.moyenne}%`} icon={TrendingUp} color="sky" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher par étudiant ou cours..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">Tous les statuts</option>
            <option value="validee">Validée</option>
            <option value="en_attente">En attente</option>
          </select>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Étudiant</th>
                <th className="pb-3 pr-4">Matricule</th>
                <th className="pb-3 pr-4">Cours</th>
                <th className="pb-3 pr-4">Note</th>
                <th className="pb-3 pr-4">Coefficient</th>
                <th className="pb-3 pr-4">Semestre</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Statut</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-neutral-500">
                    Aucune note trouvée
                  </td>
                </tr>
              )}
              {filtered.map((n) => (
                <tr key={n.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={n.etudiant} size="sm" />
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{n.etudiant}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">{n.matricule}</td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">{n.cours}</td>
                  <td className="py-3 pr-4">
                    <span className={cn('text-lg font-bold', getNoteColor(n.note, n.sur))}>
                      {n.note}
                    </span>
                    <span className="text-xs text-neutral-400">/{n.sur}</span>
                  </td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">x{n.coefficient}</td>
                  <td className="py-3 pr-4"><Badge variant="outline" size="sm">{n.semestre}</Badge></td>
                  <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">{n.date ? formatDate(n.date) : '—'}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={n.statut === 'validee' ? 'primary' : 'warning'} size="sm">
                      {n.statut === 'validee' ? 'Validée' : 'En attente'}
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