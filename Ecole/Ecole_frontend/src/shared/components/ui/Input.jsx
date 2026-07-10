/**
 * Input — Champ de texte Érudit
 *
 * Variants : default | error
 * Sizes    : sm | md | lg
 */

import { forwardRef, useState, useId, isValidElement } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

const Input = forwardRef(function Input(
  {
    className,
    type = 'text',
    size = 'md',
    error,
    label,
    helperText,
    icon,
    id,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  // Accept icon as React element (JSX) or component type (function/forwardRef)
  const iconIsElement = isValidElement(icon);
  // Capitalize so JSX renders it as a component rather than a DOM <icon> tag
  const IconComponent = iconIsElement ? null : icon;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-primary)]">
          {label}
          {props.required && <span className="ml-0.5 text-[var(--red)]">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            {iconIsElement ? icon : <IconComponent className="h-4 w-4" />}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            'w-full rounded-lg border outline-none transition-all duration-150',
            'bg-[var(--surface-raised)] text-[var(--text-primary)]',
            'placeholder:text-[var(--text-tertiary)]',
            'focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'read-only:cursor-default read-only:opacity-80',
            error
              ? 'border-[var(--red)] focus-visible:border-[var(--red)] focus-visible:ring-[var(--red-subtle)]'
              : 'border-[var(--border)] hover:border-[var(--border-heavy)]',
            icon && 'pl-10',
            isPassword && 'pr-10',
            sizes[size],
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
            tabIndex={-1}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-[var(--red)]">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-xs text-[var(--text-tertiary)]">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
