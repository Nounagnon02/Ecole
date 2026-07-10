/**
 * Button — Bouton Érudit
 *
 * Variants : primary (cinabre) | secondary (teal) | ghost | outline | danger
 * Sizes    : sm | md | lg
 */

import { forwardRef } from 'react';
import { cn } from '@/shared/lib/utils';

const variants = {
  primary:
    'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)]',
  secondary:
    'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]',
  ghost:
    'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-subtle)]',
  outline:
    'border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-subtle)]',
  danger:
    'bg-[var(--red)] text-white hover:bg-[var(--red-hover)]',
};

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    className,
    disabled,
    loading,
    icon,
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]',
        'disabled:pointer-events-none disabled:opacity-50',
        'select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children && <span className="truncate">{children}</span>}
    </button>
  );
});

export default Button;
