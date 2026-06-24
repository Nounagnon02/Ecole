/**
 * Avatar — Photo de profil / initiales
 *
 * Sizes : sm | md | lg | xl
 */

import { cn, getInitials, stringToColor } from '@/shared/lib/utils';

const sizes = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-lg',
};

export default function Avatar({
  src,
  name,
  size = 'md',
  className,
  status,
}) {
  const initials = getInitials(name);
  const bgColor = stringToColor(name);

  if (src) {
    return (
      <div className="relative inline-flex shrink-0">
        <img
          src={src}
          alt={name || 'Avatar'}
          className={cn(
            'rounded-full object-cover',
            sizes[size],
            className
          )}
        />
        {status && <StatusDot status={status} size={size} />}
      </div>
    );
  }

  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-semibold text-white',
          sizes[size],
          className
        )}
        style={{ backgroundColor: bgColor }}
        title={name}
      >
        {initials}
      </div>
      {status && <StatusDot status={status} size={size} />}
    </div>
  );
}

function StatusDot({ status, size }) {
  const dotSizes = {
    sm: 'h-2 w-2 ring-1',
    md: 'h-2.5 w-2.5 ring-2',
    lg: 'h-3 w-3 ring-2',
    xl: 'h-3.5 w-3.5 ring-2',
  };

  return (
    <span
      className={cn(
        'absolute -right-0.5 -bottom-0.5 rounded-full border-white dark:border-neutral-900',
        status === 'online' && 'bg-emerald-500',
        status === 'away' && 'bg-amber-500',
        status === 'busy' && 'bg-red-500',
        status === 'offline' && 'bg-neutral-400',
        dotSizes[size]
      )}
    />
  );
}
