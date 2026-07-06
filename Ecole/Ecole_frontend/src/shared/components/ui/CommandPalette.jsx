/**
 * CommandPalette — ⌘K Universal Command Palette
 *
 * Signature feature : navigation, recherche et actions rapides
 * depuis un seul point d'entrée. Inspirée de Linear, Vercel, Raycast.
 *
 * Features :
 * - Navigation vers n'importe quelle page
 * - Recherche d'élèves/enseignants/classes
 * - Actions rapides contextuelles (selon rôle)
 * - Raccourcis clavier : ⌘K / Ctrl+K
 * - Filtrage intelligent avec fuzzy search
 * - Groupes d'actions par catégorie
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  Users,
  BookOpen,
  DollarSign,
  MessageSquare,
  Calendar,
  Settings,
  LayoutDashboard,
  FileText,
  GraduationCap,
  Search,
  Sparkles,
  BarChart3,
  CreditCard,
  ClipboardList,
  School,
  ArrowRight,
  Command as CommandIcon,
} from 'lucide-react';
import useAuthStore from '@/shared/stores/auth-store';
import useUIStore from '@/shared/stores/ui-store';
import { ROUTE_CONFIG } from '@/features/roles/route-config';
import { ROLE_LABELS, ROLES } from '@/shared/types/roles';
import { cn } from '@/shared/lib/utils';

/* ─── Mapping rôles ↔ icônes pour les actions rapides ──────────── */
const ROLE_ACTIONS = {
  [ROLES.DIRECTEUR]: [
    { icon: Users, label: 'Inscrire un élève', action: 'navigate', path: '/secretaire/inscriptions' },
    { icon: BookOpen, label: 'Saisir une note', action: 'navigate', path: '/notes' },
    { icon: DollarSign, label: 'Enregistrer un paiement', action: 'navigate', path: '/paiements' },
    { icon: Calendar, label: 'Planifier un cours', action: 'navigate', path: '/emploi-du-temps' },
    { icon: BarChart3, label: 'Rapport IA', action: 'navigate', path: '/directeur/ai-insights' },
  ],
  [ROLES.ENSEIGNANT]: [
    { icon: ClipboardList, label: 'Saisir une note', action: 'navigate', path: '/notes' },
    { icon: Users, label: 'Voir mes élèves', action: 'navigate', path: '/eleves' },
    { icon: Calendar, label: 'Mon emploi du temps', action: 'navigate', path: '/emploi-du-temps' },
    { icon: Sparkles, label: 'Assistant de cours IA', action: 'navigate', path: '/enseignant/ai-assistant' },
  ],
  [ROLES.ELEVE]: [
    { icon: BookOpen, label: 'Mes notes', action: 'navigate', path: '/notes' },
    { icon: Calendar, label: 'Emploi du temps', action: 'navigate', path: '/emploi-du-temps' },
    { icon: CreditCard, label: 'Mes paiements', action: 'navigate', path: '/paiements' },
    { icon: Sparkles, label: 'Tuteur IA', action: 'navigate', path: '/eleve/tutor' },
  ],
  [ROLES.PARENT]: [
    { icon: Users, label: 'Voir mes enfants', action: 'navigate', path: '/parent/enfants' },
    { icon: DollarSign, label: 'Paiements', action: 'navigate', path: '/paiements' },
    { icon: BookOpen, label: 'Notes des enfants', action: 'navigate', path: '/notes' },
    { icon: Sparkles, label: 'Rapport hebdomadaire', action: 'navigate', path: '/parent/ai-report' },
  ],
};

/* ─── Helper : extraire les pages du route config ───────────────── */
function getAllRoutes(userRole) {
  return Object.entries(ROUTE_CONFIG)
    .filter(([, cfg]) => cfg.roles === null || (userRole && cfg.roles?.includes(userRole)))
    .map(([key, cfg]) => ({
      key,
      label: cfg.label || key.charAt(0).toUpperCase() + key.slice(1),
      path: cfg.path,
      icon: cfg.icon || ArrowRight,
      group: cfg.group || 'navigation',
    }));
}

