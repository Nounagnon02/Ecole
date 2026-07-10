/**
 * DossiersPage — Gestion des dossiers médicaux et vaccinations
 *
 * L'infirmier consulte les dossiers médicaux et l'historique des vaccinations.
 * Données via API /infirmier/dossiers-medicaux et /infirmier/vaccinations
 */

import { useState, useEffect, useMemo } from 'react';
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
import { useApi } from '@/hooks/useApi';

export default function DossiersPage() {
  const { loading, error, get } = useApi();
  const [dossiers, setDossiers] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [search, setSearch] = useState('');
  const [filterAllergie, setFilterAllergie] = useState('');
  const [tab, setTab] = useState('dossiers'); // 'dossiers' | 'vaccinations'
  const [expandedEleve, setExpandedEleve] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [dosRes, vacRes] = await Promise.all([
          get('/infirmier/dossiers-medicaux'),
          get('/infirmier/vaccinations'),
        ]);

        const items = Array.isArray(dosRes?.data?.data) ? dosRes.data.data
          : Array.isArray(dosRes?.data) ? dosRes.data
          : Array.isArray(dosRes) ? dosRes
          : [];
        setDossiers(items);

        const vacItems = Array.isArray(vacRes?.data?.data) ? vacRes.data.data
          : Array.isArray(vacRes?.data) ? vacRes.data
          : Array.isArray(vacRes) ? vacRes
          : [];
        setVaccinations(vacItems);
      } catch (e) {
        console.error('Erreur chargement dossiers:', e);
      }
    })();
  }, [get]);

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
      (a.eleve?.nom || '').localeCompare(b.eleve?.nom || '')
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
        const nom = `${d.eleve?.prenom || ''} ${d.eleve?.nom || ''}`;
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
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
        <AlertCircle className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {tab === 'dossiers' ? 'Dossiers Médicaux' : 'Carnet de Vaccination'}
          </h1>
          <p className="text-sm text-neutral-500">
            {tab === 'dossiers'
              ? 'Gestion des dossiers médicaux des élèves'
              : 'Suivi et historique des vaccinations'}
          </p>
        </div>
        <Button size="sm" icon={<Plus />}>
          {tab === 'dossiers' ? 'Nouveau dossier' : 'Nouveau vaccin'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setTab('dossiers')}
          className={cn(
            'pb-2 text-sm font-medium border-b-2 transition-colors',
            tab === 'dossiers'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          )}
        >
          <FileText className="h-4 w-4 inline mr-1.5" />
          Dossiers Médicaux
        </button>
        <button
          onClick={() => setTab('vaccinations')}
          className={cn(
            'pb-2 text-sm font-medium border-b-2 transition-colors',
            tab === 'vaccinations'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          )}
        >
          <Syringe className="h-4 w-4 inline mr-1.5" />
          Vaccinations
        </button>
      </div>

      {/* Tab: Dossiers */}
      {tab === 'dossiers' && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <StatsCard title="Total Dossiers" value={String(stats.total)} icon={FileText} color="primary" />
            <StatsCard title="Allergies connues" value={String(stats.allergieConnues)} icon={AlertCircle} color="amber" />
            <StatsCard title="Vaccins non à jour" value={String(stats.vaccinsNonJour)} icon={Shield} color="red" />
            <StatsCard title="Visites récentes" value={String(stats.visitesRecentes)} icon={Calendar} color="emerald" />
          </div>

          <Card>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Rechercher un élève..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={filterAllergie}
                onChange={(e) => setFilterAllergie(e.target.value)}
                className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
              >
                <option value="">Toutes les allergies</option>
                <option value="oui">Avec allergies</option>
                <option value="non">Sans allergies</option>
              </select>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {filtered.length === 0 && (
              <div className="md:col-span-2">
                <Card>
                  <div className="text-center py-8 text-neutral-500">
                    <FileText className="mx-auto h-8 w-8 mb-2" />
                    <p className="text-sm">Aucun dossier trouvé</p>
                  </div>
                </Card>
              </div>
            )}
            {filtered.map((d) => (
              <Card key={d.id} hover>
                <div className="flex items-start gap-3 mb-4">
                  <Avatar name={`${d.eleve?.prenom || ''} ${d.eleve?.nom || ''}`} size="md" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">
                      {d.eleve?.prenom} {d.eleve?.nom}
                    </h3>
                    <p className="text-xs text-neutral-500">{d.eleve?.classe?.nom_classe || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                      <Droplets className="h-3 w-3" /> Groupe sanguin
                    </span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{d.groupe_sanguin || '—'}</span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                      <AlertCircle className="h-3 w-3" /> Allergies
                    </span>
                    <span className={cn(
                      'font-medium',
                      d.allergies && d.allergies !== 'Aucune' ? 'text-amber-600' : 'text-neutral-700 dark:text-neutral-300'
                    )}>
                      {d.allergies || 'Aucune'}
                    </span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                      <Shield className="h-3 w-3" /> Vaccins
                    </span>
                    <span className={cn(
                      'font-medium text-sm',
                      !d.vaccins_a_jour ? 'text-red-600' : 'text-emerald-600'
                    )}>
                      {d.vaccins_a_jour ? 'À jour' : 'Non à jour'}
                    </span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                      <Calendar className="h-3 w-3" /> Dernière visite
                    </span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {d.derniere_visite ? formatDate(d.derniere_visite) : '—'}
                    </span>
                  </div>
                </div>

                {d.maladies_chroniques && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <p className="text-xs text-neutral-500">
                      <span className="font-medium">Maladies chroniques:</span> {d.maladies_chroniques}
                    </p>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" icon={<FileText />}>Consulter</Button>
                  <Button variant="ghost" size="sm">Modifier</Button>
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
            <StatsCard title="Total Vaccins" value={String(vaccinsStats.total)} icon={Syringe} color="primary" />
            <StatsCard title="Rappels planifiés" value={String(vaccinsStats.avecRappel)} icon={Calendar} color="sky" />
            <StatsCard title="Rappels en retard" value={String(vaccinsStats.rappelsEnRetard)} icon={AlertCircle} color="red" />
            <StatsCard title="Effets secondaires" value={String(vaccinsStats.effetsSecondaires)} icon={Droplets} color="amber" />
          </div>

          {vaccinsParEleve.length === 0 && (
            <Card>
              <div className="text-center py-12 text-neutral-500">
                <Syringe className="mx-auto h-10 w-10 mb-3 text-neutral-300" />
                <p className="text-sm">Aucune vaccination enregistrée</p>
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
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <Avatar name={`${groupe.eleve?.prenom || ''} ${groupe.eleve?.nom || ''}`} size="sm" />
                      <div className="flex-1 text-left">
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {groupe.eleve?.prenom} {groupe.eleve?.nom}
                        </span>
                        <span className="ml-2 text-xs text-neutral-500">
                          {groupe.eleve?.classe?.nom_classe || '—'} · {groupe.vaccins.length} vaccin(s)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {recent?.date_rappel && new Date(recent.date_rappel) < new Date() && (
                          <Badge variant="danger" size="sm">Rappel</Badge>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
                      </div>
                    </button>

                    {/* Timeline */}
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <div className="relative pl-6 border-l-2 border-neutral-200 dark:border-neutral-700 space-y-4 mt-2">
                          {groupe.vaccins.map((v, idx) => {
                            const rappelDepasse = v.date_rappel && new Date(v.date_rappel) < new Date();
                            return (
                              <div key={v.id || idx} className="relative">
                                {/* Point sur la timeline */}
                                <div className={cn(
                                  'absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900',
                                  rappelDepasse ? 'bg-red-500' : v.date_rappel ? 'bg-amber-400' : 'bg-emerald-500'
                                )} />

                                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                        {v.nom_vaccin}
                                        {v.effets_secondaires && (
                                          <span className="ml-2 text-xs text-amber-600">(effets secondaires signalés)</span>
                                        )}
                                      </p>
                                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-neutral-500">
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
