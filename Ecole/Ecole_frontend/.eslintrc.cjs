/**
 * ESLint config — Ecole frontend (React 18 + Vite)
 *
 * ESLint 8.44 + eslint-plugin-react (JSX awareness only).
 *
 * IMPORTANT — pourquoi eslint-plugin-react est indispensable ici :
 * le `no-unused-vars` du coeur d'ESLint ne sait pas qu'un identifiant employé
 * en position JSX (`<Button />`) est une référence. Sans le plugin, chaque
 * composant importé puis rendu en JSX était signalé « defined but never used »,
 * soit ~1000 faux positifs qui noyaient les vrais. On active donc les deux
 * seules règles « marqueurs » du plugin :
 *   - react/jsx-uses-vars  : `<Foo />` marque `Foo` comme utilisé
 *   - react/jsx-uses-react : `<div />` marque `React` comme utilisé (fichiers
 *     encore en runtime JSX classique)
 * On n'étend volontairement PAS `plugin:react/recommended` : ce projet n'utilise
 * pas prop-types et n'a pas besoin des règles stylistiques du plugin.
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,          // vite.config, setupTests, api config
    'shared-node-browser': true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  extends: ['eslint:recommended'],
  plugins: ['react'],
  settings: { react: { version: 'detect' } },
  rules: {
    // JSX = usage (voir l'en-tête). Sans ces deux règles, no-unused-vars ment.
    'react/jsx-uses-vars': 'error',
    'react/jsx-uses-react': 'error',
    // Dead code & unused imports — the core Phase 2 signal
    'no-unused-vars': ['warn', {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: true,
      argsIgnorePattern: '^_',   // _foo = intentionally unused
      varsIgnorePattern: '^_',
    }],
    'no-unreachable': 'error',
    'no-dupe-keys': 'error',
    'no-dupe-args': 'error',
    'no-empty': ['error', { allowEmptyCatch: true }],
    // Hygiene
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-const-assign': 'error',
    'no-self-assign': 'error',
    'no-useless-rename': 'warn',
    'no-var': 'error',
    'prefer-const': 'warn',
    eqeqeq: ['warn', 'smart'],
  },
  ignorePatterns: ['dist', 'node_modules', 'coverage', '*.config.js', 'setupTests.js'],
  // Vitest globals for test files (jest-compatible API)
  overrides: [
    {
      files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', 'src/__tests__/**'],
      env: { jest: true },
      rules: { 'no-unused-vars': 'off' },
    },
  ],
};
