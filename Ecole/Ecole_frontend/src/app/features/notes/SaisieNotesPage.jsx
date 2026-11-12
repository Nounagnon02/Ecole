/**
 * SaisieNotesPage — la grille de saisie des notes d'une évaluation.
 *
 * « Nouvelle note » n'ouvrait rien (audit BUG-002). L'enseignant choisit sa
 * classe, sa matière et l'évaluation, puis saisit au clavier : Entrée ou
 * flèche bas passe à l'élève suivant. La grille s'ouvre sur les notes déjà
 * saisies et se réenregistre sans doublon.
 *
 * Le brouillon est gardé sur l'appareil à chaque frappe. Si le réseau manque
 * au moment d'enregistrer, rien n'est perdu : la page le dit, et renvoie les
 * notes dès que la connexion revient (audit BUG-018).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, CloudOff, Download, FileUp, Loader2, Save } from 'lucide-react';
import { lireFichier, lireTableurNotes, modeleGrille } from './importNotes';
import apiClient, { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import useAuthStore from '@/shared/stores/auth-store';
import { ROLE_GROUPS } from '@/shared/types/roles';
import Button from '@/shared/components/ui/Button';
import Card from '@/shared/components/ui/Card';
import Input from '@/shared/components/ui/Input';
import Select from '@/shared/components/ui/Select';
import { useTranslation } from '@/shared/i18n';

/** Mêmes valeurs que `StoreNoteRequest` côté API. */
export const TYPES = ['Devoir1', 'Devoir2', 'Interrogation', '1ère evaluation', '2ème evaluation', '3ème evaluation', '4ème evaluation', '5ème evaluation', '6ème evaluation'];
export const PERIODES = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'];

const aujourdhui = () => new Date().toISOString().slice(0, 10);
const cleBrouillon = (e) => `ecole:brouillon-notes:${e.classe}:${e.matiere}:${e.type}:${e.periode}:${e.type === 'Interrogation' ? e.date : ''}`;
const lire = (cle) => { try { return JSON.parse(localStorage.getItem(cle) ?? 'null'); } catch { return null; } };
const ecrire = (cle, valeur) => { try { if (valeur) localStorage.setItem(cle, JSON.stringify(valeur)); else localStorage.removeItem(cle); } catch { /* stockage indisponible : la saisie continue */ } };

/** « 12,5 » ou « 12.5 » → 12.5 ; vide → null ; hors 0–20 ou illisible → NaN. */
export function lireNote(saisie) {
  const texte = String(saisie ?? '').trim().replace(',', '.');
  if (texte === '') return null;
  const valeur = Number(texte);
  return Number.isFinite(valeur) && valeur >= 0 && valeur <= 20 ? valeur : NaN;
}

