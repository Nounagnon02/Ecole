/* eslint-disable no-console */
/**
 * Logger — Application logger
 *
 * - In dev mode (Vite): delegates to console with prefix
 * - In production: silent (use addToast or Sentry for user-facing/reportable errors)
 *
 * Usage:
 *   import logger from '@/shared/lib/logger';
 *   logger.info('SW registered', scope);
 *   logger.error('API call failed', err);
 */

const PREFIX = '[École]';

const isDev = import.meta.env.DEV;

function noop() {}

const logger = {
  debug: isDev ? (...args) => console.debug(PREFIX, ...args) : noop,
  info: isDev ? (...args) => console.info(PREFIX, ...args) : noop,
  warn: isDev ? (...args) => console.warn(PREFIX, ...args) : noop,
  error: isDev
    ? (...args) => {
        console.error(PREFIX, ...args);
        // In production, send to crash reporting here in the future
        // Sentry.captureException(args[0] || args);
      }
    : noop,
  log: isDev ? (...args) => console.log(PREFIX, ...args) : noop,
};

export default logger;
