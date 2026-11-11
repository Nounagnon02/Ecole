/**
 * Select — Menu déroulant Érudit
 */

import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const Select = forwardRef(function Select(
  { label, error, helperText, options, placeholder, className, icon: Icon, id, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          {label}
          {props.required && <span className="ml-0.5 text-[var(--red)]">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        )}

        <select
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || helperText ? `${inputId}-help` : undefined}
          className={cn(
            'min-h-11 w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] ps-3 pe-10 text-base text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-tertiary)]',
            'focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            Icon && 'ps-10',
            error && 'border-[var(--red)] focus-visible:border-[var(--red)] focus-visible:ring-[var(--red-subtle)]'
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

        <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
      </div>

      {error && <p id={`${inputId}-help`} className="mt-1 text-xs text-[var(--red)]">{error}</p>}
      {helperText && !error && (
        <p id={`${inputId}-help`} className="mt-1 text-xs text-[var(--text-tertiary)]">{helperText}</p>
      )}
    </div>
  );
});

export { Select };
export default Select;
