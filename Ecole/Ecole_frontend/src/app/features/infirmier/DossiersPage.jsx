/**
 * DossiersPage — Gestion des dossiers médicaux et vaccinations
 *
 * L'infirmier consulte les dossiers médicaux et l'historique des vaccinations.
 * Données via API /infirmier/dossiers-medicaux et /infirmier/vaccinations
 */

import { useState, useMemo } from 'react';
import apiClient, { useApiQuery } from '@/shared/lib/api-client';
import FormDialog from '@/shared/components/ui/FormDialog';
import useElevesOptions from '@/shared/lib/useElevesOptions';
import { unwrapList } from '@/shared/lib/unwrap';
import { motion } from 'framer-motion';
import {
  FileText, Search, Plus, AlertCircle, Calendar,
  Shield, Droplets, Loader2, Syringe, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useTranslation } from '@/shared/i18n';

export default function DossiersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterAllergie, setFilterAllergie] = useState('');
  const [tab, setTab] = useState('dossiers'); // 'dossiers' | 'vaccinations'
  const [expandedEleve, setExpandedEleve] = useState(null);

  // Deux requêtes indépendantes plutôt qu'un `Promise.all` derrière un
  // `useApi()` à l'état partagé : l'échec de l'une ne dit plus rien de
  // l'autre, et chacune a son entrée de cache (cf. audit P4.1).
  const requeteDossiers = useApiQuery(['infirmier-dossiers'], '/infirmier/dossiers-medicaux');
  const requeteVaccinations = useApiQuery(['infirmier-vaccinations'], '/infirmier/vaccinations');
  const [formulaire, setFormulaire] = useState(null); // { type: 'dossier'|'vaccin', initial }
  const eleves = useElevesOptions(formulaire !== null);
  const f = (cle) => t(`pages.infirmier.formulaires.${cle}`);
  const ouiNon = [{ value: 'oui', label: f('oui') }, { value: 'non', label: f('non') }];
  const champsDossier = [
    { name: 'eleve_id', label: f('eleve'), type: 'select', options: eleves, required: true },
    { name: 'contact_urgence', label: f('contact_urgence'), required: true },
    { name: 'groupe_sanguin', label: f('groupe_sanguin'), type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => ({ value: g, label: g })) },
    { name: 'vaccins_a_jour', label: f('vaccins_a_jour'), type: 'select', options: ouiNon },
    { name: 'aptitude_sport', label: f('aptitude_sport'), type: 'select', options: ouiNon },
    { name: 'allergies', label: f('allergies'), type: 'textarea' },
    { name: 'maladies_chroniques', label: f('maladies_chroniques'), type: 'textarea' },
  ];
  const champsVaccin = [
    { name: 'eleve_id', label: f('eleve'), type: 'select', options: eleves, required: true },
    { name: 'nom_vaccin', label: f('vaccin'), required: true },
    { name: 'date_vaccination', label: f('date'), type: 'date', required: true },
    { name: 'numero_lot', label: f('lot'), required: true },
    { name: 'date_rappel', label: f('rappel'), type: 'date' },
  ];
  const enregistrer = async (v) => {
    const corps = { ...v, eleve_id: Number(v.eleve_id) };
    ['vaccins_a_jour', 'aptitude_sport'].forEach((k) => { if (k in corps) corps[k] = corps[k] !== 'non'; });
    if (formulaire.type === 'dossier') {
      await apiClient.post('/infirmier/dossiers-medicaux', corps);
      requeteDossiers.refetch();
    } else {
      await apiClient.post('/infirmier/vaccinations', corps);
      requeteVaccinations.refetch();
    }
  };
  const ouvrirDossier = (d) => setFormulaire({ type: 'dossier', initial: d ? {
    ...d, eleve_id: String(d.eleve_id), vaccins_a_jour: d.vaccins_a_jour ? 'oui' : 'non', aptitude_sport: d.aptitude_sport ? 'oui' : 'non',
  } : { vaccins_a_jour: 'oui', aptitude_sport: 'oui' } });

  const dossiers = useMemo(() => unwrapList(requeteDossiers.data) ?? [], [requeteDossiers.data]);
  const vaccinations = useMemo(() => unwrapList(requeteVaccinations.data) ?? [], [requeteVaccinations.data]);

  const loading = requeteDossiers.isPending;
  const error = requeteDossiers.isError
    ? (requeteDossiers.error?.message ?? t('common.load_error'))
    : null;

  const stats = useMemo(() => {
    const now = new Date();
    const soixanteJours = 60 * 24 * 60 * 60 * 1000;
    return {
      total: dossiers.length,
      allergieConnues: dossiers.filter((d) => d.allergies && d.allergies !== 'Aucune' && d.allergies !== '').length,
      vaccinsNonJour: dossiers.filter((d) => !d.vaccins_a_jour).length,
      visitesRecentes: dossiers.filter((d) => d.derniere_visite && (now - new Date(d.derniere_visite)) < soixanteJours).length,
    };
  }, [dossiers]);

  // Vaccinations groupées par élève
  const vaccinsParEleve = useMemo(() => {
    const map = {};
    vaccinations.forEach((v) => {
      const id = v.eleve_id;
      if (!map[id]) {
        map[id] = {
          eleve: v.eleve,
          vaccins: [],
        };
      }
      map[id].vaccins.push(v);
    });
    // Trier par date décroissante
    Object.values(map).forEach((e) => {
      e.vaccins.sort((a, b) => new Date(b.date_vaccination) - new Date(a.date_vaccination));
    });
    return Object.values(map).sort((a, b) =>
      (a.eleve?.user?.name || '').localeCompare(b.eleve?.user?.name || '')
    );
  }, [vaccinations]);

  const vaccinsStats = useMemo(() => {
    const total = vaccinations.length;
    const avecRappel = vaccinations.filter((v) => v.date_rappel).length;
    const rappelsEnRetard = vaccinations.filter(
      (v) => v.date_rappel && new Date(v.date_rappel) < new Date()
    ).length;
    const effetsSecondaires = vaccinations.filter((v) => v.effets_secondaires).length;
    return { total, avecRappel, rappelsEnRetard, effetsSecondaires };
  }, [vaccinations]);

  const filtered = useMemo(() =>
    dossiers.filter((d) => {
      const q = search.toLowerCase();
      if (search) {
        const nom = `${d.eleve?.user?.prenom || ''} ${d.eleve?.user?.name || ''}`;
        if (!nom.toLowerCase().includes(q)) return false;
      }
      if (filterAllergie === 'oui' && (!d.allergies || d.allergies === 'Aucune' || d.allergies === '')) return false;
      if (filterAllergie === 'non' && d.allergies && d.allergies !== 'Aucune' && d.allergies !== '') return false;
      return true;
    }),
    [search, filterAllergie, dossiers]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--text-secondary)]">
        <AlertCircle className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] ">
            {t(tab === 'dossiers' ? 'pages.infirmier.dossiers.title' : 'pages.infirmier.vaccinations.title')}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {t(tab === 'dossiers' ? 'pages.infirmier.dossiers.subtitle' : 'pages.infirmier.vaccinations.subtitle')}
          </p>
        </div>
        <Button size="sm" icon={<Plus />} onClick={() => (tab === 'dossiers' ? ouvrirDossier(null) : setFormulaire({ type: 'vaccin', initial: { date_vaccination: new Date().toISOString().slice(0, 10) } }))}>
          {tab === 'dossiers' ? t('pages.infirmier.dossiers.nouveau_dossier') : t('pages.infirmier.dossiers.nouveau_vaccin')}
        </Button>
      </div>

      <FormDialog
        open={formulaire !== null}
        title={formulaire?.type === 'vaccin' ? t('pages.infirmier.dossiers.nouveau_vaccin') : t('pages.infirmier.dossiers.nouveau_dossier')}
        fields={formulaire?.type === 'vaccin' ? champsVaccin : champsDossier}
        initial={formulaire?.initial}
        onSubmit={enregistrer}
        onClose={() => setFormulaire(null)}
      />

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[var(--border)] ">
        <button
          onClick={() => setTab('dossiers')}
          className={cn(
            'pb-2 text-sm font-medium border-b-2 transition-colors',
            tab === 'dossiers'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] '
          )}
        >
          <FileText className="h-4 w-4 inline mr-1.5" />
          {t('pages.infirmier.dossiers.dossiers_medicaux')}
        </button>
        <button
          onClick={() => setTab('vaccinations')}
          className={cn(
            'pb-2 text-sm font-medium border-b-2 transition-colors',
            tab === 'vaccinations'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] '
          )}
        >
          <Syringe className="h-4 w-4 inline mr-1.5" />
          {t('pages.infirmier.dossiers.vaccinations')}
        </button>
      </div>

      {/* Tab: Dossiers */}
      {tab === 'dossiers' && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <StatsCard title={t('pages.infirmier.dossiers.total_dossiers')} value={String(stats.total)} icon={FileText} color="primary" />
            <StatsCard title={t('pages.infirmier.dossiers.allergies_connues')} value={String(stats.allergieConnues)} icon={AlertCircle} color="amber" />
            <StatsCard title={t('pages.infirmier.dossiers.vaccins_non_a_jour')} value={String(stats.vaccinsNonJour)} icon={Shield} color="red" />
            <StatsCard title={t('pages.infirmier.dossiers.visites_recentes')} value={String(stats.visitesRecentes)} icon={Calendar} color="emerald" />
          </div>

          <Card>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <Input
                  placeholder={t('common.search_student')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={filterAllergie}
                onChange={(e) => setFilterAllergie(e.target.value)}
                aria-label={t('pages.infirmier.dossiers.filtrer_par_allergie')}
                className="h-10 rounded-xl border border-[var(--border-heavy)] bg-[var(--surface-raised)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40   "
              >
                <option value="">{t('pages.infirmier.dossiers.toutes_les_allergies')}</option>
                <option value="oui">{t('pages.infirmier.dossiers.avec_allergies')}</option>
                <option value="non">{t('pages.infirmier.dossiers.sans_allergies')}</option>
              </select>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {filtered.length === 0 && (
              <div className="md:col-span-2">
                <Card>
                  <div className="text-center py-8 text-[var(--text-secondary)]">
                    <FileText className="mx-auto h-8 w-8 mb-2" />
                    <p className="text-sm">{t('pages.infirmier.dossiers.aucun_dossier_trouve')}</p>
                  </div>
                </Card>
              </div>
            )}
            {filtered.map((d) => (
              <Card key={d.id} hover>
                <div className="flex items-start gap-3 mb-4">
                  <Avatar name={`${d.eleve?.user?.prenom || ''} ${d.eleve?.user?.name || ''}`} size="md" />
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] ">
                      {d.eleve?.user?.prenom} {d.eleve?.user?.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">{d.eleve?.classe?.nom_classe || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)] mb-1">
                      <Droplets className="h-3 w-3" /> {t('pages.infirmier.dossiers.groupe_sanguin')}
                    </span>
                    <span className="font-medium text-[var(--text-primary)] ">{d.groupe_sanguin || '—'}</span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)] mb-1">
                      <AlertCircle className="h-3 w-3" /> {t('pages.infirmier.dossiers.allergies')}
                    </span>
                    <span className={cn(
                      'font-medium',
                      d.allergies && d.allergies !== 'Aucune' ? 'text-amber-600' : 'text-[var(--text-primary)] '
                    )}>
                      {d.allergies || t('pages.infirmier.dossiers.aucune')}
                    </span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)] mb-1">
                      <Shield className="h-3 w-3" /> {t('pages.infirmier.dossiers.vaccins')}
                    </span>
                    <span className={cn(
                      'font-medium text-sm',
                      !d.vaccins_a_jour ? 'text-red-600' : 'text-emerald-600'
                    )}>
                      {d.vaccins_a_jour ? t('pages.infirmier.dossiers.a_jour') : t('pages.infirmier.dossiers.non_a_jour')}
                    </span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)] mb-1">
                      <Calendar className="h-3 w-3" /> {t('pages.infirmier.dossiers.derniere_visite')}
                    </span>
                    <span className="font-medium text-[var(--text-primary)] ">
                      {d.derniere_visite ? formatDate(d.derniere_visite) : '—'}
                    </span>
                  </div>
                </div>

                {d.maladies_chroniques && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-light)] ">
                    <p className="text-xs text-[var(--text-secondary)]">
                      <span className="font-medium">{t('pages.infirmier.dossiers.maladies_chroniques')}</span> {d.maladies_chroniques}
                    </p>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" icon={<FileText />} onClick={() => ouvrirDossier(d)}>{t('common.edit')}</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Tab: Vaccinations timeline */}
      {tab === 'vaccinations' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard title={t('pages.infirmier.dossiers.total_vaccins')} value={String(vaccinsStats.total)} icon={Syringe} color="primary" />
            <StatsCard title={t('pages.infirmier.dossiers.rappels_planifies')} value={String(vaccinsStats.avecRappel)} icon={Calendar} color="sky" />
            <StatsCard title={t('pages.infirmier.dossiers.rappels_en_retard')} value={String(vaccinsStats.rappelsEnRetard)} icon={AlertCircle} color="red" />
            <StatsCard title={t('pages.infirmier.dossiers.effets_secondaires')} value={String(vaccinsStats.effetsSecondaires)} icon={Droplets} color="amber" />
          </div>

          {vaccinsParEleve.length === 0 && (
            <Card>
              <div className="text-center py-12 text-[var(--text-secondary)]">
                <Syringe className="mx-auto h-10 w-10 mb-3 text-[var(--text-secondary)]" />
                <p className="text-sm">{t('pages.infirmier.dossiers.aucune_vaccination_enregistree')}</p>
              </div>
            </Card>
          )}

          <div className="space-y-3">
            {vaccinsParEleve.map((groupe) => {
              const isExpanded = expandedEleve === groupe.eleve?.id;
              const recent = groupe.vaccins[0];
              return (
                <Card key={groupe.eleve?.id || Math.random()} hover>
                  <div className="p-0">
                    {/* Header élève */}
                    <button
                      onClick={() => setExpandedEleve(isExpanded ? null : (groupe.eleve?.id))}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface)]  transition-colors"
                    >
                      <Avatar name={`${groupe.eleve?.user?.prenom || ''} ${groupe.eleve?.user?.name || ''}`} size="sm" />
                      <div className="flex-1 text-left">
                        <span className="font-medium text-[var(--text-primary)] ">
                          {groupe.eleve?.user?.prenom} {groupe.eleve?.user?.name}
                        </span>
                        <span className="ml-2 text-xs text-[var(--text-secondary)]">
                          {groupe.eleve?.classe?.nom_classe || '—'} · {groupe.vaccins.length} vaccin(s)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {recent?.date_rappel && new Date(recent.date_rappel) < new Date() && (
                          <Badge variant="danger" size="sm">{t('pages.infirmier.dossiers.rappel')}</Badge>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-[var(--text-tertiary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />}
                      </div>
                    </button>

                    {/* Timeline */}
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <div className="relative pl-6 border-l-2 border-[var(--border)]  space-y-4 mt-2">
                          {groupe.vaccins.map((v, idx) => {
                            const rappelDepasse = v.date_rappel && new Date(v.date_rappel) < new Date();
                            return (
                              <div key={v.id || idx} className="relative">
                                {/* Point sur la timeline */}
                                <div className={cn(
                                  'absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 border-white ',
                                  rappelDepasse ? 'bg-red-500' : v.date_rappel ? 'bg-amber-400' : 'bg-emerald-500'
                                )} />

                                <div className="bg-[var(--surface)]  rounded-lg p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-sm font-semibold text-[var(--text-primary)] ">
                                        {v.nom_vaccin}
                                        {v.effets_secondaires && (
                                          <span className="ml-2 text-xs text-amber-600">{t('pages.infirmier.dossiers.effets_secondaires_signales')}</span>
                                        )}
                                      </p>
                                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-[var(--text-secondary)]">
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {v.date_vaccination ? formatDate(v.date_vaccination) : '—'}
                                        </span>
                                        {v.numero_lot && (
                                          <span className="font-mono">Lot: {v.numero_lot}</span>
                                        )}
                                      </div>
                                    </div>
                                    {v.date_rappel && (
                                      <Badge variant={rappelDepasse ? 'danger' : 'outline'} size="sm">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Rappel: {formatDate(v.date_rappel)}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}
