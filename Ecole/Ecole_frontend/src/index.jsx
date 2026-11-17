import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './shared/lib/query-client';
import { I18nProvider } from './shared/i18n';
import { registerSW } from './shared/lib/pwa';
import { initErrorReporting } from './shared/lib/error-reporting';
import App from './App';
import './styles/main.css';

// Sans `VITE_SENTRY_DSN`, no-op : sûr par défaut en local/CI.
initErrorReporting();


const router = createBrowserRouter([
  { path: '*', element: <App /> },
]);

// `public/sw.js` et `public/manifest.json` étaient livrés dans le build, mais
// `pwa.js` n'était importé nulle part et `index.html` ne référençait pas le
// manifeste : le service worker n'était jamais enregistré et l'application
// n'était installable sur aucun appareil. `registerSW()` sort de lui-même en
// développement et quand l'API n'est pas supportée.
registerSW();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <RouterProvider router={router} />
      </I18nProvider>
    </QueryClientProvider>
  </React.StrictMode>
);