import { WifiOff } from 'lucide-react';
import useHorsLigneStore from '@/shared/stores/hors-ligne-store';
import { useTranslation } from '@/shared/i18n';

/**
 * Bandeau « Hors connexion », avec la date des données affichées quand
 * elles viennent du cache de l'appareil.
 */
export default function BandeauReseau({ enLigne }) {
  const { t, locale } = useTranslation();
  const donneesDu = useHorsLigneStore((s) => s.donneesDu);
  if (enLigne) return null;

  const date = donneesDu
    ? new Date(donneesDu).toLocaleString(locale || 'fr', { dateStyle: 'short', timeStyle: 'short' })
    : null;

  return (
    <div role="status" className="ecole-network">
      <WifiOff size={18} aria-hidden="true" />
      <span>
        {t('c.offline')}
        {date && <> <strong>{t('c.donnees_du', { date })}</strong></>}
      </span>
    </div>
  );
}
