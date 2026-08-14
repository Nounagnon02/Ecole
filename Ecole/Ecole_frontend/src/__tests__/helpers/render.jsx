/**
 * render — Utilitaires de montage pour les tests
 *
 * Fournit un routeur mémoire et, au besoin, un QueryClient isolé.
 *
 * `retryDelay: 0` : la politique de réessai de `useApiQuery` reste celle
 * du produit (on veut la tester), mais sans les 3 s d'attente
 * exponentielle qui rendraient le chemin d'erreur invisible dans le
 * délai d'un test.
 */

import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from '@/shared/stores/auth-store';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, retryDelay: 0, gcTime: 0, staleTime: 0, refetchOnWindowFocus: false },
      mutations: { retry: false, retryDelay: 0 },
    },
  });
}

/** Réinitialise le store d'auth entre deux tests. */
export function resetAuth(overrides = {}) {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    sessionLastVerified: null,
    pendingSchools: null,
    pendingToken: null,
    step: 'initial',
    ...overrides,
  });
}

/** Place un utilisateur authentifié dans le store. */
export function signIn(role, extra = {}) {
  resetAuth({
    user: { id: 1, name: 'Test', email: 'test@example.com', role, ...extra },
    isAuthenticated: true,
    // Évite le checkSession() de ProtectedRoute pendant le test.
    sessionLastVerified: Date.now(),
  });
}

/**
 * Monte un élément dans un MemoryRouter, avec des routes témoins
 * qui rendent un texte reconnaissable — c'est ainsi qu'on observe
 * une redirection sans espionner react-router.
 */
export function renderRoute(element, { path = '/', initialEntries = [path], extraRoutes = [], withQuery = false } = {}) {
  const queryClient = withQuery ? makeQueryClient() : null;

  const tree = (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path={path} element={element} />
        <Route path="/connexion" element={<div>ECRAN-CONNEXION</div>} />
        <Route path="/unauthorized" element={<div>ECRAN-NON-AUTORISE</div>} />
        <Route path="/404" element={<div>ECRAN-404</div>} />
        {extraRoutes.map(({ path: p, label }) => (
          <Route key={p} path={p} element={<div>{label}</div>} />
        ))}
      </Routes>
    </MemoryRouter>
  );

  const result = render(withQuery ? <QueryClientProvider client={queryClient}>{tree}</QueryClientProvider> : tree);
  return { ...result, queryClient };
}
