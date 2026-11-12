/**
 * EmploiDuTempsPage — l'emploi du temps par classe (lot 6.3).
 *
 * L'ancienne grille plaçait chaque cours selon son rang dans la journée et non
 * selon son heure (un cours de 10 h, premier du jour, s'affichait à 8 h),
 * inventait un emploi du temps quand l'école n'en avait pas, et débordait sur
 * téléphone. Ici, une colonne par jour qui s'empile sur petit écran, chaque
 * cours avec ses heures réelles. La direction ajoute, modifie et supprime ;
 * l'API refuse un créneau déjà pris par la classe ou l'enseignant, et la page
 * le dit.
 */

import { useEffect, useMemo, useState } from 'react';
import { Clock, Loader2, MapPin, Pencil, Plus, Trash2, User } from 'lucide-react';
import apiClient, { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import useAuthStore from '@/shared/stores/auth-store';
import { ROLE_GROUPS } from '@/shared/types/roles';
import Button from '@/shared/components/ui/Button';
import Card from '@/shared/components/ui/Card';
import Input from '@/shared/components/ui/Input';
import Modal from '@/shared/components/ui/Modal';
import Select from '@/shared/components/ui/Select';
import { useTranslation } from '@/shared/i18n';

/** Valeurs de `emplois_du_temps.jour` côté API. */
export const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const hh = (heure) => String(heure ?? '').slice(0, 5);
const nomProf = (c) => [c.enseignant?.user?.name, c.enseignant?.user?.prenom].filter(Boolean).join(' ');
const VIDE = { classe_id: '', matiere_id: '', enseignant_id: '', jour: 'Lundi', heure_debut: '08:00', heure_fin: '09:00', salle: '' };

function CoursDialog({ cours, classeParDefaut, onClose, onDone }) {
  const { t } = useTranslation();
  const p = (cle) => t(`pages.emploi_du_temps.edition.${cle}`);
  const open = cours !== null;
  const [champs, setChamps] = useState(VIDE);
  const [erreurs, setErreurs] = useState({});
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  const classes = useApiQuery(['classes'], '/classes', { queryOptions: { enabled: open } });
  const matieres = useApiQuery(['matieres'], '/matieres', { queryOptions: { enabled: open } });
  const enseignants = useApiQuery(['enseignants'], '/enseignants', { queryOptions: { enabled: open } });
  const options = (requete, libelle) => (unwrapList(requete.data) ?? []).map((x) => ({ value: x.id, label: libelle(x) }));

  useEffect(() => {
    if (!open) return;
    setChamps(cours?.id ? {
      classe_id: String(cours.classe_id ?? ''), matiere_id: String(cours.matiere_id ?? ''), enseignant_id: String(cours.enseignant_id ?? ''),
      jour: cours.jour, heure_debut: hh(cours.heure_debut), heure_fin: hh(cours.heure_fin), salle: cours.salle ?? '',
    } : { ...VIDE, classe_id: classeParDefaut ?? '' });
    setErreurs({}); setErreur(null); setEnvoi(false);
  }, [open, cours, classeParDefaut]);

  const champ = (nom) => ({
    value: champs[nom],
    onChange: (e) => { setChamps((c) => ({ ...c, [nom]: e.target.value })); setErreurs((c) => ({ ...c, [nom]: undefined })); },
    error: erreurs[nom],
  });

  const enregistrer = async (evenement) => {
    evenement.preventDefault();
    const e = {};
    ['classe_id', 'matiere_id', 'enseignant_id'].forEach((k) => { if (!champs[k]) e[k] = p('requis'); });
    if (champs.heure_fin <= champs.heure_debut) e.heure_fin = p('fin_apres_debut');
    setErreurs(e);
    if (Object.keys(e).length) return;

    const corps = {
      classe_id: Number(champs.classe_id), matiere_id: Number(champs.matiere_id), enseignant_id: Number(champs.enseignant_id),
      jour: champs.jour, heure_debut: champs.heure_debut, heure_fin: champs.heure_fin, salle: champs.salle.trim() || null,
    };
    setEnvoi(true);
    setErreur(null);
    try {
      if (cours?.id) await apiClient.put(`/emploi-du-temps/update/${cours.id}`, corps);
      else await apiClient.post('/emploi-du-temps/store', corps);
      onDone();
      onClose();
    } catch (err) {
      const details = err?.errors ?? {};
      setErreurs(Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v?.[0]])));
      setErreur(Object.keys(details).length ? null : (err?.message ?? p('echec')));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Modal open={open} onClose={() => !envoi && onClose()} title={cours?.id ? p('modifier') : p('ajouter')} size="md">
      <form onSubmit={enregistrer} className="space-y-4 p-5" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label={p('classe')} placeholder={p('choisir')} options={options(classes, (x) => x.nom_classe)} {...champ('classe_id')} />
          <Select label={p('matiere')} placeholder={p('choisir')} options={options(matieres, (x) => x.nom)} {...champ('matiere_id')} />
          <Select label={p('enseignant')} placeholder={p('choisir')} options={options(enseignants, (x) => [x.user?.name, x.user?.prenom].filter(Boolean).join(' ') || `#${x.id}`)} {...champ('enseignant_id')} />
          <Select label={p('jour')} options={JOURS.map((j) => ({ value: j, label: t(`emploi_du_temps.${j.toLowerCase()}`) }))} {...champ('jour')} />
          <Input type="time" label={p('debut')} step="300" {...champ('heure_debut')} />
          <Input type="time" label={p('fin')} step="300" {...champ('heure_fin')} />
          <Input label={p('salle')} maxLength={191} {...champ('salle')} />
        </div>
        {erreur && <p role="alert" className="text-sm text-[var(--error)]">{erreur}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={envoi}>{t('common.cancel')}</Button>
          <Button type="submit" loading={envoi}>{p('enregistrer')}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function EmploiDuTempsPage() {
  const { t } = useTranslation();
  const p = (cle, valeurs) => t(`pages.emploi_du_temps.edition.${cle}`, valeurs);
  const peutModifier = useAuthStore((s) => s.hasAnyRole([...ROLE_GROUPS.DIRECTION]));
  const [classe, setClasse] = useState('');
  const [edition, setEdition] = useState(null);
  const [erreur, setErreur] = useState(null);

  const requeteClasses = useApiQuery(['classes'], '/classes');
  const classes = useMemo(() => (unwrapList(requeteClasses.data) ?? []).map((c) => ({ value: c.id, label: c.nom_classe })), [requeteClasses.data]);
  const requete = useApiQuery(['emploi-du-temps', classe], classe ? `/emploi-du-temps?classe_id=${classe}` : '/emploi-du-temps');

  const parJour = useMemo(() => {
    const cours = unwrapList(requete.data) ?? [];
    const structure = Object.fromEntries(JOURS.map((j) => [j, []]));
    cours.forEach((c) => {
      const jour = JOURS.find((j) => j.toLowerCase() === String(c.jour ?? '').toLowerCase());
      if (jour) structure[jour].push(c);
    });
    Object.values(structure).forEach((liste) => liste.sort((a, b) => hh(a.heure_debut).localeCompare(hh(b.heure_debut))));
    return structure;
  }, [requete.data]);

  const supprimer = async (cours) => {
    if (!window.confirm(p('confirmer_suppression', { matiere: cours.matiere?.nom ?? '', jour: cours.jour, heure: hh(cours.heure_debut) }))) return;
    setErreur(null);
    try {
      await apiClient.delete(`/emploi-du-temps/delete/${cours.id}`);
      requete.refetch();
    } catch (err) {
      setErreur(err?.message ?? p('echec'));
    }
  };

  return (
    <div className="space-y-6">
      <CoursDialog cours={edition} classeParDefaut={classe} onClose={() => setEdition(null)} onDone={() => requete.refetch()} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('pages.emploi_du_temps.emploi_du_temps.title')}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{t('pages.emploi_du_temps.emploi_du_temps.subtitle')}</p>
        </div>
        {peutModifier && <Button icon={<Plus size={18} />} onClick={() => setEdition({})}>{t('pages.emploi_du_temps.emploi_du_temps.ajouter_un_cours')}</Button>}
      </div>

      <Card>
        <div className="max-w-sm">
          <Select label={p('classe')} placeholder={p('toutes_les_classes')} options={classes} value={classe} onChange={(e) => setClasse(e.target.value)} />
        </div>
        {erreur && <p role="alert" className="mt-3 text-sm text-[var(--error)]">{erreur}</p>}
      </Card>

      {requete.isPending ? (
        <div className="flex h-40 items-center justify-center" role="status" aria-label={t('common.loading')}><Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" /></div>
      ) : requete.isError ? (
        <Card><p role="alert" className="py-6 text-center text-sm text-[var(--error)]">{requete.error?.message ?? t('common.load_error')}</p></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {JOURS.map((jour) => (
            <section key={jour} aria-labelledby={`jour-${jour}`} className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]">
              <h2 id={`jour-${jour}`} className="border-b border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]">{t(`emploi_du_temps.${jour.toLowerCase()}`)}</h2>
              {parJour[jour].length === 0 ? (
                <p className="px-3 py-4 text-xs text-[var(--text-tertiary)]">{p('aucun_cours')}</p>
              ) : (
                <ul className="divide-y divide-[var(--border-light)]">
                  {parJour[jour].map((c) => (
                    <li key={c.id} className="space-y-1 px-3 py-2 text-xs" data-testid="cours">
                      <p className="flex items-center gap-1 font-semibold text-[var(--text-primary)]"><Clock size={12} aria-hidden="true" />{hh(c.heure_debut)} – {hh(c.heure_fin)}</p>
                      <p className="text-sm font-medium text-[var(--accent)]">{c.matiere?.nom ?? '—'}</p>
                      {!classe && c.classe?.nom_classe && <p className="text-[var(--text-secondary)]">{c.classe.nom_classe}</p>}
                      {nomProf(c) && <p className="flex items-center gap-1 text-[var(--text-secondary)]"><User size={12} aria-hidden="true" />{nomProf(c)}</p>}
                      {c.salle && <p className="flex items-center gap-1 text-[var(--text-tertiary)]"><MapPin size={12} aria-hidden="true" />{c.salle}</p>}
                      {peutModifier && (
                        <div className="flex gap-1 pt-1">
                          <Button size="sm" variant="ghost" icon={<Pencil size={14} />} aria-label={p('modifier_cours', { matiere: c.matiere?.nom ?? '' })} onClick={() => setEdition(c)} />
                          <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} aria-label={p('supprimer_cours', { matiere: c.matiere?.nom ?? '' })} onClick={() => supprimer(c)} />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
