/**
 * AiInsightsPage — Page d'analyse IA adaptée au rôle
 *
 * Fonctionnalités selon le rôle :
 * - Directeur → Dashboard prédictif, tendances, alertes
 * - Enseignant → Assistant de cours, analyse de classe
 * - Élève → Tutorat personnalisé
 * - Parent → Rapport hebdomadaire, chatbot
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, TrendingUp, AlertTriangle, Lightbulb,
  BarChart3, BookOpen, GraduationCap, Send,
  Bot, User, Loader2, Target,
  MessageSquare, FileText, RefreshCw, School, HelpCircle
} from 'lucide-react';
import useAuthStore from '@/shared/stores/auth-store';
import apiClient from '@/shared/lib/api-client';
import { cn } from '@/shared/lib/utils';
import { ROLES } from '@/shared/types/roles';
import { useTranslation } from '@/shared/i18n';

/* ─── Messages de bienvenue par rôle ────────────────────────────── */
// Les textes vivent dans les locales (`pages.ai.welcome.<clé>`) ; il ne reste
// ici que les icônes, qui ne se traduisent pas. L'ordre des icônes suit celui
// des suggestions `s1`…`s4`.
const WELCOME_MESSAGES = {
  [ROLES.DIRECTEUR]: { key: 'directeur', icons: [BarChart3, TrendingUp, AlertTriangle, Lightbulb] },
  [ROLES.ENSEIGNANT]: { key: 'enseignant', icons: [BookOpen, BarChart3, FileText, GraduationCap] },
  [ROLES.ELEVE]: { key: 'eleve', icons: [BookOpen, BookOpen, BookOpen, GraduationCap] },
  [ROLES.PARENT]: { key: 'parent', icons: [School, TrendingUp, MessageSquare, Target] },
};

const DEFAULT_WELCOME = { key: 'default', icons: [Sparkles, BarChart3, FileText, HelpCircle] };

export default function AiInsightsPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const role = user?.role;
  const { key: welcomeKey, icons: welcomeIcons } = WELCOME_MESSAGES[role] || DEFAULT_WELCOME;
  const welcome = {
    title: t(`pages.ai.welcome.${welcomeKey}.title`),
    subtitle: t(`pages.ai.welcome.${welcomeKey}.subtitle`),
    suggestions: welcomeIcons.map((icon, i) => ({
      icon,
      label: t(`pages.ai.welcome.${welcomeKey}.suggestions.s${i + 1}`),
    })),
  };

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [analysisData, setAnalysisData] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const mode = role === ROLES.ELEVE ? 'tuteur'
        : role === ROLES.ENSEIGNANT ? 'assistant'
          : role === ROLES.PARENT ? 'conseiller'
            : 'general';

      const response = await apiClient.post('/v1/ia/chat', {
        message: userMsg.content,
        mode
      });
      const data = response.data;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.content || t('pages.ai.errors.no_answer') },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('pages.ai.errors.unavailable') },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (label) => {
    setInput(label);
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      handleSend(fakeEvent);
    }, 100);
  };

  const loadAnalysis = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/v1/ia/predictive');
      setAnalysisData(response.data.data);
    } catch {
      setAnalysisData({ error: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] shadow-3">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {welcome.title}
            </h1>
            <p className="text-sm text-neutral-500">{welcome.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {[
          { key: 'chat', label: t('pages.ai.tabs.chat'), icon: MessageSquare },
          { key: 'analysis', label: t('pages.ai.tabs.analysis'), icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'chat' && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          {/* Messages */}
          <div className="h-[400px] overflow-y-auto p-6">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-subtle)] px-4 py-1.5 text-sm font-medium text-[var(--accent)]">
                    <Bot className="h-4 w-4" />
                    EduPilot IA
                  </span>
                </motion.div>
                <p className="mb-6 text-sm text-neutral-500 text-center max-w-md">
                  {t('pages.ai.empty_hint')}
                </p>
                <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                  {welcome.suggestions.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.label}
                        onClick={() => handleSuggestion(s.label)}
                        className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600 transition-all hover:border-[var(--accent)]/30 hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('mb-4 flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-subtle)]">
                    <Bot className="h-4 w-4 text-[var(--accent)]" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                )}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-subtle)]">
                    <User className="h-4 w-4 text-[var(--accent)]" />
                  </div>
                )}
              </motion.div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-subtle)]">
                  <Bot className="h-4 w-4 text-[var(--accent)]" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
                  <span className="text-sm text-neutral-500">{t('pages.ai.thinking')}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('pages.ai.placeholder')}
                disabled={isLoading}
                className="h-11 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-900 outline-none transition-all focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-white transition-all hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Analyse prédictive */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('pages.ai.predictive.title')}
                </h2>
              </div>
              <button
                onClick={loadAnalysis}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-subtle)] px-4 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent-subtle)] disabled:opacity-50"
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                {t('pages.ai.predictive.run')}
              </button>
            </div>

            {analysisData?.error && (
              <p className="text-sm text-neutral-500 text-center py-8">
                {t('pages.ai.predictive.not_configured')}
              </p>
            )}

            {!analysisData && (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <BarChart3 className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
                <p className="text-sm text-neutral-500">
                  {t('pages.ai.predictive.hint')}
                </p>
              </div>
            )}

            {analysisData && !analysisData.error && (
              <div className="grid gap-4 sm:grid-cols-2">
                {analysisData.trends?.map((trend, i) => (
                  <div key={i} className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                    <div className="mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                        {t('pages.ai.predictive.trend', { n: i + 1 })}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{trend}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats rapides */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                <Target className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">—</p>
              <p className="text-xs text-neutral-500">{t('pages.ai.stats.performance')}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">—</p>
              <p className="text-xs text-neutral-500">{t('pages.ai.stats.alerts')}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
                <Lightbulb className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">—</p>
              <p className="text-xs text-neutral-500">{t('pages.ai.stats.recommendations')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
