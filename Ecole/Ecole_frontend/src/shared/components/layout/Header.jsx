/**
 * Header — Barre supérieure premium v3
 *
 * Contient : bouton menu mobile/collapse, barre de recherche avec ⌘K,
 * notifications avec dot indicator, menu utilisateur déroulant,
 * thème toggle, AI Assistant trigger, micro-interactions.
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
  Sparkles,
  Command,
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
    toggleAIAssistant,
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
        'sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-neutral-800 bg-neutral-950/80 px-4 backdrop-blur-xl transition-all duration-300',
        'lg:px-6'
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={toggleSidebar}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white lg:hidden"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            'hidden h-11 w-11 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white lg:flex',
            'motion-safe:active:scale-95'
          )}
          aria-label={sidebarCollapsed ? 'Étendre' : 'Réduire'}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page title placeholder */}
        <h1 className="hidden text-sm font-semibold text-white sm:block" />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-1.5">
        {/* Command Palette trigger (⌘K) */}
        <button
          onClick={toggleCommandPalette}
          className="relative hidden h-9 w-56 items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 text-sm text-neutral-500 transition-all duration-200 hover:border-indigo-500/50 hover:bg-neutral-900 hover:text-neutral-300 lg:flex lg:w-64"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Rechercher...</span>
          <kbd className="flex items-center gap-0.5 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        {/* Separator */}
        <div className="mx-1 hidden h-5 w-px bg-neutral-800 md:block" />

        {/* Theme toggle with rotation animation */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-400 transition-all hover:bg-neutral-800 hover:text-white motion-safe:active:scale-95"
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

        {/* Separator */}
        <div className="mx-1 hidden h-5 w-px bg-neutral-800 md:block" />

        {/* AI Assistant trigger */}
        <button
          onClick={toggleAIAssistant}
          className="group relative flex h-11 w-11 items-center justify-center rounded-lg text-indigo-400/80 transition-all hover:bg-indigo-500/10 hover:text-indigo-300 motion-safe:active:scale-95"
          aria-label="Assistant IA"
        >
          <Sparkles className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
          {/* Glow ring au hover */}
          <span className="absolute inset-0 rounded-lg opacity-0 ring-1 ring-indigo-500/20 transition-opacity duration-200 group-hover:opacity-100" />
        </button>

        {/* Separator */}
        <div className="mx-1 hidden h-5 w-px bg-neutral-800 md:block" />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex h-11 w-11 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white motion-safe:active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
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
                className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/20"
              >
                <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  <span className="text-xs text-indigo-400">{unreadCount} non lue(s)</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((notif, i) => (
                    <motion.button
                      key={notif.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-800/50"
                    >
                      <div
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          notif.unread ? 'bg-indigo-500' : 'bg-neutral-600'
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'text-sm',
                            notif.unread ? 'font-medium text-white' : 'text-neutral-400'
                          )}
                        >
                          {notif.text}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">{notif.time}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
                {/* Voir toutes */}
                <div className="border-t border-neutral-800 p-2">
                  <button className="flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/10 min-h-11">
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
            className="group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-neutral-800/50 min-h-11"
          >
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 text-xs font-semibold text-indigo-400 transition-transform group-hover:scale-105">
              {user?.name?.[0]?.toUpperCase() || 'U'}
              {/* Status en ligne */}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-neutral-950 bg-emerald-500" />
            </div>
            <div className="hidden text-left lg:block">
              <p className="text-sm font-medium leading-tight text-white">
                {user?.name || 'Utilisateur'}
              </p>
              <p className="text-xs leading-tight text-neutral-500">
                {ROLE_LABELS[user?.role] || user?.role || '—'}
              </p>
            </div>
            <ChevronDown
              className={cn(
                'hidden h-3.5 w-3.5 text-neutral-500 transition-transform duration-200 lg:block',
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
                className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/20"
              >
                {/* En-tête utilisateur */}
                <div className="border-b border-neutral-800 px-4 py-3">
                  <p className="text-sm font-medium text-white">{user?.nom || 'Utilisateur'}</p>
                  <p className="text-xs text-neutral-500">{user?.email || ''}</p>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/profil'); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                  >
                    <User className="h-4 w-4" />
                    Mon profil
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/parametres'); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                  >
                    <Settings className="h-4 w-4" />
                    Paramètres
                  </button>

                  <div className="my-1 border-t border-neutral-800" />

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                    <span className="ml-auto text-[10px] text-neutral-600">⌘Q</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile search trigger opens command palette */}
      <button
        onClick={toggleCommandPalette}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white md:hidden"
        aria-label="Rechercher"
      >
        <Search className="h-5 w-5" />
      </button>
    </header>
  );
}
