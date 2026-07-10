/**
 * StatsCard — Carte de statistique Érudit
 *
 * Variants color : accent | primary | green | amber | red | blue | neutral
 */

import { cn } from '@/shared/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const iconColors = {
  accent: 'bg-[var(--accent-subtle)] text-[var(--accent)]',
  primary: 'bg-[var(--primary-subtle)] text-[var(--primary)]',
  green: 'bg-[var(--green-subtle)] text-[var(--green)]',
  amber: 'bg-[var(--amber-subtle)] text-[var(--amber)]',
  red: 'bg-[var(--red-subtle)] text-[var(--red)]',
  blue: 'bg-[var(--blue-subtle)] text-[var(--blue)]',
  emerald: 'bg-[var(--emerald-subtle)] text-[var(--emerald)]',
  sky: 'bg-[var(--sky-subtle)] text-[var(--sky)]',
  purple: 'bg-[var(--purple-subtle)] text-[var(--purple)]',
  violet: 'bg-[var(--violet-subtle)] text-[var(--violet)]',
  neutral: 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]',
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'accent',
  className,
  onClick,
}) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend > 0
      ? 'text-[var(--green)]'
      : trend < 0
        ? 'text-[var(--red)]'
        : 'text-[var(--text-tertiary)]';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--surface-raised)] shadow-[var(--shadow-1)] transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-[var(--shadow-3)]',
        className
      )}
    >
      <div className="relative p-5 lg:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            {title}
          </p>
          {Icon && (
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200',
                iconColors[color]
              )}
            >
              <Icon className="h-4.5 w-4.5" />
            </div>
          )}
        </div>

        <div className="mt-2 flex items-baseline gap-3">
          <span className="font-fraunces text-3xl font-bold leading-tight text-[var(--text-primary)] tabular-nums">
            {value}
          </span>

          {trend !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-sm font-medium',
                trendColor
              )}
            >
              <TrendIcon className="h-3.5 w-3.5" />
              {Math.abs(trend)}%
            </span>
          )}
        </div>

        {trendLabel && (
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            {trendLabel}
          </p>
        )}
      </div>
    </div>
  );
}
