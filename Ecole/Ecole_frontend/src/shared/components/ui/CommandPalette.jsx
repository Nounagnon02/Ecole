/**
 * CommandPalette — ⌘K Universal Command Palette
 *
 * Signature feature : navigation, recherche et actions rapides
 * depuis un seul point d'entrée. Inspirée de Linear, Vercel, Raycast.
 *
 * Features :
 * - Navigation vers n'importe quelle page
 * - Recherche API : élèves (/eleves?q=), classes (/classes), paiements (/payments/history?q=)
 * - Actions rapides contextuelles (selon rôle)
 * - Raccourcis clavier : ⌘K / Ctrl+K
 * - Filtrage intelligent avec debounce
 * - Groupes d'actions par catégorie
 * - Navigation clavier (↑↓ Enter Esc)
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  Search,
  Sparkles,
  BarChart3,
  CreditCard,
  ClipboardList,
  ArrowRight,
  Command as CommandIcon,
  Loader2,
} from 'lucide-react';
import useAuthStore from '@/shared/stores/auth-store';
import useUIStore from '@/shared/stores/ui-store';
import apiClient from '@/shared/lib/api-client';
import { ROUTE_CONFIG } from '@/features/roles/route-config';
import { ROLES, normalizeRole } from '@/shared/types/roles';

/* ─── Debounce helper ────────────────────────────────────────────────── */
function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/* ─── Actions génériques proposées quand le rôle n'a aucune action ── */
const DEFAULT_ACTIONS = [
  { icon: Search, label: "Rechercher dans l\u2019application", action: 'none' },
];

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
  [ROLES.COMPTABLE]: [
    { icon: DollarSign, label: 'Enregistrer un paiement', action: 'navigate', path: '/paiements' },
    { icon: BarChart3, label: 'Transactions', action: 'navigate', path: '/comptable/transactions' },
  ],
  [ROLES.CENSEUR]: [
    { icon: Users, label: 'Discipline', action: 'navigate', path: '/censeur/discipline' },
    { icon: ClipboardList, label: 'Absences', action: 'navigate', path: '/censeur/absences' },
  ],
  [ROLES.SURVEILLANT]: [
    { icon: ClipboardList, label: 'Présences', action: 'navigate', path: '/surveillant/presences' },
    { icon: Users, label: 'Surveillance', action: 'navigate', path: '/surveillant/surveillance' },
  ],
  [ROLES.SECRETAIRE]: [
    { icon: Users, label: 'Inscriptions', action: 'navigate', path: '/secretaire/inscriptions' },
    { icon: Calendar, label: 'Planning', action: 'navigate', path: '/secretaire/planning' },
  ],
  [ROLES.INFIRMIER]: [
    { icon: ClipboardList, label: 'Soins', action: 'navigate', path: '/infirmier/soins' },
  ],
  [ROLES.BIBLIOTHECAIRE]: [
    { icon: BookOpen, label: 'Catalogue', action: 'navigate', path: '/bibliothecaire/catalogue' },
  ],
};

