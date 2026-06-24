/**
 * Tooltip — Infobulle premium v3
 *
 * CSS-only tooltip au survol. Utilise le pattern group/tooltip.
 * Pour des tooltips plus complexes, migrer vers Radix Tooltip.
 *
 * Props : content, side (top, bottom, left, right), delay
 */

import { cn } from '@/shared/lib/utils';

function Tooltip({ children, content, side = 'top', className }) {
  const sideStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900 dark:border-t-neutral-50',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-neutral-900 dark:border-b-neutral-50',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-neutral-900 dark:border-l-neutral-50',
    right:
      'right-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-neutral-900 dark:border-r-neutral-50',
  };

  return (
    <div className={cn('group relative inline-flex', className)}>
      {children}
      <div
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap',
          'rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-neutral-50 dark:text-neutral-900',
          'opacity-0 transition-all duration-150 group-hover:opacity-100',
          sideStyles[side]
        )}
      >
        {content}
        <div className={cn('absolute', arrowStyles[side])} />
      </div>
    </div>
  );
}

export { Tooltip };
export default Tooltip;
