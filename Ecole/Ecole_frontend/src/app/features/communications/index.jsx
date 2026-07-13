/**
 * Communications — Messagerie interne et communications de l'établissement
 *
 * Fonctions : Messagerie privée, communications officielles, notifications
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Send,
  Paperclip,
  MoreHorizontal,
  Star,
  Inbox,
  MessageSquare,
  Bell,
  Megaphone,
  Users,
  ChevronDown,
  Reply,
  Trash2,
  Eye,
  CheckCheck,
  Clock,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Download,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Avatar from '@/shared/components/ui/Avatar';

const TABS = [
  { id: 'boite', label: 'Boîte de Réception', icon: Inbox },
  { id: 'officiel', label: 'Communications', icon: Megaphone },
  { id: 'groupes', label: 'Groupes', icon: Users },
];

const MESSAGES = [
  { id: 1, from: 'M. Koffi (Enseignant)', sujet: 'Progression de votre enfant — Jean Mensah', apercu: 'Bonjour, je souhaite vous informer de la progression de votre enfant en mathématiques...', date: '2024-10-15T10:30:00', lu: false, urgent: false, pieces: 0 },
  { id: 2, from: 'Directeur', sujet: 'Réunion parents-professeurs — 1er trimestre', apercu: 'Madame, Monsieur, Nous avons le plaisir de vous convier à la réunion parents-professeurs...', date: '2024-10-14T14:00:00', lu: true, urgent: false, pieces: 1 },
  { id: 3, from: 'Mme. Dossa (Comptable)', sujet: 'Rappel — Échéance de paiement', apercu: 'Nous vous rappelons que l\'échéance de paiement du 15 octobre approche...', date: '2024-10-13T08:15:00', lu: true, urgent: true, pieces: 0 },
  { id: 4, from: 'M. Mensah (Surveillant)', sujet: 'Comportement en étude — Information', apercu: 'Je tenais à vous informer du comportement de votre enfant lors des études surveillées...', date: '2024-10-12T16:45:00', lu: false, urgent: false, pieces: 0 },
  { id: 5, from: 'Administration', sujet: 'Calendrier des examens — 1er trimestre', apercu: 'Veuillez trouver ci-joint le calendrier des examens du premier trimestre...', date: '2024-10-10T09:00:00', lu: true, urgent: false, pieces: 2 },
  { id: 6, from: 'Infirmerie', sujet: 'Campagne de vaccination — Information', apercu: 'L\'établissement organise une campagne de vaccination le 25 octobre...', date: '2024-10-09T11:20:00', lu: false, urgent: false, pieces: 0 },
];

const OFFICIELS = [
  { id: 1, titre: 'Note de service — Organisation des examens', date: '2024-10-14', dest: 'Tout le personnel', priorite: 'Haute', lu: 45, total: 52 },
  { id: 2, titre: 'Circulaire — Nouvelles mesures disciplinaires', date: '2024-10-10', dest: 'Enseignants & Surveillants', priorite: 'Moyenne', lu: 28, total: 35 },
  { id: 3, titre: 'Information — Travaux de rénovation bâtiment B', date: '2024-10-08', dest: 'Tout l\'établissement', priorite: 'Basse', lu: 120, total: 120 },
  { id: 4, titre: 'Convocation — Conseil de classe 4ème A', date: '2024-10-05', dest: 'Enseignants 4ème', priorite: 'Haute', lu: 10, total: 12 },
];

export default function Communications() {
  const [activeTab, setActiveTab] = useState('boite');
  const [search, setSearch] = useState('');
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [showCompose, setShowCompose] = useState(false);

  const filteredMsgs = MESSAGES.filter(m =>
    m.sujet.toLowerCase().includes(search.toLowerCase()) ||
    m.from.toLowerCase().includes(search.toLowerCase())
  );

  const formatMsgDate = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diffDays = (now - date) / (1000 * 60 * 60 * 24);
    if (diffDays < 1) return format(date, 'HH:mm');
    if (diffDays < 7) return format(date, 'EEEE', { locale: fr });
    return format(date, 'dd/MM');
  };

  const renderBoite = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Liste des messages */}
      <div className={cn('lg:col-span-1', selectedMsg && 'hidden lg:block')}>
        <div className="space-y-3 mb-4">
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={Search}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => setShowCompose(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nouveau
            </Button>
            <Button size="sm" variant="ghost"><Inbox className="h-4 w-4 mr-1" /> Boîte</Button>
            <Button size="sm" variant="ghost"><Star className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="space-y-1">
          {filteredMsgs.map(msg => (
            <button
              key={msg.id}
              onClick={() => setSelectedMsg(msg)}
              className={cn(
                'w-full text-left p-3 rounded-xl transition-colors',
                selectedMsg?.id === msg.id
                  ? 'bg-[var(--accent-subtle)] dark:bg-[var(--accent-subtle)]0/10'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                !msg.lu && 'bg-neutral-50/80 dark:bg-neutral-800/30'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={msg.from} size="sm" />
                  <span className={cn('text-sm truncate', !msg.lu && 'font-semibold text-neutral-900 dark:text-white')}>
                    {msg.from.split('(')[0].trim()}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {msg.urgent && <span className="w-2 h-2 rounded-full bg-red-500" />}
                  <span className="text-[11px] text-neutral-400">{formatMsgDate(msg.date)}</span>
                </div>
              </div>
              <p className={cn('text-sm mt-1 truncate', !msg.lu ? 'font-medium text-neutral-800 dark:text-neutral-200' : 'text-neutral-500')}>
                {msg.sujet}
              </p>
              <p className="text-xs text-neutral-400 truncate mt-0.5">{msg.apercu}</p>
              {msg.pieces > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Paperclip className="h-3 w-3 text-neutral-400" />
                  <span className="text-[10px] text-neutral-400">{msg.pieces} pièce(s)</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Vue détaillée */}
      <div className={cn('lg:col-span-2', !selectedMsg && 'hidden lg:flex lg:items-center lg:justify-center')}>
        {selectedMsg ? (
          <Card>
            <Card.Body className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedMsg.from} size="lg" />
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">{selectedMsg.from}</p>
                    <p className="text-sm text-neutral-500">{format(new Date(selectedMsg.date), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><Reply className="h-4 w-4" /></button>
                  <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><Trash2 className="h-4 w-4" /></button>
                  <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><MoreHorizontal className="h-4 w-4" /></button>
                </div>
              </div>

              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">{selectedMsg.sujet}</h2>

              <div className="prose prose-sm dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-400">
                <p>Bonjour,</p>
                <p className="mt-2">{selectedMsg.apercu}</p>
                <p className="mt-4">Nous restons à votre disposition pour toute information complémentaire.</p>
                <p className="mt-4">Cordialement,</p>
                <p><strong>{selectedMsg.from}</strong></p>
              </div>

              {selectedMsg.pieces > 0 && (
                <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Pièces jointes</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                      <FileText className="h-4 w-4 text-[var(--accent)]" />
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">Calendrier_Examens.pdf</span>
                      <Download className="h-3 w-3 text-neutral-400 cursor-pointer" />
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        ) : (
          <div className="text-center text-neutral-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Sélectionnez un message pour le lire</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderOfficiel = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">Communications officielles de l'établissement</p>
        <Button size="sm"><Megaphone className="h-4 w-4 mr-1" /> Nouvelle communication</Button>
      </div>
      {OFFICIELS.map((off) => (
        <Card key={off.id} hover>
          <Card.Body className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={off.priorite === 'Haute' ? 'danger' : off.priorite === 'Moyenne' ? 'warning' : 'neutral'} size="sm">
                    {off.priorite}
                  </Badge>
                  <span className="text-xs text-neutral-400">{off.date}</span>
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">{off.titre}</h3>
                <p className="text-xs text-neutral-500 mt-1">Destinataires : {off.dest}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-sm text-neutral-500">
                  <Eye className="h-4 w-4" />
                  <span>{off.lu}/{off.total}</span>
                </div>
                <p className="text-[10px] text-neutral-400 mt-0.5">taux de lecture</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );

  const renderGroupes = () => (
    <Card>
      <Card.Body>
        <p className="text-neutral-500 text-center py-12">
          Groupes de discussion — classes, équipes pédagogiques et administratives
        </p>
      </Card.Body>
    </Card>
  );

  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-neutral-900 dark:text-white"
      >
        Communications
      </motion.h1>

      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="flex gap-1 overflow-x-auto -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id ? 'border-[var(--accent)] text-[var(--accent)] dark:text-[var(--accent)]' : 'border-transparent text-neutral-500 hover:text-neutral-700'
                )}>
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {activeTab === 'boite' && renderBoite()}
          {activeTab === 'officiel' && renderOfficiel()}
          {activeTab === 'groupes' && renderGroupes()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
