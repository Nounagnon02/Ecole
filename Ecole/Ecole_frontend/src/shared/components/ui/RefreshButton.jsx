import { RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Button from './Button';
import { useTranslation } from '@/shared/i18n';

/**
 * RefreshButton — Bouton "Actualiser" réutilisable sur les dashboards.
 * Fait tourner l'icône pendant le chargement et se désactive ensuite.
 */
export default function RefreshButton({ loading = false, onRefresh, className }) {
  const { t } = useTranslation();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onRefresh}
      disabled={loading}
      className={className}
      aria-label={t('components.refresh_button.actualiser_les_donnees')}
    >
      <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
      {t('components.refresh_button.actualiser')}
    </Button>
  );
}
