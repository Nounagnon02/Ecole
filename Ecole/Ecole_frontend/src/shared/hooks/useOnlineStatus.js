/**
 * useOnlineStatus — Hook for tracking online/offline state
 *
 * Usage:
 *   const { isOnline, pendingCount } = useOnlineStatus();
 *
 * Returns:
 *   - isOnline: boolean — current connectivity state
 *   - pendingCount: number — mutations waiting to sync
 */

import { useState, useEffect, useCallback } from 'react';
import { pendingMutationCount } from '@/shared/lib/db';

export default function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);

  const refreshPending = useCallback(async () => {
    try {
      const count = await pendingMutationCount();
      setPending(count);
    } catch {
      setPending(0);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Refresh pending count when coming back online
      refreshPending();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshPending();

    // Poll pending count every 10s when online
    const interval = setInterval(refreshPending, 10_000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [refreshPending]);

  return { isOnline, pendingCount: pending };
}
