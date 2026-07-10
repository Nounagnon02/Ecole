/**
 * EmpruntsPage — Gestion des emprunts avec pénalités
 *
 * Le bibliothécaire suit les emprunts, retours et pénalités.
 * Données dynamiques via API /bibliothecaire/emprunts
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookMarked, Plus, Search, Clock, CheckCircle, AlertTriangle,
  ArrowRight, Calendar, User, Loader2, AlertCircle, Coins,
} from 'lucide-react';
import { cn, formatDate, formatCurrency } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useApi } from '@/hooks/useApi';

const getStatutVariant = (statut) => {
  switch (statut) {
    case 'en_cours': return 'warning';
    case 'en_retard': return 'danger';
    case 'termine': return 'primary';
    default: return 'outline';
  }
};

const getStatutLabel = (statut) => {
  switch (statut) {
    case 'en_cours': return 'En cours';
    case 'en_retard': return 'En retard';
    case 'termine': return 'Terminé';
    default: return statut || '—';
  }
};

export default function EmpruntsPage() {
  const { loading, error, get } = useApi();
  const [emprunts, setEmprunts] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/bibliothecaire/emprunts');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setEmprunts(items);
      } catch (e) {
        console.error('Erreur chargement emprunts:', e);
      }
    })();
  }, [get]);

  const stats = useMemo(() => {
    const now = new Date();
    const enCours = emprunts.filter((e) => !e.date_retour_effective);
    const enRetard = emprunts.filter((e) => !e.date_retour_effective && e.date_retour_prevue && new Date(e.date_retour_prevue) < now);
    const termines = emprunts.filter((e) => e.date_retour_effective);
    const totalPenalites = emprunts.reduce((a, e) => a + (parseFloat(e.penalite) || 0), 0);
    return {
      total: emprunts.length,
      enCours: enCours.length,
      enRetard: enRetard.length,
      termines: termines.length,
      penalites: totalPenalites,
    };
  }, [emprunts]);

  const filtered = useMemo(() => {
    const now = new Date();
    return emprunts.filter((e) => {
      const q = search.toLowerCase();
      if (search) {
        const eleve = `${e.eleve?.prenom || ''} ${e.eleve?.nom || ''}`;
        const livre = e.livre?.titre || '';
        if (!eleve.toLowerCase().includes(q) && !livre.toLowerCase().includes(q)) return false;
      }
      if (filterStatut) {
        if (filterStatut === 'en_cours' && e.date_retour_effective) return false;
        if (filterStatut === 'en_retard' && (e.date_retour_effective || (e.date_retour_prevue && new Date(e.date_retour_prevue) >= now))) return false;
        if (filterStatut === 'termine' && !e.date_retour_effective) return false;
      }
      return true;
    });
  }, [search, filterStatut, emprunts]);

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

  const now = new Date();
  const getItemStatut = (e) => {
    if (e.date_retour_effective) return 'termine';
    if (e.date_retour_prevue && new Date(e.date_retour_prevue) < now) return 'en_retard';
    return 'en_cours';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Emprunts</h1>
          <p className="text-sm text-neutral-500">Suivi des emprunts, retours et pénalités</p>
        </div>
        <Button size="sm" icon={<Plus />}>Nouvel emprunt</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total Emprunts" value={String(stats.total)} icon={BookMarked} color="primary" />
        <StatsCard title="En cours" value={String(stats.enCours)} icon={Clock} color="amber" />
        <StatsCard title="En retard" value={String(stats.enRetard)} icon={AlertTriangle} color="red" />
        <StatsCard title="Pénalités" value={formatCurrency(stats.penalites)} icon={Coins} color="sky" />
        <StatsCard title="Terminés" value={String(stats.termines)} icon={CheckCircle} color="emerald" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un élève ou un ouvrage..."
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
            <option value="en_cours">En cours</option>
            <option value="en_retard">En retard</option>
            <option value="termine">Terminé</option>
          </select>
        </div>
      </Card>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <BookMarked className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucun emprunt trouvé</p>
            </div>
          </Card>
        )}
        {filtered.map((e) => {
          const statut = getItemStatut(e);
          const penalite = parseFloat(e.penalite) || 0;
          const joursRetard = e.jours_retard || 0;
          return (
            <Card key={e.id} hover>
              <div className="flex items-start gap-4">
                <div className={cn(
                  'h-12 w-12 rounded-xl flex items-center justify-center shrink-0',
                  statut === 'en_retard' ? 'bg-red-100 dark:bg-red-900/20' :
                  statut === 'termine' ? 'bg-emerald-100 dark:bg-emerald-900/20' :
                  'bg-amber-100 dark:bg-amber-900/20'
                )}>
                  <BookMarked className={cn(
                    'h-6 w-6',
                    statut === 'en_retard' ? 'text-red-500' :
                    statut === 'termine' ? 'text-emerald-500' :
                    'text-amber-500'
                  )} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">{e.livre?.titre || 'Ouvrage'}</span>
                    <Badge variant={getStatutVariant(statut)} size="sm">{getStatutLabel(statut)}</Badge>
                    {penalite > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600">
                        <Coins className="h-3 w-3" />
                        {formatCurrency(penalite)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {e.eleve?.prenom} {e.eleve?.nom} · {e.eleve?.classe?.nom_classe || '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      Emprunt: {e.date_emprunt ? formatDate(e.date_emprunt) : '—'}
                    </span>
                    <span className={cn(
                      'flex items-center gap-1',
                      statut === 'en_retard' ? 'text-red-600 font-medium' : ''
                    )}>
                      <Calendar className="h-3 w-3" />
                      Retour prévu: {e.date_retour_prevue ? formatDate(e.date_retour_prevue) : '—'}
                    </span>
                    {statut === 'en_retard' && joursRetard > 0 && (
                      <span className="text-red-500 font-medium">
                        {joursRetard}j de retard
                      </span>
                    )}
                    {e.date_retour_effective && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle className="h-3 w-3" />
                        Retourné: {formatDate(e.date_retour_effective)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {statut !== 'termine' && (
                    <Button variant="outline" size="sm">Marquer retour</Button>
                  )}
                  <Button variant="ghost" size="sm">Détails</Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}
