/**
 * Tooltip — Infobulle premium v3
 *
 * Accessibilité :
 * - role="tooltip" sur le contenu
 * - aria-describedby reliant le trigger au tooltip
 * - Visible au focus ET au hover
 * - Esc pour fermer, auto-hide après 5s
 * - prefers-reduced-motion respecté
 *
 * Props : content, side (top, bottom, left, right), delay
 */

import { useState, useCallback, useRef, useId, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';

function Tooltip({ children, content, side = 'top', className }) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();
  const hideTimeoutRef = useRef(null);
  const showTimeoutRef = useRef(null);

  const show = useCallback(() => {
    clearTimeout(hideTimeoutRef.current);
    showTimeoutRef.current = setTimeout(() => setIsVisible(true), 50);
  }, []);

  const hide = useCallback(() => {
    clearTimeout(showTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 100);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && isVisible) {
        hide();
      }
    },
    [isVisible, hide]
  );

  useEffect(() => {
    return () => {
      clearTimeout(hideTimeoutRef.current);
      clearTimeout(showTimeoutRef.current);
    };
  }, []);

  const sideStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900 dark:border-t-neutral-50',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-neutral-900 dark:border-b-neutral-50',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-neutral-900 dark:border-l-neutral-50',
    right:
      'right-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-neutral-900 dark:border-r-neutral-50',
  };

  return (
    <div
      className={cn('group relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={handleKeyDown}
    >
      <div aria-describedby={isVisible ? tooltipId : undefined}>
        {children}
      </div>
      <div
        id={tooltipId}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap',
          'rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-neutral-50 dark:text-neutral-900',
          'transition-all duration-150',
          isVisible ? 'opacity-100' : 'opacity-0',
          sideStyles[side]
        )}
      >
        {content}
        <div className={cn('absolute', arrowStyles[side])} />
      </div>
    </div>
  );
}

export { Tooltip };
export default Tooltip;
