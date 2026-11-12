/**
 * PresencesPage — l'appel d'une classe (lot 6.1).
 *
 * La page n'affichait que des absences déjà saisies ailleurs, sur tout
 * l'effectif de l'école. On choisit maintenant une classe et un jour, chaque
 * élève est présent par défaut, et une touche le marque absent ou en retard.
 * Comme la grille de notes, l'appel est gardé sur l'appareil et repart seul
 * au retour du réseau ; l'enregistrement se rejoue sans doublon. Les absences
 * du jour se justifient ensuite ligne par ligne.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, Clock, CloudOff, Loader2, Save, XCircle } from 'lucide-react';
import apiClient, { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import Button from '@/shared/components/ui/Button';
import Card from '@/shared/components/ui/Card';
import Input from '@/shared/components/ui/Input';
import Select from '@/shared/components/ui/Select';
import { useTranslation } from '@/shared/i18n';

export const STATUTS = ['present', 'absent', 'retard'];
const ICONES = { present: CheckCircle, absent: XCircle, retard: Clock };
const COULEURS = { present: 'var(--success)', absent: 'var(--error)', retard: 'var(--warning)' };
const aujourdhui = () => new Date().toISOString().slice(0, 10);
const cleBrouillon = (classe, date) => `ecole:brouillon-appel:${classe}:${date}`;
const lire = (cle) => { try { return JSON.parse(localStorage.getItem(cle) ?? 'null'); } catch { return null; } };
const ecrire = (cle, valeur) => { try { if (valeur) localStorage.setItem(cle, JSON.stringify(valeur)); else localStorage.removeItem(cle); } catch { /* stockage indisponible */ } };

