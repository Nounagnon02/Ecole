/**
 * CataloguePage — Gestion du catalogue de la bibliothèque
 *
 * Le bibliothécaire gère les ouvrages et ressources disponibles.
 * Données dynamiques via API /bibliothecaire/livres
 */

import { useState, useMemo } from 'react';
import { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
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
import { useTranslation } from '@/shared/i18n';

export default function CataloguePage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');

  // Le chargement passait par un `useState` doublé d'un `useEffect` de
  // premier rendu, sans cache ni déduplication : deux composants montés
  // ensemble lançaient deux requêtes, et un retour sur la page rechargeait
  // tout (cf. audit P4.1). `unwrapList` traverse les trois formes
  // d'enveloppe que renvoient les contrôleurs.
  const requete = useApiQuery(['bibliothecaire-livres'], '/bibliothecaire/livres');

  const ouvrages = useMemo(() => unwrapList(requete.data) ?? [], [requete.data]);
  const loading = requete.isPending;
  const error = requete.isError ? (requete.error?.message ?? 'Erreur de chargement') : null;

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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pages.bibliothecaire.catalogue.title')}</h1>
          <p className="text-sm text-neutral-500">{t('pages.bibliothecaire.catalogue.subtitle')}</p>
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
