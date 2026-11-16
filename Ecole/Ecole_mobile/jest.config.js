/**
 * Configuration Jest — Érudit v4
 *
 * Le preset jest-expo fournit la transformation Babel (babel-preset-expo),
 * les mocks des modules natifs Expo et la résolution des extensions
 * plateforme (.ios.js, .android.js, …).
 */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/', '/dist/'],
  // Le premier rendu d'un écran (polices, animations, transformation Babel à
  // froid) prend plusieurs secondes sur les machines de la CI : des cas qui
  // tiennent en 0,5 s en local y dépassaient les 5 s par défaut (R-47,
  // 16/11/2026). Budget de temps seulement ; aucune assertion n'est relâchée.
  testTimeout: 20000,
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', 'app/**/*.{js,jsx,ts,tsx}'],
};
