/**
 * Card — Carte Érudit
 *
 * Variants : default | elevated | outline | flat
 * Sous-composants : Card.Header, Card.Body, Card.Footer, Card.Title, Card.Description
 */

import { forwardRef } from 'react';
import { cn } from '@/shared/lib/utils';

const variantStyles = {
  default:
    'border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-1)]',
  elevated:
    'border border-[var(--border-light)] bg-[var(--surface-raised)] shadow-[var(--shadow-3)]',
  outline:
    'border border-[var(--border)] bg-transparent',
  flat: 'bg-[var(--surface-subtle)]',
};

function Card({ children, className, variant = 'default', hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-200',
        variantStyles[variant] || variantStyles.default,
        hover &&
          'cursor-pointer hover:shadow-[var(--shadow-4)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = forwardRef(function CardHeader({ children, className, action, padding = true }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between gap-4',
        padding && 'px-5 pt-5 lg:px-6 lg:pt-6',
        className
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
});

Card.Body = forwardRef(function CardBody({ children, className, padding = true }, ref) {
  return (
    <div ref={ref} className={cn('flex-1', padding && 'px-5 py-5 lg:px-6 lg:py-6', className)}>
      {children}
    </div>
  );
});

Card.Footer = forwardRef(function CardFooter({ children, className, padding = true }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3',
        padding && 'px-5 pb-5 pt-0 lg:px-6 lg:pb-6',
        className
      )}
    >
      {children}
    </div>
  );
});

Card.Title = forwardRef(function CardTitle({ children, className, as: Component = 'h3' }, ref) {
  return (
    <Component
      ref={ref}
      className={cn('font-fraunces text-lg font-semibold leading-tight text-[var(--text-primary)]', className)}
    >
      {children}
    </Component>
  );
});

Card.Description = forwardRef(function CardDescription({ children, className }, ref) {
  return (
    <p ref={ref} className={cn('text-sm text-[var(--text-secondary)]', className)}>
      {children}
    </p>
  );
});

export { Card };
export default Card;
