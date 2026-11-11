/**
 * ProtectedRoute — Nouvelle architecture premium
 *
 * Composant de garde qui vérifie l'authentification via le auth-store Zustand.
 * Supporte `allowedRoles` (array) et `role` (string unique).
 * Redirige vers /connexion si non auth, /unauthorized si mauvais rôle.
 */

import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore, { SESSION_CHECK_INTERVAL } from '@/shared/stores/auth-store';
import { LoadingSpinner } from '@/shared/components/ui/Skeleton';

export const TWO_FACTOR_SETUP_PATH = '/activation-2fa';
export const PASSWORD_CHANGE_PATH = '/changer-mot-de-passe';

export default function ProtectedRoute({ children, allowedRoles, role }) {
  const {
    isAuthenticated, isLoading, user, hasAnyRole, checkSession, sessionLastVerified, twoFactorSetupRequired,
  } = useAuthStore();
  const location = useLocation();
  const checkingRef = useRef(false);
  const [isChecking, setIsChecking] = useState(true);

  /* ─── Re-validation silencieuse de la session ──────────────────────── */
  useEffect(() => {
    if (isAuthenticated && !checkingRef.current) {
      const elapsed = Date.now() - (sessionLastVerified || 0);
      if (elapsed > SESSION_CHECK_INTERVAL) {
        checkingRef.current = true;
        setIsChecking(true);
        checkSession().finally(() => {
          checkingRef.current = false;
          setIsChecking(false);
        });
      } else {
        setIsChecking(false);
      }
    } else if (!isAuthenticated) {
      setIsChecking(false);
    }
  }, [location.pathname, isAuthenticated, sessionLastVerified, checkSession]);

  /* ─── Chargement en cours ────────────────────────────────────────── */
  if (isLoading || isChecking) {
    return <LoadingSpinner message="Vérification des permissions…" />;
  }

  /* ─── Non authentifié ─────────────────────────────────────────────── */
  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />;
  }

  /* ─── Mot de passe provisoire à remplacer ─────────────────────────── */
  // Passe avant la 2FA : l'API ne laisse rien faire d'autre, pas même
  // l'enrôlement, tant que le mot de passe remis n'est pas remplacé.
  if (user?.password_change_required) {
    return location.pathname === PASSWORD_CHANGE_PATH ? children : <Navigate to={PASSWORD_CHANGE_PATH} replace />;
  }

  /* ─── 2FA obligatoire pas encore activée ──────────────────────────── */
  // L'API refuserait tout appel : on mène directement à l'activation.
  if (twoFactorSetupRequired && location.pathname !== TWO_FACTOR_SETUP_PATH) {
    return <Navigate to={TWO_FACTOR_SETUP_PATH} replace />;
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
