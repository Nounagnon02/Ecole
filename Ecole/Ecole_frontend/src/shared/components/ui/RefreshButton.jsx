import { RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Button from './Button';

/**
 * RefreshButton — Bouton "Actualiser" réutilisable sur les dashboards.
 * Fait tourner l'icône pendant le chargement et se désactive ensuite.
 */
export default function RefreshButton({ loading = false, onRefresh, className }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onRefresh}
      disabled={loading}
      className={className}
      aria-label="Actualiser les données"
    >
      <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
      Actualiser
    </Button>
  );
}
