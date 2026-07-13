/**
 * CataloguePage — Gestion du catalogue de la bibliothèque
 *
 * Le bibliothécaire gère les ouvrages et ressources disponibles.
 * Données dynamiques via API /bibliothecaire/livres
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Plus, Search, BookMarked, Book, BookX,
  Eye, Loader2, AlertCircle,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useApi } from '@/hooks/useApi';

export default function CataloguePage() {
  const { loading, error, get } = useApi();
  const [ouvrages, setOuvrages] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/bibliothecaire/livres');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setOuvrages(items);
      } catch (e) {
        console.error('Erreur chargement catalogue:', e);
      }
    })();
  }, []);

  const stats = useMemo(() => ({
    total: ouvrages.length,
    disponibles: ouvrages.filter((o) => o.disponible).length,
    empruntes: ouvrages.filter((o) => !o.disponible).length,
    categories: new Set(ouvrages.map((o) => o.categorie)).size,
  }), [ouvrages]);

  const categories = useMemo(() => {
    const set = new Set(ouvrages.map((o) => o.categorie).filter(Boolean));
    return ['Toutes', ...Array.from(set)];
  }, [ouvrages]);

  const filtered = useMemo(() =>
    ouvrages.filter((o) => {
      const q = search.toLowerCase();
      if (search && !(o.titre || '').toLowerCase().includes(q) && !(o.auteur || '').toLowerCase().includes(q)) return false;
      if (filterCategorie && o.categorie !== filterCategorie) return false;
      return true;
    }),
    [search, filterCategorie, ouvrages]
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Catalogue</h1>
          <p className="text-sm text-neutral-500">Gestion des ouvrages et ressources de la bibliothèque</p>
        </div>
        <Button size="sm" icon={<Plus />}>Ajouter un ouvrage</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total Ouvrages" value={String(stats.total)} icon={BookOpen} color="primary" />
        <StatsCard title="Disponibles" value={String(stats.disponibles)} icon={Book} color="emerald" />
        <StatsCard title="Empruntés" value={String(stats.empruntes)} icon={BookMarked} color="amber" />
        <StatsCard title="Catégories" value={String(stats.categories)} icon={BookX} color="sky" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un titre ou un auteur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategorie(cat === 'Toutes' ? '' : cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filterCategorie === (cat === 'Toutes' ? '' : cat)
                    ? 'bg-[var(--primary-subtle)] text-[var(--accent)] dark:text-[var(--accent)]'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Grille */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <Card>
              <div className="text-center py-8 text-neutral-500">
                <BookOpen className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">Aucun ouvrage trouvé</p>
              </div>
            </Card>
          </div>
        )}
        {filtered.map((o) => (
          <Card key={o.id} hover>
            <div className="h-10 w-10 rounded-xl bg-[var(--primary-subtle)] flex items-center justify-center mb-3">
              <BookOpen className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white mb-1">{o.titre}</h3>
            <p className="text-xs text-neutral-500 mb-2">par {o.auteur || 'Inconnu'}</p>
            <div className="flex items-center gap-2 mb-2">
              {o.categorie && <Badge variant="outline" size="sm">{o.categorie}</Badge>}
              {o.annee_publication && (
                <span className="text-[10px] text-neutral-400">{o.annee_publication}</span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={cn(
                'font-medium',
                o.disponible ? 'text-emerald-600' : 'text-red-600'
              )}>
                {o.disponible ? 'Disponible' : 'Épuisé'}
                {o.nombre_exemplaires ? ` (${o.nombre_exemplaires} ex.)` : ''}
              </span>
              {o.isbn && <span className="text-neutral-400">ISBN: {o.isbn.slice(-8)}</span>}
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
              <Button variant="outline" size="sm" icon={<Eye />}>Détails</Button>
              <Button variant="ghost" size="sm" disabled={!o.disponible}>
                Emprunter
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
