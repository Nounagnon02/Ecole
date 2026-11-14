/**
 * ProgrammePage — séries, matières et coefficients de chaque classe.
 *
 * L'API d'écriture existait, mais aucun écran ne l'exposait : une classe
 * neuve restait sans matière, donc sans enseignant affectable, tant que
 * personne n'écrivait en base (audit du 14/11, N-08). La direction
 * configure ici une classe, ou reprend le programme d'une classe voisine,
 * puis passe aux affectations.
 */

import { useMemo, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import apiClient, { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { useTranslation } from '@/shared/i18n';
import Button from '@/shared/components/ui/Button';
import Card from '@/shared/components/ui/Card';
import Input from '@/shared/components/ui/Input';
import Modal from '@/shared/components/ui/Modal';
import Select from '@/shared/components/ui/Select';

const NOUVELLE = 'nouvelle';
const coefficientValide = (v) => Number.isFinite(v) && v >= 0.1 && v <= 10;

export default function ProgrammePage() {
  const { t } = useTranslation();
  const p = (cle, valeurs) => t(`pages.programme.${cle}`, valeurs);

  const [classeId, setClasseId] = useState('');
  const [serieId, setSerieId] = useState('');
  const [nomSerie, setNomSerie] = useState('');
  const [matiereId, setMatiereId] = useState('');
  const [coefficient, setCoefficient] = useState('1');
  const [source, setSource] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [aRetirer, setARetirer] = useState(null);

  const requeteClasses = useApiQuery(['classes', 'programme'], '/classes');
  const requeteSeries = useApiQuery(['series'], '/series');
  const requeteMatieres = useApiQuery(['matieres'], '/matieres');
  const requeteProgramme = useApiQuery(['programme', classeId], `/classes/${classeId}/programme`, {
    queryOptions: { enabled: !!classeId },
  });

  const classes = useMemo(() => unwrapList(requeteClasses.data) ?? [], [requeteClasses.data]);
  const series = useMemo(() => unwrapList(requeteSeries.data) ?? [], [requeteSeries.data]);
  const matieres = useMemo(() => unwrapList(requeteMatieres.data) ?? [], [requeteMatieres.data]);
  const lignes = useMemo(() => (classeId ? unwrapList(requeteProgramme.data) ?? [] : []), [requeteProgramme.data, classeId]);
  const classe = classes.find((c) => String(c.id) === String(classeId));

  const recharger = () => { requeteProgramme.refetch(); requeteSeries.refetch(); };
  const erreur = (err, defaut) => toast.error(err?.message ?? defaut);

  const ajouter = async (evenement) => {
    evenement.preventDefault();
    const coef = Number(coefficient);
    if (!serieId || (serieId === NOUVELLE && !nomSerie.trim()) || !matiereId) {
      toast.error(p('champs_requis'));
      return;
    }
    if (!coefficientValide(coef)) {
      toast.error(p('coefficient_invalide'));
      return;
    }
    setEnvoi(true);
    try {
      let serie = Number(serieId);
      if (serieId === NOUVELLE) {
        const { data } = await apiClient.post('/series/store', { nom: nomSerie.trim() });
        serie = Number(data?.id ?? data?.data?.id);
        setSerieId(String(serie));
        setNomSerie('');
      }
      await apiClient.post(`/series/${serie}/matieres`, { matiere_id: Number(matiereId), classe_id: Number(classeId), coefficient: coef });
      toast.success(p('ajoutee'));
      setMatiereId('');
      setCoefficient('1');
      recharger();
    } catch (err) {
      erreur(err, p('echec'));
    } finally {
      setEnvoi(false);
    }
  };

  const changerCoefficient = async (ligne, valeur) => {
    const coef = Number(valeur);
    if (coef === Number(ligne.coefficient)) return;
    if (!coefficientValide(coef)) {
      toast.error(p('coefficient_invalide'));
      recharger();
      return;
    }
    try {
      await apiClient.put(`/series/${ligne.serie_id}/matieres/${ligne.matiere_id}/coefficient`, { classe_id: Number(classeId), coefficient: coef });
      toast.success(p('coefficient_enregistre', { matiere: ligne.matiere_nom }));
      recharger();
    } catch (err) {
      erreur(err, p('echec'));
    }
  };

  const retirer = async () => {
    const ligne = aRetirer;
    setEnvoi(true);
    try {
      // `classe_id` : la matière ne quitte que cette classe.
      await apiClient.delete(`/series/${ligne.serie_id}/matieres/${ligne.matiere_id}`, { params: { classe_id: Number(classeId) } });
      toast.success(p('retiree', { matiere: ligne.matiere_nom }));
      setARetirer(null);
      recharger();
    } catch (err) {
      erreur(err, p('echec'));
    } finally {
      setEnvoi(false);
    }
  };

  /** Reprendre les lignes d'une autre classe ; une ligne déjà présente est ignorée. */
  const reprendre = async () => {
    setEnvoi(true);
    let ajoutees = 0;
    try {
      const { data } = await apiClient.get(`/classes/${source}/programme`);
      const deja = new Set(lignes.map((l) => `${l.serie_id}-${l.matiere_id}`));
      for (const l of unwrapList(data) ?? []) {
        if (deja.has(`${l.serie_id}-${l.matiere_id}`)) continue;
        await apiClient.post(`/series/${l.serie_id}/matieres`, { matiere_id: l.matiere_id, classe_id: Number(classeId), coefficient: Number(l.coefficient) });
        ajoutees += 1;
      }
      toast.success(p('repris', { n: ajoutees }));
      setSource('');
      recharger();
    } catch (err) {
      erreur(err, p('echec'));
      recharger();
    } finally {
      setEnvoi(false);
    }
  };

  const optionsSeries = [
    ...series.map((s) => ({ value: String(s.id), label: s.nom })),
    { value: NOUVELLE, label: p('nouvelle_serie') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{p('title')}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{p('subtitle')}</p>
      </div>

      <Card padding>
        <div className="max-w-sm">
          <Select
            label={p('classe')}
            placeholder={requeteClasses.isPending ? t('common.loading') : p('choisir_classe')}
            value={classeId}
            onChange={(e) => { setClasseId(e.target.value); setSource(''); }}
            options={classes.map((c) => ({ value: String(c.id), label: c.nom_classe ?? c.nom ?? `#${c.id}` }))}
          />
        </div>
      </Card>

      {classeId && (
        <>
          <Card padding>
            <h2 className="mb-3 text-base font-semibold text-[var(--text-primary)]">{p('matieres_de', { classe: classe?.nom_classe ?? '' })}</h2>
            {requeteProgramme.isPending ? (
              <div className="flex h-24 items-center justify-center" role="status" aria-label={t('common.loading')}>
                <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
              </div>
            ) : requeteProgramme.isError ? (
              <div className="py-6 text-center">
                <p className="text-sm text-[var(--text-secondary)]">{requeteProgramme.error?.message ?? t('common.load_error')}</p>
                <Button className="mt-3" variant="outline" onClick={() => requeteProgramme.refetch()}>{t('common.retry')}</Button>
              </div>
            ) : lignes.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">{p('vide')}</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="sm:w-64">
                    <Select
                      label={p('reprendre_de')}
                      placeholder={p('choisir_classe')}
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      options={classes.filter((c) => String(c.id) !== String(classeId)).map((c) => ({ value: String(c.id), label: c.nom_classe ?? `#${c.id}` }))}
                    />
                  </div>
                  <Button variant="outline" onClick={reprendre} disabled={!source} loading={envoi}>{p('reprendre')}</Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto" role="region" aria-label={t('common.tableau_defilant')} tabIndex={0}>
                <table className="w-full text-sm">
                  <caption className="sr-only">{p('matieres_de', { classe: classe?.nom_classe ?? '' })}</caption>
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
                      <th scope="col" className="px-3 py-2 font-medium">{p('serie')}</th>
                      <th scope="col" className="px-3 py-2 font-medium">{p('matiere')}</th>
                      <th scope="col" className="px-3 py-2 font-medium">{p('coefficient')}</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((l) => (
                      <tr key={`${l.serie_id}-${l.matiere_id}`} className="border-b border-[var(--border-light)]">
                        <td className="px-3 py-2 text-[var(--text-secondary)]">{l.serie_nom}</td>
                        <td className="px-3 py-2 font-medium text-[var(--text-primary)]">{l.matiere_nom}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0.1"
                            max="10"
                            step="0.5"
                            defaultValue={Number(l.coefficient)}
                            aria-label={p('coefficient_de', { matiere: l.matiere_nom })}
                            onBlur={(e) => changerCoefficient(l, e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                            className="h-11 w-24 rounded-lg border border-[var(--border-heavy)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 />}
                            aria-label={`${p('retirer')} ${l.matiere_nom}`}
                            title={p('retirer')}
                            onClick={() => setARetirer(l)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card padding>
            <h2 className="mb-3 text-base font-semibold text-[var(--text-primary)]">{p('ajouter_titre')}</h2>
            <form onSubmit={ajouter} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end" noValidate>
              <Select label={p('serie')} placeholder={p('choisir_serie')} value={serieId} onChange={(e) => setSerieId(e.target.value)} options={optionsSeries} />
              {serieId === NOUVELLE && (
                <Input label={p('nom_nouvelle_serie')} value={nomSerie} onChange={(e) => setNomSerie(e.target.value)} maxLength={255} placeholder={p('exemple_serie')} />
              )}
              <Select
                label={p('matiere')}
                placeholder={p('choisir_matiere')}
                value={matiereId}
                onChange={(e) => setMatiereId(e.target.value)}
                options={matieres.map((m) => ({ value: String(m.id), label: m.nom }))}
              />
              <Input type="number" inputMode="decimal" min="0.1" max="10" step="0.5" label={p('coefficient')} value={coefficient} onChange={(e) => setCoefficient(e.target.value)} />
              <Button type="submit" icon={<Plus size={18} />} loading={envoi}>{p('ajouter')}</Button>
            </form>
            <p className="mt-3 text-xs text-[var(--text-tertiary)]">{p('aide_affectation')}</p>
          </Card>
        </>
      )}

      <Modal open={!!aRetirer} onClose={() => { if (!envoi) setARetirer(null); }} title={p('retirer_titre')} size="sm">
        {aRetirer && (
          <div className="space-y-4 p-5">
            <p className="text-sm text-[var(--text-secondary)]">{p('retirer_texte', { matiere: aRetirer.matiere_nom, classe: classe?.nom_classe ?? '' })}</p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setARetirer(null)} disabled={envoi}>{t('common.cancel')}</Button>
              <Button variant="danger" onClick={retirer} loading={envoi}>{p('retirer')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
