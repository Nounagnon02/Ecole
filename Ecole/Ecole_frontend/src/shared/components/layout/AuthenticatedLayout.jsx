import { AnimatePresence } from 'framer-motion';
import AppShell from './AppShell';

/**
 * Coque des pages connectées. Module à part, chargé à la demande : la page
 * de connexion n'a besoin ni de la coque, ni de framer-motion, qui pesaient
 * sur le premier chargement en réseau lent.
 */
export default function AuthenticatedLayout({ children }) {
  return (
    <AppShell>
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    </AppShell>
  );
}
