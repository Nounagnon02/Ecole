/**
 * MessageriePage — Messagerie interne
 *
 * Données dynamiques via :
 *   - GET  /messages/conversations        liste des fils
 *   - GET  /messages/conversation/:id     fil de discussion
 *   - POST /messages                      envoi
 *   - PUT  /messages/conversation/:id/read  marquage lu du fil
 *   - GET  /messages/contacts             contacteur (nouvelle conversation)
 *
 * Trois pièges corrigés :
 *   - la sélection automatique enregistrait la ligne BRUTE de l'API (sans
 *     `id`/`name`) — le fil partait sur /conversation/undefined ;
 *   - le dernier message d'une conversation n'était jamais rendu (le backend
 *     ne fournissait pas `dernier_message`) ;
 *   - rien ne marquait un fil lu : les badges non-lus ne redescendaient
 *     jamais. L'ouverture d'un fil appelle PUT …/read puis rafraîchit la liste.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApiQuery } from '@/shared/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, Send, Paperclip, Trash2, Star, MessageSquare, Users,
  Phone, Video, Loader2, AlertCircle, X
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import { api } from '@/shared/services/api';
import useAuthStore from '@/shared/stores/auth-store';
import { unwrapList } from '@/shared/lib/unwrap';
import logger from '@/shared/lib/logger';
import { useTranslation } from '@/shared/i18n';

/**
 * Normalise une ligne de conversation en objet UI. Le backend expose
 * `id` (identifiant stable), `contact_nom`, `role`, `dernier_message` et
 * `non_lus` ; la page en a besoin sous des clés homogènes.
 */
function mapConversations(items) {
  return items.map((c) => ({
    ...c,
    id: c.id ?? c.contact_id,
    name: c.contact_nom || 'Conversation',
    role: c.role || 'Utilisateur',
    lastMessage: c.dernier_message || '',
    date: c.derniere_date || new Date().toISOString(),
    unread: Number(c.non_lus ?? 0),
    online: false,
    avatar: null,
  }));
}

