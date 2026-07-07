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
      sessionLastVerified: null,
    });
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state).toHaveProperty('user');
    expect(state).toHaveProperty('isAuthenticated');
    expect(state).toHaveProperty('isLoading');
    expect(state.isAuthenticated).toBe(false);
  });

  it('handles setUser via internal state update', () => {
    const mockUser = { id: 1, nom: 'Test', role: 'directeur' };
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('handles clearSession action', () => {
    // Set user first
    useAuthStore.setState({ user: { id: 1, nom: 'Test', role: 'directeur' }, isAuthenticated: true });
    // Then clear
    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('tracks isLoading state', () => {
    expect(useAuthStore.getState().isLoading).toBe(false);

    useAuthStore.setState({ isLoading: true });
    expect(useAuthStore.getState().isLoading).toBe(true);

    useAuthStore.setState({ isLoading: false });
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('has hasRole and hasAnyRole helpers', () => {
    useAuthStore.setState({
      user: { id: 1, nom: 'Directeur', role: 'directeur' },
      isAuthenticated: true,
    });

    expect(useAuthStore.getState().hasRole('directeur')).toBe(true);
    expect(useAuthStore.getState().hasRole('enseignant')).toBe(false);
    expect(useAuthStore.getState().hasAnyRole(['enseignant', 'directeur'])).toBe(true);
    expect(useAuthStore.getState().hasAnyRole(['enseignant', 'eleve'])).toBe(false);
  });
});