export default function PresencesPage() {
  const { t } = useTranslation();
  const p = (cle, valeurs) => t(`pages.surveillant.appel.${cle}`, valeurs);
  const [classe, setClasse] = useState('');
  const [date, setDate] = useState(aujourdhui());
  const [statuts, setStatuts] = useState({});
  const [etat, setEtat] = useState('repos'); // repos | envoi | enregistre | attente | erreur
  const [message, setMessage] = useState(null);

  const requeteClasses = useApiQuery(['classes'], '/classes');
  const classes = useMemo(() => (unwrapList(requeteClasses.data) ?? []).map((c) => ({ value: c.id, label: c.nom_classe })), [requeteClasses.data]);

  const requeteFeuille = useApiQuery(['appel', classe, date], `/surveillant/appel/${classe}?date=${date}`, { queryOptions: { enabled: !!classe, staleTime: 0 } });
  const eleves = useMemo(() => requeteFeuille.data?.data?.eleves ?? [], [requeteFeuille.data]);
  const cle = classe ? cleBrouillon(classe, date) : null;

  const requeteAbsences = useApiQuery(['absences-du-jour', classe, date], `/surveillant/absences?date=${date}&classe_id=${classe}`, { queryOptions: { enabled: !!classe, staleTime: 0 } });
  const absences = useMemo(() => unwrapList(requeteAbsences.data) ?? [], [requeteAbsences.data]);

  // Le brouillon de l'appareil s'il existe, sinon ce que le serveur a relevé.
  useEffect(() => {
    if (!cle || !requeteFeuille.data) return;
    const brouillon = lire(cle);
    setStatuts(brouillon ?? Object.fromEntries(eleves.map((e) => [e.id, e.statut])));
    setEtat(brouillon ? 'attente' : 'repos');
    setMessage(null);
  }, [cle, requeteFeuille.data]); // eslint-disable-line

  const marquer = (eleveId, statut) => {
    setStatuts((precedent) => {
      const suivant = { ...precedent, [eleveId]: statut };
      ecrire(cle, suivant);
      return suivant;
    });
    setEtat('attente');
    setMessage(null);
  };

  const compte = useMemo(() => {
    const c = { present: 0, absent: 0, retard: 0 };
    eleves.forEach((e) => { c[statuts[e.id] ?? 'present'] += 1; });
    return c;
  }, [eleves, statuts]);

  const enregistrer = async () => {
    if (!classe || eleves.length === 0) return;
    setEtat('envoi');
    setMessage(null);
    try {
      const { data } = await apiClient.post('/surveillant/appel', {
        classe_id: Number(classe), date,
        eleves: eleves.map((e) => ({ eleve_id: e.id, statut: statuts[e.id] ?? 'present' })),
      });
      if (data?.queued) { setEtat('attente'); setMessage(p('hors_ligne')); return; }
      ecrire(cle, null);
      setEtat('enregistre');
      requeteAbsences.refetch();
    } catch (err) {
      const horsLigne = !err?.status;
      setEtat(horsLigne ? 'attente' : 'erreur');
      setMessage(horsLigne ? p('hors_ligne') : (err?.message ?? p('echec')));
    }
  };

  const enregistrerRef = useRef(enregistrer);
  enregistrerRef.current = enregistrer;
  const etatRef = useRef(etat);
  etatRef.current = etat;
  useEffect(() => {
    const auRetour = () => { if (etatRef.current === 'attente') enregistrerRef.current(); };
    window.addEventListener('online', auRetour);
    return () => window.removeEventListener('online', auRetour);
  }, []);

  const justifier = async (absence) => {
    const motif = window.prompt(p('motif_question'), absence.motif ?? '');
    if (motif === null) return;
    try {
      await apiClient.patch(`/surveillant/absences/${absence.id}`, { justifiee: true, motif: motif.trim() || null });
      requeteAbsences.refetch();
    } catch (err) {
      setMessage(err?.message ?? p('echec'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{p('title')}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{p('subtitle')}</p>
      </div>

      <Card padding>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label={p('classe')} placeholder={p('choisir_classe')} options={classes} value={classe} onChange={(e) => setClasse(e.target.value)} />
          <Input type="date" label={p('date')} max={aujourdhui()} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </Card>

      {classe && (
        <Card padding>
          {requeteFeuille.isPending ? (
            <div className="flex h-32 items-center justify-center" role="status" aria-label={t('common.loading')}><Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" /></div>
          ) : requeteFeuille.isError ? (
            <p role="alert" className="py-6 text-center text-sm text-[var(--error)]">{requeteFeuille.error?.message ?? t('common.load_error')}</p>
          ) : eleves.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-secondary)]">{p('aucun_eleve')}</p>
          ) : (
            <>
              <ul className="divide-y divide-[var(--border-light)]">
                {eleves.map((eleve) => {
                  const nom = `${eleve.nom ?? ''} ${eleve.prenom ?? ''}`.trim();
                  const actuel = statuts[eleve.id] ?? 'present';
                  return (
                    <li key={eleve.id} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-medium text-[var(--text-primary)]">{nom} <span className="ml-1 font-mono text-xs text-[var(--text-secondary)]">{eleve.matricule}</span></span>
                      <div role="group" aria-label={p('statut_de', { nom })} className="flex gap-1">
                        {STATUTS.map((statut) => {
                          const Icone = ICONES[statut];
                          const choisi = actuel === statut;
                          return (
                            <button
                              key={statut}
                              type="button"
                              aria-pressed={choisi}
                              onClick={() => marquer(eleve.id, statut)}
                              className="inline-flex min-h-11 items-center gap-1 rounded-md border px-3 text-sm"
                              style={choisi ? { borderColor: COULEURS[statut], color: COULEURS[statut], fontWeight: 600 } : { borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                            >
                              <Icone size={16} aria-hidden="true" />{p(statut)}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div role="status" aria-live="polite" className="text-sm">
                  <p className="text-[var(--text-primary)]">{p('compte', compte)}</p>
                  {etat === 'enregistre' && <p className="text-[var(--success)]">{p('enregistre')}</p>}
                  {etat === 'attente' && !message && <p className="inline-flex items-center gap-1 text-[var(--text-primary)]"><CloudOff size={16} aria-hidden="true" />{p('en_attente')}</p>}
                  {message && <p className={etat === 'erreur' ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]'}>{message}</p>}
                </div>
                <Button icon={<Save size={16} />} onClick={enregistrer} loading={etat === 'envoi'}>{p('enregistrer')}</Button>
              </div>
            </>
          )}
        </Card>
      )}

      {classe && absences.length > 0 && (
        <Card padding>
          <h2 className="mb-3 text-base font-semibold text-[var(--text-primary)]">{p('absences_du_jour')}</h2>
          <ul className="divide-y divide-[var(--border-light)]" data-testid="absences">
            {absences.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-medium">{`${a.eleve?.user?.name ?? ''} ${a.eleve?.user?.prenom ?? ''}`.trim()}</span>
                  <span className="ml-2 text-[var(--text-secondary)]">{a.type === 'retard' ? p('retard') : p('absent')}{a.motif ? ` · ${a.motif}` : ''}</span>
                </span>
                {a.justifiee
                  ? <span className="text-[var(--success)]">{p('justifiee')}</span>
                  : <Button size="sm" variant="outline" onClick={() => justifier(a)}>{p('justifier')}</Button>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
