/**
 * App — Nouvelle architecture premium
 *
 * Point d'entrée du routing.
 * Utilise le auth-store Zustand pour l'authentification,
 * AppShell pour le layout des routes protégées,
 * et la route-config comme source unique des chemins.
 */

import { useEffect, Suspense, lazy as reactLazy } from 'react';
import { Routes, Route, Navigate, ScrollRestoration } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import useAuthStore from '@/shared/stores/auth-store';
import AppShell from '@/shared/components/layout/AppShell';
import ProtectedRoute from '@/shared/components/auth/ProtectedRoute';
import LoginForm from '@/shared/components/auth/LoginForm';
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-6 text-center dark:bg-neutral-950">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Accès non autorisé
      </h1>
      <p className="max-w-sm text-sm text-neutral-500">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.
      </p>
      <a
        href="/connexion"
        className="mt-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
      >
        Retour à la connexion
      </a>
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
          className: '!rounded-xl !border !border-neutral-200 !bg-white !shadow-lg !text-sm !font-medium !text-neutral-900 dark:!border-neutral-800 dark:!bg-neutral-900 dark:!text-neutral-100 !shadow-xl',
          duration: 4000,
          success: { className: '!border-emerald-200 !bg-emerald-50 !text-emerald-900 dark:!border-emerald-900/50 dark:!bg-emerald-950/30 dark:!text-emerald-300' },
          error: { className: '!border-red-200 !bg-red-50 !text-red-900 dark:!border-red-900/50 dark:!bg-red-950/30 dark:!text-red-300' },
          loading: { className: '!border-indigo-200 !bg-indigo-50 !text-indigo-900 dark:!border-indigo-900/50 dark:!bg-indigo-950/30 dark:!text-indigo-300' },
        }}
        closeButton
        richColors={false}
      />
      <ScrollRestoration getKey={(location) => location.pathname + location.search} />
      <Routes>
        {/* ─── Route publique — connexion ──────────────────────────────── */}
        <Route path="/connexion" element={<LoginForm />} />

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
