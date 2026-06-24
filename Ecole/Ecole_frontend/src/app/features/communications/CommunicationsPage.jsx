/**
 * CommunicationsPage — Communications et annonces
 *
 * Fil d'actualité centralisé pour toutes les communications de l'établissement.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Send, Bell, Megaphone, Calendar,
  Pin, Clock, Eye, Heart, MessageCircle, Share2,
  Plus, Filter,
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';

const POSTS = [
  {
    id: 1,
    auteur: 'Direction',
    avatar: null,
    role: 'Directeur',
    date: new Date(Date.now() - 3600000),
    title: 'Réunion des parents d\'élèves',
    content: 'Nous vous informons que la réunion trimestrielle des parents d\'élèves aura lieu le samedi 15 mars 2026 à 9h00 dans la grande salle polyvalente. Votre présence est vivement souhaitée.',
    tags: ['Information', 'Réunion'],
    pinned: true,
    likes: 24,
    comments: 8,
    category: 'important',
  },
  {
    id: 2,
    auteur: 'Vie Scolaire',
    avatar: null,
    role: 'Censeur',
    date: new Date(Date.now() - 86400000 * 2),
    title: 'Inscriptions aux activités parascolaires',
    content: 'Les inscriptions aux clubs et activités parascolaires pour le second semestre sont ouvertes. Veuillez consulter la liste des clubs disponibles au bureau de la vie scolaire.',
    tags: ['Activités', 'Inscriptions'],
    pinned: false,
    likes: 15,
    comments: 3,
    category: 'info',
  },
  {
    id: 3,
    auteur: 'Comité Sportif',
    avatar: null,
    role: 'Sports',
    date: new Date(Date.now() - 86400000 * 5),
    title: 'Tournoi inter-écoles de football',
    content: 'Grand tournoi inter-écoles le 20 mars ! Les élèves intéressés doivent s\'inscrire avant le 10 mars auprès de leur professeur d\'EPS.',
    tags: ['Sport', 'Événement'],
    pinned: false,
    likes: 42,
    comments: 12,
    category: 'event',
  },
  {
    id: 4,
    auteur: 'Comptabilité',
    avatar: null,
    role: 'Comptable',
    date: new Date(Date.now() - 86400000 * 7),
    title: 'Rappel : Échéance des frais de scolarité',
    content: 'Nous rappelons aux parents que la date limite de paiement des frais de scolarité du deuxième trimestre est fixée au 31 mars 2026.',
    tags: ['Paiement', 'Rappel'],
    pinned: false,
    likes: 10,
    comments: 5,
    category: 'info',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Tout', icon: MessageSquare },
  { id: 'important', label: 'Important', icon: Bell },
  { id: 'info', label: 'Informations', icon: Megaphone },
  { id: 'event', label: 'Événements', icon: Calendar },
];

export default function CommunicationsPage() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = activeCategory === 'all' ? POSTS : POSTS.filter((p) => p.category === activeCategory);
  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.date - a.date;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Communications</h1>
          <p className="text-sm text-neutral-500">Restez informé des actualités de l'établissement</p>
        </div>
        <Button size="sm" icon={<Plus />}>
          Nouvelle Publication
        </Button>
      </div>

      {/* Categories */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
              }`}
            >
              <cat.icon className="h-4 w-4" />
              {cat.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Posts */}
      <div className="space-y-4">
        {sorted.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card hover>
              {post.pinned && (
                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-indigo-500">
                  <Pin className="h-3 w-3" />
                  Épinglé
                </div>
              )}
              <div className="flex items-start gap-4">
                <Avatar name={post.auteur} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {post.auteur}
                    </span>
                    <Badge variant="ghost" className="text-xs">{post.role}</Badge>
                    <span className="text-xs text-neutral-500">
                      {formatRelativeTime(post.date)}
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-neutral-900 dark:text-white">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed dark:text-neutral-400">
                    {post.content}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline" size="sm">{tag}</Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-neutral-500">
                    <button className="inline-flex items-center gap-1.5 hover:text-indigo-500 transition-colors">
                      <Heart className="h-4 w-4" />
                      {post.likes}
                    </button>
                    <button className="inline-flex items-center gap-1.5 hover:text-indigo-500 transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      {post.comments}
                    </button>
                    <button className="inline-flex items-center gap-1.5 hover:text-indigo-500 transition-colors">
                      <Share2 className="h-4 w-4" />
                      Partager
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
