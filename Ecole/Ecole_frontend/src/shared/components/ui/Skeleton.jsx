/**
 * Skeleton — Loading placeholder premium v3
 *
 * Variants : text, avatar, card, table-row, custom shape
 * Animé avec shimmer gradient
 *
 * Compositions exportées :
 *   SkeletonPage    — page complète (header + sections)
 *   SkeletonCard    — carte avec contenu squelettique
 *   SkeletonTable   — ligne de tableau + header
 *   SkeletonStats   — grille de stats cards
 *   LoadingSpinner  — spinner centré full-page ou inline
 */

import { cn } from '@/shared/lib/utils';

/* ─── Skeleton de base ──────────────────────────────────────────────────── */
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
        'animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800',
        variants[variant] || variant,
        className
      )}
      style={{
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

/* ─── LoadingSpinner ────────────────────────────────────────────────────── */
function LoadingSpinner({ message, variant = 'fullscreen', size = 'md' }) {
  const sizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-[3px]',
    lg: 'h-14 w-14 border-4',
  };

  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full border-neutral-200 border-t-indigo-600 dark:border-neutral-800 dark:border-t-indigo-400',
        sizes[size]
      )}
    />
  );

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center gap-3 py-8" role="status" aria-label="Chargement">
        {spinner}
        {message && <span className="text-sm text-neutral-500 dark:text-neutral-400">{message}</span>}
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
      {message && <p className="text-sm text-neutral-500 dark:text-neutral-400">{message}</p>}
      <span className="sr-only">Chargement en cours…</span>
    </div>
  );
}

/* ─── Compositions squelettes ───────────────────────────────────────────── */

/**
 * SkeletonPage — squelette de page complète (titre + sections)
 */
function SkeletonPage({ sections = 2 }) {
  return (
    <div className="space-y-6 p-6" aria-label="Contenu en chargement">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton variant="title" className="!h-8 !w-64" />
        <Skeleton variant="button" />
      </div>
      {/* Sections */}
      {Array.from({ length: sections }, (_, i) => (
        <div key={i} className="space-y-4 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
          <Skeleton variant="subtitle" className="!w-40" />
          <Skeleton variant="text" />
          <Skeleton variant="text" className="!w-5/6" />
          <Skeleton variant="text" className="!w-3/4" />
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonCard — carte squelette (titre + contenu)
 */
function SkeletonCard({ rows = 3 }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
      <Skeleton variant="subtitle" className="mb-4 !w-40" />
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} variant="text" className={i === rows - 1 ? '!w-2/3' : ''} />
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonTable — squelette de tableau (header + lignes)
 */
function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-1" role="progressbar" aria-label="Tableau en chargement">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} variant="text" className={i === 0 ? '!w-1/4' : '!w-1/6'} />
        ))}
      </div>
      {/* Lignes */}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-4 border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
          {Array.from({ length: cols }, (_, j) => (
            <Skeleton key={j} variant="text" className={j === 0 ? '!w-1/4' : '!w-1/6'} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonStats — grille de cartes de statistiques
 */
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
        <div key={i} className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
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
