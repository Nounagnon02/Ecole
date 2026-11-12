// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// L'application charge l'anglais et l'arabe à la demande. Les tests portent
// sur les textes, pas sur ce chargement (couvert par premier-chargement.test.js) :
// les trois langues sont donc prêtes d'emblée.
import { chargerLocale } from '@/shared/i18n';
await Promise.all([chargerLocale('en'), chargerLocale('ar')]);

// Polyfill fetch for React Router data-router in jsdom test environment
import { fetch, Request, Response, Headers } from 'cross-fetch';
globalThis.fetch = fetch;
globalThis.Request = Request;
globalThis.Response = Response;
globalThis.Headers = Headers;

// ResizeObserver polyfill (required by recharts/framer-motion in jsdom)
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
