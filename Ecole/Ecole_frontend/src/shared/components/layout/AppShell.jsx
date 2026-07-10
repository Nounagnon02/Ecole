/**
 * AppShell — Layout applicatif Érudit
 *
 * Structure : Sidebar + Header + Contenu principal
 */

import { useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumb from '@/shared/components/ui/Breadcrumb';
import CommandPalette from '@/shared/components/ui/CommandPalette';
import useUIStore from '@/shared/stores/ui-store';
import useAuthStore from '@/shared/stores/auth-store';
import useRealtimeStore from '@/shared/stores/realtime-store';
import { startOfflineSync } from '@/shared/lib/offline-queue';
import { cn } from '@/shared/lib/utils';

/**
 * LoadingSkeleton — Placeholder de chargement
 */
function LoadingSkeleton() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-[var(--border-light)]" />
        <div className="flex flex-col items-center gap-2">
          <div className="h-3 w-32 animate-pulse rounded-full bg-[var(--border-light)]" />
          <div className="h-2 w-24 animate-pulse rounded-full bg-[var(--border-light)]" />
        </div>
      </div>
    </div>
  );
}

/* ─── Animation variants ───────────────────────────────────────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1],
};

export default function AppShell({ children }) {
  const { sidebarCollapsed, globalLoading } = useUIStore();
  const { user } = useAuthStore();
  const { connect, listenForNotifications, listenForMessages } = useRealtimeStore();

  const marginLeft = useMemo(
    () => (sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)'),
    [sidebarCollapsed]
  );

  useEffect(() => {
    if (!user?.id) return;
    connect();
    listenForNotifications(user.id);
    listenForMessages(user.id);
  }, [user?.id, connect, listenForNotifications, listenForMessages]);

  useEffect(() => {
    const cleanup = startOfflineSync();
    return cleanup;
  }, []);

  return (
    <div className="relative min-h-screen bg-[var(--surface)] text-[var(--text-primary)]">
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
      </div>

      {/* ⌘K Command Palette */}
      <CommandPalette />
    </div>
  );
}
