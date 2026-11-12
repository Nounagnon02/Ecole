/**
 * PersonnelPage — les comptes du personnel de l'école, et l'ajout direct.
 *
 * La direction n'avait aucun écran pour créer le compte d'un enseignant ou
 * d'un agent : seule l'API le permettait. Ici, un membre s'ajoute en quelques
 * champs ; son téléphone lui sert d'identifiant, et son mot de passe
 * provisoire, affiché une seule fois, devra être remplacé à la première
 * connexion. Pour une équipe entière, l'import par fichier est sur la page
 * « Élèves ».
 */

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Search } from 'lucide-react';
import apiClient, { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { ROLE_LABELS } from '@/shared/types/roles';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Card from '@/shared/components/ui/Card';
import Input from '@/shared/components/ui/Input';
import Modal from '@/shared/components/ui/Modal';
import Select from '@/shared/components/ui/Select';
import { telephoneBeninValide } from '@/app/features/eleves/InscriptionDialog';
import { useTranslation } from '@/shared/i18n';

/** Rôles que la direction peut créer (cf. `Roles::provisionable()` côté API). */
export const ROLES_PERSONNEL = [
  'enseignant', 'enseignementM', 'enseignementP', 'enseignement',
  'secretaire', 'comptable', 'surveillant', 'censeur', 'infirmier', 'bibliothecaire',
  'directeurM', 'directeurP', 'directeurS', 'directeur',
];

const VIDE = { role: '', nom: '', prenom: '', telephone: '', email: '' };

function AjoutDialog({ open, onClose, onDone }) {
  const { t } = useTranslation();
  const p = (cle, valeurs) => t(`pages.personnel.${cle}`, valeurs);
  const [champs, setChamps] = useState(VIDE);
  const [erreurs, setErreurs] = useState({});
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [acces, setAcces] = useState(null);

  useEffect(() => {
    if (open) { setChamps(VIDE); setErreurs({}); setErreur(null); setEnvoi(false); setAcces(null); }
  }, [open]);

  const champ = (nom) => ({
    value: champs[nom],
    onChange: (e) => { setChamps((c) => ({ ...c, [nom]: e.target.value })); setErreurs((c) => ({ ...c, [nom]: undefined })); },
    error: erreurs[nom],
  });
  const fermer = () => { if (!envoi) onClose(); };

  const creer = async (evenement) => {
    evenement.preventDefault();
    const e = {};
    if (!champs.role) e.role = p('role_requis');
    if (!champs.nom.trim()) e.nom = p('nom_requis');
    if (!telephoneBeninValide(champs.telephone)) e.telephone = p('telephone_invalide');
    setErreurs(e);
    if (Object.keys(e).length > 0) return;

    setEnvoi(true);
    setErreur(null);
    try {
      const { data } = await apiClient.post('/personnel/comptes', {
        role: champs.role,
        nom: champs.nom.trim(),
        telephone: champs.telephone.trim(),
        ...(champs.prenom.trim() ? { prenom: champs.prenom.trim() } : {}),
        ...(champs.email.trim() ? { email: champs.email.trim() } : {}),
      });
      setAcces(data?.acces ?? {});
      onDone?.();
    } catch (err) {
      const details = err?.errors ?? {};
      setErreurs({ telephone: details.telephone?.[0], email: details.email?.[0], role: details.role?.[0] });
      setErreur(details.telephone || details.email || details.role ? null : (err?.message ?? p('echec')));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Modal open={open} onClose={fermer} title={acces ? p('titre_fait') : p('ajouter')} size="md">
      {acces ? (
        <div className="space-y-4 p-5">
          <p role="status" className="text-sm text-[var(--text-primary)]">{p('fait', { nom: `${champs.nom} ${champs.prenom}`.trim() })}</p>
          <p className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm text-[var(--text-secondary)]">{p('une_seule_fois')}</p>
          <dl className="rounded-md border border-[var(--border)] p-3 text-sm" data-testid="acces">
            <dd>{p('identifiant')} : <strong className="font-mono">{acces.identifiant}</strong></dd>
            <dd>{p('mot_de_passe')} : <strong className="font-mono">{acces.mot_de_passe_provisoire}</strong></dd>
          </dl>
          <div className="flex justify-end"><Button onClick={onClose}>{p('terminer')}</Button></div>
        </div>
      ) : (
        <form onSubmit={creer} className="space-y-4 p-5" noValidate>
          <Select
            label={p('role')}
            placeholder={p('choisir_role')}
            options={ROLES_PERSONNEL.map((role) => ({ value: role, label: ROLE_LABELS[role] ?? role }))}
            required
            {...champ('role')}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label={p('nom')} autoComplete="off" required {...champ('nom')} />
            <Input label={p('prenom')} autoComplete="off" {...champ('prenom')} />
            <Input type="tel" inputMode="tel" label={p('telephone')} helperText={p('telephone_aide')} placeholder="01 97 00 00 00" required {...champ('telephone')} />
            <Input type="email" label={p('email')} autoComplete="off" {...champ('email')} />
          </div>
          {erreur && <p role="alert" className="text-sm text-[var(--error)]">{erreur}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={fermer} disabled={envoi}>{t('common.cancel')}</Button>
            <Button type="submit" loading={envoi}>{p('creer')}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function PersonnelPage() {
  const { t } = useTranslation();
  const p = (cle, valeurs) => t(`pages.personnel.${cle}`, valeurs);
  const [recherche, setRecherche] = useState('');
  const [ajout, setAjout] = useState(false);
  const requete = useApiQuery(['personnel-comptes'], '/personnel/comptes');
  const comptes = useMemo(() => unwrapList(requete.data) ?? [], [requete.data]);
  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return q ? comptes.filter((c) => `${c.name} ${c.prenom ?? ''} ${ROLE_LABELS[c.role] ?? c.role} ${c.identifiant ?? ''}`.toLowerCase().includes(q)) : comptes;
  }, [comptes, recherche]);

  return (
    <div className="space-y-6">
      <AjoutDialog open={ajout} onClose={() => setAjout(false)} onDone={() => requete.refetch()} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{p('title')}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{p('subtitle')}</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setAjout(true)}>{p('ajouter')}</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
        <Input className="pl-9" aria-label={p('rechercher')} placeholder={p('rechercher')} value={recherche} onChange={(e) => setRecherche(e.target.value)} />
      </div>

      <Card>
        {requete.isPending ? (
          <div className="flex h-32 items-center justify-center" role="status" aria-label={t('common.loading')}><Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" /></div>
        ) : requete.isError ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--text-secondary)]">{requete.error?.message ?? t('common.load_error')}</p>
            <Button className="mt-3" variant="outline" onClick={() => requete.refetch()}>{t('common.retry')}</Button>
          </div>
        ) : visibles.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-secondary)]">{p('aucun')}</p>
        ) : (
          <div className="overflow-x-auto" role="region" aria-label={t('common.tableau_defilant')} tabIndex={0}>
            <table className="w-full text-sm">
              <caption className="sr-only">{p('title')}</caption>
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
                  <th scope="col" className="px-3 py-2 font-medium">{p('nom')}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{p('role')}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{p('identifiant')}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{p('etat')}</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((compte) => (
                  <tr key={compte.id} className="border-b border-[var(--border-light)] last:border-0">
                    <th scope="row" className="px-3 py-3 text-left font-medium text-[var(--text-primary)]">{`${compte.name} ${compte.prenom ?? ''}`.trim()}</th>
                    <td className="px-3 py-3">{ROLE_LABELS[compte.role] ?? compte.role}</td>
                    <td className="px-3 py-3 font-mono text-xs">{compte.identifiant ?? '—'}</td>
                    <td className="px-3 py-3">
                      {compte.is_active === false
                        ? <Badge variant="default">{p('desactive')}</Badge>
                        : compte.mot_de_passe_provisoire
                          ? <Badge variant="warning">{p('jamais_connecte')}</Badge>
                          : <Badge variant="success">{p('actif')}</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
