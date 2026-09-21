/// <reference types="vitest/config" />
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configurable : à l'intérieur de docker-compose, `localhost` désigne le
// conteneur frontend lui-même, pas le backend. `VITE_DEV_API_TARGET` permet
// de viser le service `backend` sans toucher au code pour qui lance le
// serveur de dev nativement (le défaut ne change pas).
const devApiTarget = process.env.VITE_DEV_API_TARGET || 'http://localhost:8000';

export default defineConfig({
  plugins: [
    react({
      include: ['**/*.js', '**/*.jsx', '**/*.tsx'],
    }),
    tailwindcss(),
  ],
  server: {
    port: 3002,
    // Pas d'ouverture de navigateur en CI : le conteneur est sans affichage et
    // `open` y lance un `xdg-open` qui n'aboutit pas.
    open: !process.env.CI,
    proxy: {
      '/api': {
        target: devApiTarget,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'http://localhost:3002');
          });
        },
      },
      '/sanctum': {
        target: devApiTarget,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'http://localhost:3002');
          });
        },
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: false,

    // Pas de `manualChunks`. Il y en avait un, qui classait les paquets de
    // `node_modules` par sous-chaîne du chemin — et la production affichait une
    // page blanche :
    //
    //   Uncaught ReferenceError: Cannot access 'j' before initialization
    //     (vendor-other-*.js)
    //
    // Deux défauts se cumulaient. D'abord le classement lui-même :
    // `id.includes('react')` capturait aussi `@tanstack/react-query` et
    // `react-pdf`, qui n'atteignaient donc jamais les branches écrites pour
    // eux — les tests `@tanstack` et `pdfjs-dist` situés plus bas étaient
    // inatteignables. Ensuite la conséquence : des paquets mutuellement
    // dépendants se retrouvaient dans des chunks distincts, ce qui crée un
    // cycle d'initialisation entre chunks. Le premier à s'exécuter lit une
    // liaison `const` de l'autre avant qu'elle n'existe.
    //
    // Le découpage automatique de Rollup respecte l'ordre d'initialisation par
    // construction. Des chunks plus gros valent mieux qu'une page blanche, et
    // l'avertissement de taille ci-dessous reste le bon endroit pour en
    // rediscuter — avec, cette fois, une vérification sur le bundle *construit*
    // (voir `src/__tests__/production-bundle.test.js`).
    rollupOptions: {
      output: {},
    },

    chunkSizeWarningLimit: 250,
    cssCodeSplit: true,
    minify: 'esbuild',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      src: path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    esbuild: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  test: {
    projects: [
      {
        // Suite existante (Vitest + jsdom), inchangée hormis son nom. `npm test`
        // ne lance que ce projet (`--project unit`) : hermétique, sans
        // navigateur à installer, et sans le démarrage à froid de Chromium qui
        // faisait dépasser les timeouts des tests jsdom lancés en parallèle.
        extends: true,
        test: {
          name: 'unit',
          globals: true,
          environment: 'jsdom',
          setupFiles: './src/setupTests.js',
          css: true,
          include: ['src/**/*.{test,spec}.{js,jsx}'],
          deps: {
            inline: [/shared/],
            esbuild: {
              loader: {
                '.js': 'jsx',
              },
            },
          },
        },
      },
      {
        // Fait tourner chaque story comme un test (rendu réel dans Chromium
        // headless via Playwright, pas jsdom). Lancé à part via
        // `npm run test:storybook` : exige `npx playwright install chromium`.
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(__dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});