/**
 * ClassesPage — Gestion des classes pour les enseignants
 *
 * L'enseignant consulte ses classes, voit les élèves et saisit les notes.
 * Données dynamiques via API /enseignant/classes et /enseignant/eleves
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Users, Search, Filter, GraduationCap,
  BarChart3, FileText, ArrowRight, Clock, Loader2,
} from 'lucide-react';
import { cn, formatNumber } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import StatsCard from '@/shared/components/ui/StatsCard';
import Input from '@/shared/components/ui/Input';
import { useApi } from '@/hooks/useApi';

export default function ClassesPage() {
  const { loading, error, get } = useApi();
  const [classes, setClasses] = useState([]);
  const [elevesByClasse, setElevesByClasse] = useState({});
  const [selectedClasse, setSelectedClasse] = useState(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('liste');

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/enseignant/classes');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setClasses(items);
        if (items.length > 0 && !selectedClasse) setSelectedClasse(items[0]);
      } catch (e) {
        console.error('Erreur chargement classes:', e);
      }
    })();
  }, [get, selectedClasse]);

  useEffect(() => {
    if (!selectedClasse) return;
    (async () => {
      try {
        const res = await get(`/enseignant/classes/${selectedClasse.id}/eleves`);
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setElevesByClasse(prev => ({ ...prev, [selectedClasse.id]: items }));
      } catch (e) {
        console.error('Erreur chargement élèves:', e);
      }
    })();
  }, [selectedClasse, get]);

  const eleves = useMemo(() => elevesByClasse[selectedClasse?.id] || [], [elevesByClasse, selectedClasse]);

  const filteredEleves = useMemo(() =>
    eleves.filter((e) => {
      const nom = `${e.prenom || ''} ${e.nom || ''}`.toLowerCase();
      return !search || nom.includes(search.toLowerCase());
    }),
    [eleves, search]
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
        <Clock className="h-8 w-8 mb-2 text-red-400" />
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Mes Classes</h1>
          <p className="text-sm text-neutral-500">Gérez vos classes et suivez vos élèves</p>
        </div>
      </div>

      {/* Cartes Classes */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {classes.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-4">
            <div className="text-center py-8 text-neutral-500">
              <Users className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucune classe assignée</p>
            </div>
          </Card>
        ) : (
          classes.map((classe) => (
            <button
              key={classe.id}
              onClick={() => setSelectedClasse(classe)}
              className={cn(
                'rounded-2xl border-2 p-4 text-left transition-all',
                selectedClasse?.id === classe.id
                  ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                  : 'border-neutral-200 bg-white hover:border-[var(--accent)]/30 dark:border-neutral-700 dark:bg-neutral-900'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <Badge variant="primary" size="sm">{classe.niveau || 'Collège'}</Badge>
                <GraduationCap className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">{classe.nom}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {classe.effectif || 0}
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Ø {classe.moyenne || '—'}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {(classe.matieres || []).length} mat.
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Détail de la classe sélectionnée */}
      {selectedClasse && (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Classe de {selectedClasse.nom}
              </h2>
              <p className="text-sm text-neutral-500">
                {selectedClasse.effectif || 0} élèves · Salle {selectedClasse.salle || '—'} · {(selectedClasse.matieres || []).join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Rechercher un élève..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <div className="flex rounded-lg border border-neutral-300 dark:border-neutral-700 overflow-hidden">
                <button
                  onClick={() => setViewMode('liste')}
                  className={cn('px-3 py-1.5 text-xs font-medium transition-colors',
                    viewMode === 'liste' ? 'bg-[var(--accent)] text-white' : 'text-neutral-600 dark:text-neutral-400'
                  )}
                >
                  Liste
                </button>
                <button
                  onClick={() => setViewMode('grille')}
                  className={cn('px-3 py-1.5 text-xs font-medium transition-colors',
                    viewMode === 'grille' ? 'bg-[var(--accent)] text-white' : 'text-neutral-600 dark:text-neutral-400'
                  )}
                >
                  Grille
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'liste' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Élève</th>
                    <th className="pb-3 pr-4">Moyenne</th>
                    <th className="pb-3 pr-4">Absences</th>
                    <th className="pb-3 pr-4">Rang</th>
                    <th className="pb-3 pr-4">Appréciation</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEleves.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-neutral-500">
                        Aucun élève trouvé
                      </td>
                    </tr>
                  )}
                  {filteredEleves.map((eleve, idx) => (
                    <tr key={eleve.id} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-neutral-400 w-5">{idx + 1}</span>
                          <Avatar name={`${eleve.prenom} ${eleve.nom}`} size="sm" />
                          <span className="text-sm font-medium text-neutral-900 dark:text-white">{eleve.prenom} {eleve.nom}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn(
                          'text-sm font-semibold',
                          eleve.moyenne >= 14 ? 'text-emerald-600' : eleve.moyenne >= 10 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {eleve.moyenne?.toFixed(1) || '—'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn('text-sm', eleve.absences > 5 ? 'text-red-600 font-medium' : 'text-neutral-600 dark:text-neutral-400')}>
                          {eleve.absences || 0}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={eleve.rang <= 3 ? 'primary' : eleve.rang <= 10 ? 'outline' : 'ghost'} size="sm">
                          {eleve.rang}e
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          eleve.moyenne >= 14 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                          eleve.moyenne >= 10 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        )}>
                          {eleve.moyenne >= 14 ? 'Excellent' : eleve.moyenne >= 10 ? 'Passable' : 'Insuffisant'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm" icon={<FileText />} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEleves.map((eleve) => (
                <div key={eleve.id} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 hover:border-[var(--accent)]/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={`${eleve.prenom} ${eleve.nom}`} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{eleve.prenom} {eleve.nom}</p>
                      <p className="text-xs text-neutral-500">Rang: {eleve.rang}e</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Moyenne:</span>
                    <span className={cn(
                      'font-semibold',
                      eleve.moyenne >= 14 ? 'text-emerald-600' : eleve.moyenne >= 10 ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {eleve.moyenne?.toFixed(1) || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-neutral-500">Absences:</span>
                    <span className="text-neutral-900 dark:text-white">{eleve.absences || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </motion.div>
  );
}