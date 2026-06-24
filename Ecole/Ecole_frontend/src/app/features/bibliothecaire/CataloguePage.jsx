/**
 * CataloguePage — Gestion du catalogue de la bibliothèque
 *
 * Le bibliothécaire gère les ouvrages et ressources disponibles.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Plus, Search, Filter, BookMarked, Book, BookX,
  Download, Eye, Clock, Users,
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const OUVRAGES = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1,
  titre: [
    'Mathématiques 4e', 'Physique Chimie TS', 'Français 6e', 'Histoire-Géo 3e',
    'Anglais Terminale', 'SVT 5e', 'Philosophie TS', 'Algorithme et Programmation',
    'Grammaire Française', 'Bescherelle Anglais', 'Atlas Mondial', 'Dictionnaire Latin',
    'Guide d\'algèbre', 'Biologie Cellulaire', 'Littérature Africaine', 'Manuel SVT 4e',
  ][i],
  auteur: [
    'M. Diallo', 'Mme Touré', 'M. Koné', 'Mme Cissé',
    'M. Traoré', 'Mme Sow', 'M. Diop', 'M. Ndiaye',
    'M. Ba', 'Mme Sylla', 'M. Faye', 'Mme Gueye',
    'M. Diallo', 'Mme Touré', 'M. Koné', 'Mme Cissé',
  ][i],
  isbn: `978-2-${String(100000 + i).slice(-6)}-${String(10 + i)}-${i}`,
  categorie: ['Sciences', 'Sciences', 'Lettres', 'Histoire', 'Langues', 'Sciences', 'Philosophie', 'Informatique', 'Lettres', 'Langues', 'Géographie', 'Langues', 'Sciences', 'Sciences', 'Lettres', 'Sciences'][i],
  exemplaires: [5, 3, 8, 4, 6, 7, 2, 4, 10, 5, 3, 2, 4, 3, 6, 5][i],
  disponibles: [3, 1, 6, 2, 4, 5, 0, 3, 8, 3, 1, 0, 2, 2, 4, 3][i],
  annee: [2024, 2023, 2024, 2023, 2024, 2023, 2024, 2024, 2023, 2024, 2023, 2020, 2024, 2023, 2024, 2023][i],
}));

const CATEGORIES = ['Toutes', 'Sciences', 'Lettres', 'Langues', 'Histoire', 'Philosophie', 'Informatique', 'Géographie'];

export default function CataloguePage() {
  const [search, setSearch] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');

  const stats = useMemo(() => ({
    total: OUVRAGES.length,
    disponibles: OUVRAGES.reduce((s, o) => s + o.disponibles, 0),
    empruntes: OUVRAGES.reduce((s, o) => s + (o.exemplaires - o.disponibles), 0),
    epuises: OUVRAGES.filter((o) => o.disponibles === 0).length,
  }), []);

  const filtered = useMemo(() =>
    OUVRAGES.filter((o) => {
      if (search && !o.titre.toLowerCase().includes(search.toLowerCase()) && !o.auteur.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategorie && o.categorie !== filterCategorie) return false;
      return true;
    }),
    [search, filterCategorie]
  );

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
        <StatsCard title="Total Ouvrages" value={String(stats.total)} icon={BookOpen} color="indigo" />
        <StatsCard title="Disponibles" value={String(stats.disponibles)} icon={Book} color="emerald" />
        <StatsCard title="Empruntés" value={String(stats.empruntes)} icon={BookMarked} color="amber" />
        <StatsCard title="Épuisés" value={String(stats.epuises)} icon={BookX} color="red" />
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
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategorie(cat === 'Toutes' ? '' : cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filterCategorie === (cat === 'Toutes' ? '' : cat)
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
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
            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center mb-3">
              <BookOpen className="h-5 w-5 text-indigo-500" />
            </div>
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white mb-1">{o.titre}</h3>
            <p className="text-xs text-neutral-500 mb-2">par {o.auteur}</p>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" size="sm">{o.categorie}</Badge>
              <span className="text-[10px] text-neutral-400">{o.annee}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={cn(
                'font-medium',
                o.disponibles > 0 ? 'text-emerald-600' : 'text-red-600'
              )}>
                {o.disponibles}/{o.exemplaires} disponibles
              </span>
              <span className="text-neutral-400">ISBN: {o.isbn.slice(-8)}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
              <Button variant="outline" size="sm" icon={<Eye />}>Détails</Button>
              <Button variant="ghost" size="sm" icon={<Download />} disabled={o.disponibles === 0}>
                Emprunter
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
