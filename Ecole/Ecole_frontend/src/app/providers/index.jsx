/**
 * App Providers
 *
 * Wraps the entire app with every required provider layer.
 * Order matters: QueryClientProvider → Auth → UI → Router
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

/* ─── Query client ──────────────────────────────────────────────────────── */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 min avant refetch
      gcTime: 10 * 60 * 1000,          // 10 min avant garbage (ex cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/* ─── AppProviders ────────────────────────────────────────────────────────── */
export default function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
