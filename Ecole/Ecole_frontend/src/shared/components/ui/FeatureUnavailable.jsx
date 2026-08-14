/**
 * FeatureUnavailable — État explicite pour une page dont l'API n'existe pas
 *
 * Ces pages appelaient un endpoint inexistant, attrapaient l'erreur et
 * affichaient une liste vide. Pour l'utilisateur, « aucune donnée » et
 * « fonctionnalité pas encore construite » sont indistinguables — et la
 * première lecture est la mauvaise : elle laisse croire que le contenu
 * viendra, ou qu'il a disparu.
 *
 * On dit donc ce qui est. `reason` décrit ce qui manque côté backend, pour
 * que l'écart soit lisible par l'équipe comme par l'utilisateur.
 */

import { Construction } from 'lucide-react';
import Card from '@/shared/components/ui/Card';

export default function FeatureUnavailable({ title, reason, children }) {
  return (
    <div className="p-6">
      <Card className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
            aria-hidden="true"
          >
            <Construction className="h-7 w-7" />
          </span>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title} — en cours de développement
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Cette page n'est pas encore alimentée : l'API correspondante reste
              à construire.
            </p>
            {reason && (
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-500">
                {reason}
              </p>
            )}
          </div>

          {children}
        </div>
      </Card>
    </div>
  );
}
