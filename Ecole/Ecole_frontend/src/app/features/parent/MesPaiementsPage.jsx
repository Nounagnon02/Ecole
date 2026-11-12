/**
 * MesPaiementsPage — ce que le parent doit, et le paiement en ligne.
 *
 * Le menu du parent ouvrait la page de la comptabilité, dont les routes lui
 * répondent 403 (audit BUG-003). Cette page ne lit que les routes du parent.
 *
 * Le choix de l'opérateur (MTN, Moov, Celtiis) et la saisie du numéro se font
 * sur la page de la passerelle : ici, on choisit l'échéance et le montant.
 */

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CreditCard, Loader2, RotateCcw, Wallet } from 'lucide-react';
import apiClient, { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { formatCurrency } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Modal from '@/shared/components/ui/Modal';
import { useTranslation } from '@/shared/i18n';

/** Montant minimal accepté par l'API (`InitializePaymentRequest`). */
const MONTANT_MINIMAL = 100;

const STATUTS = {
  PAYE: { cle: 'solde', variante: 'success' },
  PARTIEL: { cle: 'partiel', variante: 'warning' },
  EN_ATTENTE: { cle: 'a_payer', variante: 'default' },
};

const versPasserelle = (url) => window.location.assign(url);

export default function MesPaiementsPage({ onRedirect = versPasserelle }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [idEnfant, setIdEnfant] = useState(null);
  const [echeance, setEcheance] = useState(null);
  const [saisie, setSaisie] = useState('');
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  const requeteEnfants = useApiQuery(['parent-enfants'], '/parent/enfants');
  const enfants = useMemo(() => unwrapList(requeteEnfants.data) ?? [], [requeteEnfants.data]);

  useEffect(() => {
    if (!idEnfant && enfants.length > 0) setIdEnfant(enfants[0].id);
  }, [enfants, idEnfant]);

  const requetePaiements = useApiQuery(
    ['enfant-paiements', idEnfant],
    `/parent/enfants/${idEnfant}/paiements`,
    { queryOptions: { enabled: !!idEnfant, staleTime: 0 } },
  );
  const echeances = useMemo(() => unwrapList(requetePaiements.data) ?? [], [requetePaiements.data]);
  const totaux = requetePaiements.data?.meta ?? { total_du: 0, total_paye: 0, solde: 0 };

  const ouvrir = (ligne) => {
    setEcheance(ligne);
    setSaisie(String(ligne.reste));
    setErreur(null);
  };
  const fermer = () => { if (!envoi) setEcheance(null); };

  const payer = async (evenement) => {
    evenement.preventDefault();
    const montant = Number(saisie);

    if (!Number.isFinite(montant) || montant < MONTANT_MINIMAL) {
      setErreur(t('pages.parent.paiements.montant_minimal', { montant: formatCurrency(MONTANT_MINIMAL) }));
      return;
    }
    if (montant > echeance.reste) {
      setErreur(t('pages.parent.paiements.montant_trop_eleve', { montant: formatCurrency(echeance.reste) }));
      return;
    }

    setEnvoi(true);
    setErreur(null);
    try {
      const { data } = await apiClient.post('/payments/initialize', {
        eleve_id: idEnfant,
        paiement_eleve_id: echeance.id,
        amount: montant,
        type: 'scolarite',
        description: echeance.libelle,
      });
      if (!data?.success || !data?.data?.checkout_url) {
        throw new Error(data?.message || t('pages.parent.paiements.ouverture_impossible'));
      }
      // L'ouverture est désormais « en cours » : la liste doit le montrer au retour.
      queryClient.invalidateQueries({ queryKey: ['enfant-paiements', idEnfant] });
      onRedirect(data.data.checkout_url);
    } catch (e) {
      setErreur(e?.response?.data?.message ?? e?.message ?? t('pages.parent.paiements.ouverture_impossible'));
      setEnvoi(false);
    }
  };

  if (requeteEnfants.isPending) {
    return (
      <div className="flex h-64 items-center justify-center" role="status" aria-label={t('common.loading')}>
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('pages.parent.paiements.title')}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{t('pages.parent.paiements.subtitle')}</p>
      </div>

      {enfants.length === 0 ? (
        <Card><p className="py-8 text-center text-sm text-[var(--text-secondary)]">{t('pages.parent.enfants.aucun_enfant_lie_a_votre_compte')}</p></Card>
      ) : (
        <>
          {enfants.length > 1 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('pages.parent.paiements.choisir_enfant')}>
              {enfants.map((enfant) => (
                <Button
                  key={enfant.id}
                  size="sm"
                  variant={enfant.id === idEnfant ? 'primary' : 'outline'}
                  aria-pressed={enfant.id === idEnfant}
                  onClick={() => setIdEnfant(enfant.id)}
                >
                  {enfant.nom || enfant.user?.name}
                </Button>
              ))}
            </div>
          )}

          <dl className="grid gap-3 sm:grid-cols-3">
            {[
              ['total-du', 'total_du', totaux.total_du],
              ['total-paye', 'total_paye', totaux.total_paye],
              ['total-reste', 'reste_a_payer', totaux.solde],
            ].map(([id, cle, valeur]) => (
              <Card padding key={id}>
                <dt className="text-sm text-[var(--text-secondary)]">{t(`pages.parent.paiements.${cle}`)}</dt>
                <dd data-testid={id} className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{formatCurrency(valeur)}</dd>
              </Card>
            ))}
          </dl>

          <Card padding>
            {requetePaiements.isPending ? (
              <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" /></div>
            ) : requetePaiements.isError ? (
              <div className="py-8 text-center">
                <p className="text-sm text-[var(--text-secondary)]">{requetePaiements.error?.message ?? t('common.load_error')}</p>
                <Button className="mt-3" variant="outline" onClick={() => requetePaiements.refetch()}>{t('common.retry')}</Button>
              </div>
            ) : echeances.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-secondary)]">
                <Wallet className="mx-auto mb-2 h-8 w-8" aria-hidden="true" />
                <p className="text-sm">{t('pages.parent.paiements.aucune_echeance')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto" role="region" aria-label={t('common.tableau_defilant')} tabIndex={0}>
                <table className="w-full text-sm">
                  <caption className="sr-only">{t('pages.parent.paiements.title')}</caption>
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
                      <th scope="col" className="px-3 py-2 font-medium">{t('pages.parent.paiements.echeance')}</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">{t('pages.parent.paiements.total_du')}</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">{t('pages.parent.paiements.total_paye')}</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">{t('pages.parent.paiements.reste_a_payer')}</th>
                      <th scope="col" className="px-3 py-2 font-medium">{t('pages.parent.paiements.statut')}</th>
                      <th scope="col" className="px-3 py-2"><span className="sr-only">{t('common.actions')}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {echeances.map((ligne) => {
                      const statut = STATUTS[ligne.statut] ?? STATUTS.EN_ATTENTE;
                      const enCours = ligne.paiement_en_cours;
                      return (
                        <tr key={ligne.id} className="border-b border-[var(--border-light)] last:border-0">
                          <th scope="row" className="px-3 py-3 text-left font-medium text-[var(--text-primary)]">{ligne.libelle}</th>
                          <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(ligne.montant_total)}</td>
                          <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(ligne.montant_paye)}</td>
                          <td data-testid="reste" className="px-3 py-3 text-right font-medium tabular-nums">{formatCurrency(ligne.reste)}</td>
                          <td className="px-3 py-3">
                            {enCours
                              ? <Badge variant="info">{t('pages.parent.paiements.en_cours', { montant: formatCurrency(enCours.montant) })}</Badge>
                              : <Badge variant={statut.variante}>{t(`pages.parent.paiements.statuts.${statut.cle}`)}</Badge>}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {enCours?.checkout_url ? (
                              <Button size="sm" variant="outline" icon={<RotateCcw size={16} />} onClick={() => onRedirect(enCours.checkout_url)}>
                                {t('pages.parent.paiements.reprendre')}
                              </Button>
                            ) : !enCours && ligne.reste > 0 ? (
                              <Button size="sm" icon={<CreditCard size={16} />} onClick={() => ouvrir(ligne)}>
                                {t('pages.parent.paiements.payer')}
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <Modal
        open={!!echeance}
        onClose={fermer}
        title={t('pages.parent.paiements.payer_titre', { libelle: echeance?.libelle ?? '' })}
        size="sm"
      >
        {echeance && (
          <form onSubmit={payer} className="space-y-4 p-5" noValidate>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('pages.parent.paiements.reste_sur_echeance', { montant: formatCurrency(echeance.reste) })}
            </p>
            <Input
              type="number"
              inputMode="numeric"
              min={MONTANT_MINIMAL}
              max={echeance.reste}
              step="1"
              label={t('pages.parent.paiements.montant_a_payer')}
              helperText={t('pages.parent.paiements.paiement_partiel_possible')}
              value={saisie}
              onChange={(e) => { setSaisie(e.target.value); setErreur(null); }}
              error={erreur ?? undefined}
              required
            />
            <p className="text-xs text-[var(--text-secondary)]">{t('pages.parent.paiements.suite')}</p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={fermer} disabled={envoi}>{t('common.cancel')}</Button>
              <Button type="submit" loading={envoi}>{t('pages.parent.paiements.continuer')}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
