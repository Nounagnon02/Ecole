/**
 * Switch — Toggle Érudit
 */

import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

function Switch({ checked, onCheckedChange, size = 'md', label, disabled, className }) {
  const sizes = {
    sm: { track: 'h-5 w-9', thumb: 'h-3.5 w-3.5', translateX: 'translate-x-4' },
    md: { track: 'h-6 w-11', thumb: 'h-4.5 w-4.5', translateX: 'translate-x-5' },
    lg: { track: 'h-7 w-14', thumb: 'h-5.5 w-5.5', translateX: 'translate-x-7' },
  };

  const sizeConfig = sizes[size];

  return (
    <label
      className={cn(
        'inline-flex items-center gap-3',
        disabled && 'cursor-not-allowed opacity-50',
        !disabled && 'cursor-pointer',
        className
      )}
    >
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]',
          sizeConfig.track,
          checked
            ? 'bg-[var(--accent)]'
            : 'bg-[var(--border-heavy)]'
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            'inline-block rounded-full bg-white shadow-sm',
            sizeConfig.thumb,
            checked && sizeConfig.translateX,
            !checked && 'translate-x-0.5'
          )}
        />
      </button>
      {label && (
        <span className="select-none text-sm font-medium text-[var(--text-primary)]">
          {label}
        </span>
      )}
    </label>
  );
}

export { Switch };
export default Switch;
