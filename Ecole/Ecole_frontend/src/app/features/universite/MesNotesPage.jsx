/**
 * MesNotesPage — relevé de notes de l'étudiant (système LMD), 17/11/2026.
 *
 * Constaté le 17/11/2026 : sur le web, l'étudiant n'avait aucune page de
 * notes (« Notes » est la page du professeur), alors que l'API et le mobile
 * donnent son relevé. Mêmes données et même avertissement que le mobile :
 * moyennes d'UE, statut, crédits acquis, moyenne de semestre pondérée par
 * les crédits — provisoire jusqu'à la délibération du jury.
 * Données : GET /api/universite/mes-notes (étudiant connecté seulement).
 */
import { Fragment, useState } from 'react';
import { AlertCircle, Award, BookOpen, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useApiQuery } from '@/shared/lib/api-client';
import { cn, formatDate, libelleEvaluation, noteSur } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useTranslation } from '@/shared/i18n';

const TYPES = { CC: 'Contrôle continu', TP: 'TP', Examen: 'Examen' };

export function statutUe(ue) {
  if (ue.validee === true) return { cle: 'validee', variante: 'success' };
  if (ue.validee === false) return { cle: 'non_validee', variante: 'danger' };
  return { cle: ue.notes?.length ? 'en_cours' : 'pas_de_note', variante: 'outline' };
}

export default function MesNotesPage() {
  const { t } = useTranslation();
  const requete = useApiQuery(['universite-mes-notes'], '/universite/mes-notes');
  const releve = requete.data?.data;
  const semestres = releve?.semestres ?? [];
  const [choisi, setChoisi] = useState(null);
  const [ouverte, setOuverte] = useState(null);
  const semestre = semestres.find((s) => s.semestre_id === choisi) ?? semestres[semestres.length - 1];
  const poids = releve?.regles?.poids_examen;

  if (requete.isPending) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" aria-label={t('common.loading')} /></div>;
  }
  if (requete.isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-[var(--text-secondary)]" role="alert">
        <AlertCircle className="mb-2 h-8 w-8 text-red-400" aria-hidden="true" />
        <p className="text-sm">{requete.error?.message ?? t('common.load_error')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('pages.universite.mes_notes.title')}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{[releve?.etudiant?.filiere, releve?.etudiant?.niveau].filter(Boolean).join(' · ')}</p>
      </div>

      <Card padding className="border-[var(--amber)] bg-[var(--amber-subtle)]">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{t('pages.universite.mes_notes.provisoire')}</p>
        <p className="text-sm text-[var(--text-primary)]">{t('pages.universite.mes_notes.jury')}</p>
        {poids !== undefined && poids !== null ? (
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {t('pages.universite.mes_notes.regle', { cc: Math.round((1 - poids) * 100), examen: Math.round(poids * 100), seuil: releve.regles.seuil_validation })}
          </p>
        ) : null}
      </Card>

      {semestres.length === 0 ? (
        <Card padding><p className="py-6 text-center text-sm text-[var(--text-secondary)]">{t('pages.universite.mes_notes.aucune_ue')}</p></Card>
      ) : (
        <>
          {semestres.length > 1 ? (
            <div className="flex gap-2" role="tablist" aria-label={t('pages.universite.mes_notes.semestres')}>
              {semestres.map((s) => (
                <button key={s.semestre_id} type="button" role="tab" aria-selected={s.semestre_id === semestre?.semestre_id}
                  onClick={() => { setChoisi(s.semestre_id); setOuverte(null); }}
                  className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                    s.semestre_id === semestre?.semestre_id ? 'border-[var(--action)] bg-[var(--action)] text-white' : 'border-[var(--border-heavy)] text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]')}>
                  {s.libelle}
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <StatsCard title={t('pages.universite.mes_notes.moyenne', { semestre: semestre.libelle })} value={noteSur(semestre.moyenne)} icon={Award} color="primary" />
            <StatsCard title={t('pages.universite.mes_notes.credits_acquis')} value={`${semestre.credits_acquis}/${semestre.credits_total}`} icon={BookOpen} color="emerald" />
          </div>
          {!semestre.complet ? <p className="text-xs text-[var(--text-secondary)]">{t('pages.universite.mes_notes.moyenne_partielle')}</p> : null}

          <Card padding>
            <div className="overflow-x-auto" role="region" aria-label={t('common.tableau_defilant')} tabIndex={0}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    <th scope="col" className="pb-3 pr-4">{t('pages.universite.mes_notes.ue')}</th>
                    <th scope="col" className="pb-3 pr-4">{t('pages.universite.mes_notes.credits')}</th>
                    <th scope="col" className="pb-3 pr-4">{t('pages.universite.mes_notes.cc')}</th>
                    <th scope="col" className="pb-3 pr-4">{t('pages.universite.mes_notes.examen')}</th>
                    <th scope="col" className="pb-3 pr-4">{t('pages.universite.mes_notes.moyenne_ue')}</th>
                    <th scope="col" className="pb-3 pr-4">{t('common.status_label')}</th>
                    <th scope="col" className="pb-3 text-right"><span className="sr-only">{t('common.details')}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {semestre.ues.map((u) => {
                    const statut = statutUe(u);
                    const deplie = ouverte === u.matiere_id;
                    return (
                      <Fragment key={u.matiere_id}>
                        <tr className="border-b border-[var(--border-light)]">
                          <td className="py-3 pr-4 text-sm font-medium text-[var(--text-primary)]">{u.code} · {u.intitule}</td>
                          <td className="py-3 pr-4 text-sm text-[var(--text-secondary)]">{u.credit}</td>
                          <td className="py-3 pr-4 text-sm">{noteSur(u.controle_continu)}</td>
                          <td className="py-3 pr-4 text-sm">{noteSur(u.examen)}</td>
                          <td className="py-3 pr-4 text-sm font-semibold">{noteSur(u.moyenne)}</td>
                          <td className="py-3 pr-4"><Badge variant={statut.variante} size="sm">{t(`pages.universite.mes_notes.statut.${statut.cle}`)}</Badge></td>
                          <td className="py-3 text-right">
                            <button type="button" aria-expanded={deplie} onClick={() => setOuverte(deplie ? null : u.matiere_id)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[var(--action)] hover:bg-[var(--surface-subtle)]">
                              {deplie ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                              {t('pages.universite.mes_notes.detail_de', { code: u.code })}
                            </button>
                          </td>
                        </tr>
                        {deplie ? (
                          <tr className="border-b border-[var(--border-light)] bg-[var(--surface-subtle)]">
                            <td colSpan={7} className="px-4 py-3 text-sm">
                              {u.enseignant ? <p className="text-[var(--text-secondary)]">{t('pages.universite.mes_notes.enseignant', { nom: u.enseignant })}</p> : null}
                              {u.notes.length === 0 ? <p className="text-[var(--text-secondary)]">{t('pages.universite.mes_notes.aucune_note')}</p> : (
                                <ul className="mt-1 space-y-0.5">
                                  {u.notes.map((n, i) => (
                                    <li key={`${n.type}-${n.date}-${i}`}>{TYPES[n.type] ?? libelleEvaluation(n.type)} — {formatDate(n.date)} : {noteSur(n.note)}</li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