/* ─── Helper : extraire les pages du route config ───────────────── */
function getAllRoutes(userRole) {
  const effective = normalizeRole(userRole);
  return Object.entries(ROUTE_CONFIG)
    .filter(([, cfg]) => cfg.roles === null || (effective && cfg.roles.includes(effective)))
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
  const debouncedQuery = useDebouncedValue(query, 300);

  /* ─── API search results ─────────────────────────────────────── */
  const [apiResults, setApiResults] = useState({ eleves: [], classes: [], paiements: [] });
  const [apiLoading, setApiLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef(null);
  const listRef = useRef(null);

  /* ─── Pages accessibles à l'utilisateur ─────────────────────────── */
  const pages = useMemo(() => getAllRoutes(user?.role), [user?.role]);

  /* ─── Actions rapides pour le rôle ──────────────────────────────── */
  const actions = useMemo(() => {
    if (!user?.role) return [];
    const effective = normalizeRole(user.role);
    return ROLE_ACTIONS[user.role] || ROLE_ACTIONS[effective] || DEFAULT_ACTIONS;
  }, [user?.role]);

  /* ─── Filtrage local (pages + actions) ──────────────────────────── */
  const filterItems = useCallback(
    (items) => {
      if (!debouncedQuery.trim()) return items;
      const q = debouncedQuery.toLowerCase().trim();
      return items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.path?.toLowerCase().includes(q)
      );
    },
    [debouncedQuery]
  );

  const filteredPages = useMemo(() => filterItems(pages), [filterItems, pages]);
  const filteredActions = useMemo(() => filterItems(actions), [filterItems, actions]);

  /* ─── API search with debounce ──────────────────────────────────── */
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setApiResults({ eleves: [], classes: [], paiements: [] });
      return;
    }

    let cancelled = false;

    async function fetchResults() {
      setApiLoading(true);
      const q = debouncedQuery.trim();

      const [elevesRes, classesRes, paiementsRes] = await Promise.allSettled([
        apiClient.get('/eleves', { params: { q } }),
        apiClient.get('/classes', { params: { q } }),
        apiClient.get('/payments/history', { params: { q } }),
      ]);

      if (cancelled) return;

      const extract = (res) => {
        if (res.status !== 'fulfilled') return [];
        const data = res.value?.data;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data?.eleves)) return data.eleves;
        if (Array.isArray(data?.results)) return data.results;
        return [];
      };

      setApiResults({
        eleves: extract(elevesRes),
        classes: extract(classesRes),
        paiements: extract(paiementsRes),
      });
      setApiLoading(false);
    }

    fetchResults();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  /* ─── Flatten all results for keyboard navigation ──────────────── */
  const allResultItems = useMemo(() => {
    const items = [];

    filteredActions.forEach((action) => items.push({ ...action, _type: 'action' }));
    apiResults.eleves.forEach((el) =>
      items.push({
        label: el.nom_complet || el.nom || `${el.prenom || ''} ${el.nom || ''}`.trim(),
        sublabel: el.classe || el.classe_nom || '',
        path: `/eleves/${el.id}`,
        icon: Users,
        _type: 'eleve',
      })
    );
    apiResults.classes.forEach((cl) =>
      items.push({
        label: cl.nom || cl.nom_classe || `Classe ${cl.id}`,
        sublabel: cl.niveau || cl.section || '',
        path: `/classes/${cl.id}`,
        icon: BookOpen,
        _type: 'classe',
      })
    );
    apiResults.paiements.forEach((p) =>
      items.push({
        label: p.eleve || p.eleve_nom || `Paiement #${p.id}`,
        sublabel: p.montant ? `${p.montant} FCFA` : p.date || '',
        path: `/paiements`,
        icon: CreditCard,
        _type: 'paiement',
      })
    );
    filteredPages.forEach((page) => items.push({ ...page, _type: 'page' }));

    return items;
  }, [filteredActions, apiResults, filteredPages]);

  const hasResults =
    filteredActions.length > 0 ||
    apiResults.eleves.length > 0 ||
    apiResults.classes.length > 0 ||
    apiResults.paiements.length > 0 ||
    filteredPages.length > 0;

  /* ─── Reset query + active index on open/close ──────────────────── */
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setActiveIndex(0);
      setApiResults({ eleves: [], classes: [], paiements: [] });
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery]);

  /* ─── Keyboard navigation ───────────────────────────────────────── */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeCommandPalette();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % Math.max(allResultItems.length, 1));
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + allResultItems.length) % Math.max(allResultItems.length, 1));
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const item = allResultItems[activeIndex];
        if (item) handleSelect(item);
      }
    },
    [allResultItems, activeIndex, closeCommandPalette]
  );

  /* ─── Scroll active item into view ──────────────────────────────── */
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  /* ─── Handler de sélection ──────────────────────────────────────── */
  const handleSelect = useCallback(
    (item) => {
      closeCommandPalette();
      if (item.action === 'navigate' || item.path) {
        navigate(item.path);
      }
    },
    [closeCommandPalette, navigate]
  );

  /* ─── Focus input on open ──────────────────────────────────────── */
  useEffect(() => {
    if (commandPaletteOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [commandPaletteOpen]);

  /* ─── Render helpers ────────────────────────────────────────────── */
  let globalIndex = -1;

  function renderItem(item, idx) {
    globalIndex++;
    const currentIndex = globalIndex;
    const isActive = currentIndex === activeIndex;

    return (
      <button
        key={`${item._type}-${item.key || item.label || idx}`}
        data-active={isActive}
        onClick={() => handleSelect(item)}
        onMouseEnter={() => setActiveIndex(currentIndex)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
          isActive
            ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
        }`}
      >
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
          isActive ? 'bg-[var(--accent)] text-white' : 'bg-[var(--border-light)] text-[var(--text-tertiary)]'
        }`}>
          <item.icon className="h-3.5 w-3.5" />
        </span>
        <span className="flex-1 text-left truncate">{item.label}</span>
        {item.sublabel && (
          <span className="text-[11px] text-[var(--text-tertiary)] truncate max-w-[120px]">{item.sublabel}</span>
        )}
        {item.path && !item.sublabel && (
          <span className="text-[11px] text-[var(--text-tertiary)]">{item.path}</span>
        )}
      </button>
    );
  }

  function renderGroup(label, items) {
    if (items.length === 0) return null;
    return (
      <div className="mb-2">
        <div className="mb-1 px-2 py-1 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
          {label}
        </div>
        {items.map((item, i) => renderItem(item, i))}
      </div>
    );
  }

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
            role="dialog"
            aria-label="Palette de commandes"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
            onClick={(e) => e.target === e.currentTarget && closeCommandPalette()}
          >
            <div
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-2xl shadow-black/10"
              onKeyDown={handleKeyDown}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-[var(--border-light)] px-4">
                <Search className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
                <input
                  ref={inputRef}
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher élèves, classes, paiements..."
                  role="combobox"
                  aria-expanded={hasResults}
                  aria-autocomplete="list"
                  aria-controls="command-palette-list"
                  aria-activedescendant={allResultItems[activeIndex] ? `result-${activeIndex}` : undefined}
                  className="h-12 w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder-[var(--text-tertiary)]"
                />
                {apiLoading && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--accent)]" />
                )}
                <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)] sm:flex">
                  <CommandIcon className="h-3 w-3" />
                  K
                </kbd>
              </div>

              {/* Results */}
              <div
                ref={listRef}
                id="command-palette-list"
                role="listbox"
                aria-label="Résultats de recherche"
                className="max-h-80 overflow-y-auto p-2"
              >
                {!hasResults && debouncedQuery.trim() && !apiLoading && (
                  <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                    <Search className="h-8 w-8 text-[var(--text-tertiary)]" />
                    <p className="text-sm text-[var(--text-secondary)]">
                      Aucun résultat pour &ldquo;{debouncedQuery}&rdquo;
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Essayez un nom d&apos;élève, de classe ou une action
                    </p>
                  </div>
                )}

                {!debouncedQuery.trim() && (
                  <div className="mb-2 px-2 py-1.5 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Suggestions
                  </div>
                )}

                {/* Actions rapides */}
                {renderGroup('Actions', filteredActions)}

                {/* API Results: Élèves */}
                {renderGroup('Élèves', apiResults.eleves.map((el) => ({
                  label: el.nom_complet || el.nom || `${el.prenom || ''} ${el.nom || ''}`.trim(),
                  sublabel: el.classe || el.classe_nom || '',
                  path: `/eleves/${el.id}`,
                  icon: Users,
                  _type: 'eleve',
                })))}

                {/* API Results: Classes */}
                {renderGroup('Classes', apiResults.classes.map((cl) => ({
                  label: cl.nom || cl.nom_classe || `Classe ${cl.id}`,
                  sublabel: cl.niveau || cl.section || '',
                  path: `/classes/${cl.id}`,
                  icon: BookOpen,
                  _type: 'classe',
                })))}

                {/* API Results: Paiements */}
                {renderGroup('Paiements', apiResults.paiements.map((p) => ({
                  label: p.eleve || p.eleve_nom || `Paiement #${p.id}`,
                  sublabel: p.montant ? `${p.montant} FCFA` : p.date || '',
                  path: '/paiements',
                  icon: CreditCard,
                  _type: 'paiement',
                })))}

                {/* Navigation pages */}
                {renderGroup('Pages', filteredPages)}

                {!debouncedQuery.trim() && !hasResults && (
                  <div className="px-4 py-8 text-center text-sm text-[var(--text-tertiary)]">
                    Tapez pour commencer à rechercher...
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 border-t border-[var(--border-light)] px-4 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
                  <kbd className="rounded border border-[var(--border)] bg-[var(--surface-subtle)] px-1 py-0.5 text-[10px]">↑↓</kbd>
                  <span>Naviguer</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
                  <kbd className="rounded border border-[var(--border)] bg-[var(--surface-subtle)] px-1 py-0.5 text-[10px]">↵</kbd>
                  <span>Ouvrir</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
                  <kbd className="rounded border border-[var(--border)] bg-[var(--surface-subtle)] px-1 py-0.5 text-[10px]">Esc</kbd>
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
