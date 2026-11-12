/**
 * BulletinsPage — arrêter, consulter et imprimer les bulletins (lot 5.4, 5.5).
 *
 * Le calcul et l'archive existaient côté API, sans aucun écran. La direction
 * (et le censeur) choisit une classe et une période et arrête les bulletins :
 * moyennes, rangs et mentions sont figés, les notes verrouillées. Chacun les
 * consulte ensuite dans son périmètre — les familles ne voient que ceux de
 * leurs enfants — et les imprime, un par page. L'impression du navigateur
 * permet aussi d'enregistrer en PDF.
 */

import { useMemo, useState } from 'react';
import { Eye, Lock, Loader2, Printer } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient, { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import useAuthStore from '@/shared/stores/auth-store';
import { ROLES, ROLE_GROUPS } from '@/shared/types/roles';
import Button from '@/shared/components/ui/Button';
import Card from '@/shared/components/ui/Card';
import Modal from '@/shared/components/ui/Modal';
import Select from '@/shared/components/ui/Select';
import { useTranslation } from '@/shared/i18n';

export const PERIODES = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'];

const nomEleve = (b) => `${b.eleve?.user?.name ?? ''} ${b.eleve?.user?.prenom ?? ''}`.trim() || `#${b.eleve_id}`;
const sur20 = (v) => (v == null ? '—' : Number(v).toFixed(2).replace('.', ','));
const rangTexte = (rang, total) => (rang ? `${rang}${rang === 1 ? 'er' : 'e'}${total ? ` / ${total}` : ''}` : '—');
const detail = (b) => (Array.isArray(b.data) ? b.data : (() => { try { return JSON.parse(b.data ?? '[]'); } catch { return []; } })());

/** Un bulletin, tel qu'il s'affiche et s'imprime. */
export function BulletinDocument({ bulletin, ecole }) {
  const { t } = useTranslation();
  const p = (cle) => t(`pages.bulletins.${cle}`);
  const lignes = detail(bulletin);
  return (
    <article className="bulletin-imprimable space-y-4 text-[var(--text-primary)]" aria-label={`${p('bulletin_de')} ${nomEleve(bulletin)}`}>
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--border)] pb-3">
        <div>
          {ecole && <p className="text-sm font-semibold">{ecole}</p>}
          <h2 className="text-lg font-bold">{p('bulletin_de')} {nomEleve(bulletin)}</h2>
          <p className="text-sm text-[var(--text-secondary)]">{bulletin.classe?.nom_classe ?? ''} · {bulletin.periode} · {bulletin.annee_scolaire}</p>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">{p('matricule')} : <span className="font-mono">{bulletin.eleve?.numero_matricule ?? '—'}</span></p>
      </header>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
            <th scope="col" className="py-2 pr-3 font-medium">{p('matiere')}</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">{p('moyenne')}</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">{p('coefficient')}</th>
            <th scope="col" className="py-2 text-right font-medium">{p('rang')}</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => (
            <tr key={l.matiere_id ?? l.matiere} className="border-b border-[var(--border-light)]">
              <th scope="row" className="py-2 pr-3 text-left font-normal">{l.matiere}</th>
              <td className="py-2 pr-3 text-right tabular-nums">{sur20(l.moyenne)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{l.coefficient ?? '—'}</td>
              <td className="py-2 text-right tabular-nums">{l.rang ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="grid gap-2 text-sm sm:grid-cols-3" data-testid="synthese">
        <div><dt className="text-[var(--text-secondary)]">{p('moyenne_generale')}</dt><dd className="text-lg font-bold tabular-nums">{sur20(bulletin.moyenne_generale)} / 20</dd></div>
        <div><dt className="text-[var(--text-secondary)]">{p('rang')}</dt><dd className="text-lg font-bold">{rangTexte(bulletin.rang, bulletin.total_eleves)}</dd></div>
        <div><dt className="text-[var(--text-secondary)]">{p('mention')}</dt><dd className="text-lg font-bold">{bulletin.mention ?? '—'}</dd></div>
      </dl>
    </article>
  );
}

export default function BulletinsPage() {
  const { t } = useTranslation();
  const p = (cle, valeurs) => t(`pages.bulletins.${cle}`, valeurs);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole);
  const estFamille = hasAnyRole([ROLES.PARENT, ROLES.ELEVE]);
  const peutArreter = hasAnyRole([...ROLE_GROUPS.DIRECTION, ROLES.CENSEUR]);
  const estEnseignant = hasAnyRole([...ROLE_GROUPS.ENSEIGNANTS]);
  const ecole = user?.ecole?.nom || user?.ecole?.name || null;

  const [classe, setClasse] = useState('');
  const [periode, setPeriode] = useState(PERIODES[0]);
  const [ouvert, setOuvert] = useState(null);
  const [aImprimer, setAImprimer] = useState([]);
  const [confirmation, setConfirmation] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [retour, setRetour] = useState(null);

  const requeteClasses = useApiQuery(['classes-bulletins', estEnseignant], estEnseignant ? '/enseignant/classes' : '/classes', { queryOptions: { enabled: !estFamille } });
  const classes = useMemo(() => (unwrapList(requeteClasses.data) ?? []).map((c) => ({ value: c.id, label: c.nom_classe })), [requeteClasses.data]);

  const filtre = estFamille ? '' : `?${new URLSearchParams({ classe_id: classe, periode })}`;
  const requete = useApiQuery(['bulletins', filtre], `/bulletins${filtre}`, {
    queryOptions: { enabled: estFamille || !!classe, staleTime: 0 },
  });
  const bulletins = useMemo(() => unwrapList(requete.data) ?? [], [requete.data]);

  const imprimer = (liste) => {
    setAImprimer(liste);
    // Laisser React rendre la zone d'impression avant d'ouvrir la boîte du navigateur.
    setTimeout(() => window.print(), 50);
  };

  const arreter = async () => {
    setEnvoi(true);
    setRetour(null);
    try {
      const { data } = await apiClient.post('/bulletins/verrouiller', { classe_id: Number(classe), periode });
      setRetour({ type: 'succes', texte: p('arretes', { nombre: data?.data?.length ?? 0, notes: data?.notes_verrouillees ?? 0 }) });
      queryClient.invalidateQueries({ queryKey: ['bulletins'] });
    } catch (err) {
      setRetour({ type: 'erreur', texte: err?.message ?? p('echec') });
    } finally {
      setEnvoi(false);
      setConfirmation(false);
    }
  };

  return (
    <div className="space-y-6">
      <div data-no-print>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{p('title')}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{estFamille ? p('subtitle_famille') : p('subtitle')}</p>
      </div>

      {!estFamille && (
        <Card data-no-print>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <Select label={p('classe')} placeholder={p('choisir_classe')} options={classes} value={classe} onChange={(e) => { setClasse(e.target.value); setRetour(null); }} />
            <Select label={p('periode')} options={PERIODES.map((v) => ({ value: v, label: v }))} value={periode} onChange={(e) => { setPeriode(e.target.value); setRetour(null); }} />
            {peutArreter && (
              <Button icon={<Lock size={16} />} disabled={!classe} onClick={() => setConfirmation(true)}>{p('arreter')}</Button>
            )}
            <Button variant="outline" icon={<Printer size={16} />} disabled={bulletins.length === 0} onClick={() => imprimer(bulletins)}>{p('imprimer_classe')}</Button>
          </div>
          {retour && <p role={retour.type === 'erreur' ? 'alert' : 'status'} className={`mt-3 text-sm ${retour.type === 'erreur' ? 'text-[var(--error)]' : 'text-[var(--success)]'}`}>{retour.texte}</p>}
        </Card>
      )}

      <Card data-no-print>
        {!estFamille && !classe ? (
          <p className="py-8 text-center text-sm text-[var(--text-secondary)]">{p('choisir_d_abord')}</p>
        ) : requete.isPending ? (
          <div className="flex h-32 items-center justify-center" role="status" aria-label={t('common.loading')}><Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" /></div>
        ) : requete.isError ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--text-secondary)]">{requete.error?.message ?? t('common.load_error')}</p>
            <Button className="mt-3" variant="outline" onClick={() => requete.refetch()}>{t('common.retry')}</Button>
          </div>
        ) : bulletins.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-secondary)]">{estFamille ? p('aucun_famille') : p('aucun')}</p>
        ) : (
          <div className="overflow-x-auto" role="region" aria-label={t('common.tableau_defilant')} tabIndex={0}>
            <table className="w-full text-sm">
              <caption className="sr-only">{p('title')}</caption>
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
                  {!estFamille && <th scope="col" className="px-3 py-2 font-medium">{p('rang')}</th>}
                  <th scope="col" className="px-3 py-2 font-medium">{p('eleve')}</th>
                  {estFamille && <th scope="col" className="px-3 py-2 font-medium">{p('periode')}</th>}
                  <th scope="col" className="px-3 py-2 text-right font-medium">{p('moyenne_generale')}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{p('mention')}</th>
                  <th scope="col" className="px-3 py-2"><span className="sr-only">{t('common.actions')}</span></th>
                </tr>
              </thead>
              <tbody>
                {bulletins.map((b) => (
                  <tr key={b.id} className="border-b border-[var(--border-light)] last:border-0">
                    {!estFamille && <td className="px-3 py-2 tabular-nums">{rangTexte(b.rang, b.total_eleves)}</td>}
                    <th scope="row" className="px-3 py-2 text-left font-medium text-[var(--text-primary)]">{nomEleve(b)}</th>
                    {estFamille && <td className="px-3 py-2">{b.periode} · {b.annee_scolaire}{estFamille && b.rang ? ` · ${rangTexte(b.rang, b.total_eleves)}` : ''}</td>}
                    <td className="px-3 py-2 text-right tabular-nums">{sur20(b.moyenne_generale)}</td>
                    <td className="px-3 py-2">{b.mention ?? '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="ghost" icon={<Eye size={16} />} onClick={() => setOuvert(b)}>{p('voir')}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!ouvert} onClose={() => setOuvert(null)} title={ouvert ? `${p('bulletin_de')} ${nomEleve(ouvert)}` : ''} size="lg">
        {ouvert && (
          <div className="space-y-4 p-5">
            <BulletinDocument bulletin={ouvert} ecole={ecole} />
            <div className="flex justify-end" data-no-print>
              <Button icon={<Printer size={16} />} onClick={() => imprimer([ouvert])}>{p('imprimer')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={confirmation} onClose={() => !envoi && setConfirmation(false)} title={p('confirmer_titre')} size="sm">
        <div className="space-y-4 p-5">
          <p className="text-sm text-[var(--text-primary)]">{p('confirmer_texte', { classe: classes.find((c) => String(c.value) === String(classe))?.label ?? '', periode })}</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmation(false)} disabled={envoi}>{t('common.cancel')}</Button>
            <Button onClick={arreter} loading={envoi}>{p('arreter')}</Button>
          </div>
        </div>
      </Modal>

      {/* Zone d'impression : invisible à l'écran, un bulletin par page sur papier. */}
      <div className="zone-impression" aria-hidden="true" data-testid="impression">
        {aImprimer.map((b) => <BulletinDocument key={b.id} bulletin={b} ecole={ecole} />)}
      </div>
    </div>
  );
}
