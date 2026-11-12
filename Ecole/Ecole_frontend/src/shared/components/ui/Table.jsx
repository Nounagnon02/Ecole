/**
 * Table — Tableau de données premium v3 (Linear/Notion-inspired)
 *
 * Sous-composants : Table.Header, Table.Head, Table.Body, Table.Row, Table.Cell
 * Props : sortable, stickyHeader, compact, striped
 */

import { forwardRef } from 'react';
import { cn } from '@/shared/lib/utils';
import { useTranslation } from '@/shared/i18n';

function Table({ children, className, wrapperClassName, stickyHeader = false, label }) {
  const { t } = useTranslation();
  // Zone qui défile : atteignable au clavier (flèches) et nommée, sinon un
  // tableau trop large ne se lit qu'à la souris.
  return (
    <div role="region" aria-label={label || t('common.tableau_defilant')} tabIndex={0}
      className={cn('w-full overflow-auto rounded-xl border border-[var(--border)]', wrapperClassName)}>
      <table className={cn('w-full caption-bottom text-sm', className)}>
        {children}
      </table>
    </div>
  );
}

Table.Header = forwardRef(function TableHeader({ children, className, sticky = false }, ref) {
  return (
    <thead
      ref={ref}
      className={cn(
        'border-b border-[var(--border)] ',
        sticky && 'sticky top-0 z-10',
        className
      )}
    >
      <tr>{children}</tr>
    </thead>
  );
});

Table.Head = forwardRef(function TableHead(
  { children, className, sortable, sortDir, onSort, align = 'left' },
  ref
) {
  const alignments = {
    left: 'text-start',
    center: 'text-center',
    right: 'text-end',
  };

  return (
    <th
      ref={ref}
      className={cn(
        'h-11 px-4 align-middle text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)] ',
        alignments[align],
        sortable && 'cursor-pointer select-none hover:text-[var(--text-primary)] ',
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      <div className={cn('inline-flex items-center gap-1.5', alignments[align])}>
        {children}
        {sortable && sortDir && (
          <span className="inline-flex flex-col leading-none">
            <svg
              width="8"
              height="4"
              viewBox="0 0 8 4"
              className={cn('transition-colors', sortDir === 'asc' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] ')}
            >
              <path d="M4 0l4 4H0z" fill="currentColor" />
            </svg>
            <svg
              width="8"
              height="4"
              viewBox="0 0 8 4"
              className={cn('transition-colors', sortDir === 'desc' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] ')}
            >
              <path d="M4 4L0 0h8z" fill="currentColor" />
            </svg>
          </span>
        )}
        {sortable && !sortDir && (
          <span className="inline-flex flex-col leading-none opacity-0 group-hover:opacity-100">
            <svg width="8" height="4" viewBox="0 0 8 4" className="text-[var(--text-secondary)] ">
              <path d="M4 0l4 4H0z" fill="currentColor" />
            </svg>
            <svg width="8" height="4" viewBox="0 0 8 4" className="text-[var(--text-secondary)] ">
              <path d="M4 4L0 0h8z" fill="currentColor" />
            </svg>
          </span>
        )}
      </div>
    </th>
  );
});

Table.Body = forwardRef(function TableBody({ children, className }, ref) {
  return (
    <tbody ref={ref} className={cn('', className)}>
      {children}
    </tbody>
  );
});

Table.Row = forwardRef(function TableRow(
  { children, className, onClick, highlight, selected },
  ref
) {
  return (
    <tr
      ref={ref}
      onClick={onClick}
      className={cn(
        'border-b border-[var(--border-light)] transition-colors last:border-b-0 ',
        'group',
        onClick && 'cursor-pointer',
        selected
          ? 'bg-[var(--accent-subtle)]'
          : highlight
            ? 'bg-[var(--accent-subtle)]/70'
            : 'hover:bg-[var(--surface)] ',
        className
      )}
    >
      {children}
    </tr>
  );
});

Table.Cell = forwardRef(function TableCell({ children, className, align = 'left' }, ref) {
  const alignments = {
    left: 'text-start',
    center: 'text-center',
    right: 'text-end',
  };

  return (
    <td
      ref={ref}
      className={cn(
        'p-4 align-middle text-[var(--text-primary)] ',
        alignments[align],
        className
      )}
    >
      {children}
    </td>
  );
});

export { Table };
export default Table;
