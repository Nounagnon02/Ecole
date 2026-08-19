/**
 * Tabs — Navigation par onglets premium v3
 *
 * Sous-composants : Tabs.List, Tabs.Trigger, Tabs.Content, Tabs.Indicator
 * Variants : underline (défaut), pills, segmented
 *
 * Accessibilité : WAI-ARIA Tabs pattern
 * - role="tablist" / role="tab" / role="tabpanel"
 * - aria-selected, aria-controls, id liés
 * - Roving tabindex : onglet actif = tabIndex 0, autres = -1
 * - Navigation flèches Gauche/Droite
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  Children,
  cloneElement,
  useId,
} from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

const TabsContext = createContext(null);

function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : internalValue;

  const setValue = useCallback(
    (val) => {
      if (!isControlled) setInternalValue(val);
      onValueChange?.(val);
    },
    [isControlled, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ activeValue, setValue }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ children, className, variant = 'underline' }) {
  const tabListRef = useRef(null);
  const { activeValue, setValue } = useContext(TabsContext);

  const variants = {
    underline: 'border-b border-[var(--border-subtle)]',
    pills: 'gap-1 rounded-xl bg-[var(--surface-subtle)] p-1',
    segmented: 'gap-0 rounded-xl border border-[var(--border-subtle)] p-0.5',
  };

  const handleKeyDown = useCallback(
    (e) => {
      const tabs = Array.from(tabListRef.current?.querySelectorAll('[role="tab"]:not([disabled])') ?? []);
      const currentIndex = tabs.findIndex((t) => t === document.activeElement);
      if (currentIndex === -1) return;

      let nextIndex;
      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      e.preventDefault();
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    },
    []
  );

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={cn('flex items-center', variants[variant], className)}
    >
      {Children.map(children, (child) =>
        cloneElement(child, { variant })
      )}
    </div>
  );
}

function TabsTrigger({ children, value, variant, className, disabled }) {
  const { activeValue, setValue } = useContext(TabsContext);
  const isActive = activeValue === value;
  const triggerId = useId();
  const panelId = useId();

  const variantStyles = {
    underline: cn(
      'relative px-4 py-2.5 text-sm font-medium transition-colors',
      isActive
        ? 'text-[var(--accent)]'
        : 'text-[var(--text-secondary)]',
      disabled && 'cursor-not-allowed opacity-50'
    ),
    pills: cn(
      'relative rounded-lg px-4 py-2 text-sm font-medium transition-all',
      isActive
        ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-sm'
        : 'text-[var(--text-secondary)]',
      disabled && 'cursor-not-allowed opacity-50'
    ),
    segmented: cn(
      'relative rounded-lg px-4 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-sm'
        : 'text-[var(--text-secondary)]',
      disabled && 'cursor-not-allowed opacity-50'
    ),
  };

  return (
    <button
      id={triggerId}
      role="tab"
      aria-selected={isActive}
      aria-controls={panelId}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      onClick={() => !disabled && setValue(value)}
      className={cn(variantStyles[variant || 'underline'], 'whitespace-nowrap', className)}
    >
      {children}
      {isActive && variant === 'underline' && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
    </button>
  );
}

function TabsContent({ children, value, className }) {
  const { activeValue } = useContext(TabsContext);
  const contentId = useId();

  if (activeValue !== value) return null;

  return (
    <motion.div
      id={contentId}
      role="tabpanel"
      tabIndex={0}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn('mt-4 focus-visible:outline-none', className)}
    >
      {children}
    </motion.div>
  );
}

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

export { Tabs };
export default Tabs;
