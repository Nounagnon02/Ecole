/**
 * MessageriePage — Messagerie interne
 *
 * Système de messagerie interne pour tous les rôles.
 * Données dynamiques via API /messagerie/conversations et /messagerie/messages
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Send, Paperclip, MoreHorizontal, Archive,
  Trash2, Star, Inbox, MessageSquare, Users,
  ChevronLeft, ChevronRight, Phone, Video, Loader2, AlertCircle,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import { useApi } from '@/hooks/useApi';

export default function MessageriePage() {
  const { loading, error, get, post } = useApi();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [messageText, setMessageText] = useState('');
  const [filter, setFilter] = useState('inbox');
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(false);

  // Load conversations
  const loadConversations = useCallback(async () => {
    setLoadingConv(true);
    try {
      const res = await get('/messagerie/conversations');
      const items = Array.isArray(res?.data?.data) ? res.data.data
        : Array.isArray(res?.data) ? res.data
        : Array.isArray(res) ? res
        : [];
      setConversations(items.map((c) => ({
        ...c,
        name: c.correspondant?.nom || c.correspondant?.prenom ? `${c.correspondant?.prenom || ''} ${c.correspondant?.nom || ''}`.trim() : c.name || c.sujet || 'Conversation',
        role: c.correspondant?.role || c.role || 'Utilisateur',
        lastMessage: c.dernier_message?.contenu || c.last_message || c.dernierMessage || '',
        date: c.dernier_message?.created_at || c.updated_at || c.date || new Date().toISOString(),
        unread: c.non_lus ?? c.unread_count ?? c.unread ?? 0,
        online: c.correspondant?.online ?? c.online ?? false,
        avatar: c.correspondant?.avatar ?? c.avatar ?? null,
      })));
      if (items.length > 0 && !selectedConv) {
        setSelectedConv(items[0]);
      }
    } catch (e) {
      console.error('Erreur chargement conversations:', e);
    } finally {
      setLoadingConv(false);
    }
  }, [get, selectedConv]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConv) {
      setMessages([]);
      return;
    }
    setLoadingMsg(true);
    (async () => {
      try {
        const res = await get(`/messagerie/conversations/${selectedConv.id}/messages`);
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setMessages(items.map((m) => ({
          id: m.id,
          from: m.expediteur_id === (m.user_id || 'current') ? 'me' : 'them',
          text: m.contenu || m.texte || m.message || '',
          time: m.created_at || m.date || new Date().toISOString(),
        })));
      } catch (e) {
        console.error('Erreur chargement messages:', e);
        setMessages([]);
      } finally {
        setLoadingMsg(false);
      }
    })();
  }, [selectedConv, get]);

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
      const res = await post(`/messagerie/conversations/${selectedConv.id}/messages`, { contenu: text });
      const newMsg = res?.data?.data || res?.data || res;
      setMessages((prev) => [...prev, {
        id: newMsg.id || Date.now(),
        from: 'me',
        text,
        time: newMsg.created_at || new Date().toISOString(),
      }]);
      // Update conversation list
      setConversations((prev) => prev.map((c) =>
        c.id === selectedConv.id ? { ...c, lastMessage: text, date: new Date().toISOString(), unread: 0 } : c
      ));
    } catch (e) {
      console.error('Erreur envoi message:', e);
      setMessageText(text);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-neutral-500">
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-12rem)] gap-4">
        {/* Liste des conversations */}
        <Card className="w-full lg:w-80 shrink-0 flex flex-col max-h-48 lg:max-h-none">
          <div className="border-b border-neutral-200 p-3 dark:border-neutral-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Rechercher..."
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
                      : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                >
                  {f === 'inbox' ? 'Boîte' : f === 'starred' ? 'Favoris' : 'Archive'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConv && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
              </div>
            )}
            {filtered.length === 0 && !loadingConv && (
              <div className="text-center py-8 text-neutral-500">
                <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">Aucune conversation</p>
              </div>
            )}
            {filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={cn(
                  'w-full border-b border-neutral-100 p-3 text-left transition-colors dark:border-neutral-800',
                  selectedConv?.id === conv.id
                    ? 'bg-[var(--accent-subtle)] dark:bg-[var(--accent-subtle)]0/5'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
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
                      <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {conv.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 shrink-0">
                        {formatRelativeTime(conv.date)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 truncate">{conv.lastMessage || 'Aucun message'}</p>
                  </div>
                  {conv.unread > 0 && (
                    <Badge variant="primary" size="sm" className="shrink-0">{conv.unread}</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-neutral-200 p-3 dark:border-neutral-700">
            <Button variant="ghost" size="sm" icon={<Users />} className="w-full justify-start">
              Nouvelle conversation
            </Button>
          </div>
        </Card>

        {/* Zone de message */}
        <Card className="flex-1 flex flex-col">
          {selectedConv ? (
            <>
              {/* Header conversation */}
              <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-700">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedConv.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{selectedConv.name}</p>
                    <p className="text-xs text-neutral-500">{selectedConv.role}</p>
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
                    <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                  </div>
                )}
                {messages.length === 0 && !loadingMsg && (
                  <div className="text-center py-8 text-neutral-400">
                    <MessageSquare className="mx-auto h-12 w-12 mb-3" />
                    <p className="text-sm">Aucun message pour cette conversation</p>
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
                        : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 rounded-bl-md'
                    )}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={cn(
                        'text-[10px] mt-1',
                        msg.from === 'me' ? 'text-[var(--accent)]/60' : 'text-neutral-400'
                      )}>
                        {formatRelativeTime(msg.time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="border-t border-neutral-200 p-4 dark:border-neutral-700">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" icon={<Paperclip />} />
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && messageText.trim()) {
                        sendMessage();
                      }
                    }}
                  />
                  <Button size="sm" icon={<Send />} disabled={!messageText.trim()} onClick={sendMessage}>
                    Envoyer
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-400">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 mb-3" />
                <p className="text-sm">Sélectionnez une conversation</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
}