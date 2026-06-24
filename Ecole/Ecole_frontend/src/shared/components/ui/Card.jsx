/**
 * Card — Premium glassmorphism card with depth variants
 *
 * Variants : default | glass | elevated | outline | flat
 * Sub-components : Card.Header, Card.Body, Card.Footer, Card.Title, Card.Description
 */

import { forwardRef } from 'react';
import { cn } from '@/shared/lib/utils';

const variantStyles = {
  default:
    'border border-neutral-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.2)]',
  glass:
    'border border-white/20 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-[12px] dark:border-white/[0.06] dark:bg-neutral-950/70 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
  elevated:
    'border border-neutral-200/80 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.2)]',
  outline:
    'border-2 border-neutral-200 bg-transparent dark:border-neutral-700',
  flat: 'bg-neutral-50 dark:bg-neutral-900',
};

function Card({ children, className, variant = 'default', hover = false, glow = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-200',
        variantStyles[variant] || variantStyles.default,
        hover &&
          'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_25px_rgba(0,0,0,0.35)]',
        glow && 'shadow-[0_0_20px_rgba(99,102,241,0.15)] dark:shadow-[0_0_20px_rgba(99,102,241,0.08)]',
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
      className={cn(
        'text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100',
        className
      )}
    >
      {children}
    </Component>
  );
});

Card.Description = forwardRef(function CardDescription({ children, className }, ref) {
  return (
    <p ref={ref} className={cn('text-sm text-neutral-500 dark:text-neutral-400', className)}>
      {children}
    </p>
  );
});

export { Card };
export default Card;