export default function MessageriePage() {
  const { t } = useTranslation();
  // Nécessaire pour distinguer les messages envoyés de ceux reçus : l'API
  // renvoie l'identifiant de l'auteur dans `expediteur`.
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [selectedConv, setSelectedConv] = useState(null);
  const [search, setSearch] = useState('');
  const [messageText, setMessageText] = useState('');
  const [filter, setFilter] = useState('inbox');
  const [showContacts, setShowContacts] = useState(false);

  const queryClient = useQueryClient();

  // ─── Conversations ───────────────────────────────────────────
  //
  // La liste vivait dans un `useState` alimenté par un `useEffect`, avec un
  // `refreshConversations` appelé à la main depuis trois endroits. react-query
  // la tient : une clé, un cache, une invalidation (cf. audit P4.1).
  const requeteConversations = useApiQuery(['messages', 'conversations'], '/messages/conversations');

  const conversations = useMemo(
    () => mapConversations(unwrapList(requeteConversations.data) ?? []),
    [requeteConversations.data],
  );
  const loadingConv = requeteConversations.isPending;
  const loading = requeteConversations.isPending;
  const error = requeteConversations.isError
    ? (requeteConversations.error?.message ?? t('common.load_error'))
    : null;

  const refreshConversations = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] }),
    [queryClient],
  );

  // Première conversation sélectionnée d'office — la version MAPPÉE (avec
  // `id`/`name`), jamais la ligne brute de l'API.
  useEffect(() => {
    if (!selectedConv && conversations.length > 0) {
      setSelectedConv(conversations[0]);
    }
  }, [conversations, selectedConv]);

  // ─── Fil de la conversation ──────────────────────────────────
  //
  // Requête dépendante : la clé porte la conversation, donc en changer change
  // d'entrée de cache au lieu d'écraser la précédente.
  const requeteFil = useApiQuery(
    ['messages', 'conversation', selectedConv?.id],
    `/messages/conversation/${selectedConv?.id}`,
    { queryOptions: { enabled: !!selectedConv } },
  );

  const messages = useMemo(() => {
    if (!selectedConv) return [];
    return (unwrapList(requeteFil.data) ?? []).map((m) => ({
      id: m.id,
      from: String(m.expediteur) === String(currentUserId) ? 'me' : 'them',
      text: m.contenu || '',
      time: m.created_at || new Date().toISOString(),
    }));
  }, [requeteFil.data, selectedConv, currentUserId]);

  const loadingMsg = !!selectedConv && requeteFil.isPending;

  /** Ajoute un message au fil en cache, sans aller-retour. */
  const appendMessage = useCallback((brut) => {
    queryClient.setQueryData(['messages', 'conversation', selectedConv?.id], (ancien) => {
      const liste = unwrapList(ancien) ?? [];
      return { data: [...liste, brut] };
    });
  }, [queryClient, selectedConv]);

  // À l'ouverture d'un fil, il est marqué lu côté serveur, et le badge
  // correspondant descend à zéro dans le cache.
  //
  // Mise à jour directe plutôt qu'invalidation : recharger toute la liste pour
  // un compteur la fait clignoter le temps de l'aller-retour, alors que la
  // valeur est connue d'avance.
  useEffect(() => {
    if (!selectedConv || !requeteFil.isSuccess) return;

    api.put(`/messages/conversation/${selectedConv.id}/read`).catch(() => {});

    queryClient.setQueryData(['messages', 'conversations'], (ancien) => {
      const liste = unwrapList(ancien) ?? [];
      return {
        data: liste.map((c) =>
          String(c.contact_id ?? c.id) === String(selectedConv.id) ? { ...c, non_lus: 0 } : c,
        ),
      };
    });
  }, [selectedConv, requeteFil.isSuccess, queryClient]);

  // ─── Contacts ────────────────────────────────────────────────
  //
  // Chargés seulement quand le contacteur s'ouvre.
  const requeteContacts = useApiQuery(['messages', 'contacts'], '/messages/contacts', {
    queryOptions: { enabled: showContacts },
  });

  const contacts = useMemo(() => unwrapList(requeteContacts.data) ?? [], [requeteContacts.data]);
  const loadingContacts = showContacts && requeteContacts.isPending;

  const openContacts = useCallback(() => setShowContacts(true), []);

  const startConversation = useCallback((contact) => {
    setShowContacts(false);
    const thread = {
      id: contact.id,
      name: contact.name || t('pages.messagerie.messagerie.conversation'),
      role: contact.role || t('common.user'),
      lastMessage: '',
      date: new Date().toISOString(),
      unread: 0,
      online: false,
      avatar: null,
    };
    // Conversation locale, pas encore connue du serveur : on la pose en tête
    // du cache pour qu'elle apparaisse immédiatement dans la liste.
    queryClient.setQueryData(['messages', 'conversations'], (ancien) => {
      const liste = unwrapList(ancien) ?? [];
      return liste.some((c) => String(c.contact_id ?? c.id) === String(contact.id))
        ? ancien
        : { data: [{ id: contact.id, contact_id: contact.id, contact_nom: thread.name, role: thread.role, dernier_message: '', non_lus: 0 }, ...liste] };
    });
    setSelectedConv(thread);
  }, [queryClient, t]);

  const filtered = useMemo(() =>
    conversations.filter((c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage?.toLowerCase().includes(search.toLowerCase())
    ), [search, conversations]);

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConv) return;
    const text = messageText.trim();
    setMessageText('');
    try {
      const res = await api.post('/messages', {
        destinataire: String(selectedConv.id),
        contenu: text
      });
      const newMsg = res?.data?.data || res?.data || res;
      appendMessage({
        id: newMsg.id || Date.now(),
        expediteur: currentUserId,
        contenu: text,
        created_at: newMsg.created_at || new Date().toISOString(),
      });
      // Les badges et l'aperçu viennent du serveur : on invalide plutôt
      // que de recopier l'état à la main.
      refreshConversations();
    } catch (e) {
      logger.error('Erreur envoi message:', e);
      setMessageText(text);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-[var(--text-secondary)]">
        <AlertCircle className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-12rem)] gap-4">
        {/* Liste des conversations */}
        <Card className="relative w-full lg:w-80 shrink-0 flex flex-col max-h-48 lg:max-h-none">
          <div className="border-b border-[var(--border)] p-3 ">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <Input
                placeholder={t('common.search_ellipsis')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="mt-2 flex gap-1">
              {['inbox', 'starred', 'archive'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'flex-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                    filter === f
                      ? 'bg-[var(--primary-subtle)] text-[var(--accent)] dark:bg-[var(--accent-subtle)]0/10 dark:text-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] '
                  )}
                >
                  {f === 'inbox' ? t('pages.messagerie.messagerie.boite') : f === 'starred' ? t('pages.messagerie.messagerie.favoris') : t('pages.messagerie.messagerie.archive')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConv && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
              </div>
            )}
            {filtered.length === 0 && !loadingConv && (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">{t('pages.messagerie.messagerie.aucune_conversation')}</p>
              </div>
            )}
            {filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={cn(
                  'w-full border-b border-[var(--border-light)] p-3 text-left transition-colors ',
                  selectedConv?.id === conv.id
                    ? 'bg-[var(--accent-subtle)] dark:bg-[var(--accent-subtle)]0/5'
                    : 'hover:bg-[var(--surface)] '
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar name={conv.name} size="sm" />
                    {conv.online && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--text-primary)]  truncate">
                        {conv.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">
                        {formatRelativeTime(conv.date)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{conv.lastMessage || t('pages.messagerie.messagerie.aucun_message')}</p>
                  </div>
                  {conv.unread > 0 && (
                    <Badge variant="primary" size="sm" className="shrink-0">{conv.unread}</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-[var(--border)] p-3 ">
            <Button variant="ghost" size="sm" icon={<Users />} className="w-full justify-start" onClick={openContacts}>
              {t('pages.messagerie.messagerie.nouvelle_conversation')}
            </Button>
          </div>

          {/* Contacteur — nouvelle conversation */}
          {showContacts && (
            <div className="absolute inset-0 z-10 flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]  ">
              <div className="flex items-center justify-between border-b border-[var(--border)] p-3 ">
                <p className="text-sm font-semibold text-[var(--text-primary)] ">{t('pages.messagerie.messagerie.nouvelle_conversation')}</p>
                <button onClick={() => setShowContacts(false)} aria-label={t('pages.messagerie.messagerie.fermer')}>
                  <X className="h-4 w-4 text-[var(--text-tertiary)]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingContacts && (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                  </div>
                )}
                {!loadingContacts && contacts.length === 0 && (
                  <p className="p-4 text-sm text-[var(--text-tertiary)]">{t('pages.messagerie.messagerie.aucun_contact_disponible')}</p>
                )}
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => startConversation(contact)}
                    className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-[var(--surface)] "
                  >
                    <Avatar name={contact.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)] ">{contact.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{contact.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Zone de message */}
        <Card className="flex-1 flex flex-col">
          {selectedConv ? (
            <>
              {/* Header conversation */}
              <div className="flex items-center justify-between border-b border-[var(--border)] p-4 ">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedConv.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] ">{selectedConv.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{selectedConv.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" icon={<Phone />} />
                  <Button variant="ghost" size="sm" icon={<Video />} />
                  <Button variant="ghost" size="sm" icon={<Star />} />
                  <Button variant="ghost" size="sm" icon={<Trash2 />} />
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsg && (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
                  </div>
                )}
                {messages.length === 0 && !loadingMsg && (
                  <div className="text-center py-8 text-[var(--text-tertiary)]">
                    <MessageSquare className="mx-auto h-12 w-12 mb-3" />
                    <p className="text-sm">{t('pages.messagerie.messagerie.aucun_message_pour_cette_conversation')}</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={cn(
                    'flex',
                    msg.from === 'me' ? 'justify-end' : 'justify-start'
                  )}>
                    <div className={cn(
                      'max-w-[70%] rounded-2xl px-4 py-2.5',
                      msg.from === 'me'
                        ? 'bg-[var(--accent-subtle)]0 text-white rounded-br-md'
                        : 'bg-[var(--surface-subtle)] text-[var(--text-primary)]   rounded-bl-md'
                    )}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={cn(
                        'text-[10px] mt-1',
                        msg.from === 'me' ? 'text-[var(--accent)]/60' : 'text-[var(--text-tertiary)]'
                      )}>
                        {formatRelativeTime(msg.time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="border-t border-[var(--border)] p-4 ">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" icon={<Paperclip />} />
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={t('pages.messagerie.messagerie.ecrivez_votre_message')}
                    className="flex-1 rounded-xl border border-[var(--border-heavy)] bg-[var(--surface-raised)] px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40   "
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && messageText.trim()) {
                        sendMessage();
                      }
                    }}
                  />
                  <Button size="sm" icon={<Send />} disabled={!messageText.trim()} onClick={sendMessage}>
                    {t('pages.messagerie.messagerie.envoyer')}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--text-tertiary)]">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 mb-3" />
                <p className="text-sm">{t('pages.messagerie.messagerie.selectionnez_une_conversation')}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
}