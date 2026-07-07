/**
 * Input — Champ de texte premium v3
 *
 * Variants : default | error | glass
 * Sizes    : sm | md | lg
 */

import { forwardRef, useState, useId } from 'react';
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
    variant = 'default',
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
  const IconComponent = icon;

  const variantStyles = {
    default: cn(
      'border bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white',
      error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700'
        : 'border-neutral-300 dark:border-neutral-700'
    ),
    glass: cn(
      'border border-white/20 bg-white/70 text-neutral-900 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/70 dark:text-white',
      error
        ? 'border-red-300/70 dark:border-red-700/70'
        : 'border-neutral-200/70 dark:border-neutral-700/50'
    ),
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
          {props.required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {IconComponent && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
            {typeof IconComponent === 'function' ? <IconComponent className="h-4 w-4" /> : IconComponent}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            'w-full rounded-xl outline-none transition-all duration-150',
            'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
            'focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'read-only:cursor-default read-only:opacity-80',
            variantStyles[variant],
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
            tabIndex={-1}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-500">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-xs text-neutral-500 dark:text-neutral-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
