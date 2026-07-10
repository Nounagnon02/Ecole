/**
 * EmptyState — État vide élégant pour listes/tableaux sans données
 *
 * Props :
 * - icon    : composant d'icône Lucide (défaut : Inbox)
 * - title   : titre principal (défaut : "Aucune donnée")
 * - message : description optionnelle
 * - action  : { label, onClick } bouton d'action optionnel
 * - size    : sm | md | lg
 */

import { cn } from '@/shared/lib/utils';

const sizes = {
  sm: { icon: 'h-8 w-8', title: 'text-base', wrapper: 'py-8' },
  md: { icon: 'h-12 w-12', title: 'text-lg', wrapper: 'py-12' },
  lg: { icon: 'h-16 w-16', title: 'text-xl', wrapper: 'py-16' },
};

function EmptyState({
  icon: Icon,
  title = 'Aucune donnée',
  message,
  action,
  size = 'md',
  className,
}) {
  const s = sizes[size] || sizes.md;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        s.wrapper,
        className
      )}
      role="status"
    >
      {Icon && (
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <Icon className={cn('text-neutral-400 dark:text-neutral-500', s.icon)} />
        </div>
      )}
      <h3 className={cn('font-semibold text-neutral-700 dark:text-neutral-300', s.title)}>
        {title}
      </h3>
      {message && (
        <p className="mt-1 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
          {message}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * ErrorDisplay — Message d'erreur inline
 */
function ErrorDisplay({ message = 'Une erreur est survenue', onRetry, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-8 dark:border-red-900/30 dark:bg-red-950/20',
        className
      )}
      role="alert"
    >
      <p className="text-sm font-medium text-red-700 dark:text-red-400">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}

export { EmptyState, ErrorDisplay };
export default EmptyState;
