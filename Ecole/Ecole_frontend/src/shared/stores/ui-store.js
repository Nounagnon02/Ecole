/**
 * UI store — Zustand
 *
 * Manages global UI state: sidebar, theme, AI assistant, modals etc.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useUIStore = create(
  devtools(
    persist(
      (set, get) => ({
        /* ─── Sidebar ──────────────────────────────────────────────────── */
        sidebarOpen: true,
        sidebarCollapsed: false,

        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        setSidebarCollapsed: (collapsed) =>
          set({ sidebarCollapsed: collapsed }),

        /* ─── AI Assistant ─────────────────────────────────────────────── */
        aiAssistantOpen: false,
        aiAssistantMinimized: false,

        openAIAssistant: () =>
          set({ aiAssistantOpen: true, aiAssistantMinimized: false }),

        closeAIAssistant: () =>
          set({ aiAssistantOpen: false, aiAssistantMinimized: false }),

        toggleAIAssistant: () =>
          set((state) => ({ aiAssistantOpen: !state.aiAssistantOpen })),

        minimizeAIAssistant: () =>
          set({ aiAssistantMinimized: true }),

        /* ─── Theme ────────────────────────────────────────────────────── */
        theme: 'light', // 'light' | 'dark' | 'system'

        setTheme: (theme) => {
          set({ theme });
          applyTheme(theme);
        },

        /* ─── Command Palette ──────────────────────────────────────────── */
        commandPaletteOpen: false,

        toggleCommandPalette: () =>
          set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

        closeCommandPalette: () =>
          set({ commandPaletteOpen: false }),

        /* ─── Notifications / Toasts ───────────────────────────────────── */
        toasts: [],

        addToast: (toast) =>
          set((state) => ({
            toasts: [...state.toasts, { id: crypto.randomUUID(), ...toast }],
          })),

        removeToast: (id) =>
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          })),

        clearToasts: () => set({ toasts: [] }),

        /* ─── Page title ────────────────────────────────────────────────── */
        pageTitle: '',
        setPageTitle: (title) => set({ pageTitle: title }),

        /* ─── Loading overlay ──────────────────────────────────────────── */
        globalLoading: false,
        setGlobalLoading: (loading) => set({ globalLoading: loading }),
      }),
      {
        name: 'ecole-ui-storage',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
        }),
      }
    ),
    { name: 'ui-store' }
  )
);

/* ─── Helper : applique le thème au <html> ──────────────────────────────── */
function applyTheme(theme) {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

/* ─── Initialisation au chargement du module ───────────────────────────── */
if (typeof window !== 'undefined') {
  const stored = useUIStore.getState().theme;
  applyTheme(stored);
}

export default useUIStore;
