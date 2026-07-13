/**
 * ForbiddenPage — Page 403 Accès refusé
 *
 * Affiche un message clair lorsque l'utilisateur n'a pas les permissions
 * nécessaires pour accéder à une ressource.
 * Pattern visuel cohérent avec NotFoundPage et ServerErrorPage.
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-screen flex-col items-center justify-center px-6"
    >
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        {/* Badge icône */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 dark:bg-red-950/30">
          <svg
            className="h-10 w-10 text-red-500 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>

        {/* Code erreur */}
        <span className="mb-3 inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
          403
        </span>

        {/* Titre */}
        <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Accès refusé
        </h1>

        {/* Description */}
        <p className="mb-8 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
          Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre
          administrateur.
        </p>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--accent-hover)] motion-safe:active:scale-95"
          >
            Retour à l'accueil
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 motion-safe:active:scale-95 dark:border-[var(--border)] dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Page précédente
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * ForbiddenError — Composant utilitaire exporté pour les routes protégées
 *
 * Usage : envelopper le contenu à protéger dans un layout centré.
 * Peut être utilisé par ProtectedRoute comme fallback visuel.
 */
export function ForbiddenError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-6 text-center dark:bg-neutral-950">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Accès non autorisé
      </h1>
      <p className="max-w-sm text-sm text-neutral-500">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
