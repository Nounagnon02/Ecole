/**
 * DataTable v2 — Premium DataGrid premium
 *
 * Tableau de données complet avec tri, recherche, pagination,
 * sélection, états loading/empty, responsive mobile.
 * Design system : Tailwind v4 + composants existants.
 *
 * Props :
 *   data, columns, loading, onRowClick,
 *   searchable, sortable, pagination, selectable,
 *   itemsPerPage, emptyMessage, className,
 *   onEdit, onDelete, onView (actions automatiques)
 */

import { useState, useMemo, useCallback, forwardRef } from 'react';
import {
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Search, Eye, Edit2, Trash2, Download,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Skeleton from './Skeleton';
import Button from './Button';

/* ─── Interface de colonne ──────────────────────────────────────────── */
/* {
 *   key: string        — clé unique
 *   header: string     — texte d'en-tête
 *   accessor: string   — chemin dans l'objet (ex: 'user.nom')
 *                        ou fonction (item) => value
 *   render?: (value, item) => node  — custom render
 *   sortable?: boolean  — défaut true
 *   className?: string  — classe sur le <td>
 * }
 */

/* ─── Pagination ──────────────────────────────────────────────────────── */
function Pagination({ currentPage, totalPages, totalItems, onChange }) {
  const pages = useMemo(() => {
    const range = [];
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, currentPage + 1);
    for (let i = start; i <= end; i++) range.push(i);
    if (start > 2) range.unshift(-1);
    if (start > 1) range.unshift(1);
    if (end < totalPages - 1) range.push(-2);
    if (end < totalPages) range.push(totalPages);
    return range;
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3 sm:flex-row dark:border-neutral-800">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        {totalItems} résultat{totalItems > 1 ? 's' : ''}
        {' · '}Page {currentPage}/{totalPages}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onChange(currentPage - 1)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-800"
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p < 0 ? (
            <span key={p} className="flex h-8 w-8 items-center justify-center text-xs text-neutral-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                'flex h-11 min-w-[2.75rem] items-center justify-center rounded-lg px-2 text-xs font-medium transition-all',
                p === currentPage
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onChange(currentPage + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-800"
          aria-label="Page suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Ligne de chargement squelettique ──────────────────────────────── */
function LoadingRows({ columnsCount, rowCount = 5 }) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, i) => (
        <tr key={i}>
          <td colSpan={columnsCount} className="px-4 py-3">
            <Skeleton variant="table-row" />
          </td>
        </tr>
      ))}
    </>
  );
}

/* ─── État vide ───────────────────────────────────────────────────────── */
function EmptyState({ message, icon: Icon }) {
  return (
    <tr>
      <td colSpan={99}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {Icon && (
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
              <Icon className="h-6 w-6 text-neutral-400" />
            </div>
          )}
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {message}
          </p>
        </div>
      </td>
    </tr>
  );
}

