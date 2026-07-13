/**
 * NotFoundPage — Page 404
 *
 * Affichée quand aucune route ne correspond à l'URL demandée.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 text-center dark:bg-neutral-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md"
      >
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-neutral-100 dark:bg-neutral-900">
            <span className="text-5xl font-bold text-neutral-300 dark:text-neutral-700">404</span>
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Page introuvable
        </h1>
        <p className="mb-8 text-sm text-neutral-500 dark:text-neutral-400">
          La page que vous recherchez n'existe pas ou a été déplacée.
          Vérifiez l'URL ou retournez à l'accueil.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Accueil
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-[var(--border)] dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Page précédente
          </button>
        </div>
      </motion.div>
    </div>
  );
}
