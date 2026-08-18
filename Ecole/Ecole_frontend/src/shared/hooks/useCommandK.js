/**
 * useCommandK — Hook for managing ⌘K / Ctrl+K command palette state
 *
 * Listens for the Cmd+K / Ctrl+K keyboard shortcut globally
 * and manages the open/close state via the UI store.
 *
 * Usage:
 *   const { isOpen, open, close, toggle } = useCommandK();
 */

import { useEffect, useCallback } from 'react';
import useUIStore from '@/shared/stores/ui-store';

export default function useCommandK() {
  const isOpen = useUIStore((s) => s.commandPaletteOpen);
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const closeCommandPalette = useUIStore((s) => s.closeCommandPalette);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggleCommandPalette]);

  const open = useCallback(() => {
    if (!isOpen) toggleCommandPalette();
  }, [isOpen, toggleCommandPalette]);

  const close = useCallback(() => {
    if (isOpen) closeCommandPalette();
  }, [isOpen, closeCommandPalette]);

  return { isOpen, open, close, toggle: toggleCommandPalette };
}
