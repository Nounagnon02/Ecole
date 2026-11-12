/**
 * App — Nouvelle architecture premium
 *
 * Point d'entrée du routing.
 * Utilise le auth-store Zustand pour l'authentification,
 * AppShell pour le layout des routes protégées,
 * et la route-config comme source unique des chemins.
 */

import { useEffect, useState, Suspense, lazy as reactLazy } from 'react';
import { Routes, Route, Navigate, Link, ScrollRestoration } from 'react-router-dom';
import useAuthStore from '@/shared/stores/auth-store';
import useCommandK from '@/shared/hooks/useCommandK';
import ProtectedRoute, { TWO_FACTOR_SETUP_PATH, PASSWORD_CHANGE_PATH } from '@/shared/components/auth/ProtectedRoute';
import LoginForm from '@/shared/components/auth/LoginForm';
import ErrorBoundary from '@/shared/components/ui/ErrorBoundary';
import { captureException } from '@/shared/lib/error-reporting';
import { LoadingSpinner } from '@/shared/components/ui/Skeleton';
import { useTranslation } from '@/shared/i18n';

// Seule la page de connexion est dans le premier chargement : en 3G lente,
// chaque kilo-octet de plus retarde le formulaire. La coque des pages
// connectées (et framer-motion), la palette de commandes et les écrans
// secondaires viennent à la demande.
const AuthenticatedLayout = reactLazy(() => import('@/shared/components/layout/AuthenticatedLayout'));
const CommandPalette = reactLazy(() => import('@/shared/components/ui/CommandPalette'));
const PasswordChangePage = reactLazy(() => import('@/app/features/auth/PasswordChangePage'));
const TwoFactorSetupPage = reactLazy(() => import('@/app/features/auth/TwoFactorSetupPage'));
const ForgotPassword = reactLazy(() => import('@/app/features/auth/ForgotPassword'));
const ResetPassword = reactLazy(() => import('@/app/features/auth/ResetPassword'));
const ResetSmsPage = reactLazy(() => import('@/app/features/auth/ResetSmsPage'));
const NotFoundPage = reactLazy(() => import('@/app/error/NotFoundPage'));
const ForbiddenPage = reactLazy(() => import('@/app/error/ForbiddenPage'));
// Le conteneur des notifications : la page de connexion n'en affiche pas, et
// les pages qui en affichent sont chargées après lui.
const Toaster = reactLazy(() => import('sonner').then((m) => ({ default: m.Toaster })));
import {
  PROTECTED_ROUTES,
  ROLE_REDIRECT_MAP
} from '@/features/roles/route-config';

/* ─── Page non autorisée ─────────────────────────────────────────────── */
function UnauthorizedPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--surface)] px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--red-subtle)] text-[var(--red)]">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h1 className="font-heading text-2xl font-semibold text-[var(--text-primary)]">
        {t('error.unauthorized')}
      </h1>
      <p className="max-w-sm text-sm text-[var(--text-secondary)]">
        {t('error.403.description')}
      </p>
      <Link
        to="/connexion"
        className="mt-2 rounded-lg bg-[var(--action)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--action-hover)]"
      >
        {t('error.go_home')}
      </Link>
    </div>
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

/**
 * Lance le chargement de la page en même temps que celui de la coque.
 * Sans lui, la page (chargée à la demande dans la coque, elle aussi à la
 * demande) ne commençait qu'une fois la coque arrivée : une attente en
 * cascade, coûteuse en 3G lente. Le module est mis en cache par le
 * navigateur : `React.lazy` le retrouve ensuite sans nouvelle requête.
 */
function PrechargerPage({ charger }) {
  useState(() => { charger().catch(() => {}); });
  return null;
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
            <PrechargerPage charger={cfg.component} />
            <AuthenticatedLayout>
              <Suspense fallback={<LoadingSpinner />}>
                  <ErrorBoundary onError={(error, info) => captureException(error, info)}>
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useCommandK();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Pas d'attente globale de /auth/me : la page de connexion s'affiche tout
  // de suite (un aller-retour de moins en 3G lente). Les routes protégées et
  // `/` attendent la session elles-mêmes (ProtectedRoute, AuthRedirect).
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {/* Suspense propres : leur chargement ne doit pas cacher la page. La
          palette (et ses icônes) ne se charge qu'une fois connecté. */}
      <Suspense fallback={null}>
      {isAuthenticated && <CommandPalette />}
      <Toaster
        position="top-right"
        aria-live="polite"
        toastOptions={{
          className: '!rounded-lg !border !border-[var(--border)] !bg-[var(--surface-raised)] !shadow-[var(--shadow-3)] !text-sm !font-medium !text-[var(--text-primary)]',
          duration: 4000,
          success: { className: '!border-[var(--green-light)] !bg-[var(--green-subtle)] !text-[var(--green)]' },
          error: { className: '!border-[var(--red-light)] !bg-[var(--red-subtle)] !text-[var(--red)]' }
        }}
        closeButton
        richColors={false}
      />
      </Suspense>
      <ScrollRestoration getKey={(location) => location.pathname + location.search} />
      <Routes>
        {/* ─── Route publique — connexion ──────────────────────────────── */}
        <Route path="/connexion" element={<LoginForm />} />

        {/* ─── Routes publiques — mot de passe oublié ──────────────────── */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/mot-de-passe-oublie/sms" element={<ResetSmsPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ─── Route publique — landing / redirect auth ────────────────── */}
        <Route path="/" element={<AuthRedirect />} />

        {/* ─── Page non autorisée ──────────────────────────────────────── */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ─── 403 — Accès refusé ──────────────────────────────────────────── */}
        <Route path="/403" element={<ForbiddenPage />} />

        {/* ─── Activation imposée de la 2FA — connecté, mais hors coque ─── */}
        <Route
          path={PASSWORD_CHANGE_PATH}
          element={<ProtectedRoute><PasswordChangePage /></ProtectedRoute>}
        />
        <Route
          path={TWO_FACTOR_SETUP_PATH}
          element={<ProtectedRoute><TwoFactorSetupPage /></ProtectedRoute>}
        />

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
