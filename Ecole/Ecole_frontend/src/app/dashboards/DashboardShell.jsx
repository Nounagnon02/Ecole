/**
 * DashboardShell — l'ossature commune aux douze tableaux de bord.
 *
 * Chacun réécrivait le même bloc d'une soixantaine de lignes : titre animé,
 * sous-titre daté, bouton de rafraîchissement, bandeau d'erreur, barre
 * d'onglets et transition entre sections. Environ 700 lignes identiques à
 * douze exemplaires, où une correction d'accessibilité ou de style devait
 * être portée douze fois — et l'était rarement.
 *
 * Ce qui reste propre à chaque rôle vit dans `tabs`, `actions` et les
 * sections rendues en enfants.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import { RefreshButton } from '@/shared/components/ui';
import { ErrorDisplay } from '@/shared/components/ui/EmptyState';

/**
 * @param {object}   props
 * @param {string}   props.title       Titre du tableau de bord.
 * @param {React.ReactNode} [props.subtitle] Texte précédant la date du jour.
 * @param {Array}    props.tabs        [{ id, label, icon }]
 * @param {string}   props.activeTab
 * @param {Function} props.onTabChange Reçoit l'id de l'onglet cliqué.
 * @param {boolean}  props.loading
 * @param {string}   [props.error]
 * @param {Function} props.onRefresh
 * @param {React.ReactNode} [props.actions]  Boutons propres au rôle.
 * @param {React.ReactNode} props.children   La section active.
 */
export default function DashboardShell({
  title,
  subtitle = null,
  tabs = [],
  activeTab,
  onTabChange,
  loading = false,
  error = null,
  onRefresh,
  actions = null,
  children,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-neutral-900 dark:text-white"
          >
            {title}
          </motion.h1>
          {/* Le sous-titre est facultatif et peut être un nœud : le tableau de
              bord directeur n'affiche que la date, celui de l'élève y glisse
              sa classe. */}
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {subtitle ? <>{subtitle} — </> : null}
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton loading={loading} onRefresh={onRefresh} />
          {actions}
        </div>
      </div>

      {error && <ErrorDisplay message={error} onRetry={onRefresh} />}

      {tabs.length > 0 && (
        <div className="border-b border-neutral-200 dark:border-neutral-800">
          {/* `role="tablist"` et les `aria-*` manquaient partout : la barre
              n'était qu'une rangée de boutons pour un lecteur d'écran. */}
          <nav className="flex gap-1 overflow-x-auto -mb-px" role="tablist" aria-label={title}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const actif = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={actif}
                  aria-controls={`panneau-${tab.id}`}
                  id={`onglet-${tab.id}`}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                    actif
                      ? 'border-[var(--accent)] text-[var(--accent)] dark:text-[var(--accent)]'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />} {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          id={`panneau-${activeTab}`}
          role={tabs.length > 0 ? 'tabpanel' : undefined}
          aria-labelledby={tabs.length > 0 ? `onglet-${activeTab}` : undefined}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
