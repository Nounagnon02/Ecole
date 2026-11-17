/* eslint-disable no-console */
/**
 * Logger — Application logger
 *
 * - In dev mode (Vite): delegates to console with prefix
 * - In production: silent on the console, but `error()` still reports to
 *   Sentry (no-op itself without VITE_SENTRY_DSN — see error-reporting.js)
 *
 * Usage:
 *   import logger from '@/shared/lib/logger';
 *   logger.info('SW registered', scope);
 *   logger.error('API call failed', err);
 */

import { captureException } from './error-reporting';

const PREFIX = '[École]';

const isDev = import.meta.env.DEV;

function noop() {}

const logger = {
  debug: isDev ? (...args) => console.debug(PREFIX, ...args) : noop,
  info: isDev ? (...args) => console.info(PREFIX, ...args) : noop,
  warn: isDev ? (...args) => console.warn(PREFIX, ...args) : noop,
  error: (...args) => {
    if (isDev) console.error(PREFIX, ...args);

    const [first, ...rest] = args;
    const error = first instanceof Error ? first : new Error(String(first));
    captureException(error, rest.length ? { extra: rest } : undefined);
  },
  log: isDev ? (...args) => console.log(PREFIX, ...args) : noop,
};

export default logger;