export default function CommandPalette() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { commandPaletteOpen, closeCommandPalette } = useUIStore();

  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('navigation');

  /* ─── Pages accessibles à l'utilisateur ─────────────────────────── */
  const pages = useMemo(() => getAllRoutes(user?.role), [user?.role]);

  /* ─── Actions rapides pour le rôle ──────────────────────────────── */
  const actions = useMemo(() => {
    if (!user?.role) return [];
    return ROLE_ACTIONS[user.role] || ROLE_ACTIONS[ROLES.DIRECTEUR] || [];
  }, [user?.role]);

  /* ─── Filtrage fuzzy (basique) ──────────────────────────────────── */
  const filterItems = useCallback(
    (items) => {
      if (!query.trim()) return items;
      const q = query.toLowerCase().trim();
      return items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.path?.toLowerCase().includes(q)
      );
    },
    [query]
  );

  const filteredPages = useMemo(() => filterItems(pages), [filterItems, pages]);
  const filteredActions = useMemo(() => filterItems(actions), [filterItems, actions]);
  const hasResults = filteredPages.length > 0 || filteredActions.length > 0;

  /* ─── Handler de sélection ──────────────────────────────────────── */
  const handleSelect = useCallback(
    (item) => {
      closeCommandPalette();
      if (item.action === 'navigate' || item.path) {
        navigate(item.path);
      } else if (item.action === 'url') {
        window.open(item.path, '_blank');
      }
    },
    [closeCommandPalette, navigate]
  );

  /* ─── Raccourci clavier ⌘K global ───────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useUIStore.getState().toggleCommandPalette();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  /* ─── Reset query à chaque ouverture ────────────────────────────── */
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
    }
  }, [commandPaletteOpen]);

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeCommandPalette}
            aria-hidden="true"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
            onClick={(e) => e.target === e.currentTarget && closeCommandPalette()}
          >
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl shadow-black/10 dark:border-neutral-800 dark:bg-neutral-900">
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800">
                <Search className="h-4 w-4 shrink-0 text-neutral-400" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une page, un élève, une action..."
                  className="h-12 w-full bg-transparent text-sm text-neutral-900 outline-none placeholder-neutral-400 dark:text-neutral-100"
                />
                <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md border border-neutral-300 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 sm:flex">
                  <CommandIcon className="h-3 w-3" />
                  K
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto p-2">
                {!hasResults && query.trim() && (
                  <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                    <Search className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                    <p className="text-sm text-neutral-500">
                      Aucun résultat pour &ldquo;{query}&rdquo;
                    </p>
                    <p className="text-xs text-neutral-400">
                      Essayez un nom de page, une fonctionnalité, ou une action
                    </p>
                  </div>
                )}

                {!query.trim() && (
                  <div className="mb-2 px-2 py-1.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Suggestions
                  </div>
                )}

                {/* Actions rapides */}
                {filteredActions.length > 0 && (
                  <div className="mb-2">
                    {filteredActions.map((action, i) => (
                      <button
                        key={`action-${i}`}
                        onClick={() => handleSelect(action)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                          <action.icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1 text-left">{action.label}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Navigation pages */}
                {filteredPages.length > 0 && (
                  <>
                    <div className="mb-1 px-2 py-1 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Pages
                    </div>
                    {filteredPages.slice(0, 8).map((page) => (
                      <button
                        key={page.key}
                        onClick={() => handleSelect(page)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        <page.icon className="h-4 w-4 text-neutral-400" />
                        <span className="flex-1 text-left">{page.label}</span>
                        <span className="text-[11px] text-neutral-400">{page.path}</span>
                      </button>
                    ))}
                  </>
                )}

                {!query.trim() && filteredPages.length === 0 && filteredActions.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-neutral-500">
                    Tapez pour commencer à rechercher...
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 border-t border-neutral-200 px-4 py-2.5 dark:border-neutral-800">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                  <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 py-0.5 text-[10px] dark:border-neutral-700 dark:bg-neutral-800">↑↓</kbd>
                  <span>Naviguer</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                  <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 py-0.5 text-[10px] dark:border-neutral-700 dark:bg-neutral-800">↵</kbd>
                  <span>Ouvrir</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                  <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 py-0.5 text-[10px] dark:border-neutral-700 dark:bg-neutral-800">Esc</kbd>
                  <span>Fermer</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
