/**
 * `getEcho()` est devenu asynchrone (voir echo-lazy-load.test.js) pour
 * différer le chargement de `laravel-echo`/`pusher-js`. `AppShell` et
 * `Header` appellent tous deux `listenForNotifications(user.id)` au montage
 * pour le même canal -- avant, la garde `if (subscriptions[ch]) return`
 * suffisait car tout se passait de façon synchrone. Avec un `await` au
 * milieu, un second appel qui démarre avant que le premier ait fini
 * ouvrirait un second abonnement sur le même canal sans la réservation
 * synchrone ajoutée dans le store.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const channelListen = vi.fn();
const fakeChannel = { listen: channelListen };
const echoPrivate = vi.fn(() => fakeChannel);

vi.mock('@/shared/lib/echo', () => ({
  getEcho: vi.fn(),
}));

import { getEcho } from '@/shared/lib/echo';
import useRealtimeStore from '@/shared/stores/realtime-store';

function resetStore() {
  useRealtimeStore.setState({
    connected: false,
    connecting: false,
    error: null,
    subscriptions: {},
    notifications: [],
    latestMessage: null,
    latestGradeUpdate: null,
    latestPaiement: null,
  });
}

describe('realtime-store — abonnements sous getEcho() asynchrone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("n'ouvre qu'un seul abonnement quand deux appels concurrents visent le même canal", async () => {
    let resolveEcho;
    getEcho.mockReturnValue(
      new Promise((resolve) => {
        resolveEcho = resolve;
      }).then(() => ({ private: echoPrivate }))
    );

    const first = useRealtimeStore.getState().listenForNotifications(42);
    const second = useRealtimeStore.getState().listenForNotifications(42);

    resolveEcho();
    await Promise.all([first, second]);

    expect(echoPrivate).toHaveBeenCalledTimes(1);
    expect(echoPrivate).toHaveBeenCalledWith('notifications.42');
  });

  it('retire la réservation si getEcho() ne renvoie rien, pour ne pas bloquer un futur essai', async () => {
    getEcho.mockResolvedValue(null);

    await useRealtimeStore.getState().listenForNotifications(7);

    expect(useRealtimeStore.getState().subscriptions['notifications.7']).toBeUndefined();
  });

  it('un canal notifications déjà ouvert reçoit un listener paiement en plus, sans rouvrir le canal', async () => {
    getEcho.mockResolvedValue({ private: echoPrivate });

    await useRealtimeStore.getState().listenForNotifications(9);
    expect(echoPrivate).toHaveBeenCalledTimes(1);

    await useRealtimeStore.getState().listenForPaiements(9);

    expect(echoPrivate).toHaveBeenCalledTimes(1);
    expect(channelListen).toHaveBeenCalledWith('.paiement.confirmed', expect.any(Function));
  });

  it("un canal paiements pas encore résolu (réservation) ne déclenche pas une seconde ouverture", async () => {
    let resolveEcho;
    getEcho.mockReturnValue(
      new Promise((resolve) => {
        resolveEcho = resolve;
      }).then(() => ({ private: echoPrivate }))
    );

    const notificationsCall = useRealtimeStore.getState().listenForNotifications(5);
    const paiementsCall = useRealtimeStore.getState().listenForPaiements(5);

    resolveEcho();
    await Promise.all([notificationsCall, paiementsCall]);

    expect(echoPrivate).toHaveBeenCalledTimes(1);
  });
});
