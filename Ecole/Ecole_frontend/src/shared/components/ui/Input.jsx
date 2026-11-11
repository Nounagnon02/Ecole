/**
 * Input — Champ de texte Érudit
 *
 * Variants : default | error
 * Sizes    : sm | md | lg
 */

import { forwardRef, useState, useId, isValidElement } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useTranslation } from '@/shared/i18n';

const sizes = {
  sm: 'min-h-11 px-3 text-sm',
  md: 'min-h-11 px-4 text-base',
  lg: 'min-h-[52px] px-4 text-base',
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
  const { t } = useTranslation();
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
          <div className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
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
            icon && 'ps-10',
            isPassword && 'pe-12',
            sizes[size],
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute end-0 top-1/2 flex h-11 w-11 items-center justify-center -translate-y-1/2 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
            aria-label={showPassword ? t('components.input.masquer_le_mot_de_passe') : t('components.input.afficher_le_mot_de_passe')}
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
