/**
 * Breadcrumb — Fil d'Ariane premium v1
 *
 * Features:
 * - Auto-génération depuis ROUTE_CONFIG + useLocation
 * - Items customisable via props (override)
 * - HTML sémantique nav>ol pour accessibilité
 * - ChevronRight separator, aria-current="page" sur le dernier
 * - Dark mode, micro-animations framer-motion
 * - Fallback "Accueil" vers le dashboard du rôle connecté
 */

import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, LayoutDashboard } from 'lucide-react';
import useAuthStore from '@/shared/stores/auth-store';
import { ROUTE_CONFIG, ROLE_REDIRECT_MAP } from '@/features/roles/route-config';
import { cn } from '@/shared/lib/utils';

/* ─── Mapping route-key → label lisible ──────────────────────────── */
const ROUTE_KEY_LABELS = {
  home: 'Accueil',
  connexion: 'Connexion',
  directeur: 'Direction',
  enseignant: 'Enseignant',
  eleve: 'Élève',
  parent: 'Parent',
  comptable: 'Comptabilité',
  surveillant: 'Surveillance',
  censeur: 'Censure',
  infirmier: 'Infirmerie',
  bibliothecaire: 'Bibliothèque',
  secretaire: 'Secrétariat',
  admin: 'Administration',
  universite: 'Université',
  eleves: 'Élèves',
  notes: 'Notes',
  paiements: 'Paiements',
  communications: 'Communications',
  emploiDuTemps: 'Emploi du Temps',
  parametres: 'Paramètres',
  messagerie: 'Messagerie',
  enseignantClasses: 'Mes Classes',
  parentEnfants: 'Mes Enfants',
  eleveCours: 'Mes Cours',
  comptableTransactions: 'Transactions',
  comptableFactures: 'Factures',
  surveillantSurveillance: 'Surveillance',
  surveillantPresences: 'Présences',
  censeurDiscipline: 'Discipline',
  censeurAbsences: 'Absences',
  infirmierSoins: 'Soins',
  infirmierDossiers: 'Dossiers Médicaux',
  bibliothecaireCatalogue: 'Catalogue',
  bibliothecaireEmprunts: 'Emprunts',
  secretaireInscriptions: 'Inscriptions',
  secretairePlanning: 'Planning',
  secretaireDocuments: 'Documents',
  universiteFacultes: 'Facultés',
  universiteDepartements: 'Départements',
  universiteEtudiants: 'Étudiants',
  universiteCours: 'Cours',
  universiteMesCours: 'Mes Cours',
  universiteNotes: 'Notes',
  universiteTaches: 'Tâches',
  universitePlanning: 'Planning',
  universiteDashboard: 'Dashboard',
  adminEcoles: 'Écoles',
  adminUtilisateurs: 'Utilisateurs',
  adminStatistiques: 'Statistiques',
  adminConfiguration: 'Configuration',
};

/* ─── Build path → label lookup from ROUTE_CONFIG keys ───────────── */
const PATH_LABEL_MAP = Object.entries(ROUTE_CONFIG).reduce((map, [key, cfg]) => {
  if (cfg.path) map[cfg.path] = ROUTE_KEY_LABELS[key] || null;
  return map;
}, {});

/* ─── Segments ignorés ───────────────────────────────────────────── */
const IGNORE_SEGMENTS = new Set(['dashboard']);

/* ─── Extraire le premier segment comme qualifiant de groupe ─────── */
function inferGroupLabel(segment) {
  const groupLabels = {
    admin: 'Administration',
    universite: 'Université',
    enseignant: 'Enseignant',
    parent: 'Parent',
    eleve: 'Élève',
    comptable: 'Comptabilité',
    surveillant: 'Surveillance',
    censeur: 'Censure',
    infirmier: 'Infirmerie',
    bibliothecaire: 'Bibliothèque',
    secretaire: 'Secrétariat',
    directeur: 'Direction',
  };
  return groupLabels[segment] || null;
}

/* ─── Capitaliser un segment en label lisible ────────────────────── */
function segmentToLabel(seg) {
  return seg
    .replace(/[-_]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

export default function Breadcrumb({ items: propItems, className }) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  /* ─── Auto-génération depuis le path ─────────────────────────────── */
  const autoItems = useMemo(() => {
    if (propItems) return null; // override explicite → pas d'auto

    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return [];

    const homePath = user?.role ? ROLE_REDIRECT_MAP[user.role] : '/connexion';
    const items = [{ label: 'Accueil', href: homePath }];

    let accumulated = '';
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      accumulated += `/${seg}`;
      const isLast = i === segments.length - 1;

      if (IGNORE_SEGMENTS.has(seg)) {
        if (isLast) items[items.length - 1].href = undefined; // dernier = courant
        continue;
      }

      const label =
        PATH_LABEL_MAP[accumulated] ||
        (i === 0 ? inferGroupLabel(seg) : null) ||
        segmentToLabel(seg);

      items.push({
        label,
        href: isLast ? undefined : accumulated,
      });
    }

    return items;
  }, [location.pathname, propItems, user?.role]);

  const items = propItems || autoItems || [];

  if (items.length === 0) return null;

  return (
    <nav aria-label="Fil d'Ariane" className={cn('mb-4', className)}>
      <motion.ol
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex flex-wrap items-center gap-1 text-sm"
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-neutral-500"
                  aria-hidden="true"
                />
              )}

              {isLast || !item.href ? (
                <span
                  className="truncate font-medium text-neutral-900 dark:text-white"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {index === 0 && (
                    <LayoutDashboard className="mr-1.5 inline h-3.5 w-3.5 text-neutral-400" />
                  )}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="truncate text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </motion.ol>
    </nav>
  );
}
