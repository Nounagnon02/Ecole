/**
 * Badge — Indicateur de statut Érudit
 *
 * Variants : default | primary | success | warning | danger | info | accent
 * Sizes    : sm | md | lg
 */

import { cn } from '@/shared/lib/utils';

const variants = {
  default: 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
  primary: 'bg-[var(--primary-subtle)] text-[var(--primary)]',
  success: 'bg-[var(--green-subtle)] text-[var(--green)]',
  warning: 'bg-[var(--amber-subtle)] text-[var(--amber)]',
  danger: 'bg-[var(--red-subtle)] text-[var(--red)]',
  info: 'bg-[var(--blue-subtle)] text-[var(--blue)]',
  accent: 'bg-[var(--accent-subtle)] text-[var(--accent)]',
  // Hues complémentaires (alignés sur les StatsCard de dashboards)
  emerald: 'bg-[var(--emerald-subtle)] text-[var(--emerald)]',
  sky: 'bg-[var(--sky-subtle)] text-[var(--sky)]',
  purple: 'bg-[var(--purple-subtle)] text-[var(--purple)]',
  violet: 'bg-[var(--violet-subtle)] text-[var(--violet)]',
};

const dotColors = {
  default: 'bg-[var(--text-tertiary)]',
  primary: 'bg-[var(--primary)]',
  success: 'bg-[var(--green)]',
  warning: 'bg-[var(--amber)]',
  danger: 'bg-[var(--red)]',
  info: 'bg-[var(--blue)]',
  accent: 'bg-[var(--accent)]',
  emerald: 'bg-[var(--emerald)]',
  sky: 'bg-[var(--sky)]',
  purple: 'bg-[var(--purple)]',
  violet: 'bg-[var(--violet)]',
};

const sizes = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot,
  removable,
  onRemove,
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100"
          aria-label="Supprimer"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
            <path d="M1 1l6 6M7 1l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  );
}
