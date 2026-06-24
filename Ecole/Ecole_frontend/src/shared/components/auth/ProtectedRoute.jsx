/**
 * ProtectedRoute — Nouvelle architecture premium
 *
 * Composant de garde qui vérifie l'authentification via le auth-store Zustand.
 * Supporte `allowedRoles` (array) et `role` (string unique).
 * Redirige vers /connexion si non auth, /unauthorized si mauvais rôle.
 */

import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore, { SESSION_CHECK_INTERVAL } from '@/shared/stores/auth-store';
import { LoadingSpinner } from '@/shared/components/ui/Skeleton';

export default function ProtectedRoute({ children, allowedRoles, role }) {
  const { isAuthenticated, isLoading, user, hasAnyRole, checkSession, sessionLastVerified } =
    useAuthStore();
  const location = useLocation();
  const checkingRef = useRef(false);

  /* ─── Re-validation silencieuse de la session ──────────────────────── */
  useEffect(() => {
    if (isAuthenticated && !checkingRef.current) {
      const elapsed = Date.now() - (sessionLastVerified || 0);
      if (elapsed > SESSION_CHECK_INTERVAL) {
        checkingRef.current = true;
        checkSession().finally(() => {
          checkingRef.current = false;
        });
      }
    }
  }, [location.pathname, isAuthenticated, sessionLastVerified, checkSession]);

  /* ─── Chargement en cours ────────────────────────────────────────── */
  if (isLoading) {
    return <LoadingSpinner message="Vérification des permissions…" />;
  }

  /* ─── Non authentifié ─────────────────────────────────────────────── */
  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />;
  }

  /* ─── Vérification des rôles ──────────────────────────────────────── */
  const roles = allowedRoles || (role ? [role] : null);

  if (roles && user) {
    if (!hasAnyRole(roles)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  /* ─── Tout OK ─────────────────────────────────────────────────────── */
  return children;
}
