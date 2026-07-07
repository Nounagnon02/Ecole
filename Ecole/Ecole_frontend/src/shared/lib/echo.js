/**
 * Echo — Laravel WebSocket client (Reverb/Pusher)
 *
 * Uses Pusher protocol via Laravel Echo. Falls back gracefully
 * when reverb is not running or Echo is not installed yet.
 *
 * Import:
 *   import echo from '@/shared/lib/echo';
 *   echo.connector.pusher.connection.bind('connected', () => { ... });
 *
 * Or use the useRealtime hook instead of accessing echo directly.
 */

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import logger from './logger';

/** @type {Echo|null} Singleton instance */
let echoInstance = null;

/** @type {boolean} True when we've already tried connecting */
let attempted = false;

/**
 * Get or create the Echo singleton.
 * Returns null if not configured or if the connection fails.
 */
export function getEcho() {
  if (echoInstance) return echoInstance;
  if (attempted) return null;

  const key = import.meta.env.VITE_PUSHER_APP_KEY;
  if (!key) {
    logger.warn('Pusher key not configured — realtime disabled.');
    attempted = true;
    return null;
  }

  try {
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
  }
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
}

export default getEcho;
