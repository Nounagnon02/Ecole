/**
 * ServerErrorPage — Page 500 / erreur applicative
 *
 * Affichée quand une erreur de rendu survient (ErrorBoundary)
 * ou comme page d'erreur générique.
 */

import { motion } from 'framer-motion';

export function ErrorBoundaryFallback({ error, onReset }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 text-center dark:bg-neutral-950">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md"
      >
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 dark:bg-red-950/30">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Une erreur est survenue
        </h1>
        <p className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
          Désolé, un problème technique est survenu. L'équipe technique a été informée.
        </p>
        {process.env.NODE_ENV === 'development' && error && (
          <pre className="mb-6 max-w-full overflow-auto rounded-lg bg-neutral-100 p-4 text-left text-xs text-red-600 dark:bg-neutral-900 dark:text-red-400">
            {error.message}
          </pre>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onReset || (() => window.location.reload())}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-[var(--border)] dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Accueil
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export default function ServerErrorPage() {
  return <ErrorBoundaryFallback />;
}
