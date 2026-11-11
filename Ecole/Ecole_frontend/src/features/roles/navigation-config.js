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
  History,
} from 'lucide-react';
import { ROLES, ROLE_NORMALIZATION, hasRole } from '@/shared/types/roles';
import { PROTECTED_ROUTES } from './route-config';

const ENSEIGNANT_COMMON = [
  { icon: Users, label: 'nav.eleves', path: '/eleves' },
  { icon: ClipboardList, label: 'nav.notes', path: '/notes' },
  { icon: Calendar, label: 'nav.emploi_du_temps', path: '/emploi-du-temps' },
  { icon: MessageSquare, label: 'nav.annonces', path: '/communications' },
];

const ROLE_MENUS = {
  [ROLES.DIRECTEUR]: [
    { icon: LayoutDashboard, label: 'nav.dashboard', path: '/directeur/dashboard' },
    { icon: Users, label: 'nav.eleves', path: '/eleves' },
    { icon: UserCheck, label: 'nav.personnel', path: '/personnel' },
    { icon: GraduationCap, label: 'nav.affectations', path: '/affectations' },
    { icon: BookOpen, label: 'nav.notes', path: '/notes' },
    { icon: Calendar, label: 'nav.emploi_du_temps', path: '/emploi-du-temps' },
    { icon: DollarSign, label: 'nav.paiements', path: '/paiements' },
    { icon: MessageSquare, label: 'nav.annonces', path: '/communications' },
    { icon: History, label: 'nav.audit_log', path: '/admin/journal-audit' },
    { icon: Settings, label: 'nav.parametres', path: '/parametres' },
  ],
  [ROLES.ENSEIGNANT]: [
    { icon: LayoutDashboard, label: 'nav.dashboard', path: '/enseignant/dashboard' },
    { icon: BookOpen, label: 'nav.classes', path: '/enseignant/classes' },
    ...ENSEIGNANT_COMMON,
    { icon: Settings, label: 'nav.parametres', path: '/parametres' },
  ],
  [ROLES.ELEVE]: [
    { icon: LayoutDashboard, label: 'nav.dashboard', path: '/eleve/dashboard' },
    { icon: BookOpen, label: 'nav.matieres', path: '/eleve/cours' },
    { icon: Calendar, label: 'nav.emploi_du_temps', path: '/emploi-du-temps' },
    { icon: BarChart3, label: 'nav.notes', path: '/notes' },
    { icon: CreditCard, label: 'nav.paiements', path: '/paiements' },
    { icon: MessageSquare, label: 'nav.annonces', path: '/communications' },
    { icon: Settings, label: 'nav.parametres', path: '/parametres' },
  ],
  [ROLES.PARENT]: [
    { icon: LayoutDashboard, label: 'nav.dashboard', path: '/parent/dashboard' },
    { icon: UserCheck, label: 'nav.enfants', path: '/parent/enfants' },
    { icon: BookOpen, label: 'nav.notes', path: '/notes' },
    { icon: CreditCard, label: 'nav.paiements', path: '/parent/paiements' },
    { icon: MessageSquare, label: 'nav.annonces', path: '/communications' },
    { icon: Settings, label: 'nav.parametres', path: '/parametres' },
  ],
  [ROLES.COMPTABLE]: [
    { icon: Calculator, label: 'nav.dashboard', path: '/comptable/dashboard' },
    { icon: DollarSign, label: 'nav.transactions', path: '/comptable/transactions' },
    { icon: FileSpreadsheet, label: 'nav.factures', path: '/comptable/factures' },
    { icon: CreditCard, label: 'nav.paiements', path: '/paiements' },
    { icon: MessageSquare, label: 'nav.annonces', path: '/communications' },
    { icon: Settings, label: 'nav.parametres', path: '/parametres' },
  ],
  [ROLES.SURVEILLANT]: [
    { icon: Shield, label: 'nav.dashboard', path: '/surveillant/dashboard' },
    { icon: Users, label: 'nav.surveillance', path: '/surveillant/surveillance' },
    { icon: Calendar, label: 'nav.presences', path: '/surveillant/presences' },
    { icon: Calendar, label: 'nav.emploi_du_temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'nav.annonces', path: '/communications' },
  ],
  [ROLES.CENSEUR]: [
    { icon: ClipboardList, label: 'nav.dashboard', path: '/censeur/dashboard' },
    { icon: Users, label: 'nav.discipline', path: '/censeur/discipline' },
    { icon: Calendar, label: 'nav.absences', path: '/censeur/absences' },
    { icon: Calendar, label: 'nav.emploi_du_temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'nav.annonces', path: '/communications' },
  ],
  [ROLES.INFIRMIER]: [
    { icon: Stethoscope, label: 'nav.dashboard', path: '/infirmier/dashboard' },
    { icon: Heart, label: 'nav.soins', path: '/infirmier/soins' },
    { icon: FileText, label: 'nav.dossiers_medicaux', path: '/infirmier/dossiers' },
    { icon: Calendar, label: 'nav.emploi_du_temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'nav.annonces', path: '/communications' },
  ],
  [ROLES.BIBLIOTHECAIRE]: [
    { icon: Library, label: 'nav.dashboard', path: '/bibliothecaire/dashboard' },
    { icon: BookOpen, label: 'nav.catalogue', path: '/bibliothecaire/catalogue' },
    { icon: UserCheck, label: 'nav.emprunts', path: '/bibliothecaire/emprunts' },
    { icon: Calendar, label: 'nav.emploi_du_temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'nav.annonces', path: '/communications' },
  ],
  [ROLES.SECRETAIRE]: [
    { icon: FileText, label: 'nav.dashboard', path: '/secretaire/dashboard' },
    { icon: Users, label: 'nav.inscriptions', path: '/secretaire/inscriptions' },
    { icon: Users, label: 'nav.eleves', path: '/eleves' },
    { icon: Calendar, label: 'nav.planning', path: '/secretaire/planning' },
    { icon: FileSpreadsheet, label: 'nav.documents', path: '/secretaire/documents' },
    { icon: MessageSquare, label: 'nav.annonces', path: '/communications' },
    { icon: Settings, label: 'nav.parametres', path: '/parametres' },
  ],
  [ROLES.RECTEUR]: [
    { icon: School, label: 'nav.dashboard', path: '/universite/dashboard' },
    { icon: GraduationCap, label: 'nav.facultes', path: '/universite/facultes' },
    { icon: Users, label: 'nav.etudiants', path: '/universite/etudiants' },
    { icon: BookOpen, label: 'nav.cours', path: '/universite/cours' },
    { icon: Calendar, label: 'nav.emploi_du_temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'nav.annonces', path: '/communications' },
    { icon: Settings, label: 'nav.parametres', path: '/parametres' },
  ],
  [ROLES.DOYEN]: [
    { icon: School, label: 'nav.dashboard', path: '/universite/dashboard' },
    { icon: GraduationCap, label: 'nav.departements', path: '/universite/departements' },
    { icon: Users, label: 'nav.etudiants', path: '/universite/etudiants' },
    { icon: BookOpen, label: 'nav.cours', path: '/universite/cours' },
    { icon: Calendar, label: 'nav.emploi_du_temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'nav.annonces', path: '/communications' },
  ],
  [ROLES.PROFESSEUR]: [
    { icon: LayoutDashboard, label: 'nav.dashboard', path: '/universite/dashboard' },
    { icon: BookOpen, label: 'nav.mes_cours', path: '/universite/mes-cours' },
    { icon: Users, label: 'nav.etudiants', path: '/universite/etudiants' },
    { icon: ClipboardList, label: 'nav.notes', path: '/universite/notes' },
    { icon: Calendar, label: 'nav.emploi_du_temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'nav.annonces', path: '/communications' },
  ],
  [ROLES.ETUDIANT]: [
    { icon: LayoutDashboard, label: 'nav.dashboard', path: '/universite/dashboard' },
    { icon: BookOpen, label: 'nav.mes_cours', path: '/universite/mes-cours' },
    { icon: BarChart3, label: 'nav.notes', path: '/universite/notes' },
    { icon: Calendar, label: 'nav.emploi_du_temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'nav.annonces', path: '/communications' },
  ],
  [ROLES.PERSONNEL]: [
    { icon: LayoutDashboard, label: 'nav.dashboard', path: '/universite/dashboard' },
    { icon: FileText, label: 'nav.taches', path: '/universite/taches' },
    { icon: Calendar, label: 'nav.planning', path: '/universite/planning' },
    { icon: Calendar, label: 'nav.emploi_du_temps', path: '/emploi-du-temps' },
    { icon: MessageSquare, label: 'nav.annonces', path: '/communications' },
  ],
  [ROLES.SUPER_ADMIN]: [
    { icon: Shield, label: 'nav.ecoles', path: '/admin/ecoles' },
    { icon: School, label: 'nav.dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'nav.utilisateurs', path: '/admin/utilisateurs' },
    { icon: BarChart3, label: 'nav.statistiques', path: '/admin/statistiques' },
    { icon: BookMarked, label: 'nav.plans', path: '/admin/plans' },
    { icon: DollarSign, label: 'nav.facturation', path: '/admin/billing' },
    { icon: ClipboardList, label: 'nav.modules', path: '/admin/modules' },
    { icon: Shield, label: 'nav.identite', path: '/admin/white-label' },
    { icon: Settings, label: 'nav.configuration', path: '/admin/configuration' },
  ],
  [ROLES.ADMIN]: [
    { icon: LayoutDashboard, label: 'nav.dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'nav.utilisateurs', path: '/admin/utilisateurs' },
    { icon: History, label: 'nav.audit_log', path: '/admin/journal-audit' },
    { icon: Settings, label: 'nav.configuration', path: '/admin/configuration' },
  ],
};

const COMMON_ITEMS = [
  { icon: MessageSquare, label: 'nav.messagerie', path: '/messagerie' },
  { icon: Settings, label: 'nav.parametres', path: '/parametres' },
];


const LABELS = {"/parent/enfants": "enfants", "/communications": "annonces", "/comptable/transactions": "transactions", "/comptable/factures": "factures", "/surveillant/surveillance": "surveillance", "/surveillant/presences": "presences", "/censeur/discipline": "discipline", "/censeur/absences": "absences", "/infirmier/dossiers": "dossiers_medicaux", "/infirmier/soins": "soins", "/bibliothecaire/catalogue": "catalogue", "/bibliothecaire/emprunts": "emprunts", "/secretaire/inscriptions": "inscriptions", "/secretaire/documents": "documents", "/secretaire/planning": "planning", "/universite/facultes": "facultes", "/universite/departements": "departements", "/universite/enseignants": "enseignants", "/universite/etudiants": "etudiants", "/universite/cours": "cours", "/universite/mes-cours": "mes_cours", "/universite/taches": "taches", "/universite/planning": "planning", "/admin/ecoles": "ecoles", "/admin/utilisateurs": "utilisateurs", "/admin/modules": "modules", "/admin/plans": "plans", "/admin/billing": "facturation", "/admin/statistiques": "statistiques", "/admin/configuration": "configuration", "/admin/white-label": "identite", "/affectations": "affectations", "/personnel": "personnel", "/directeur/ai-insights": "assistant", "/enseignant/ai-assistant": "assistant", "/parent/ai-report": "assistant", "/eleve/tutor": "assistant"};

/** Les liens et les accès utilisent le même registre ; aucun module autorisé n'est orphelin. */
export function getRoleNavigation(role) {
  if (!role) return [];
  const routes = Object.values(PROTECTED_ROUTES).filter(route => hasRole(role, route.roles));
  const paths = new Set(routes.map(route => route.path));
  const preferred = ROLE_MENUS[ROLE_NORMALIZATION[role] || role] || [];
  const items = [...preferred, ...COMMON_ITEMS].filter(item => paths.has(item.path));
  for (const route of routes) {
    if (route.path.endsWith('/dashboard') || route.path.startsWith('/paiement/')) continue;
    if (!items.some(item => item.path === route.path) && LABELS[route.path]) {
      items.push({ icon: FileText, label: `nav.${LABELS[route.path]}`, path: route.path });
    }
  }
  return items.filter((item, i) => items.findIndex(other => other.path === item.path) === i);
}
