import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import useInactivite, { DELAI_SENSIBLE_MS, DELAI_STANDARD_MS, delaiPour } from '@/shared/lib/useInactivite';
import useAuthStore from '@/shared/stores/auth-store';
import { signIn } from './helpers/render';

function Sonde({ surDeconnexion }) { useInactivite(surDeconnexion); return null; }

let logout;
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

function monter(role) {
  signIn(role);
  logout = vi.fn().mockResolvedValue();
  useAuthStore.setState({ logout });
  const surDeconnexion = vi.fn();
  render(<Sonde surDeconnexion={surDeconnexion} />);
  return surDeconnexion;
}

describe('déconnexion après inactivité', () => {
  it('donne un délai court à la direction et à la comptabilité', () => {
    expect(delaiPour('directeur')).toBe(DELAI_SENSIBLE_MS);
    expect(delaiPour('comptable')).toBe(DELAI_SENSIBLE_MS);
    expect(delaiPour('parent')).toBe(DELAI_STANDARD_MS);
  });

  it('déconnecte le comptable après 15 minutes sans activité', async () => {
    const surDeconnexion = monter('comptable');

    await act(async () => { vi.advanceTimersByTime(DELAI_SENSIBLE_MS - 1000); });
    expect(logout).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(2000); });

    expect(logout).toHaveBeenCalledTimes(1);
    expect(surDeconnexion).toHaveBeenCalled();
  });

  it('repart de zéro à chaque activité', async () => {
    monter('comptable');

    await act(async () => { vi.advanceTimersByTime(DELAI_SENSIBLE_MS - 1000); });
    act(() => { window.dispatchEvent(new Event('keydown')); });
    await act(async () => { vi.advanceTimersByTime(DELAI_SENSIBLE_MS - 1000); });

    expect(logout).not.toHaveBeenCalled();
  });

  it('laisse une heure aux autres rôles', async () => {
    monter('parent');

    await act(async () => { vi.advanceTimersByTime(DELAI_SENSIBLE_MS + 1000); });
    expect(logout).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(DELAI_STANDARD_MS); });
    expect(logout).toHaveBeenCalled();
  });
});
