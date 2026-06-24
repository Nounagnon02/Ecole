/**
 * Sidebar — Navigation latérale premium v3
 *
 * S'adapte au rôle de l'utilisateur connecté avec menus groupés.
 * Premium : section labels, active indicator bar, logo animé,
 *           collapse fluide, tooltips sur icônes, micro-interactions.
 */

import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Users,
  DollarSign,
  MessageSquare,
  FileText,
  Settings,
  Calendar,
  BookMarked,
  ClipboardList,
  Shield,
  ChevronLeft,
  X,
  School,
  BarChart3,
  Bell,
  UserCheck,
  CreditCard,
  Library,
  Heart,
  Stethoscope,
  Calculator,
  FileSpreadsheet,
  User,
  LogOut,
} from 'lucide-react';
import useAuthStore from '@/shared/stores/auth-store';
import useUIStore from '@/shared/stores/ui-store';
import { ROLES, ROLE_LABELS, ROLE_NORMALIZATION } from '@/shared/types/roles';
import { cn } from '@/shared/lib/utils';

/* ─── Menu items par rôle ──────────────────────────────────────────────────── */

/* Base commune aux 4 rôles ENSEIGNANT — évite la duplication pointée par B1 */
const ENSEIGNANT_COMMON = [
  { icon: Users, label: 'Élèves', path: '/eleves' },
  { icon: ClipboardList, label: 'Notes', path: '/notes' },
  { icon: Calendar, label: 'Emploi du temps', path: '/emploi-du-temps' },
  { icon: MessageSquare, label: 'Communications', path: '/communications' },
];

