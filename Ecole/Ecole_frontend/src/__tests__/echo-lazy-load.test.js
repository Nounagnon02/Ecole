/**
 * `laravel-echo` + `pusher-js` pèsent ~143 Ko à eux deux et étaient importés
 * statiquement -- tout visiteur anonyme sur `/connexion` les téléchargeait
 * sans jamais en avoir besoin. `getEcho()` les importe dynamiquement à la
 * place ; ces tests fixent le contrat : rien n'est chargé sans clé
 * configurée, un seul chargement même sous appels concurrents, et l'échec
 * d'import ne fait jamais planter l'appelant.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const echoConnectionBind = vi.fn();
const EchoConstructor = vi.fn(function FakeEcho() {
  this.connector = { pusher: { connection: { bind: echoConnectionBind } } };
  this.disconnect = vi.fn();
});

vi.mock('laravel-echo', () => ({
  default: EchoConstructor,
}));

vi.mock('pusher-js', () => ({
  default: class FakePusher {},
}));

describe('getEcho — chargement différé', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    delete window.Pusher;
  });

  it("ne tente rien sans clé Pusher configurée, et ne casse pas l'appelant", async () => {
    vi.stubEnv('VITE_PUSHER_APP_KEY', '');
    const { getEcho } = await import('@/shared/lib/echo');

    const echo = await getEcho();

    expect(echo).toBeNull();
    expect(EchoConstructor).not.toHaveBeenCalled();
  });

  it('importe laravel-echo/pusher-js dynamiquement et construit une seule instance', async () => {
    vi.stubEnv('VITE_PUSHER_APP_KEY', 'test-key');
    const { getEcho } = await import('@/shared/lib/echo');

    const echo = await getEcho();

    expect(echo).not.toBeNull();
    expect(EchoConstructor).toHaveBeenCalledTimes(1);
    expect(window.Pusher).toBeDefined();
  });

  it('renvoie la même instance sans reconstruire au second appel', async () => {
    vi.stubEnv('VITE_PUSHER_APP_KEY', 'test-key');
    const { getEcho } = await import('@/shared/lib/echo');

    const first = await getEcho();
    const second = await getEcho();

    expect(second).toBe(first);
    expect(EchoConstructor).toHaveBeenCalledTimes(1);
  });

  it('ne construit qu’une seule instance quand deux appels concurrents démarrent avant la résolution du premier', async () => {
    vi.stubEnv('VITE_PUSHER_APP_KEY', 'test-key');
    const { getEcho } = await import('@/shared/lib/echo');

    const [first, second] = await Promise.all([getEcho(), getEcho()]);

    expect(first).toBe(second);
    expect(EchoConstructor).toHaveBeenCalledTimes(1);
  });
});
