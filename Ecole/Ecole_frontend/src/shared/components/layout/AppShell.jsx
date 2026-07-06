/**
 * AppShell — Layout applicatif premium v3
 *
 * Structure : Sidebar + Header + Contenu principal (+ AI Assistant flottant)
 * Premium : glassmorphism footer, micro-animations, background noise texture,
 *           loading skeleton avec shimmer, transitions fluides
 */

import { useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import AIAssistant from './AIAssistant';
import Breadcrumb from '@/shared/components/ui/Breadcrumb';
import CommandPalette from '@/shared/components/ui/CommandPalette';
import useUIStore from '@/shared/stores/ui-store';
import useAuthStore from '@/shared/stores/auth-store';
import useRealtimeStore from '@/shared/stores/realtime-store';
import { startOfflineSync } from '@/shared/lib/offline-queue';
import { cn } from '@/shared/lib/utils';

/**
 * LoadingSkeleton — Shimmer loading placeholder premium
 */
function LoadingSkeleton() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo */}
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-2xl border-2 border-neutral-200 border-t-indigo-500 dark:border-neutral-800 dark:border-t-indigo-400" />
          <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-2xl bg-indigo-500/5" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-3 w-32 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-2 w-24 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800/50" />
        </div>
      </div>
    </div>
  );
}

/* ─── Animation variants ───────────────────────────────────────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const pageTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export default function AppShell({ children }) {
  const { sidebarCollapsed, globalLoading } = useUIStore();
  const { user } = useAuthStore();
  const { connect, listenForNotifications, listenForMessages } = useRealtimeStore();

  const marginLeft = useMemo(
    () => (sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)'),
    [sidebarCollapsed]
  );

  /* ─── Initialisation temps réel ──────────────────────────────────────── */
  useEffect(() => {
    if (!user?.id) return;
    connect();
    listenForNotifications(user.id);
    listenForMessages(user.id);
  }, [user?.id, connect, listenForNotifications, listenForMessages]);

  /* ─── Offline sync ───────────────────────────────────────────────────── */
  useEffect(() => {
    const cleanup = startOfflineSync();
    return cleanup;
  }, []);

  return (
    <div className="relative min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Subtle background texture (Linear-inspired) */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.03),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.06),transparent_50%)]" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300 ease-out-expo',
          'lg:ml-[var(--sidebar-width)]',
          sidebarCollapsed && 'lg:ml-[var(--sidebar-collapsed)]'
        )}
      >
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 2xl:p-8">
          <AnimatePresence mode="wait">
            {globalLoading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <LoadingSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <Breadcrumb />
                {children || <Outlet />}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Premium Footer */}
        <footer className="relative border-t border-neutral-200/80 bg-white/50 backdrop-blur-sm dark:border-neutral-800/80 dark:bg-neutral-950/50">
          {/* Gradient accent line */}
          <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

          <div className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-500/10 text-[10px] font-bold text-indigo-500">
                É
              </span>
              <span>&copy; {new Date().getFullYear()} École — Système de Gestion Scolaire</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span className="hidden sm:inline">Version 3.0</span>
              <span className="hidden sm:block text-neutral-300 dark:text-neutral-700">·</span>
              <span className="hidden sm:inline">Propulsé par l&apos;équipe École</span>
            </div>
          </div>
        </footer>
      </div>

      {/* AI Assistant flottant */}
      <AIAssistant />

      {/* ⌘K Command Palette */}
      <CommandPalette />
    </div>
  );
}
