/**
 * InscriptionDialog — inscrire un élève, et son parent s'il est connu.
 *
 * « Nouvel élève » n'ouvrait rien (audit BUG-002). L'agent saisit qui est
 * l'élève et où il va ; l'API produit le matricule et les mots de passe
 * provisoires, que ce dialogue affiche une seule fois pour les remettre à la
 * famille.
 */

import { useEffect, useMemo, useState } from 'react';
import apiClient, { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Modal from '@/shared/components/ui/Modal';
import Select from '@/shared/components/ui/Select';
import { useTranslation } from '@/shared/i18n';

/** Même règle que `App\Support\BeninPhone` : 10 chiffres en 01, ou 8 (ancien format). */
export const telephoneBeninValide = (saisie) =>
  /^(\+229|00229|229)?(01\d{8}|\d{8})$/.test(String(saisie ?? '').replace(/[\s.\-()]/g, ''));

const VIDE = { name: '', prenom: '', classe_id: '', sexe: '', date_naissance: '', parentNom: '', parentPrenom: '', parentTelephone: '' };

export default function InscriptionDialog({ open, onClose, onDone }) {
  const { t } = useTranslation();
  const p = (cle, valeurs) => t(`pages.eleves.inscription.${cle}`, valeurs);
  const [champs, setChamps] = useState(VIDE);
  const [erreurs, setErreurs] = useState({});
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [acces, setAcces] = useState(null);

  const requeteClasses = useApiQuery(['classes'], '/classes', { queryOptions: { enabled: open } });
  const classes = useMemo(
    () => (unwrapList(requeteClasses.data) ?? []).map((c) => ({ value: c.id, label: c.nom_classe })),
    [requeteClasses.data],
  );

  useEffect(() => {
    if (open) { setChamps(VIDE); setErreurs({}); setErreur(null); setEnvoi(false); setAcces(null); }
  }, [open]);

  const champ = (nom) => ({
    value: champs[nom],
    onChange: (e) => { setChamps((c) => ({ ...c, [nom]: e.target.value })); setErreurs((c) => ({ ...c, [nom]: undefined })); },
    error: erreurs[nom],
  });
  const fermer = () => { if (!envoi) onClose(); };
  const avecParent = Boolean(champs.parentNom.trim() || champs.parentPrenom.trim() || champs.parentTelephone.trim());

  const controler = () => {
    const e = {};
    if (!champs.name.trim()) e.name = p('nom_requis');
    if (!champs.prenom.trim()) e.prenom = p('prenom_requis');
    if (!champs.classe_id) e.classe_id = p('classe_requise');
    if (avecParent && !champs.parentNom.trim()) e.parentNom = p('parent_nom_requis');
    if (avecParent && !telephoneBeninValide(champs.parentTelephone)) e.parentTelephone = p('telephone_invalide');
    return e;
  };

  const inscrire = async (evenement) => {
    evenement.preventDefault();
    const e = controler();
    setErreurs(e);
    if (Object.keys(e).length > 0) return;

    setEnvoi(true);
    setErreur(null);
    try {
      const { data } = await apiClient.post('/eleves/store', {
        name: champs.name.trim(),
        prenom: champs.prenom.trim(),
        classe_id: Number(champs.classe_id),
        ...(champs.sexe ? { sexe: champs.sexe } : {}),
        ...(champs.date_naissance ? { date_naissance: champs.date_naissance } : {}),
        ...(avecParent ? { parent: {
          name: champs.parentNom.trim(),
          ...(champs.parentPrenom.trim() ? { prenom: champs.parentPrenom.trim() } : {}),
          telephone: champs.parentTelephone.trim(),
        } } : {}),
      });
      setAcces({ matricule: data?.numero_matricule, ...(data?.acces ?? {}) });
      onDone?.(data);
    } catch (err) {
      const details = err?.errors ?? err?.response?.data?.errors;
      setErreur(details ? Object.values(details).flat().join(' ') : (err?.response?.data?.message ?? err?.message ?? p('echec')));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Modal open={open} onClose={fermer} title={acces ? p('titre_fait') : p('titre')} size="lg">
      {acces ? (
        <div className="space-y-4 p-5">
          <p role="status" className="text-sm text-[var(--text-primary)]">{p('fait', { nom: `${champs.name} ${champs.prenom}`.trim() })}</p>
          <p className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm text-[var(--text-secondary)]">{p('une_seule_fois')}</p>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-[var(--border)] p-3" data-testid="acces-eleve">
              <dt className="text-sm font-medium text-[var(--text-primary)]">{p('acces_eleve')}</dt>
              <dd className="mt-1 text-sm">{p('identifiant')} : <strong className="font-mono">{acces.eleve?.identifiant}</strong></dd>
              <dd className="text-sm">{p('mot_de_passe')} : <strong className="font-mono">{acces.eleve?.mot_de_passe_provisoire}</strong></dd>
            </div>
            {acces.parent && (
              <div className="rounded-md border border-[var(--border)] p-3" data-testid="acces-parent">
                <dt className="text-sm font-medium text-[var(--text-primary)]">{p('acces_parent')}</dt>
                <dd className="mt-1 text-sm">{p('identifiant')} : <strong className="font-mono">{acces.parent.identifiant}</strong></dd>
                <dd className="text-sm">
                  {acces.parent.nouveau
                    ? <>{p('mot_de_passe')} : <strong className="font-mono">{acces.parent.mot_de_passe_provisoire}</strong></>
                    : p('parent_deja_connu')}
                </dd>
              </div>
            )}
          </dl>
          <div className="flex justify-end"><Button onClick={onClose}>{p('terminer')}</Button></div>
        </div>
      ) : (
        <form onSubmit={inscrire} className="space-y-5 p-5" noValidate>
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-semibold text-[var(--text-primary)]">{p('eleve')}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label={p('nom')} autoComplete="off" required {...champ('name')} />
              <Input label={p('prenom')} autoComplete="off" required {...champ('prenom')} />
              <Select label={p('classe')} placeholder={p('choisir_classe')} options={classes} required {...champ('classe_id')} />
              <Select
                label={p('sexe')}
                placeholder={p('non_precise')}
                options={[{ value: 'F', label: p('fille') }, { value: 'M', label: p('garcon') }]}
                {...champ('sexe')}
              />
              <Input type="date" label={p('date_naissance')} {...champ('date_naissance')} />
            </div>
          </fieldset>
          <fieldset className="space-y-3">
            <legend className="mb-1 text-sm font-semibold text-[var(--text-primary)]">{p('parent')}</legend>
            <p className="text-sm text-[var(--text-secondary)]">{p('parent_aide')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label={p('parent_nom')} autoComplete="off" {...champ('parentNom')} />
              <Input label={p('parent_prenom')} autoComplete="off" {...champ('parentPrenom')} />
              <Input type="tel" inputMode="tel" label={p('parent_telephone')} helperText={p('telephone_aide')} placeholder="01 97 00 00 00" {...champ('parentTelephone')} />
            </div>
          </fieldset>
          {erreur && <p role="alert" className="text-sm text-[var(--error)]">{erreur}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={fermer} disabled={envoi}>{t('common.cancel')}</Button>
            <Button type="submit" loading={envoi}>{p('inscrire')}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
