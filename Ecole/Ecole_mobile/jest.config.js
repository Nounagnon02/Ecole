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
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', 'app/**/*.{js,jsx,ts,tsx}'],
};
