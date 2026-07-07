/**
 * PWA — Enregistrement du Service Worker
 *
 * Vérifie le support, enregistre le SW, et expose l'état
 * de la connectivité pour le reste de l'application.
 */

import logger from './logger';

export function registerSW() {
  if (!('serviceWorker' in navigator)) {
    logger.info('Service Worker non supporté');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        logger.info('SW enregistré:', registration.scope);

        // Écouter les mises à jour
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nouvelle version disponible
              showUpdateNotification(registration);
            }
          });
        });
      })
      .catch((error) => {
        logger.error('Erreur SW:', error);
      });
  });
}

function showUpdateNotification(registration) {
  // Notification de mise à jour disponible
  const event = new CustomEvent('sw-update', {
    detail: { registration },
  });
  window.dispatchEvent(event);
}

/**
 * Permet à l'utilisateur de forcer la mise à jour
 */
export function applyUpdate(registration) {
  if (!registration) return;
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
}

/**
 * Écoute l'état de la connexion
 */
export function addConnectivityListeners(onOnline, onOffline) {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Hook pour détecter le mode hors-ligne
 * Usage : const isOnline = useOnlineStatus();
 */
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const cleanup = addConnectivityListeners(
      () => setIsOnline(true),
      () => setIsOnline(false)
    );
    return cleanup;
  }, []);

  return isOnline;
}
