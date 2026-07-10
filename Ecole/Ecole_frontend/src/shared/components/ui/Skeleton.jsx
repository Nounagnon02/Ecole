/**
 * Skeleton — Placeholder de chargement Érudit
 *
 * Variants : text, avatar, card, table-row, custom
 * Animé avec pulse simple (opacité), sans shimmer
 */

import { cn } from '@/shared/lib/utils';

function Skeleton({ className, variant = 'text' }) {
  const variants = {
    text: 'h-4 w-full rounded',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-48 w-full rounded-xl',
    'table-row': 'h-12 w-full rounded-lg',
    circle: 'h-10 w-10 rounded-full',
    button: 'h-9 w-24 rounded-lg',
    badge: 'h-5 w-16 rounded-full',
    input: 'h-10 w-full rounded-lg',
    title: 'h-7 w-2/3 rounded-lg',
    subtitle: 'h-5 w-1/2 rounded-lg',
    chart: 'h-64 w-full rounded-xl',
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-[var(--border-light)] dark:bg-[var(--border)]',
        variants[variant] || variant,
        className
      )}
    />
  );
}

/* ─── LoadingSpinner ────────────────────────────────────────────────────── */
function LoadingSpinner({ message, variant = 'fullscreen', size = 'md' }) {
  const sizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-[3px]',
  };

  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full border-[var(--border)] border-t-[var(--accent)]',
        sizes[size]
      )}
    />
  );

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center gap-3 py-8" role="status" aria-label="Chargement">
        {spinner}
        {message && <span className="text-sm text-[var(--text-secondary)]">{message}</span>}
        <span className="sr-only">Chargement en cours…</span>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-full flex-col items-center justify-center gap-4"
      role="status"
      aria-label="Chargement"
    >
      {spinner}
      {message && <p className="text-sm text-[var(--text-secondary)]">{message}</p>}
      <span className="sr-only">Chargement en cours…</span>
    </div>
  );
}

/* ─── Compositions squelettes ───────────────────────────────────────────── */

function SkeletonPage({ sections = 2 }) {
  return (
    <div className="space-y-6 p-6" aria-label="Contenu en chargement">
      <div className="flex items-center justify-between">
        <Skeleton variant="title" className="!h-8 !w-64" />
        <Skeleton variant="button" />
      </div>
      {Array.from({ length: sections }, (_, i) => (
        <div key={i} className="space-y-4 rounded-xl border border-[var(--border-light)] p-6">
          <Skeleton variant="subtitle" className="!w-40" />
          <Skeleton variant="text" />
          <Skeleton variant="text" className="!w-5/6" />
          <Skeleton variant="text" className="!w-3/4" />
        </div>
      ))}
    </div>
  );
}

function SkeletonCard({ rows = 3 }) {
  return (
    <div className="rounded-xl border border-[var(--border-light)] p-6">
      <Skeleton variant="subtitle" className="mb-4 !w-40" />
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} variant="text" className={i === rows - 1 ? '!w-2/3' : ''} />
        ))}
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-1" role="progressbar" aria-label="Tableau en chargement">
      <div className="flex gap-4 px-4 py-3">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} variant="text" className={i === 0 ? '!w-1/4' : '!w-1/6'} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-4 border-t border-[var(--border-light)] px-4 py-3">
          {Array.from({ length: cols }, (_, j) => (
            <Skeleton key={j} variant="text" className={j === 0 ? '!w-1/4' : '!w-1/6'} />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonStats({ count = 4, cols = 4 }) {
  return (
    <div
      className={cn('grid gap-4', {
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4': cols === 4,
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3': cols === 3,
        'grid-cols-1 sm:grid-cols-2': cols === 2,
      })}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl border border-[var(--border-light)] p-5">
          <Skeleton variant="subtitle" className="!w-24" />
          <Skeleton variant="title" className="mt-2 !w-16" />
          <Skeleton variant="text" className="mt-1 !w-20" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, LoadingSpinner, SkeletonPage, SkeletonCard, SkeletonTable, SkeletonStats };
export default Skeleton;
