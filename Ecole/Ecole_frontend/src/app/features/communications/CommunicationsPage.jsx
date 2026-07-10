/**
 * CommunicationsPage — Communications et annonces
 *
 * Fil d'actualité centralisé pour toutes les communications de l'établissement.
 * Données dynamiques via API /api/communications
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Send, Bell, Megaphone, Calendar,
  Pin, Clock, Eye, Heart, MessageCircle, Share2,
  Plus, Filter, Loader2, AlertCircle,
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import { useApi } from '@/hooks/useApi';

const CATEGORY_CONFIG = {
  all: { label: 'Tout', icon: MessageSquare },
  important: { label: 'Important', icon: Bell },
  info: { label: 'Informations', icon: Megaphone },
  event: { label: 'Événements', icon: Calendar },
};

export default function CommunicationsPage() {
  const { loading, error, get, post } = useApi();
  const [posts, setPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      setLoadingPosts(true);
      try {
        const res = await get('/communications');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setPosts(items.map((p) => ({
          ...p,
          auteur: p.auteur?.nom || p.auteur?.prenom ? `${p.auteur?.prenom || ''} ${p.auteur?.nom || ''}`.trim() : p.auteur_nom || 'Auteur',
          role: p.auteur?.role || p.role || 'Utilisateur',
          date: p.date || p.created_at || new Date().toISOString(),
          title: p.title || p.titre || 'Sans titre',
          content: p.content || p.contenu || '',
          tags: p.tags || p.tag || [],
          pinned: p.pinned || p.epingle || false,
          likes: p.likes || p.likes_count || 0,
          comments: p.comments || p.commentaires_count || 0,
          category: p.category || p.categorie || 'info',
        })));
      } catch (e) {
        console.error('Erreur chargement communications:', e);
      } finally {
        setLoadingPosts(false);
      }
    };
    loadPosts();
  }, [get]);

  const filtered = useMemo(() =>
    activeCategory === 'all' ? posts : posts.filter((p) => p.category === activeCategory),
    [activeCategory, posts]
  );

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.date) - new Date(a.date);
    }),
    [filtered]
  );

  const handleCreatePost = async () => {
    // TODO: Open modal for creating post
    // TODO: Ouvrir le modal de création de publication
  };

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Communications</h1>
          <p className="text-sm text-neutral-500">Restez informé des actualités de l'établissement</p>
        </div>
        <Button size="sm" icon={<Plus />} onClick={handleCreatePost}>
          Nouvelle Publication
        </Button>
      </div>

      {/* Categories */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_CONFIG).map(([id, cfg]) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                activeCategory === id
                  ? 'bg-[var(--accent-subtle)]0 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
              }`}
            >
              <cfg.icon className="h-4 w-4" />
              {cfg.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Posts */}
      <div className="space-y-4">
        {loadingPosts && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-neutral-200 animate-pulse dark:bg-neutral-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/4 bg-neutral-200 animate-pulse dark:bg-neutral-700 rounded" />
                    <div className="h-4 w-3/4 bg-neutral-200 animate-pulse dark:bg-neutral-700 rounded" />
                    <div className="h-4 w-1/2 bg-neutral-200 animate-pulse dark:bg-neutral-700 rounded" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        {!loadingPosts && sorted.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <MessageSquare className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucune communication trouvée</p>
            </div>
          </Card>
        )}
        {!loadingPosts && sorted.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card hover>
              {post.pinned && (
                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
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
                    <button className="inline-flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors">
                      <Heart className="h-4 w-4" />
                      {post.likes}
                    </button>
                    <button className="inline-flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      {post.comments}
                    </button>
                    <button className="inline-flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors">
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