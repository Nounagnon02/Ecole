/**
 * App — Nouvelle architecture premium
 *
 * Point d'entrée du routing.
 * Utilise le auth-store Zustand pour l'authentification,
 * AppShell pour le layout des routes protégées,
 * et la route-config comme source unique des chemins.
 */

import { useEffect, Suspense, lazy as reactLazy } from 'react';
import { Routes, Route, Navigate, Link, ScrollRestoration } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import useAuthStore from '@/shared/stores/auth-store';
import AppShell from '@/shared/components/layout/AppShell';
import ProtectedRoute from '@/shared/components/auth/ProtectedRoute';
import LoginForm from '@/shared/components/auth/LoginForm';
import ForgotPassword from '@/app/features/auth/ForgotPassword';
import ResetPassword from '@/app/features/auth/ResetPassword';
import ErrorBoundary from '@/shared/components/ui/ErrorBoundary';
import { LoadingSpinner } from '@/shared/components/ui/Skeleton';
import NotFoundPage from '@/app/error/NotFoundPage';
import ForbiddenPage from '@/app/error/ForbiddenPage';
import {
  ROUTE_CONFIG,
  PROTECTED_ROUTES,
  ROLE_REDIRECT_MAP,
} from '@/features/roles/route-config';

/* ─── Page non autorisée ─────────────────────────────────────────────── */
function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--surface)] px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--red-subtle)] text-[var(--red)]">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h1 className="font-fraunces text-2xl font-semibold text-[var(--text-primary)]">
        Accès non autorisé
      </h1>
      <p className="max-w-sm text-sm text-[var(--text-secondary)]">
        Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <Link
        to="/connexion"
        className="mt-2 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
      >
        Retour à la connexion
      </Link>
    </div>
  );
}

/* ─── Authenticated layout wrapper ──────────────────────────────────── */
function AuthenticatedLayout({ children }) {
  return (
    <AppShell>
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    </AppShell>
  );
}

/* ─── Auth redirect — si déjà connecté, va au dashboard du rôle ─────── */
function AuthRedirect() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated && user) {
    const redirectPath = ROLE_REDIRECT_MAP[user.role] || '/connexion';
    return <Navigate to={redirectPath} replace />;
  }

  return <Navigate to="/connexion" replace />;
}

/* ─── Route map builder ─────────────────────────────────────────────── */
function buildProtectedRoutes() {
  return Object.entries(PROTECTED_ROUTES).map(([key, cfg]) => {
    const Component = cfg.component ? reactLazy(cfg.component) : null;
    if (!Component) return null;

    return (
      <Route
        key={key}
        path={cfg.path}
        element={
          <ProtectedRoute allowedRoles={cfg.roles}>
            <AuthenticatedLayout>
              <Suspense fallback={<LoadingSpinner />}>
                  <ErrorBoundary>
                    <Component />
                  </ErrorBoundary>
                </Suspense>
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
    );
  });
}

/* ─── Composant principal ────────────────────────────────────────────── */
function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Toaster
        position="top-right"
        aria-live="polite"
        toastOptions={{
          className: '!rounded-lg !border !border-[var(--border)] !bg-[var(--surface-raised)] !shadow-[var(--shadow-3)] !text-sm !font-medium !text-[var(--text-primary)]',
          duration: 4000,
          success: { className: '!border-[var(--green-light)] !bg-[var(--green-subtle)] !text-[var(--green)]' },
          error: { className: '!border-[var(--red-light)] !bg-[var(--red-subtle)] !text-[var(--red)]' },
        }}
        closeButton
        richColors={false}
      />
      <ScrollRestoration getKey={(location) => location.pathname + location.search} />
      <Routes>
        {/* ─── Route publique — connexion ──────────────────────────────── */}
        <Route path="/connexion" element={<LoginForm />} />

        {/* ─── Routes publiques — mot de passe oublié ──────────────────── */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ─── Route publique — landing / redirect auth ────────────────── */}
        <Route path="/" element={<AuthRedirect />} />

        {/* ─── Page non autorisée ──────────────────────────────────────── */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ─── 403 — Accès refusé ──────────────────────────────────────────── */}
        <Route path="/403" element={<ForbiddenPage />} />

        {/* ─── Routes protégées (dashboards) ───────────────────────────── */}
        {buildProtectedRoutes()}

        {/* ─── 404 ─────────────────────────────────────────────────────── */}
        <Route path="/404" element={<NotFoundPage />} />

        {/* ─── Fallback → 404 ──────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
