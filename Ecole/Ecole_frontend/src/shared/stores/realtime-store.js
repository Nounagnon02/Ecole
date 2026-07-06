/**
 * realtime-store — Zustand store for WebSocket connection state
 *
 * Tracks connection status and provides actions for subscribing
 * to real-time channels.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getEcho } from '@/shared/lib/echo';

const useRealtimeStore = create(
  devtools(
    (set, get) => ({
      /* ─── State ─────────────────────────────────────────────────────────── */
      connected: false,
      connecting: false,
      error: null,

      /** Map of active subscriptions: { channelName: EchoChannel } */
      subscriptions: {},

      /** Latest notifications received in this session */
      notifications: [],

      /** Latest message received */
      latestMessage: null,

      /** Latest grade update */
      latestGradeUpdate: null,

      /** Latest payment confirmation */
      latestPaiement: null,

      /* ─── Connection ────────────────────────────────────────────────────── */
      connect: () => {
        const { connecting, connected } = get();
        if (connecting || connected) return;

        set({ connecting: true, error: null });
        const echo = getEcho();

        if (!echo) {
          set({ connecting: false, error: 'Echo not available' });
          return;
        }

        echo.connector.pusher.connection.bind('connected', () => {
          set({ connected: true, connecting: false, error: null });
        });

        echo.connector.pusher.connection.bind('disconnected', () => {
          set({ connected: false, error: null });
        });

        echo.connector.pusher.connection.bind('error', (err) => {
          console.warn('[Realtime] Error:', err);
          set({ error: err.message || 'Connection error' });
        });
      },

      disconnect: () => {
        const { subscriptions } = get();
        Object.values(subscriptions).forEach((sub) => {
          try {
            sub.unsubscribe();
          } catch { /* ignore */ }
        });
        set({
          connected: false,
          subscriptions: {},
        });
      },

      /* ─── Notifications ─────────────────────────────────────────────────── */
      listenForNotifications: (userId) => {
        const { subscriptions } = get();
        const ch = `notifications.${userId}`;
        if (subscriptions[ch]) return;

        const echo = getEcho();
        if (!echo) return;

        const channel = echo.private(ch);
        channel.listen('.notification.pushed', (data) => {
          set((state) => ({
            notifications: [data, ...state.notifications].slice(0, 50),
          }));
        });

        set((state) => ({
          subscriptions: { ...state.subscriptions, [ch]: channel },
        }));
      },

      /* ─── Messaging ─────────────────────────────────────────────────────── */
      listenForMessages: (userId) => {
        const { subscriptions } = get();
        const ch = `messages.${userId}`;
        if (subscriptions[ch]) return;

        const echo = getEcho();
        if (!echo) return;

        const channel = echo.private(ch);
        channel.listen('.message.sent', (data) => {
          set({ latestMessage: data });
        });

        set((state) => ({
          subscriptions: { ...state.subscriptions, [ch]: channel },
        }));
      },

      listenForConversation: (conversationId) => {
        const { subscriptions } = get();
        const ch = `conversations.${conversationId}`;
        if (subscriptions[ch]) return;

        const echo = getEcho();
        if (!echo) return;

        const channel = echo.private(ch);
        channel.listen('.message.sent', (data) => {
          set({ latestMessage: data });
        });

        set((state) => ({
          subscriptions: { ...state.subscriptions, [ch]: channel },
        }));
      },

      /* ─── Grades ────────────────────────────────────────────────────────── */
      listenForGradeUpdates: (classeId) => {
        const { subscriptions } = get();
        const ch = `grades.${classeId}`;
        if (subscriptions[ch]) return;

        const echo = getEcho();
        if (!echo) return;

        const channel = echo.private(ch);
        channel.listen('.grade.updated', (data) => {
          set({ latestGradeUpdate: data });
        });

        set((state) => ({
          subscriptions: { ...state.subscriptions, [ch]: channel },
        }));
      },

      /* ─── Paiements ─────────────────────────────────────────────────────── */
      listenForPaiements: (userId) => {
        const { subscriptions } = get();
        const ch = `notifications.${userId}`;
        if (subscriptions[ch]) return; // already listening for notifications

        const echo = getEcho();
        if (!echo) return;

        const channel = echo.private(ch);
        channel.listen('.paiement.confirmed', (data) => {
          set({ latestPaiement: data });
        });

        set((state) => ({
          subscriptions: { ...state.subscriptions, [ch]: channel },
        }));
      },

      /* ─── Cleanup ────────────────────────────────────────────────────────── */
      clearNotifications: () => set({ notifications: [] }),
      clearLatestMessage: () => set({ latestMessage: null }),
      clearLatestGradeUpdate: () => set({ latestGradeUpdate: null }),
    }),
    { name: 'realtime-store' }
  )
);

export default useRealtimeStore;
