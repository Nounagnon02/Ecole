import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleBasedRedirect from './auth/RoleBasedRedirect';
import LoginForm from './components/LoginForm';
import { ROUTE_CONFIG, REDIRECTS } from './config/routes';

// ── Composant de chargement ──────────────────────────────────────────────
const LoadingSpinner = () => (
  <div style={{
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '100vh', flexDirection: 'column', gap: '1rem'
  }}>
    <div style={{
      width: 50, height: 50, border: '4px solid #f3f3f3',
      borderTop: '4px solid #3498db', borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p>Chargement...</p>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Page non autorisée ───────────────────────────────────────────────────
const UnauthorizedPage = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100vh', textAlign: 'center', padding: '2rem'
  }}>
    <h1 style={{ color: '#e74c3c', marginBottom: '1rem' }}>Accès non autorisé</h1>
    <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
  </div>
);

// ── Lazy wrapper ─────────────────────────────────────────────────────────
const lazy = (importFn) => React.lazy(importFn);

// ── Instances lazy (générées depuis le config) ────────────────────────────
const components = Object.fromEntries(
  Object.entries(ROUTE_CONFIG).map(([key, cfg]) => {
    if (cfg.type === 'redirect') return [key, RoleBasedRedirect];
    return [key, cfg.component ? lazy(cfg.component) : null];
  })
);

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Route eager — critique pour l'auth, jamais lazy */}
          <Route path="/connexion" element={<LoginForm />} />

          {/* Routes publiques lazy */}
          {['home','connexionE','connexionU','inscription','dashboard'].map(k => {
            const C = components[k];
            const cfg = ROUTE_CONFIG[k];
            return C ? <Route key={k} path={cfg.path} element={<C />} /> : null;
          })}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Routes protégées (dashboard + gestion + université) */}
          {Object.entries(ROUTE_CONFIG).map(([k, cfg]) => {
            if (cfg.roles === null) return null; // publique
            const C = components[k];
            if (!C || !cfg.roles) return null;
            return (
              <Route key={k} path={cfg.path} element={
                <ProtectedRoute allowedRoles={cfg.roles}><C /></ProtectedRoute>
              } />
            );
          })}

          {/* Redirections (alias legacy) */}
          {Object.entries(REDIRECTS).map(([from, to]) =>
            from !== '*' && <Route key={`redir-${from}`} path={from} element={<Navigate to={to} replace />} />
          )}

          {/* Fallback */}
          <Route path="*" element={<Navigate to={REDIRECTS['*'] || '/dashboard'} replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;