/* ─── Composant principal ─────────────────────────────────────────────── */
const DataTable = forwardRef(function DataTable(
  {
    /* ─── Données ─── */
    data = [],
    columns = [],
    loading = false,

    /* ─── Interactions ─── */
    onRowClick,
    onEdit,
    onDelete,
    onView,
    onSelectionChange,

    /* ─── Features ─── */
    searchable = true,
    sortable = true,
    pagination = true,
    selectable = false,
    exportable = false,
    itemsPerPage = 10,

    /* ─── États ─── */
    emptyMessage = 'Aucune donnée',
    emptyIcon,

    /* ─── Style ─── */
    className,
  },
  ref
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());

  /* ─── Résoudre la valeur d'une colonne ────────────────────────────── */
  const resolveValue = useCallback((item, column) => {
    if (typeof column.accessor === 'function') return column.accessor(item);
    if (typeof column.accessor === 'string') {
      return column.accessor.split('.').reduce((o, k) => (o ? o[k] : undefined), item);
    }
    return item[column.key];
  }, []);

  /* ─── Filtrage ──────────────────────────────────────────────────── */
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const q = searchTerm.toLowerCase();
    return data.filter((item) =>
      columns.some((col) => {
        const v = resolveValue(item, col);
        return String(v ?? '').toLowerCase().includes(q);
      })
    );
  }, [data, searchTerm, columns, resolveValue]);

  /* ─── Tri ────────────────────────────────────────────────────────── */
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = resolveValue(a, columns.find((c) => c.key === sortConfig.key)) ?? '';
      const bVal = resolveValue(b, columns.find((c) => c.key === sortConfig.key)) ?? '';
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortConfig, columns, resolveValue]);

  /* ─── Pagination ─────────────────────────────────────────────────── */
  const pageCount = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage, pagination]);

  /* ─── Sort handler ────────────────────────────────────────────────── */
  const handleSort = useCallback(
    (key) => {
      if (!sortable) return;
      setSortConfig((prev) => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
      }));
    },
    [sortable]
  );

  /* ─── Selection ──────────────────────────────────────────────────── */
  const allSelected = paginatedData.length > 0 && paginatedData.every((item) => selectedIds.has(item.id ?? item._id));

  const toggleAll = useCallback(() => {
    const ids = paginatedData.map((item) => item.id ?? item._id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (ids.every((id) => next.has(id))) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      onSelectionChange?.(next);
      return next;
    });
  }, [paginatedData, onSelectionChange]);

  const toggleOne = useCallback(
    (id) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        onSelectionChange?.(next);
        return next;
      });
    },
    [onSelectionChange]
  );

  /* ─── Export CSV ────────────────────────────────────────────────── */
  const handleExport = useCallback(() => {
    const headers = columns.map((c) => c.header).join(',');
    const rows = sortedData.map((item) =>
      columns.map((col) => `"${resolveValue(item, col) ?? ''}"`).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [columns, sortedData, resolveValue]);

  /* ─── Reset page on search ───────────────────────────────────────── */
  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  /* ─── Déterminer la valeur aria-sort ──────────────────────────────── */
  const getAriaSort = (columnKey) => {
    if (!sortConfig.key || sortConfig.key !== columnKey) return 'none';
    return sortConfig.direction === 'asc' ? 'ascending' : 'descending';
  };

  /* ─── Déterminer l'icône de tri ──────────────────────────────────── */
  const SortIcon = ({ columnKey }) => {
    if (!sortable) return null;
    const active = sortConfig.key === columnKey;
    const dir = sortConfig.direction;
    return (
      <span className="ml-1.5 inline-flex flex-col leading-none text-neutral-400">
        <ChevronUp
          className={cn('h-3 w-3 -mb-0.5', active && dir === 'asc' && 'text-[var(--accent)]')}
        />
        <ChevronDown
          className={cn('h-3 w-3', active && dir === 'desc' && 'text-[var(--accent)]')}
        />
      </span>
    );
  };

  const showActions = Boolean(onEdit || onDelete || onView);

  return (
    <div
      ref={ref}
      className={cn(
        'overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950',
        'shadow-sm dark:shadow-neutral-950/50',
        className
      )}
    >
      {/* ─── Toolbar ──────────────────────────────────────────────────── */}
      {(searchable || exportable) && (
        <div className="flex flex-col items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3 sm:flex-row sm:items-center dark:border-neutral-800">
          {searchable && (
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Rechercher…"
                aria-label="Rechercher dans le tableau"
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-[var(--accent)] dark:focus:ring-[var(--accent-subtle)]"
              />
            </div>
          )}
          {exportable && (
            <Button variant="ghost" size="sm" onClick={handleExport}>
              <Download className="mr-1.5 h-4 w-4" />
              Exporter
            </Button>
          )}
        </div>
      )}

      {/* ─── Table ────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
              {selectable && (
                <th className="w-10 px-2 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-neutral-300 text-[var(--accent)] focus:ring-[var(--accent)] dark:border-neutral-600"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  aria-sort={col.sortable !== false ? getAriaSort(col.key) : undefined}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400',
                    sortable && col.sortable !== false && 'cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-300'
                  )}
                >
                  <span className="inline-flex items-center">
                    {col.header}
                    {col.sortable !== false && <SortIcon columnKey={col.key} />}
                  </span>
                </th>
              ))}
              {showActions && (
                <th className="w-24 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {loading ? (
              <LoadingRows columnsCount={columns.length + (selectable ? 1 : 0) + (showActions ? 1 : 0)} />
            ) : paginatedData.length === 0 ? (
              <EmptyState message={emptyMessage} icon={emptyIcon || Search} />
            ) : (
              paginatedData.map((item) => {
                const id = item.id ?? item._id;
                const selected = selectedIds.has(id);
                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick?.(item)}
                    aria-selected={selectable ? selected : undefined}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer',
                      selected
                        ? 'bg-[var(--accent-subtle)]'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                    )}
                  >
                    {selectable && (
                      <td className="px-2 py-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleOne(id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-neutral-300 text-[var(--accent)] focus:ring-[var(--accent)] dark:border-neutral-600"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={cn('px-4 py-3 text-neutral-700 dark:text-neutral-300', col.className)}>
                        {col.render
                          ? col.render(resolveValue(item, col), item)
                          : (resolveValue(item, col) ?? '—')}
                      </td>
                    ))}
                    {showActions && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onView && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onView(item); }}
                              className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                              aria-label={`Voir ${resolveValue(item, columns[0]?.accessor || columns[0]?.key) || 'l\'élément'}`}
                              title="Voir"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                              className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-[var(--accent)] dark:hover:bg-neutral-800 dark:hover:text-[var(--accent)]"
                              aria-label={`Modifier ${resolveValue(item, columns[0]?.accessor || columns[0]?.key) || 'l\'élément'}`}
                              title="Modifier"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                              className="flex h-11 w-11 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                              aria-label={`Supprimer ${resolveValue(item, columns[0]?.accessor || columns[0]?.key) || 'l\'élément'}`}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination ──────────────────────────────────────────────────── */}
      {pagination && !loading && sortedData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pageCount}
          totalItems={sortedData.length}
          onChange={setCurrentPage}
        />
      )}
    </div>
  );
});

export { DataTable };
export default DataTable;
