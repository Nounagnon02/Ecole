/**
 * Sidebar — Navigation latérale Érudit
 *
 * S'adapte au rôle de l'utilisateur connecté.
 * Fond clair chaud, palette Érudit, animations minimales.
 */

import { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
  UserCheck,
  CreditCard,
  Library,
  Heart,
  Stethoscope,
  Calculator,
  FileSpreadsheet,
} from 'lucide-react';
import useAuthStore from '@/shared/stores/auth-store';
import useUIStore from '@/shared/stores/ui-store';
import { ROLES, ROLE_LABELS, ROLE_NORMALIZATION } from '@/shared/types/roles';
import { cn } from '@/shared/lib/utils';

/* ─── Menu items par rôle ──────────────────────────────────────────────────── */

const ENSEIGNANT_COMMON = [
  { icon: Users, label: 'Élèves', path: '/eleves' },
  { icon: ClipboardList, label: 'Notes', path: '/notes' },
  { icon: Calendar, label: 'Emploi du temps', path: '/emploi-du-temps' },
  { icon: MessageSquare, label: 'Communications', path: '/communications' },
];

const ROLE_MENUS = {
  [ROLES.DIRECTEUR]: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/directeur/dashboard' },
    { icon: Users, label: 'Élèves', path: '/eleves' },
    { icon: BookOpen, label: 'Notes', path: '/notes' },
    { icon: Calendar, label: 'Emploi du temps', path: '/emploi-du-temps' },
    { icon: DollarSign, label: 'Paiements', path: '/paiements' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
    { icon: Settings, label: 'Paramètres', path: '/parametres' },
  ],
  [ROLES.ENSEIGNANT]: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/enseignant/dashboard' },
    { icon: BookOpen, label: 'Mes classes', path: '/enseignant/classes' },
    ...ENSEIGNANT_COMMON,
    { icon: Settings, label: 'Paramètres', path: '/parametres' },
  ],
  [ROLES.ELEVE]: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/eleve/dashboard' },
    { icon: BookOpen, label: 'Mes cours', path: '/eleve/cours' },
    { icon: Calendar, label: 'Emploi du temps', path: '/emploi-du-temps' },
    { icon: BarChart3, label: 'Notes', path: '/notes' },
    { icon: CreditCard, label: 'Paiements', path: '/paiements' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
    { icon: Settings, label: 'Paramètres', path: '/parametres' },
  ],
  [ROLES.PARENT]: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/parent/dashboard' },
    { icon: UserCheck, label: 'Mes enfants', path: '/parent/enfants' },
    { icon: BookOpen, label: 'Suivi scolaire', path: '/notes' },
    { icon: CreditCard, label: 'Paiements', path: '/paiements' },
    { icon: MessageSquare, label: 'Communications', path: '/communications' },
    { icon: Settings, label: 'Paramètres', path: '/parametres' },
  ],
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
  [ROLES.SUPER_ADMIN]: [
    { icon: Shield, label: 'Écoles', path: '/admin/ecoles' },
    { icon: School, label: 'Tableau de bord', path: '/admin/dashboard' },
    { icon: Users, label: 'Utilisateurs', path: '/admin/utilisateurs' },
    { icon: BarChart3, label: 'Statistiques', path: '/admin/statistiques' },
    { icon: BookMarked, label: 'Plans', path: '/admin/plans' },
    { icon: DollarSign, label: 'Facturation', path: '/admin/billing' },
    { icon: ClipboardList, label: 'Modules', path: '/admin/modules' },
    { icon: Shield, label: 'White-Label', path: '/admin/white-label' },
    { icon: Settings, label: 'Configuration', path: '/admin/configuration' },
  ],
  [ROLES.ADMIN]: [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/admin/dashboard' },
    { icon: Users, label: 'Utilisateurs', path: '/admin/utilisateurs' },
    { icon: Settings, label: 'Configuration', path: '/admin/configuration' },
  ],
};

const COMMON_ITEMS = [
  { icon: MessageSquare, label: 'Messagerie', path: '/messagerie' },
  { icon: Settings, label: 'Paramètres', path: '/parametres' },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const { sidebarCollapsed, setSidebarCollapsed, sidebarOpen, toggleSidebar } = useUIStore();
  const location = useLocation();

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
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] transition-all duration-300 ease-out-expo',
          sidebarCollapsed ? 'w-[var(--sidebar-collapsed)]' : 'w-[var(--sidebar-width)]',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center border-b border-[var(--sidebar-border)] px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <span className="whitespace-nowrap font-fraunces text-sm font-semibold text-[var(--text-primary)]">
                  École
                </span>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] lg:flex"
            aria-label={sidebarCollapsed ? 'Étendre' : 'Réduire'}
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform duration-300',
                sidebarCollapsed && 'rotate-180'
              )}
            />
          </button>

          <button
            onClick={toggleSidebar}
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] lg:hidden"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 scrollbar-hide" aria-label="Navigation principale">
          <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) toggleSidebar();
                    }}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                      active
                        ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                        : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-bg-hover)] hover:text-[var(--text-primary)]'
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      <Icon className="h-4 w-4" />
                    </span>

                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </AnimatePresence>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User footer */}
        <div className="border-t border-[var(--sidebar-border)] px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-xs font-medium text-[var(--accent)]">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {user?.name || 'Utilisateur'}
                  </p>
                  <p className="truncate text-xs text-[var(--text-tertiary)]">
                    {ROLE_LABELS[user?.role] || user?.role || '—'}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>
    </>
  );
}
