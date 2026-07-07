/**
 * offline-queue — Process pending mutations on reconnection
 *
 * Monitors network status and replays queued mutations in order
 * when the browser comes back online.
 */

import apiClient from './api-client';
import {
  getPendingMutations,
  completeMutation,
  updateMutation,
  pendingMutationCount,
} from './db';
import useUIStore from '@/shared/stores/ui-store';
import logger from './logger';

/** Max retries per mutation before giving up */
const MAX_RETRIES = 3;

/** @type {boolean} Whether a sync is in progress */
let syncing = false;

/**
 * Process all pending mutations in FIFO order.
 * Shows a toast while syncing.
 */
export async function processQueue() {
  if (syncing) return;
  syncing = true;

  try {
    const pending = await getPendingMutations();
    if (!pending.length) return;

    const addToast = useUIStore.getState().addToast;
    addToast({
      type: 'info',
      title: 'Synchronisation',
      message: `${pending.length} modification(s) en attente...`,
      duration: 3000,
    });

    for (const mutation of pending) {
      try {
        await apiClient({
          method: mutation.method,
          url: mutation.url,
          data: mutation.data,
          headers: { 'X-Offline-Queue': 'true' },
        });
        await completeMutation(mutation.id);
      } catch (err) {
        const retries = (mutation.retries || 0) + 1;
        if (retries >= MAX_RETRIES) {
          await updateMutation(mutation.id, {
            status: 'failed',
            retries,
            error: err.message || 'Max retries exceeded',
          });
          addToast({
            type: 'error',
            title: 'Échec de synchronisation',
            message: `${mutation.method} ${mutation.url}`,
            duration: 5000,
          });
        } else {
          await updateMutation(mutation.id, { retries });
          break; // Stop processing — retry later
        }
      }
    }

    const remaining = await pendingMutationCount();
    if (remaining === 0) {
      addToast({
        type: 'success',
        title: 'Synchronisation terminée',
        message: 'Toutes les modifications ont été envoyées.',
        duration: 3000,
      });
    } else if (remaining > 0) {
      addToast({
        type: 'warning',
        title: 'Synchronisation partielle',
        message: `${remaining} modification(s) en attente.`,
        duration: 4000,
      });
    }
  } finally {
    syncing = false;
  }
}

/**
 * Start listening for online/offline events and auto-sync.
 * Call once at app bootstrap.
 *
 * @returns {() => void} Cleanup function
 */
export function startOfflineSync() {
  const handleOnline = () => {
    logger.info('Browser is online — processing queue...');
    processQueue();
  };

  const handleOffline = () => {
    logger.info('Browser is offline — mutations will be queued.');
    useUIStore.getState().addToast({
      type: 'warning',
      title: 'Mode hors-ligne',
      message: 'Les modifications seront synchronisées automatiquement.',
      duration: 4000,
    });
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Process any queue from a previous session
  if (navigator.onLine) {
    processQueue();
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

export default { processQueue, startOfflineSync };
