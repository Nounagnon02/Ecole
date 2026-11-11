/**
 * FicheDialog — la fiche d'un élève, et sa correction.
 *
 * Le bouton « Plus d'actions » de la liste ne faisait rien. Il ouvre
 * maintenant l'identité de l'élève, ses parents avec leur téléphone, et un
 * résumé de sa scolarité. La direction et le secrétariat peuvent y corriger
 * le nom, la classe et le matricule.
 */

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Pencil, Phone } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient, { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { formatCurrency, formatDate } from '@/shared/lib/utils';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Modal from '@/shared/components/ui/Modal';
import Select from '@/shared/components/ui/Select';
import { useTranslation } from '@/shared/i18n';

function Bloc({ titre, children }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{titre}</h3>
      {children}
    </section>
  );
}

export default function FicheDialog({ eleveId, peutModifier, onClose, onChanged }) {
  const { t } = useTranslation();
  const p = (cle, valeurs) => t(`pages.eleves.fiche.${cle}`, valeurs);
  const queryClient = useQueryClient();
  const [edition, setEdition] = useState(false);
  const [champs, setChamps] = useState({ name: '', prenom: '', classe_id: '', numero_matricule: '' });
  const [erreurs, setErreurs] = useState({});
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  const requete = useApiQuery(['eleve-fiche', eleveId], `/eleves/${eleveId}/fiche`, { queryOptions: { enabled: !!eleveId, staleTime: 0 } });
  const fiche = requete.data?.data;
  const requeteClasses = useApiQuery(['classes'], '/classes', { queryOptions: { enabled: edition } });
  const classes = useMemo(() => (unwrapList(requeteClasses.data) ?? []).map((c) => ({ value: c.id, label: c.nom_classe })), [requeteClasses.data]);

  useEffect(() => { setEdition(false); setErreur(null); setErreurs({}); }, [eleveId]);

  const modifier = () => {
    setChamps({
      name: fiche.eleve.name ?? '', prenom: fiche.eleve.prenom ?? '',
      classe_id: String(fiche.eleve.classe?.id ?? ''), numero_matricule: fiche.eleve.numero_matricule ?? '',
    });
    setErreurs({}); setErreur(null); setEdition(true);
  };
  const champ = (nom) => ({
    value: champs[nom],
    onChange: (e) => { setChamps((c) => ({ ...c, [nom]: e.target.value })); setErreurs((c) => ({ ...c, [nom]: undefined })); },
    error: erreurs[nom],
  });

  const enregistrer = async (evenement) => {
    evenement.preventDefault();
    const e = {};
    if (!champs.name.trim()) e.name = p('nom_requis');
    if (!champs.prenom.trim()) e.prenom = p('prenom_requis');
    if (!champs.classe_id) e.classe_id = p('classe_requise');
    if (!champs.numero_matricule.trim()) e.numero_matricule = p('matricule_requis');
    setErreurs(e);
    if (Object.keys(e).length > 0) return;

    setEnvoi(true);
    setErreur(null);
    try {
      await apiClient.put(`/eleves/update/${eleveId}`, {
        name: champs.name.trim(), prenom: champs.prenom.trim(),
        classe_id: Number(champs.classe_id), numero_matricule: champs.numero_matricule.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ['eleve-fiche', eleveId] });
      setEdition(false);
      onChanged?.();
    } catch (err) {
      const details = err?.errors ?? {};
      setErreurs({ name: details.name?.[0], prenom: details.prenom?.[0], classe_id: details.classe_id?.[0], numero_matricule: details.numero_matricule?.[0] });
      setErreur(Object.keys(details).length ? null : (err?.message ?? p('echec')));
    } finally {
      setEnvoi(false);
    }
  };

  const fermer = () => { if (!envoi) onClose(); };
  const nom = fiche ? `${fiche.eleve.name ?? ''} ${fiche.eleve.prenom ?? ''}`.trim() : '';

  return (
    <Modal open={!!eleveId} onClose={fermer} title={nom || p('titre')} size="lg">
      {requete.isPending ? (
        <div className="flex h-40 items-center justify-center" role="status" aria-label={t('common.loading')}><Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" /></div>
      ) : requete.isError || !fiche ? (
        <div className="p-8 text-center">
          <p className="text-sm text-[var(--text-secondary)]">{requete.error?.message ?? t('common.load_error')}</p>
          <Button className="mt-3" variant="outline" onClick={() => requete.refetch()}>{t('common.retry')}</Button>
        </div>
      ) : edition ? (
        <form onSubmit={enregistrer} className="space-y-4 p-5" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label={p('nom')} autoComplete="off" required {...champ('name')} />
            <Input label={p('prenom')} autoComplete="off" required {...champ('prenom')} />
            <Select label={p('classe')} options={classes} required {...champ('classe_id')} />
            <Input label={p('matricule')} autoComplete="off" maxLength={50} required {...champ('numero_matricule')} />
          </div>
          {erreur && <p role="alert" className="text-sm text-[var(--error)]">{erreur}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setEdition(false)} disabled={envoi}>{t('common.cancel')}</Button>
            <Button type="submit" loading={envoi}>{p('enregistrer')}</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-5 p-5">
          <Bloc titre={p('identite')}>
            <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <div><dt className="inline text-[var(--text-secondary)]">{p('classe')} : </dt><dd className="inline font-medium">{fiche.eleve.classe?.nom ?? '—'}</dd></div>
              <div><dt className="inline text-[var(--text-secondary)]">{p('matricule')} : </dt><dd className="inline font-mono">{fiche.eleve.numero_matricule}</dd></div>
              <div><dt className="inline text-[var(--text-secondary)]">{p('naissance')} : </dt><dd className="inline">{fiche.eleve.date_naissance ? formatDate(fiche.eleve.date_naissance) : '—'}</dd></div>
              <div><dt className="inline text-[var(--text-secondary)]">{p('etat')} : </dt><dd className="inline">{fiche.eleve.statut === 'inactive' ? p('retire') : p('inscrit')}</dd></div>
            </dl>
          </Bloc>

          <Bloc titre={p('parents')}>
            {fiche.parents.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">{p('aucun_parent')}</p>
            ) : (
              <ul className="space-y-2" data-testid="parents">
                {fiche.parents.map((parent) => (
                  <li key={`${parent.nom}-${parent.telephone}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-medium text-[var(--text-primary)]">{parent.nom}</span>
                    {parent.principal && <Badge variant="primary">{p('contact_reference')}</Badge>}
                    {parent.telephone && (
                      <a className="inline-flex min-h-11 items-center gap-1 text-[var(--primary)] underline" href={`tel:${parent.telephone}`}>
                        <Phone size={14} aria-hidden="true" />{parent.telephone}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Bloc>

          <Bloc titre={p('scolarite')}>
            <dl className="grid gap-3 text-sm sm:grid-cols-3" data-testid="scolarite">
              <div className="rounded-md border border-[var(--border)] p-3">
                <dt className="text-[var(--text-secondary)]">{p('moyenne')}</dt>
                <dd className="text-lg font-semibold">{fiche.scolarite.moyenne == null ? '—' : `${String(fiche.scolarite.moyenne).replace('.', ',')}/20`}</dd>
                <dd className="text-xs text-[var(--text-secondary)]">{p('sur_notes', { nombre: fiche.scolarite.notes })}</dd>
              </div>
              <div className="rounded-md border border-[var(--border)] p-3">
                <dt className="text-[var(--text-secondary)]">{p('absences')}</dt>
                <dd className="text-lg font-semibold">{fiche.scolarite.absences}</dd>
                <dd className="text-xs text-[var(--text-secondary)]">{p('non_justifiees', { nombre: fiche.scolarite.absences_non_justifiees })}</dd>
              </div>
              {fiche.paiements && (
                <div className="rounded-md border border-[var(--border)] p-3">
                  <dt className="text-[var(--text-secondary)]">{p('reste_a_payer')}</dt>
                  <dd className="text-lg font-semibold">{formatCurrency(fiche.paiements.reste)}</dd>
                  <dd className="text-xs text-[var(--text-secondary)]">{p('paye_sur', { paye: formatCurrency(fiche.paiements.total_paye), total: formatCurrency(fiche.paiements.total_du) })}</dd>
                </div>
              )}
            </dl>
          </Bloc>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={fermer}>{t('common.close')}</Button>
            {peutModifier && <Button icon={<Pencil size={16} />} onClick={modifier}>{p('modifier')}</Button>}
          </div>
        </div>
      )}
    </Modal>
  );
}
