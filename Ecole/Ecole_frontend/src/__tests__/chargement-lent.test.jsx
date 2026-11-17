import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LoadingSpinner } from '@/shared/components/ui/Skeleton';

afterEach(() => vi.useRealTimers());

describe('chargement lent', () => {
  it('dit que la connexion est lente après 5 s, propose de réessayer après 15 s', () => {
    vi.useFakeTimers();
    render(<LoadingSpinner />);
    expect(screen.queryByText(/connexion est lente/)).not.toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText(/connexion est lente/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Réessayer/ })).not.toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(10000); });
    expect(screen.getByRole('button', { name: /Réessayer/ })).toBeInTheDocument();
  });
});
