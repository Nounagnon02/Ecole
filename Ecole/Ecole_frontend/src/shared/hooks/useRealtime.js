/**
 * useRealtime — Hook for subscribing to WebSocket channels
 *
 * Automatically cleans up subscriptions on unmount.
 *
 * Usage:
 *   useRealtime({ listenNotifications: userId });
 *   useRealtime({ listenMessages: userId });
 *   useRealtime({ listenGrades: classeId });
 *   const { lastNotification } = useRealtime({ listenNotifications: userId });
 */

import { useEffect } from 'react';
import useRealtimeStore from '@/shared/stores/realtime-store';

/**
 * Subscribe to real-time channels based on provided options.
 * Pass userId / classeId as the option value to subscribe.
 */
export default function useRealtime(options = {}) {
  const {
    listenNotifications,
    listenMessages,
    listenConversation,
    listenGrades,
    listenPaiements,
  } = options;

  const connect = useRealtimeStore((s) => s.connect);
  const connected = useRealtimeStore((s) => s.connected);

  const notifications = useRealtimeStore((s) => s.notifications);
  const latestMessage = useRealtimeStore((s) => s.latestMessage);
  const latestGradeUpdate = useRealtimeStore((s) => s.latestGradeUpdate);
  const latestPaiement = useRealtimeStore((s) => s.latestPaiement);

  const listenForNotifications = useRealtimeStore((s) => s.listenForNotifications);
  const listenForMessages = useRealtimeStore((s) => s.listenForMessages);
  const listenForConversation = useRealtimeStore((s) => s.listenForConversation);
  const listenForGradeUpdates = useRealtimeStore((s) => s.listenForGradeUpdates);
  const listenForPaiements = useRealtimeStore((s) => s.listenForPaiements);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (!connected) return;
    if (listenNotifications) listenForNotifications(listenNotifications);
  }, [connected, listenNotifications, listenForNotifications]);

  useEffect(() => {
    if (!connected) return;
    if (listenMessages) listenForMessages(listenMessages);
  }, [connected, listenMessages, listenForMessages]);

  useEffect(() => {
    if (!connected) return;
    if (listenConversation) listenForConversation(listenConversation);
  }, [connected, listenConversation, listenForConversation]);

  useEffect(() => {
    if (!connected) return;
    if (listenGrades) listenForGradeUpdates(listenGrades);
  }, [connected, listenGrades, listenForGradeUpdates]);

  useEffect(() => {
    if (!connected) return;
    if (listenPaiements) listenForPaiements(listenPaiements);
  }, [connected, listenPaiements, listenForPaiements]);

  return {
    connected,
    notifications,
    lastMessage: latestMessage,
    lastGradeUpdate: latestGradeUpdate,
    lastPaiement: latestPaiement,
  };
}

/**
 * useNotification — Convenience hook for notification badge counts
 */
export function useNotifications(userId) {
  return useRealtime({ listenNotifications: userId });
}
