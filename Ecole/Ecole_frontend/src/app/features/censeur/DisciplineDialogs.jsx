/**
 * Formulaires de la vie scolaire (lot 6.2) : déclarer un incident, prononcer
 * une sanction, et la liste des sanctions avec leur levée.
 */

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import apiClient, { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { formatDate } from '@/shared/lib/utils';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Card from '@/shared/components/ui/Card';
import Input from '@/shared/components/ui/Input';
import Modal from '@/shared/components/ui/Modal';
import Select from '@/shared/components/ui/Select';
import { useTranslation } from '@/shared/i18n';

const aujourdhui = () => new Date().toISOString().slice(0, 10);

/** Petit formulaire commun : champs, contrôle, envoi, erreurs de l'API. */
function useFormulaire(initial, open) {
  const [champs, setChamps] = useState(initial);
  const [erreurs, setErreurs] = useState({});
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  useEffect(() => { if (open) { setChamps(initial); setErreurs({}); setErreur(null); setEnvoi(false); } }, [open]); // eslint-disable-line
  const champ = (nom) => ({
    value: champs[nom],
    onChange: (e) => { setChamps((c) => ({ ...c, [nom]: e.target.value })); setErreurs((c) => ({ ...c, [nom]: undefined })); },
    error: erreurs[nom],
  });
  const envoyer = async (requete, surSucces) => {
    setEnvoi(true);
    setErreur(null);
    try {
      await requete();
      surSucces();
    } catch (err) {
      const details = err?.errors ?? {};
      setErreurs(Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v?.[0]])));
      setErreur(Object.keys(details).length ? null : (err?.message ?? 'Erreur'));
    } finally {
      setEnvoi(false);
    }
  };
  return { champs, champ, erreurs, setErreurs, erreur, envoi, envoyer };
}

export function IncidentDialog({ open, onClose, onDone }) {
  const { t } = useTranslation();
  const p = (cle) => t(`pages.censeur.vie_scolaire.${cle}`);
  const f = useFormulaire({ description: '', date: aujourdhui(), gravite: 'faible' }, open);

  const creer = (e) => {
    e.preventDefault();
    if (!f.champs.description.trim()) { f.setErreurs({ description: p('description_requise') }); return; }
    f.envoyer(() => apiClient.post('/surveillant/incidents', { ...f.champs, description: f.champs.description.trim() }), () => { onDone?.(); onClose(); });
  };

  return (
    <Modal open={open} onClose={() => !f.envoi && onClose()} title={p('nouvel_incident')} size="md">
      <form onSubmit={creer} className="space-y-4 p-5" noValidate>
        <Input label={p('description')} required {...f.champ('description')} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input type="date" label={p('date')} max={aujourdhui()} {...f.champ('date')} />
          <Select label={p('gravite')} options={['faible', 'moyenne', 'grave'].map((v) => ({ value: v, label: p(`gravites.${v}`) }))} {...f.champ('gravite')} />
        </div>
        {f.erreur && <p role="alert" className="text-sm text-[var(--error)]">{f.erreur}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={f.envoi}>{t('common.cancel')}</Button>
          <Button type="submit" loading={f.envoi}>{p('enregistrer')}</Button>
        </div>
      </form>
    </Modal>
  );
}

function SanctionDialog({ open, onClose, onDone }) {
  const { t } = useTranslation();
  const p = (cle) => t(`pages.censeur.vie_scolaire.${cle}`);
  const f = useFormulaire({ eleve_id: '', type_sanction: 'Avertissement', motif: '', date: aujourdhui(), duree: '' }, open);
  const requeteEleves = useApiQuery(['eleves'], '/eleves', { queryOptions: { enabled: open } });
  const eleves = useMemo(() => (unwrapList(requeteEleves.data) ?? [])
    .map((e) => ({ value: e.id, label: `${e.user?.name ?? ''} ${e.user?.prenom ?? ''} · ${e.classe?.nom_classe ?? ''}`.trim() }))
    .sort((a, b) => a.label.localeCompare(b.label)), [requeteEleves.data]);

  const creer = (e) => {
    e.preventDefault();
    const err = {};
    if (!f.champs.eleve_id) err.eleve_id = p('eleve_requis');
    if (!f.champs.motif.trim()) err.motif = p('motif_requis');
    f.setErreurs(err);
    if (Object.keys(err).length) return;
    f.envoyer(() => apiClient.post('/surveillant/sanctions', {
      eleve_id: Number(f.champs.eleve_id), type_sanction: f.champs.type_sanction, motif: f.champs.motif.trim(), date: f.champs.date,
      ...(f.champs.duree ? { duree: Number(f.champs.duree) } : {}),
    }), () => { onDone?.(); onClose(); });
  };

  return (
    <Modal open={open} onClose={() => !f.envoi && onClose()} title={p('nouvelle_sanction')} size="md">
      <form onSubmit={creer} className="space-y-4 p-5" noValidate>
        <Select label={p('eleve')} placeholder={p('choisir_eleve')} options={eleves} required {...f.champ('eleve_id')} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label={p('type')} options={['Avertissement', 'Blâme', 'Retenue', 'Exclusion temporaire', 'Travail d’intérêt scolaire'].map((v) => ({ value: v, label: v }))} {...f.champ('type_sanction')} />
          <Input type="number" min="1" label={p('duree')} helperText={p('duree_aide')} {...f.champ('duree')} />
        </div>
        <Input label={p('motif')} required {...f.champ('motif')} />
        <Input type="date" label={p('date')} max={aujourdhui()} {...f.champ('date')} />
        {f.erreur && <p role="alert" className="text-sm text-[var(--error)]">{f.erreur}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={f.envoi}>{t('common.cancel')}</Button>
          <Button type="submit" loading={f.envoi}>{p('enregistrer')}</Button>
        </div>
      </form>
    </Modal>
  );
}

export function SanctionsSection() {
  const { t } = useTranslation();
  const p = (cle) => t(`pages.censeur.vie_scolaire.${cle}`);
  const [ouvert, setOuvert] = useState(false);
  const requete = useApiQuery(['surveillant-sanctions'], '/surveillant/sanctions');
  const sanctions = useMemo(() => unwrapList(requete.data) ?? [], [requete.data]);

  const lever = async (id) => {
    await apiClient.patch(`/surveillant/sanctions/${id}`, { statut: 'levee' });
    requete.refetch();
  };

  return (
    <Card padding>
      <SanctionDialog open={ouvert} onClose={() => setOuvert(false)} onDone={() => requete.refetch()} />
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">{p('sanctions')}</h2>
        <Button size="sm" icon={<Plus size={16} />} onClick={() => setOuvert(true)}>{p('nouvelle_sanction')}</Button>
      </div>
      {sanctions.length === 0 ? (
        <p className="py-4 text-sm text-[var(--text-secondary)]">{p('aucune_sanction')}</p>
      ) : (
        <ul className="divide-y divide-[var(--border-light)]" data-testid="sanctions">
          {sanctions.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span>
                <span className="font-medium">{`${s.eleve?.user?.name ?? ''} ${s.eleve?.user?.prenom ?? ''}`.trim()}</span>
                <span className="ml-2 text-[var(--text-secondary)]">{s.type_sanction} · {s.motif} · {s.date ? formatDate(s.date) : ''}</span>
              </span>
              {s.statut === 'active'
                ? <Button size="sm" variant="outline" onClick={() => lever(s.id)}>{p('lever')}</Button>
                : <Badge variant="default">{p(`statuts_sanction.${s.statut}`)}</Badge>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
