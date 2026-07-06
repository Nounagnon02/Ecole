/**
 * Auth store tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import useAuthStore from '@/shared/stores/auth-store';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state).toHaveProperty('user');
    expect(state).toHaveProperty('isAuthenticated');
    expect(state).toHaveProperty('isLoading');
    expect(state.isAuthenticated).toBe(false);
  });

  it('handles setUser action', () => {
    const mockUser = { id: 1, nom: 'Test', role: 'directeur' };
    useAuthStore.getState().setUser(mockUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('handles logout action', () => {
    // Set user first
    useAuthStore.getState().setUser({ id: 1, nom: 'Test', role: 'directeur' });
    // Then logout
    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('handles loading state', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);

    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