const ROLE_MENUS = {
  /* Direction générale */
  [ROLES.DIRECTEUR]: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/directeur/dashboard' },
    { icon: Users, label: 'Élèves', path: '/eleves' },
    { icon: BookOpen, label: 'Notes', path: '/notes' },
    { icon: Calendar, label: 'Emploi du temps', path: '/emploi-du-temps' },
    { icon: DollarSign, label: 'Paiements', path: '/paiements' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
    { icon: Settings, label: 'Paramètres', path: '/parametres' },
  ],
  /* Enseignants */
  [ROLES.ENSEIGNANT]: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/enseignant/dashboard' },
    { icon: BookOpen, label: 'Mes classes', path: '/enseignant/classes' },
    ...ENSEIGNANT_COMMON,
    { icon: Settings, label: 'Paramètres', path: '/parametres' },
  ],
  /* Élèves */
  [ROLES.ELEVE]: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/eleve/dashboard' },
    { icon: BookOpen, label: 'Mes cours', path: '/eleve/cours' },
    { icon: Calendar, label: 'Emploi du temps', path: '/emploi-du-temps' },
    { icon: BarChart3, label: 'Notes', path: '/notes' },
    { icon: CreditCard, label: 'Paiements', path: '/paiements' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
    { icon: Settings, label: 'Paramètres', path: '/parametres' },
  ],

  /* Parents */
  [ROLES.PARENT]: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/parent/dashboard' },
    { icon: UserCheck, label: 'Mes enfants', path: '/parent/enfants' },
    { icon: BookOpen, label: 'Suivi scolaire', path: '/notes' },
    { icon: CreditCard, label: 'Paiements', path: '/paiements' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
    { icon: Settings, label: 'Paramètres', path: '/parametres' },
  ],

  /* Staff */
  [ROLES.COMPTABLE]: [
    { icon: Calculator, label: 'Tableau de bord', path: '/comptable/dashboard' },
    { icon: DollarSign, label: 'Transactions', path: '/comptable/transactions' },
    { icon: FileSpreadsheet, label: 'Factures', path: '/comptable/factures' },
    { icon: CreditCard, label: 'Paiements', path: '/paiements' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
    { icon: Settings, label: 'Paramètres', path: '/parametres' },
  ],
  [ROLES.SURVEILLANT]: [
    { icon: Shield, label: 'Tableau de bord', path: '/surveillant/dashboard' },
    { icon: Users, label: 'Surveillance', path: '/surveillant/surveillance' },
    { icon: Calendar, label: 'Présences', path: '/surveillant/presences' },
    { icon: Calendar, label: 'Emploi du temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
  ],
  [ROLES.CENSEUR]: [
    { icon: ClipboardList, label: 'Tableau de bord', path: '/censeur/dashboard' },
    { icon: Users, label: 'Discipline', path: '/censeur/discipline' },
    { icon: Calendar, label: 'Absences', path: '/censeur/absences' },
    { icon: Calendar, label: 'Emploi du temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
  ],
  [ROLES.INFIRMIER]: [
    { icon: Stethoscope, label: 'Tableau de bord', path: '/infirmier/dashboard' },
    { icon: Heart, label: 'Soins', path: '/infirmier/soins' },
    { icon: FileText, label: 'Dossiers', path: '/infirmier/dossiers' },
    { icon: Calendar, label: 'Emploi du temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
  ],
  [ROLES.BIBLIOTHECAIRE]: [
    { icon: Library, label: 'Tableau de bord', path: '/bibliothecaire/dashboard' },
    { icon: BookOpen, label: 'Catalogue', path: '/bibliothecaire/catalogue' },
    { icon: UserCheck, label: 'Emprunts', path: '/bibliothecaire/emprunts' },
    { icon: Calendar, label: 'Emploi du temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
  ],
  [ROLES.SECRETAIRE]: [
    { icon: FileText, label: 'Tableau de bord', path: '/secretaire/dashboard' },
    { icon: Users, label: 'Inscriptions', path: '/secretaire/inscriptions' },
    { icon: Users, label: 'Élèves', path: '/eleves' },
    { icon: Calendar, label: 'Planning', path: '/secretaire/planning' },
    { icon: FileSpreadsheet, label: 'Documents', path: '/secretaire/documents' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
    { icon: Settings, label: 'Paramètres', path: '/parametres' },
  ],

  /* Université */
  [ROLES.RECTEUR]: [
    { icon: School, label: 'Tableau de bord', path: '/universite/dashboard' },
    { icon: GraduationCap, label: 'Facultés', path: '/universite/facultes' },
    { icon: Users, label: 'Étudiants', path: '/universite/etudiants' },
    { icon: BookOpen, label: 'Cours', path: '/universite/cours' },
    { icon: Calendar, label: 'Emploi du temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
    { icon: Settings, label: 'Paramètres', path: '/parametres' },
  ],
  [ROLES.DOYEN]: [
    { icon: School, label: 'Tableau de bord', path: '/universite/dashboard' },
    { icon: GraduationCap, label: 'Départements', path: '/universite/departements' },
    { icon: Users, label: 'Étudiants', path: '/universite/etudiants' },
    { icon: BookOpen, label: 'Cours', path: '/universite/cours' },
    { icon: Calendar, label: 'Emploi du temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
  ],
  [ROLES.PROFESSEUR]: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/universite/dashboard' },
    { icon: BookOpen, label: 'Mes cours', path: '/universite/mes-cours' },
    { icon: Users, label: 'Étudiants', path: '/universite/etudiants' },
    { icon: ClipboardList, label: 'Notes', path: '/universite/notes' },
    { icon: Calendar, label: 'Emploi du temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
  ],
  [ROLES.ETUDIANT]: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/universite/dashboard' },
    { icon: BookOpen, label: 'Mes cours', path: '/universite/mes-cours' },
    { icon: BarChart3, label: 'Notes', path: '/universite/notes' },
    { icon: Calendar, label: 'Emploi du temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
  ],
  [ROLES.PERSONNEL]: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/universite/dashboard' },
    { icon: FileText, label: 'Tâches', path: '/universite/taches' },
    { icon: Calendar, label: 'Planning', path: '/universite/planning' },
    { icon: Calendar, label: 'Emploi du temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
  ],

  /* Admin */
  [ROLES.SUPER_ADMIN]: [
    { icon: Shield, label: 'Écoles', path: '/admin/ecoles' },
    { icon: School, label: 'Tableau de bord', path: '/admin/dashboard' },
    { icon: Users, label: 'Utilisateurs', path: '/admin/utilisateurs' },
    { icon: BarChart3, label: 'Statistiques', path: '/admin/statistiques' },
    { icon: Settings, label: 'Configuration', path: '/admin/configuration' },
  ],
  [ROLES.ADMIN]: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/admin/dashboard' },
    { icon: Users, label: 'Utilisateurs', path: '/admin/utilisateurs' },
    { icon: Settings, label: 'Configuration', path: '/admin/configuration' },
  ],
};

/* ─── Sidebar items communs ─────────────────────────────────────────────── */
const COMMON_ITEMS = [
  { icon: MessageSquare, label: 'Messagerie', path: '/messagerie' },
  { icon: Settings, label: 'Paramètres', path: '/parametres' },
];

/* ─── Animation variants ────────────────────────────────────────────────── */
const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03, duration: 0.2 },
  }),
};

export default function Sidebar() {
  const { user } = useAuthStore();
  const { sidebarCollapsed, setSidebarCollapsed, sidebarOpen, toggleSidebar } = useUIStore();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = useMemo(() => {
    if (!user?.role) return COMMON_ITEMS;
    const effectiveRole = ROLE_NORMALIZATION[user.role] || user.role;
    const roleItems = ROLE_MENUS[effectiveRole];
    if (!roleItems) return COMMON_ITEMS;

    const allPaths = new Set(roleItems.map((i) => i.path));
    return [
      ...roleItems,
      ...COMMON_ITEMS.filter((i) => !allPaths.has(i.path)),
    ];
  }, [user?.role]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-neutral-950/50 backdrop-blur-sm lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-neutral-800 bg-neutral-950 transition-all duration-300 ease-out-expo',
          sidebarCollapsed ? 'w-[var(--sidebar-collapsed)]' : 'w-[var(--sidebar-width)]',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b border-neutral-800 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Logo badge — animated gradient */}
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:200%_100%] motion-safe:animate-[shimmer_3s_ease-in-out_infinite]" />
              <GraduationCap className="relative h-5 w-5 text-white" />
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap text-sm font-semibold text-white"
                >
                  École
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Collapse button (desktop) */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white lg:flex"
            aria-label={sidebarCollapsed ? 'Étendre le menu' : 'Réduire le menu'}
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform duration-300',
                sidebarCollapsed && 'rotate-180'
              )}
            />
          </button>

          {/* Close button (mobile) */}
          <button
            onClick={toggleSidebar}
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 scrollbar-hide" aria-label="Navigation principale">
          <ul className="space-y-0.5">
            {menuItems.map((item, index) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              const isHovered = hoveredItem === item.path;

              return (
                <motion.li
                  key={item.path}
                  custom={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <NavLink
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) toggleSidebar();
                    }}
                    onMouseEnter={() => setHoveredItem(item.path)}
                    onMouseLeave={() => setHoveredItem(null)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      active
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    {/* Active indicator bar */}
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-indigo-500"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}

                    {/* Icon with active glow */}
                    <span
                      className={cn(
                        'relative flex h-5 w-5 shrink-0 items-center justify-center transition-transform duration-150',
                        isHovered && !sidebarCollapsed && 'scale-110'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {active && (
                        <span className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20" style={{ animationDuration: '3s' }} />
                      )}
                    </span>

                    {/* Label */}
                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15 }}
                          className="truncate"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </NavLink>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        {/* User info footer */}
        <div className="border-t border-neutral-800/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 text-xs font-semibold text-indigo-400">
              {user?.nom?.[0]?.toUpperCase() || 'U'}
              {/* Online status dot */}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-neutral-950 bg-emerald-500" />
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-medium text-white">
                    {user?.nom || 'Utilisateur'}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {ROLE_LABELS[user?.role] || user?.role || '—'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>
    </>
  );
}
