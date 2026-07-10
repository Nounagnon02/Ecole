/**
 * Tabs — Navigation par onglets premium v3
 *
 * Sous-composants : Tabs.List, Tabs.Trigger, Tabs.Content, Tabs.Indicator
 * Variants : underline (défaut), pills, segmented
 */

import { createContext, useContext, useState, useCallback, Children, cloneElement } from 'react';
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
  const variants = {
    underline: 'border-b border-neutral-200 dark:border-neutral-800',
    pills: 'gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800',
    segmented: 'gap-0 rounded-xl border border-neutral-200 p-0.5 dark:border-neutral-800',
  };

  return (
    <div className={cn('flex items-center', variants[variant], className)}>
      {Children.map(children, (child) =>
        cloneElement(child, { variant })
      )}
    </div>
  );
}

function TabsTrigger({ children, value, variant, className, disabled }) {
  const { activeValue, setValue } = useContext(TabsContext);
  const isActive = activeValue === value;

  const variantStyles = {
    underline: cn(
      'relative px-4 py-2.5 text-sm font-medium transition-colors',
      isActive
        ? 'text-[var(--accent)]'
        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
      disabled && 'cursor-not-allowed opacity-50'
    ),
    pills: cn(
      'relative rounded-lg px-4 py-2 text-sm font-medium transition-all',
      isActive
        ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-white'
        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
      disabled && 'cursor-not-allowed opacity-50'
    ),
    segmented: cn(
      'relative rounded-lg px-4 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white'
        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
      disabled && 'cursor-not-allowed opacity-50'
    ),
  };

  return (
    <button
      onClick={() => !disabled && setValue(value)}
      disabled={disabled}
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

  if (activeValue !== value) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn('mt-4', className)}
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
