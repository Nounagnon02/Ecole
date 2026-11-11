/**
 * Separator — Séparateur horizontal/vertical premium v3
 *
 * Variants : default, subtle, gradient
 * Orientation : horizontal, vertical
 */

import { cn } from '@/shared/lib/utils';

function Separator({ orientation = 'horizontal', variant = 'default', className }) {
  const variantStyles = {
    default: 'bg-[var(--surface-subtle)] ',
    subtle: 'bg-[var(--surface-subtle)] ',
    gradient: 'bg-gradient-to-r from-transparent via-neutral-200 to-transparent dark:via-neutral-800',
  };

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        variantStyles[variant],
        className
      )}
    />
  );
}

export { Separator };
export default Separator;
