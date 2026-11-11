/**
 * EncaissementDialog — constater un versement reçu au guichet.
 *
 * « Payer » sur une échéance n'ouvrait que le paiement en ligne (audit
 * BUG-025). Ce dialogue crédite l'échéance du montant remis en espèces, par
 * chèque, par virement ou par mobile money constaté.
 */

import { useEffect, useState } from 'react';
import apiClient from '@/shared/lib/api-client';
import { formatCurrency } from '@/shared/lib/utils';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Modal from '@/shared/components/ui/Modal';
import Select from '@/shared/components/ui/Select';
import { useTranslation } from '@/shared/i18n';

/** Mêmes valeurs que `EncaisserEcheanceRequest::MODES` côté API. */
const MODES = ['ESPECES', 'CHEQUE', 'VIREMENT', 'MOBILE_MONEY'];

export default function EncaissementDialog({ echeance, onClose, onDone }) {
  const { t } = useTranslation();
  const [montant, setMontant] = useState('');
  const [mode, setMode] = useState(MODES[0]);
  const [reference, setReference] = useState('');
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  const reste = Number(echeance?.reste ?? 0);

  useEffect(() => {
    if (!echeance) return;
    setMontant(String(Number(echeance.reste ?? 0)));
    setMode(MODES[0]);
    setReference('');
    setErreur(null);
    setEnvoi(false);
  }, [echeance]);

  const fermer = () => { if (!envoi) onClose(); };

  const enregistrer = async (evenement) => {
    evenement.preventDefault();
    const valeur = Number(montant);

    if (!Number.isFinite(valeur) || valeur < 1) {
      setErreur(t('pages.paiements.encaissement.montant_requis'));
      return;
    }
    if (valeur > reste) {
      setErreur(t('pages.paiements.encaissement.montant_trop_eleve', { montant: formatCurrency(reste) }));
      return;
    }

    setEnvoi(true);
    setErreur(null);
    try {
      const { data } = await apiClient.post(`/comptable/echeancier/${echeance.id}/encaisser`, {
        montant: valeur,
        mode_paiement: mode,
        ...(reference.trim() ? { reference: reference.trim() } : {}),
      });
      onDone(data?.data);
    } catch (e) {
      setErreur(e?.response?.data?.message ?? e?.message ?? t('pages.paiements.encaissement.echec'));
      setEnvoi(false);
    }
  };

  return (
    <Modal open={!!echeance} onClose={fermer} title={t('pages.paiements.encaissement.titre')} size="sm">
      {echeance && (
        <form onSubmit={enregistrer} className="space-y-4 p-5" noValidate>
          <p className="text-sm text-[var(--text-secondary)]">
            {t('pages.paiements.encaissement.reste', { type: echeance.type ?? '', montant: formatCurrency(reste) })}
          </p>
          <Input
            type="number"
            inputMode="numeric"
            min="1"
            max={reste}
            step="1"
            label={t('pages.paiements.encaissement.montant')}
            value={montant}
            onChange={(e) => { setMontant(e.target.value); setErreur(null); }}
            error={erreur ?? undefined}
            required
          />
          <Select
            label={t('pages.paiements.encaissement.mode')}
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            options={MODES.map((valeur) => ({ value: valeur, label: t(`pages.paiements.encaissement.modes.${valeur}`) }))}
          />
          <Input
            label={t('pages.paiements.encaissement.reference')}
            helperText={t('pages.paiements.encaissement.reference_aide')}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            maxLength={255}
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={fermer} disabled={envoi}>{t('common.cancel')}</Button>
            <Button type="submit" loading={envoi}>{t('pages.paiements.encaissement.enregistrer')}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
