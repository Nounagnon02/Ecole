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
import logger from '@/shared/lib/logger';

const CATEGORY_CONFIG = {
  all: { label: 'Tout', icon: MessageSquare },
  important: { label: 'Important', icon: Bell },
  info: { label: 'Informations', icon: Megaphone },
  event: { label: 'Événements', icon: Calendar },
};

/** Catégories acceptées à l'écriture — `Communication::categories()` côté serveur. */
const WRITABLE_CATEGORIES = [
  { value: 'info', label: 'Informations' },
  { value: 'important', label: 'Important' },
  { value: 'event', label: 'Événements' },
];

const EMPTY_FORM = { titre: '', contenu: '', categorie: 'info' };

/**
 * Met une annonce du serveur à la forme attendue par le rendu.
 *
 * Extrait de l'effet de chargement pour que la publication créée par le
 * formulaire soit normalisée exactement comme celles du fil : une carte
 * ajoutée localement doit être indistinguable d'une carte rechargée.
 */
function normalizePost(p) {
  // La colonne d'identité de `users` est `name`, pas `nom` : lire
  // `p.auteur.nom` retombait toujours sur le libellé « Auteur ».
  const nom = p.auteur?.name || p.auteur?.nom || '';
  const prenom = p.auteur?.prenom || '';
  const auteur = `${prenom} ${nom}`.trim();

  return {
    ...p,
    auteur: auteur || p.auteur_nom || 'Auteur',
    role: p.auteur?.role || p.role || 'Utilisateur',
    date: p.publie_le || p.date || p.created_at || new Date().toISOString(),
    title: p.title || p.titre || 'Sans titre',
    content: p.content || p.contenu || '',
    // `tags` est une colonne JSON : elle peut revenir à null, et
    // `.map()` sur null casse le rendu.
    tags: Array.isArray(p.tags) ? p.tags : [],
    pinned: p.pinned || p.epingle || false,
    likes: p.likes || p.likes_count || 0,
    comments: p.comments || p.commentaires_count || 0,
    category: p.category || p.categorie || 'info',
  };
}

export default function CommunicationsPage() {
  const { loading, error, get } = useApi();
  // Deuxième instance, volontairement : `useApi` porte un `loading` et un
  // `error` uniques. Partagée avec la lecture, une écriture qui échoue
  // remplacerait tout le fil par l'écran d'erreur — un champ mal rempli
  // ferait donc disparaître les annonces déjà affichées.
  const { post, loading: submitting } = useApi();
  const [posts, setPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const loadPosts = async () => {
      setLoadingPosts(true);
      try {
        // GET /api/communications — le serveur ne renvoie que les annonces qui
        // s'adressent au lecteur (école, cycle, classe ou rôle) et qui sont dans
        // leur fenêtre de validité. Le tri épinglé-puis-récent vient aussi du
        // serveur ; le tri local ci-dessous n'est qu'un filet.
        const res = await get('/communications');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setPosts(items.map(normalizePost));
      } catch (e) {
        logger.error('Erreur chargement communications:', e);
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

  /** Premier message d'erreur du champ, tel que Laravel le renvoie (tableau). */
  const fieldError = (name) => {
    const messages = fieldErrors?.[name];
    return Array.isArray(messages) ? messages[0] : messages || undefined;
  };

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Le message du champ appartient à la soumission qui l'a produit : le
    // garder après correction ferait passer une saisie valide pour fautive.
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
  };

  const toggleForm = () => {
    setFormOpen((open) => !open);
    setFieldErrors({});
    setSubmitError(null);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError(null);

    try {
      // POST /api/communications — l'auteur, l'école et la date de publication
      // sont posés par le serveur ; le client n'envoie que la rédaction.
      const res = await post('/communications', {
        titre: form.titre,
        contenu: form.contenu,
        categorie: form.categorie,
      });

      // 201 → { success, message, data: {…} } : on insère l'annonce sans
      // recharger le fil, mais normalisée comme les autres.
      const created = res?.data?.data ?? res?.data ?? null;
      if (created && typeof created === 'object' && !Array.isArray(created)) {
        setPosts((prev) => [normalizePost(created), ...prev]);
      }
      setForm(EMPTY_FORM);
      setFormOpen(false);
    } catch (err) {
      // 422 Laravel : { message, errors: { champ: [message] } }. L'intercepteur
      // conserve les deux — le message général et le détail par champ.
      setFieldErrors(err?.errors || err?.response?.data?.errors || {});
      setSubmitError(err?.message || 'La publication a échoué.');
    }
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
        <Button size="sm" icon={<Plus />} onClick={toggleForm} aria-expanded={formOpen}>
          Nouvelle Publication
        </Button>
      </div>

      {/* Rédaction */}
      {formOpen && (
        <Card>
          <form onSubmit={handleCreatePost} aria-label="Nouvelle publication" className="space-y-4">
            <Input
              label="Titre"
              name="titre"
              value={form.titre}
              onChange={handleField}
              error={fieldError('titre')}
              placeholder="Titre de la publication"
            />

            <div className="space-y-1.5">
              <label
                htmlFor="communication-contenu"
                className="block text-sm font-medium text-[var(--text-primary)]"
              >
                Contenu
              </label>
              <textarea
                id="communication-contenu"
                name="contenu"
                rows={4}
                value={form.contenu}
                onChange={handleField}
                placeholder="Que souhaitez-vous annoncer ?"
                aria-invalid={fieldError('contenu') ? 'true' : undefined}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-sm text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
              />
              {fieldError('contenu') && (
                <p role="alert" className="text-xs font-medium text-[var(--red)]">
                  {fieldError('contenu')}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="communication-categorie"
                className="block text-sm font-medium text-[var(--text-primary)]"
              >
                Catégorie
              </label>
              <select
                id="communication-categorie"
                name="categorie"
                value={form.categorie}
                onChange={handleField}
                className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--text-primary)] outline-none"
              >
                {WRITABLE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {fieldError('categorie') && (
                <p role="alert" className="text-xs font-medium text-[var(--red)]">
                  {fieldError('categorie')}
                </p>
              )}
            </div>

            {/* Le message général de l'échec : sans lui, un refus sans détail
                par champ (403, 500) ne laisserait aucune trace à l'écran. */}
            {submitError && (
              <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" icon={<Send />} loading={submitting}>
                Publier
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={toggleForm}>
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

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