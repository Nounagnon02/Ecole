/**
 * Header — Barre supérieure Érudit
 *
 * Navigation, recherche ⌘K, notifications, thème, menu utilisateur.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Moon,
  Sun,
} from 'lucide-react';
import useAuthStore from '@/shared/stores/auth-store';
import useUIStore from '@/shared/stores/ui-store';
import { ROLE_LABELS } from '@/shared/types/roles';
import { cn } from '@/shared/lib/utils';

/* ─── Animation variants ────────────────────────────────────────────────── */
const dropdownVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.1 } },
};

export default function Header() {
  const { user, logout } = useAuthStore();
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    toggleCommandPalette,
    theme,
    setTheme,
  } = useUIStore();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  // Fermer les menus au clic extérieur
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    function handleKeyDown(e) {
      // Escape → fermer les menus
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/connexion');
  }, [logout, navigate]);

  const notifications = [
    { id: '1', text: 'Nouvel élève inscrit en 6ème A', time: 'Il y a 5 min', unread: true },
    { id: '2', text: 'Paiement de 50 000 FCFA reçu', time: 'Il y a 1h', unread: true },
    { id: '3', text: 'Réunion parents-professeurs demain', time: 'Il y a 3h', unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)]/80 px-4 backdrop-blur-lg transition-all duration-300',
        'lg:px-6'
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={toggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] md:hidden"
          aria-label="Rechercher"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            'hidden h-9 w-9 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] lg:flex'
          )}
          aria-label={sidebarCollapsed ? 'Étendre' : 'Réduire'}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page title placeholder */}
        <h1 className="hidden text-sm font-medium text-[var(--text-secondary)] sm:block" />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-1.5">
        {/* Command Palette trigger (⌘K) */}
        <button
          onClick={toggleCommandPalette}
          className="relative hidden h-8 w-56 items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-tertiary)] transition-all duration-200 hover:border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)] lg:flex lg:w-56"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Rechercher...</span>
          <kbd className="flex items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--surface-subtle)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">⌘K
          </kbd>
        </button>

{/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-all hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          aria-label="Changer le thème"
        >
          <AnimatePresence mode="wait">
            {theme === 'dark' ? (
              <motion.span
                key="sun"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="h-4 w-4" />
              </motion.span>
            ) : (
              <motion.span
                key="moon"
                initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

{/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--red)] px-1 text-[10px] font-bold text-white"
              >
                {unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-4)]"
              >
                <div className="flex items-center justify-between border-b border-[var(--border-light)] px-4 py-3">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Notifications</span>
                  <span className="text-xs text-[var(--accent)]">{unreadCount} non lue(s)</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((notif, i) => (
                    <motion.button
                      key={notif.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      <div
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          notif.unread ? 'bg-[var(--accent)]' : 'bg-[var(--text-tertiary)]'
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'text-sm',
                            notif.unread ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                          )}
                        >
                          {notif.text}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{notif.time}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <div className="border-t border-[var(--border-light)] p-2">
                  <button className="flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent-subtle)]">
                    Voir toutes les notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--surface-hover)]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-xs font-medium text-[var(--accent)]">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden text-left lg:block">
              <p className="text-sm font-medium leading-tight text-[var(--text-primary)]">
                {user?.name || 'Utilisateur'}
              </p>
              <p className="text-xs leading-tight text-[var(--text-tertiary)]">
                {ROLE_LABELS[user?.role] || user?.role || '—'}
              </p>
            </div>
            <ChevronDown
              className={cn(
                'hidden h-3 w-3 text-[var(--text-tertiary)] transition-transform duration-200 lg:block',
                userMenuOpen && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-4)]"
              >
                <div className="border-b border-[var(--border-light)] px-4 py-3">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{user?.nom || 'Utilisateur'}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{user?.email || ''}</p>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/profil'); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  >
                    <User className="h-4 w-4" />
                    Mon profil
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/parametres'); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  >
                    <Settings className="h-4 w-4" />
                    Paramètres
                  </button>

                  <div className="my-1 border-t border-[var(--border-light)]" />

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--red)] transition-colors hover:bg-[var(--red-subtle)]"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile search — visible uniquement < lg */}
      <button
        onClick={toggleCommandPalette}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] lg:hidden"
        aria-label="Rechercher"
      >
        <Search className="h-4 w-4" />
      </button>
    </header>
  );
}
