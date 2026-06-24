/**
 * AIAssistant — Assistant IA flottant accessible depuis tous les écrans
 *
 * Mini panneau latéral ou modal avec chat contextuel.
 * Se réduit en icône flottante (FAB) quand minimisé.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  Send,
  Bot,
  User,
  Loader2,
  Zap,
  FileText,
  BarChart3,
  HelpCircle,
  School,
} from 'lucide-react';
import useUIStore from '@/shared/stores/ui-store';
import { cn } from '@/shared/lib/utils';

const SUGGESTIONS = [
  { icon: BarChart3, label: 'Résumé des performances' },
  { icon: FileText, label: 'Générer un rapport' },
  { icon: HelpCircle, label: 'Aide sur une fonctionnalité' },
  { icon: School, label: 'Statistiques établissement' },
];

const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    'Bonjour ! Je suis votre assistant IA. Je peux vous aider à analyser les données, générer des rapports, ou répondre à vos questions sur la gestion scolaire. Comment puis-je vous aider ?',
};

export default function AIAssistant() {
  const {
    aiAssistantOpen,
    aiAssistantMinimized,
    closeAIAssistant,
    minimizeAIAssistant,
    toggleAIAssistant,
  } = useUIStore();

  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input quand le panneau s'ouvre
  useEffect(() => {
    if (aiAssistantOpen && !aiAssistantMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [aiAssistantOpen, aiAssistantMinimized]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulation de réponse IA (à connecter à l'API)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Je comprends votre demande concernant "${userMessage.content}". Je travaille actuellement sur l'intégration de mon moteur d'analyse en temps réel. Pour l'instant, voici ce que je peux vous dire : cette fonctionnalité sera disponible très prochainement avec des capacités d'analyse avancées basées sur les données de votre établissement.`,
        },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSuggestion = (label) => {
    setInput(label);
    // Soumettre automatiquement après un court délai
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      inputRef.current.value = label;
      handleSend(fakeEvent);
    }, 100);
  };

  // FAB (minimisé)
  if (aiAssistantMinimized) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleAIAssistant}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 transition-shadow hover:shadow-xl hover:shadow-indigo-500/30"
        aria-label="Ouvrir l'assistant IA"
      >
        <Sparkles className="h-6 w-6" />
      </motion.button>
    );
  }

  if (!aiAssistantOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 right-0 z-50 flex h-[calc(100vh-4rem)] w-full flex-col border-l border-neutral-800 bg-neutral-950 shadow-2xl sm:w-96"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Assistant IA</h3>
              <p className="text-xs text-neutral-500">Analyse scolaire intelligente</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={minimizeAIAssistant}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              aria-label="Minimiser"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={closeAIAssistant}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-700">
          {/* Suggestions (affichées avant le premier message utilisateur) */}
          {messages.length === 1 && (
            <div className="mb-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
                Suggestions
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.label}
                      onClick={() => handleSuggestion(s.label)}
                      className="flex flex-col items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 px-3 py-4 text-center text-xs text-neutral-400 transition-all hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:text-indigo-400"
                    >
                      <Icon className="h-5 w-5" />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'mb-4 flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20">
                  <Bot className="h-4 w-4 text-indigo-400" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-neutral-800/50 text-neutral-300'
                )}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20">
                  <User className="h-4 w-4 text-indigo-400" />
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20">
                <Bot className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-neutral-800/50 px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                <span className="text-sm text-neutral-400">Réflexion...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-neutral-800 p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                disabled={isLoading}
                className="h-10 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 pr-10 text-sm text-white placeholder-neutral-500 outline-none transition-all focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                tabIndex={-1}
              >
                <Zap className="h-4 w-4" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white transition-all hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-neutral-600">
            L&apos;assistant peut commettre des erreurs. Vérifiez les informations importantes.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
