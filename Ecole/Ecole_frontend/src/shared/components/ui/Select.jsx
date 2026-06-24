/**
 * Select — Menu déroulant premium v3
 *
 * Composant contrôlé avec icône, placeholder, états error/disabled.
 * Style natif amélioré, prêt pour future migration vers Radix.
 */

import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const Select = forwardRef(function Select(
  { label, error, helperText, options, placeholder, className, icon: Icon, variant = 'default', ...props },
  ref
) {
  const variantStyles = {
    default:
      'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 focus:border-indigo-500 dark:focus:border-indigo-400',
    glass:
      'border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/70 focus:border-indigo-400/50',
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
          {props.required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        )}

        <select
          ref={ref}
          className={cn(
            'h-10 w-full appearance-none rounded-xl px-3 text-sm text-neutral-900 outline-none transition-all duration-200 placeholder:text-neutral-400',
            'focus:ring-1 focus:ring-indigo-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50 dark:disabled:bg-neutral-800/50',
            'dark:text-white',
            Icon && 'pl-10',
            variantStyles[variant],
            error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500'
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{helperText}</p>
      )}
    </div>
  );
});

export { Select };
export default Select;
