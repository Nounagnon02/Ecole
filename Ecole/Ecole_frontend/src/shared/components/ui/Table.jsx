/**
 * Table — Tableau de données premium v3 (Linear/Notion-inspired)
 *
 * Sous-composants : Table.Header, Table.Head, Table.Body, Table.Row, Table.Cell
 * Props : sortable, stickyHeader, compact, striped
 */

import { forwardRef } from 'react';
import { cn } from '@/shared/lib/utils';

function Table({ children, className, wrapperClassName, stickyHeader = false }) {
  return (
    <div className={cn('w-full overflow-auto rounded-xl border border-neutral-200 dark:border-neutral-800', wrapperClassName)}>
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
        'border-b border-neutral-200 dark:border-neutral-800',
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
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <th
      ref={ref}
      className={cn(
        'h-11 px-4 align-middle text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400',
        alignments[align],
        sortable && 'cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-200',
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
              className={cn('transition-colors', sortDir === 'asc' ? 'text-indigo-500' : 'text-neutral-300 dark:text-neutral-600')}
            >
              <path d="M4 0l4 4H0z" fill="currentColor" />
            </svg>
            <svg
              width="8"
              height="4"
              viewBox="0 0 8 4"
              className={cn('transition-colors', sortDir === 'desc' ? 'text-indigo-500' : 'text-neutral-300 dark:text-neutral-600')}
            >
              <path d="M4 4L0 0h8z" fill="currentColor" />
            </svg>
          </span>
        )}
        {sortable && !sortDir && (
          <span className="inline-flex flex-col leading-none opacity-0 group-hover:opacity-100">
            <svg width="8" height="4" viewBox="0 0 8 4" className="text-neutral-300 dark:text-neutral-600">
              <path d="M4 0l4 4H0z" fill="currentColor" />
            </svg>
            <svg width="8" height="4" viewBox="0 0 8 4" className="text-neutral-300 dark:text-neutral-600">
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
        'border-b border-neutral-100 transition-colors last:border-b-0 dark:border-neutral-800',
        'group',
        onClick && 'cursor-pointer',
        selected
          ? 'bg-indigo-50/60 dark:bg-indigo-500/8'
          : highlight
            ? 'bg-indigo-50/40 dark:bg-indigo-500/5'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40',
        className
      )}
    >
      {children}
    </tr>
  );
});

Table.Cell = forwardRef(function TableCell({ children, className, align = 'left' }, ref) {
  const alignments = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <td
      ref={ref}
      className={cn(
        'p-4 align-middle text-neutral-700 dark:text-neutral-300',
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
