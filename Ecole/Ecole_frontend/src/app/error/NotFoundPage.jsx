/**
 * NotFoundPage — Page 404
 *
 * Affichée quand aucune route ne correspond à l'URL demandée.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '@/shared/i18n';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface)] px-6 text-center ">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md"
      >
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--surface-subtle)] ">
            <span className="text-5xl font-bold text-[var(--text-secondary)] ">404</span>
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)] ">
          {t('error.404.title')}
        </h1>
        <p className="mb-8 text-sm text-[var(--text-secondary)] ">
          {t('error.404.description')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--action)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--action-hover)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {t('error.go_home')}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-6 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface)] dark:border-[var(--border)]   "
          >
            {t('error.go_back')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
