/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react({
      include: ['**/*.js', '**/*.jsx', '**/*.tsx'],
    }),
    tailwindcss(),
  ],
  server: {
    port: 3002,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'http://localhost:3002');
          });
        },
      },
      '/sanctum': {
        target: 'http://localhost:8000',
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
});
