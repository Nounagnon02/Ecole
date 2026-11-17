import { useEffect, useRef } from 'react';
import useAuthStore from '@/shared/stores/auth-store';
import { ROLES, ROLE_GROUPS } from '@/shared/types/roles';

/** Délais d'inactivité avant déconnexion (lot 7.5). */
export const DELAI_SENSIBLE_MS = 15 * 60 * 1000;
export const DELAI_STANDARD_MS = 60 * 60 * 1000;
const ROLES_SENSIBLES = [...ROLE_GROUPS.DIRECTION, ROLES.COMPTABLE, ROLES.ADMIN, ROLES.SUPER_ADMIN];
const EVENEMENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'];

export const delaiPour = (role) => (ROLES_SENSIBLES.includes(role) ? DELAI_SENSIBLE_MS : DELAI_STANDARD_MS);

/**
 * Déconnecte après une période sans activité. Un poste partagé (secrétariat,
 * cybercafé, téléphone prêté) restait ouvert indéfiniment sur un compte qui
 * voit les notes, les paiements ou les dossiers médicaux. La direction et la
 * comptabilité ont un délai court.
 */
export default function useInactivite(surDeconnexion) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const minuterie = useRef(null);
  const rappel = useRef(surDeconnexion);
  rappel.current = surDeconnexion;

  useEffect(() => {
    if (!isAuthenticated || !user) return undefined;
    const delai = delaiPour(user.role);
    const relancer = () => {
      clearTimeout(minuterie.current);
      minuterie.current = setTimeout(async () => {
        try { await logout(); } finally { rappel.current?.(); }
      }, delai);
    };
    relancer();
    EVENEMENTS.forEach((e) => window.addEventListener(e, relancer, { passive: true }));
    return () => {
      clearTimeout(minuterie.current);
      EVENEMENTS.forEach((e) => window.removeEventListener(e, relancer));
    };
  }, [isAuthenticated, user, logout]);
}
