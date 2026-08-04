// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

/**
 * Globales disponibles dans les tests, mais pas dans le code applicatif.
 *
 * Deux familles distinctes :
 *  - celles qu'injecte Jest (`describe`, `expect`, …) ;
 *  - celles de Node (`__dirname`, `require`, `process`). Les tests tournent
 *    sous Node, pas sur l'appareil : `navigation.test.jsx` lit l'arborescence
 *    de `app/` pour vérifier que les routes déclarées existent, ce qui exige
 *    `__dirname`. Sans cette déclaration, ESLint le signalait comme indéfini —
 *    trois erreurs sur du code parfaitement valide.
 */
const globalesTest = {
  jest: 'readonly',
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeAll: 'readonly',
  beforeEach: 'readonly',
  afterAll: 'readonly',
  afterEach: 'readonly',

  __dirname: 'readonly',
  __filename: 'readonly',
  require: 'readonly',
  module: 'writable',
  process: 'readonly',
};

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'expo-env.d.ts'],
  },
  {
    files: ['__tests__/**/*.{js,jsx,ts,tsx}', '**/*.test.{js,jsx,ts,tsx}', 'jest.setup.js'],
    languageOptions: { globals: globalesTest },
  },
]);
