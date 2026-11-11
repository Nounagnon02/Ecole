/**
 * PaiementRetourPage — où revient le payeur après la page de la passerelle.
 *
 * L'API (`PaymentController::callback`) a déjà relu le statut auprès de la
 * passerelle et crédité l'échéance si le paiement est approuvé ; elle redirige
 * ici avec `?statut=confirme|attente|echoue|erreur`. Cette page ne fait
 * qu'annoncer l'issue : le paramètre n'accorde rien, la vérité reste en base.
 */

import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import useAuthStore from '@/shared/stores/auth-store';
import { ROLES } from '@/shared/types/roles';
import { useTranslation } from '@/shared/i18n';

const ISSUES = {
  confirme: { Icone: CheckCircle, couleur: 'text-[var(--success)]' },
  attente: { Icone: Clock, couleur: 'text-[var(--warning)]' },
  echoue: { Icone: XCircle, couleur: 'text-[var(--error)]' },
  erreur: { Icone: AlertCircle, couleur: 'text-[var(--text-secondary)]' },
};

export default function PaiementRetourPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [parametres] = useSearchParams();
  const role = useAuthStore((etat) => etat.user?.role);

  const demande = parametres.get('statut');
  const statut = Object.hasOwn(ISSUES, demande) ? demande : 'erreur';
  const { Icone, couleur } = ISSUES[statut];
  const retour = role === ROLES.PARENT ? '/parent/paiements' : '/paiements';

  return (
    <div className="mx-auto max-w-lg py-8">
      <Card className="p-6 text-center">
        <Icone className={`mx-auto mb-4 h-12 w-12 ${couleur}`} aria-hidden="true" />
        <div role="status" aria-live="polite">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">{t(`pages.paiements.retour.${statut}.titre`)}</h1>
          <p className="my-4 leading-relaxed text-[var(--text-secondary)]">{t(`pages.paiements.retour.${statut}.texte`)}</p>
        </div>
        <Button onClick={() => navigate(retour)}>{t('pages.paiements.retour.lien')}</Button>
      </Card>
    </div>
  );
}
