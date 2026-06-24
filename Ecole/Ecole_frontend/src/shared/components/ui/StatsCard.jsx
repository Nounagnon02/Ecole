/**
 * StatsCard — Carte de statistique premium v3 avec effet glassmorphique
 *
 * Variants color : indigo | emerald | amber | red | sky | purple | neutral
 */

import { cn } from '@/shared/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const iconColors = {
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
  sky: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

const glowColors = {
  indigo: 'shadow-[0_0_20px_rgba(99,102,241,0.12)]',
  emerald: 'shadow-[0_0_20px_rgba(16,185,129,0.12)]',
  amber: 'shadow-[0_0_20px_rgba(245,158,11,0.12)]',
  red: 'shadow-[0_0_20px_rgba(239,68,68,0.12)]',
  sky: 'shadow-[0_0_20px_rgba(59,130,246,0.12)]',
  purple: 'shadow-[0_0_20px_rgba(139,92,246,0.12)]',
  neutral: '',
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'indigo',
  variant = 'default',
  className,
  onClick,
}) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend > 0
      ? 'text-emerald-500'
      : trend < 0
        ? 'text-red-500'
        : 'text-neutral-400';

  const cardVariants = {
    default:
      'border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900',
    glass:
      'border border-white/20 bg-white/70 backdrop-blur-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:border-white/[0.06] dark:bg-neutral-950/70 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl transition-all duration-300',
        cardVariants[variant] || cardVariants.default,
        glowColors[color],
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg',
        className
      )}
    >
      {/* Background decoration circle */}
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-[0.03] transition-all duration-500 group-hover:scale-[2] group-hover:opacity-[0.06]">
        <div className={cn('h-full w-full rounded-full', `bg-${color}-500`)} />
      </div>

      <div className="relative p-5 lg:p-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {title}
          </p>
          {Icon && (
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110',
                iconColors[color]
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Value row */}
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
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

        {/* Trend label */}
        {trendLabel && (
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {trendLabel}
          </p>
        )}
      </div>
    </div>
  );
}