export default function SaisieNotesPage() {
  const { t } = useTranslation();
  const p = (cle, valeurs) => t(`pages.notes.saisie.${cle}`, valeurs);
  const estDirection = useAuthStore((etat) => etat.hasAnyRole([...ROLE_GROUPS.DIRECTION]));
  const [evaluation, setEvaluation] = useState({ classe: '', matiere: '', type: TYPES[0], periode: PERIODES[0], date: aujourdhui() });
  const [saisies, setSaisies] = useState({});
  const [etat, setEtat] = useState('repos'); // repos | envoi | enregistre | attente | erreur
  const [message, setMessage] = useState(null);
  const champs = useRef({});
  const fichier = useRef(null);
  const [rapport, setRapport] = useState(null);

  const requeteClasses = useApiQuery(['classes-a-noter', estDirection], estDirection ? '/classes' : '/enseignant/classes');
  const classes = useMemo(() => (unwrapList(requeteClasses.data) ?? []).map((c) => ({ value: c.id, label: c.nom_classe })), [requeteClasses.data]);

  const pret = Boolean(evaluation.classe && evaluation.matiere);
  const requeteGrille = useApiQuery(
    ['notes-grille', evaluation.classe, evaluation.matiere, evaluation.type, evaluation.periode, evaluation.type === 'Interrogation' ? evaluation.date : ''],
    `/notes/grille/${evaluation.classe}`,
    {
      config: { params: pret ? { matiere_id: evaluation.matiere, type_evaluation: evaluation.type, periode: evaluation.periode, date_evaluation: evaluation.date } : {} },
      queryOptions: { enabled: !!evaluation.classe, staleTime: 0 },
    },
  );
  const grille = requeteGrille.data?.data;
  const eleves = useMemo(() => grille?.eleves ?? [], [grille]);
  const matieres = useMemo(() => (grille?.matieres ?? []).map((m) => ({ value: m.id, label: m.nom })), [grille]);
  const enregistrees = useMemo(() => Object.fromEntries((grille?.notes ?? []).map((n) => [n.eleve_id, n])), [grille]);
  const cle = pret ? cleBrouillon(evaluation) : null;

  // Une seule matière affectée dans la classe : la choisir serait une question sans choix.
  useEffect(() => {
    if (!evaluation.matiere && matieres.length === 1) setEvaluation((e) => ({ ...e, matiere: String(matieres[0].value) }));
  }, [matieres, evaluation.matiere]);

  // À l'ouverture d'une évaluation : le brouillon de l'appareil s'il existe,
  // sinon les notes déjà enregistrées.
  useEffect(() => {
    if (!pret || !grille) return;
    const brouillon = lire(cle);
    if (brouillon) {
      setSaisies(brouillon);
      setEtat('attente');
      setMessage(null);
    } else {
      setSaisies(Object.fromEntries(Object.values(enregistrees).map((n) => [n.eleve_id, String(n.note).replace('.', ',')])));
      setEtat('repos');
      setMessage(null);
    }
  }, [cle, grille]);

  const changer = (nom) => (evenement) => {
    const valeur = evenement.target.value;
    setEvaluation((e) => ({ ...e, [nom]: valeur, ...(nom === 'classe' ? { matiere: '' } : {}) }));
    setSaisies({});
  };

  const saisir = (eleveId, valeur) => {
    setSaisies((precedent) => {
      const suivant = { ...precedent, [eleveId]: valeur };
      ecrire(cle, suivant);
      return suivant;
    });
    setEtat('attente');
    setMessage(null);
  };

  const telechargerModele = () => {
    const url = URL.createObjectURL(new Blob(['\uFEFF' + modeleGrille(eleves, saisies)], { type: 'text/csv;charset=utf-8' }));
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = `notes-${grille?.classe?.nom_classe ?? 'classe'}-${evaluation.type}.csv`.replace(/[^\w.-]+/g, '_');
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    URL.revokeObjectURL(url);
  };

  // Les notes du tableur remplissent la grille ; rien n'est enregistré sans
  // le clic sur « Enregistrer ».
  const importer = async (evenement) => {
    const choisi = evenement.target.files?.[0];
    evenement.target.value = '';
    if (!choisi) return;
    const resultat = lireTableurNotes(await lireFichier(choisi), eleves, lireNote);
    setRapport({ nom: choisi.name, ...resultat });
    if (resultat.lues > 0) {
      setSaisies((precedent) => {
        const suivant = { ...precedent };
        Object.entries(resultat.saisies).forEach(([id, note]) => { if (!enregistrees[id]?.locked) suivant[id] = note; });
        ecrire(cle, suivant);
        return suivant;
      });
      setEtat('attente');
      setMessage(null);
    }
  };

  const allerA = (index) => { const cible = champs.current[eleves[index]?.id]; if (cible) { cible.focus(); cible.select?.(); } };
  const auClavier = (index) => (evenement) => {
    if (evenement.key === 'Enter' || evenement.key === 'ArrowDown') { evenement.preventDefault(); allerA(index + 1); }
    if (evenement.key === 'ArrowUp') { evenement.preventDefault(); allerA(index - 1); }
  };

  const invalides = eleves.filter((e) => Number.isNaN(lireNote(saisies[e.id])));
  const aEnvoyer = eleves
    .filter((e) => !enregistrees[e.id]?.locked)
    .map((e) => ({ eleve_id: e.id, note: lireNote(saisies[e.id]) }))
    .filter((n) => n.note !== null && !Number.isNaN(n.note));
  const enAttente = etat === 'attente' || etat === 'erreur' ? aEnvoyer.length : 0;

  const enregistrer = useCallback(async () => {
    if (!pret || invalides.length > 0 || aEnvoyer.length === 0) return;
    setEtat('envoi');
    setMessage(null);
    try {
      const { data } = await apiClient.post('/notes/bulk', {
        classe_id: Number(evaluation.classe), matiere_id: Number(evaluation.matiere),
        type_evaluation: evaluation.type, periode: evaluation.periode, date_evaluation: evaluation.date,
        notes: aEnvoyer,
      });
      // Hors-ligne, le client HTTP met l'envoi en file et répond « queued » :
      // rien n'est encore enregistré. Le dire, et garder le brouillon — le
      // renvoi au retour du réseau est sans risque, la grille se réenregistre.
      if (data?.queued) {
        setEtat('attente');
        setMessage(p('hors_ligne'));
        return;
      }
      ecrire(cle, null);
      setEtat('enregistre');
      setMessage(data?.warnings?.length ? data.warnings.join(' ') : null);
      requeteGrille.refetch();
    } catch (err) {
      // Sans réponse du serveur (status 0) : le réseau manque, le brouillon reste.
      const horsLigne = !err?.status;
      setEtat(horsLigne ? 'attente' : 'erreur');
      setMessage(horsLigne ? p('hors_ligne') : (err?.message ?? p('echec')));
    }
  }, [pret, invalides.length, aEnvoyer, evaluation, cle]);

  // Au retour du réseau, les notes en attente partent seules.
  const enregistrerRef = useRef(enregistrer);
  enregistrerRef.current = enregistrer;
  const etatRef = useRef(etat);
  etatRef.current = etat;
  useEffect(() => {
    const auRetour = () => { if (etatRef.current === 'attente') enregistrerRef.current(); };
    window.addEventListener('online', auRetour);
    return () => window.removeEventListener('online', auRetour);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{p('title')}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{p('subtitle')}</p>
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select label={p('classe')} placeholder={p('choisir_classe')} options={classes} value={evaluation.classe} onChange={changer('classe')} />
          <Select label={p('matiere')} placeholder={evaluation.classe ? p('choisir_matiere') : p('classe_d_abord')} options={matieres} value={evaluation.matiere} onChange={changer('matiere')} disabled={!evaluation.classe} />
          <Select label={p('evaluation')} options={TYPES.map((v) => ({ value: v, label: v }))} value={evaluation.type} onChange={changer('type')} />
          <Select label={p('periode')} options={PERIODES.map((v) => ({ value: v, label: v }))} value={evaluation.periode} onChange={changer('periode')} />
          <Input type="date" label={p('date')} max={aujourdhui()} value={evaluation.date} onChange={(e) => setEvaluation((x) => ({ ...x, date: e.target.value }))} />
        </div>
        {requeteClasses.isSuccess && classes.length === 0 && <p role="status" className="mt-3 text-sm text-[var(--text-secondary)]">{p('aucune_classe')}</p>}
        {requeteGrille.isError && <p role="alert" className="mt-3 text-sm text-[var(--error)]">{requeteGrille.error?.message ?? t('common.load_error')}</p>}
        {grille && matieres.length === 0 && <p role="status" className="mt-3 text-sm text-[var(--text-secondary)]">{p('aucune_matiere')}</p>}
      </Card>

      {pret && (
        <Card>
          {requeteGrille.isPending ? (
            <div className="flex h-32 items-center justify-center" role="status" aria-label={t('common.loading')}><Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" /></div>
          ) : eleves.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-secondary)]">{p('aucun_eleve')}</p>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" size="sm" icon={<Download size={16} />} onClick={telechargerModele}>{p('modele')}</Button>
                <Button variant="outline" size="sm" icon={<FileUp size={16} />} onClick={() => fichier.current?.click()}>{p('importer')}</Button>
                <input ref={fichier} type="file" accept=".csv,text/csv" className="sr-only" aria-label={p('fichier')} onChange={importer} />
              </div>
              {rapport && (
                <div role={rapport.erreurs.length ? 'alert' : 'status'} className="mb-4 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm">
                  <p className="text-[var(--text-primary)]">{p('import_lu', { nom: rapport.nom, nombre: rapport.lues })}</p>
                  {rapport.erreurs.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--error)]">
                      {rapport.erreurs.map((e) => (
                        <li key={`${e.ligne}-${e.message}`}>{p(`import_erreur_${e.message}`, { ligne: e.ligne, valeur: e.valeur ?? '' })}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">{p('title')}</caption>
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
                      <th scope="col" className="px-3 py-2 font-medium">{p('eleve')}</th>
                      <th scope="col" className="px-3 py-2 font-medium">{p('matricule')}</th>
                      <th scope="col" className="w-40 px-3 py-2 font-medium">{p('note_sur_20')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eleves.map((eleve, index) => {
                      const verrouillee = Boolean(enregistrees[eleve.id]?.locked);
                      const invalide = Number.isNaN(lireNote(saisies[eleve.id]));
                      const nom = `${eleve.nom} ${eleve.prenom}`.trim();
                      return (
                        <tr key={eleve.id} className="border-b border-[var(--border-light)] last:border-0">
                          <th scope="row" className="px-3 py-2 text-left font-medium text-[var(--text-primary)]">{nom}</th>
                          <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{eleve.matricule}</td>
                          <td className="px-3 py-2">
                            <input
                              ref={(element) => { champs.current[eleve.id] = element; }}
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              aria-label={p('note_de', { nom })}
                              aria-invalid={invalide || undefined}
                              title={verrouillee ? p('verrouillee') : undefined}
                              disabled={verrouillee}
                              value={saisies[eleve.id] ?? ''}
                              onChange={(e) => saisir(eleve.id, e.target.value)}
                              onKeyDown={auClavier(index)}
                              className={`min-h-11 w-24 rounded-md border bg-[var(--surface)] px-3 py-2 text-right tabular-nums text-[var(--text-primary)] disabled:opacity-60 ${invalide ? 'border-[var(--error)]' : 'border-[var(--border)]'}`}
                            />
                            {verrouillee && <span className="ml-2 text-xs text-[var(--text-secondary)]">{p('verrouillee')}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div role="status" aria-live="polite" className="text-sm">
                  {invalides.length > 0 ? (
                    <span className="text-[var(--error)]">{p('invalides', { nombre: invalides.length })}</span>
                  ) : etat === 'enregistre' ? (
                    <span className="inline-flex items-center gap-1 text-[var(--success)]"><CheckCircle size={16} aria-hidden="true" />{p('enregistre')}</span>
                  ) : enAttente > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[var(--text-primary)]"><CloudOff size={16} aria-hidden="true" />{p('en_attente', { nombre: enAttente })}</span>
                  ) : (
                    <span className="text-[var(--text-secondary)]">{p('aide_clavier')}</span>
                  )}
                  {message && <p className={etat === 'erreur' ? 'mt-1 text-[var(--error)]' : 'mt-1 text-[var(--text-secondary)]'}>{message}</p>}
                </div>
                <Button icon={<Save size={16} />} onClick={enregistrer} loading={etat === 'envoi'} disabled={invalides.length > 0 || aEnvoyer.length === 0}>
                  {p('enregistrer')}
                </Button>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
