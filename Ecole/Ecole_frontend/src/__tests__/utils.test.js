/**
 * Utility function tests
 */
import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate, getInitials, truncate } from '@/shared/lib/utils';

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('handles undefined values', () => {
    expect(cn('a', undefined, 'b')).toBe('a b');
  });
});

describe('formatCurrency()', () => {
  it('formats numbers with space separators', () => {
    const result = formatCurrency(15000);
    expect(result).toContain('15');
    expect(result).toContain('000');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBeDefined();
    expect(formatCurrency(0)).not.toBe('');
  });

  it('handles decimals', () => {
    const result = formatCurrency(1500.5);
    expect(result).toBeDefined();
  });
});

describe('formatDate()', () => {
  it('formats ISO date strings', () => {
    const result = formatDate('2026-07-06');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('handles Date objects', () => {
    const result = formatDate(new Date('2026-07-06'));
    expect(result).toBeDefined();
  });

  it('returns empty string for null/undefined', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });
});

describe('getInitials()', () => {
  it('extracts initials from full name', () => {
    expect(getInitials('Jean Dupont')).toBe('JD');
  });

  it('handles single name', () => {
    expect(getInitials('Jean')).toBe('J');
  });

  it('handles empty string', () => {
    expect(getInitials('')).toBe('');
  });

  it('handles null/undefined', () => {
    expect(getInitials(null)).toBe('');
    expect(getInitials(undefined)).toBe('');
  });
});

describe('truncate()', () => {
  it('truncates long strings with ellipsis', () => {
    expect(truncate('Hello World This Is Long', 10)).toBe('Hello Worl…');
  });

  it('does not truncate short strings', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('');
  });
});
