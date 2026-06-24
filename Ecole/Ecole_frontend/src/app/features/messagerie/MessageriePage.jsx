/**
 * MessageriePage — Messagerie interne
 *
 * Système de messagerie interne pour tous les rôles.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Send, Paperclip, MoreHorizontal, Archive,
  Trash2, Star, Inbox, MessageSquare, Users,
  ChevronLeft, ChevronRight, Phone, Video,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';

/* ─── Data ────────────────────────────────────────────────────────── */
const CONVERSATIONS = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: ['M. Diallo', 'Mme Touré', 'M. Koné', 'Mme Cissé', 'Direction', 'Vie Scolaire', 'Comptabilité', 'Infirmerie'][i],
  role: ['Professeur', 'Enseignante', 'Parent', 'Censeur', 'Administration', 'Surveillance', 'Comptable', 'Infirmier'][i],
  lastMessage: [
    'Bonjour, je confirme la réunion de demain à 10h.',
    'Les notes du dernier devoir sont disponibles.',
    'Mon enfant sera absent cette semaine.',
    'Veuillez trouver ci-joint le rapport de discipline.',
    'Réunion des parents le 15 mars 2026.',
    'Les inscriptions aux activités sont ouvertes.',
    'Rappel : échéance des frais de scolarité.',
    'Les certificats médicaux sont à jour.',
  ][i],
  date: new Date(Date.now() - 3600000 * (i + 1)),
  unread: i < 3 ? Math.floor(Math.random() * 3) + 1 : 0,
  online: i < 2,
  avatar: null,
}));

const MESSAGES = [
  { id: 1, from: 'them', text: 'Bonjour, je confirme la réunion de demain à 10h dans la salle des professeurs.', time: new Date(Date.now() - 7200000) },
  { id: 2, from: 'me', text: 'Parfait, je serai présent. Y a-t-il des points particuliers à préparer ?', time: new Date(Date.now() - 6500000) },
  { id: 3, from: 'them', text: 'Oui, il faudrait préparer le rapport du premier trimestre pour chaque classe.', time: new Date(Date.now() - 6000000) },
  { id: 4, from: 'them', text: 'Ainsi que les statistiques de présence.', time: new Date(Date.now() - 5900000) },
  { id: 5, from: 'me', text: 'Je m\'en occupe. Je les aurai prêts pour demain matin.', time: new Date(Date.now() - 5000000) },
  { id: 6, from: 'them', text: 'Merci beaucoup ! À demain.', time: new Date(Date.now() - 4000000) },
];

export default function MessageriePage() {
  const [selectedConv, setSelectedConv] = useState(CONVERSATIONS[0]);
  const [search, setSearch] = useState('');
  const [messageText, setMessageText] = useState('');
  const [filter, setFilter] = useState('inbox');

  const filtered = useMemo(() =>
    CONVERSATIONS.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    ), [search]);

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
                      ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                      : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                >
                  {f === 'inbox' ? 'Boîte' : f === 'starred' ? 'Favoris' : 'Archive'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={cn(
                  'w-full border-b border-neutral-100 p-3 text-left transition-colors dark:border-neutral-800',
                  selectedConv?.id === conv.id
                    ? 'bg-indigo-50 dark:bg-indigo-500/5'
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
                    <p className="text-xs text-neutral-500 truncate">{conv.lastMessage}</p>
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
                {MESSAGES.map((msg) => (
                  <div key={msg.id} className={cn(
                    'flex',
                    msg.from === 'me' ? 'justify-end' : 'justify-start'
                  )}>
                    <div className={cn(
                      'max-w-[70%] rounded-2xl px-4 py-2.5',
                      msg.from === 'me'
                        ? 'bg-indigo-500 text-white rounded-br-md'
                        : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 rounded-bl-md'
                    )}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={cn(
                        'text-[10px] mt-1',
                        msg.from === 'me' ? 'text-indigo-200' : 'text-neutral-400'
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
                    className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && messageText.trim()) {
                        setMessageText('');
                      }
                    }}
                  />
                  <Button size="sm" icon={<Send />} disabled={!messageText.trim()}>
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
