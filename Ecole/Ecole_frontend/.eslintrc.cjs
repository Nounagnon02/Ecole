/**
 * ESLint config — Ecole frontend (React 18 + Vite)
 *
 * ESLint 8.44, no external plugins installed (see package.json devDependencies).
 * Uses only built-in eslint:recommended + targeted rules so the `npm run lint`
 * script works out of the box and surfaces dead code (unused vars, unreachable
 * code) for the V5 engineering loop. React/JSX is parsed via ecmaFeatures.
 *
 * When this project adopts eslint-plugin-react / eslint-plugin-react-hooks
 * (Phase 14 CI/CD), extend them here rather than rewriting this file.
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
  rules: {
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
