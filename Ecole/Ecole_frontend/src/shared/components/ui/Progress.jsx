/**
 * Progress — Barre de progression premium v3
 *
 * Variants : default (indigo), success (emerald), warning (amber), danger (red)
 * Sizes : sm, md, lg
 * Options : showValue, animated, striped
 */

import { cn } from '@/shared/lib/utils';

function Progress({ value = 0, max = 100, variant = 'default', size = 'md', showValue, animated = true, className }) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);

  const variants = {
    default: 'bg-indigo-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800',
          sizes[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out-expo',
            variants[variant],
            animated && percent > 0 && 'animate-pulse-subtle',
            variant === 'default' && 'bg-gradient-to-r from-indigo-500 to-indigo-400'
          )}
          style={{ width: `${percent}%` }}
        >
          {size === 'lg' && showValue && (
            <span className="flex h-full items-center justify-end px-2 text-[10px] font-semibold text-white">
              {Math.round(percent)}%
            </span>
          )}
        </div>
      </div>
      {showValue && size !== 'lg' && (
        <p className="mt-1 text-right text-xs text-neutral-500">{Math.round(percent)}%</p>
      )}
    </div>
  );
}

export { Progress };
export default Progress;
