/**
 * Combobox — Searchable select dropdown
 *
 * Features:
 * - Type to filter options
 * - Keyboard navigation (Escape to close)
 * - Click outside to close
 * - Accessible ARIA attributes
 * - Error state support
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export default function Combobox({
  label,
  placeholder = 'Sélectionnez une option',
  searchPlaceholder = 'Rechercher...',
  emptyText = 'Aucun résultat',
  options = [],
  value,
  onChange,
  error,
  required,
  className,
  disabled,
  name,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = useCallback(
    (opt) => {
      onChange?.({ target: { value: opt.value, name } });
      setSearch('');
      setIsOpen(false);
    },
    [onChange, name]
  );

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
      setSearch('');
    }
  }, [disabled]);

  // Click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
        e.preventDefault();
      }
    },
    [isOpen]
  );

  return (
    <div className={cn('relative', className)} ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
          {label}
          {required && <span className="ml-0.5 text-[var(--red)]">*</span>}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label || placeholder}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border px-3.5 text-sm transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'bg-[var(--surface-raised)]',
          error
            ? 'border-[var(--red)]'
            : 'border-[var(--border)] hover:border-[var(--border-heavy)]',
          value ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
        )}
      >
        <span className="truncate">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'ml-2 h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform duration-150',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-4)]"
          role="listbox"
          ref={listRef}
        >
          {/* Search input */}
          <div className="relative border-b border-[var(--border-light)] p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-autocomplete="list"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pl-8 pr-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
            />
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-3 text-center text-sm text-[var(--text-tertiary)]">{emptyText}</p>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  onClick={() => handleSelect(opt)}
                  className={cn(
                    'flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                    opt.value === value
                      ? 'bg-[var(--accent-subtle)] font-medium text-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                  )}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs font-medium text-[var(--red)]">{error}</p>}
    </div>
  );
}
