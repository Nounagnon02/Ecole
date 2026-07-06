/**
 * MaintenancePage — Page de maintenance (503)
 *
 * Affichée lors des phases de maintenance de la plateforme.
 * Supporte le mode "bientôt disponible" pour les fonctionnalités en construction.
 */

import { motion } from 'framer-motion';
import { Wrench, RefreshCw, Clock, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MaintenancePage({
  titre = "Maintenance en cours",
  description = "Nous effectuons des améliorations sur notre plateforme. Le service sera de retour dans quelques instants.",
  dateEstimee = null,
}) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!dateEstimee) return;
    const interval = setInterval(() => {
      const diff = new Date(dateEstimee) - new Date();
      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(interval);
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [dateEstimee]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 dark:bg-neutral-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex max-w-md flex-col items-center text-center"
      >
        {/* Icone animée */}
        <motion.div
          animate={{ rotate: [0, 10, -10, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 dark:bg-amber-950/30"
        >
          <Wrench className="h-10 w-10 text-amber-500 dark:text-amber-400" />
        </motion.div>

        {/* Code statut */}
        <span className="mb-3 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          503
        </span>

        {/* Titre */}
        <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {titre}
        </h1>

        {/* Description */}
        <p className="mb-6 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {description}
        </p>

        {/* Compte à rebours si date estimée */}
        {timeLeft && (
          <div className="mb-8 flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Heures</span>
            </div>
            <span className="text-2xl text-neutral-300 dark:text-neutral-600">:</span>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Minutes</span>
            </div>
            <span className="text-2xl text-neutral-300 dark:text-neutral-600">:</span>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Secondes</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 motion-safe:active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
          <a
            href="mailto:support@ecole.app"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 motion-safe:active:scale-95 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <Mail className="h-4 w-4" />
            Contacter le support
          </a>
        </div>
      </motion.div>
    </div>
  );
}
