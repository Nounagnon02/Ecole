/**
 * Echo — Laravel WebSocket client (Reverb/Pusher)
 *
 * Uses Pusher protocol via Laravel Echo. Falls back gracefully
 * when reverb is not running or Echo is not installed yet.
 *
 * Import:
 *   import { getEcho } from '@/shared/lib/echo';
 *   const echo = await getEcho();
 *   echo?.connector.pusher.connection.bind('connected', () => { ... });
 *
 * Or use the useRealtime hook instead of accessing echo directly.
 *
 * `laravel-echo` + `pusher-js` pèsent ~143 Ko à eux deux -- en import
 * statique, ce poids partait dans le chunk principal, téléchargé par tout
 * visiteur y compris anonyme sur `/connexion`, qui n'a par définition aucune
 * connexion temps réel à établir. `getEcho()` les importe dynamiquement,
 * seulement quand une connexion est réellement demandée (après
 * authentification, depuis `AppShell`/`Header`).
 */

import logger from './logger';

/** @type {import('laravel-echo').default|null} Singleton instance */
let echoInstance = null;

/** @type {boolean} True when we've already tried connecting */
let attempted = false;

/** @type {Promise<import('laravel-echo').default|null>|null} In-flight setup, to avoid a duplicate import/connect race if getEcho() is called again before the first call resolves. */
let pendingSetup = null;

/**
 * Get or create the Echo singleton.
 * Returns null if not configured or if the connection fails.
 */
export async function getEcho() {
  if (echoInstance) return echoInstance;
  if (attempted) return null;
  if (pendingSetup) return pendingSetup;

  const key = import.meta.env.VITE_PUSHER_APP_KEY;
  if (!key) {
    logger.warn('Pusher key not configured — realtime disabled.');
    attempted = true;
    return null;
  }

  pendingSetup = (async () => {
    try {
      const [{ default: Echo }, { default: Pusher }] = await Promise.all([
        import('laravel-echo'),
        import('pusher-js'),
      ]);

      window.Pusher = Pusher;

      echoInstance = new Echo({
        broadcaster: 'pusher',
        key,
        wsHost: import.meta.env.VITE_PUSHER_HOST || window.location.hostname,
        wsPort: import.meta.env.VITE_PUSHER_PORT || 8080,
        wssPort: import.meta.env.VITE_PUSHER_PORT || 443,
        forceTLS: import.meta.env.VITE_PUSHER_SCHEME === 'https',
        encrypted: import.meta.env.VITE_PUSHER_SCHEME === 'https',
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        authEndpoint: '/api/v1/broadcasting/auth',
        auth: {
          headers: {
            Accept: 'application/json',
          },
        },
      });

      echoInstance.connector.pusher.connection.bind('connected', () => {
        logger.info('Connected to Reverb.');
      });

      echoInstance.connector.pusher.connection.bind('error', (err) => {
        logger.warn('Connection error:', err);
      });

      return echoInstance;
    } catch (err) {
      logger.warn('Setup failed — realtime unavailable:', err);
      attempted = true;
      return null;
    } finally {
      pendingSetup = null;
    }
  })();

  return pendingSetup;
}

/**
 * Disconnect Echo cleanly.
 */
export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
  attempted = false;
  pendingSetup = null;
}

export default getEcho;
