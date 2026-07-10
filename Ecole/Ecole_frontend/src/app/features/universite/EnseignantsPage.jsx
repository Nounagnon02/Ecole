/**
 * EnseignantsPage — Gestion des enseignants universitaires
 *
 * Module université : profils et affectations des enseignants chercheurs.
 * Données dynamiques via API /api/universite/enseignants
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, Search, BookOpen, GraduationCap,
  Building2, Mail, Phone, MapPin, Loader2, AlertCircle,
} from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useApi } from '@/hooks/useApi';

const GRADE_BADGE = {
  professeur: { variant: 'primary', label: 'Professeur' },
  'maître de conférences': { variant: 'emerald', label: 'MC' },
  'maitre de conferences': { variant: 'emerald', label: 'MC' },
  'maître-assistant': { variant: 'sky', label: 'MA' },
  'maitre assistant': { variant: 'sky', label: 'MA' },
  assistant: { variant: 'amber', label: 'Assistant' },
  vacataire: { variant: 'neutral', label: 'Vacataire' },
};

export default function EnseignantsPage() {
  const { loading, error, get } = useApi();
  const [enseignants, setEnseignants] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/universite/enseignants');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setEnseignants(items.map((e) => ({
          ...e,
          grade: e.grade || e.titre || '—',
          departement: e.departement?.nom || e.departement_nom || '—',
          faculte: e.faculte?.nom || e.faculte_nom || '—',
          specialite: e.specialite || e.discipline || '—',
          cours: e.cours_count ?? e.cours ?? 0,
          etudiants: e.etudiants_count ?? e.etudiants ?? 0,
        })));
      } catch (e) {
        console.error('Erreur chargement enseignants:', e);
      }
    })();
  }, []);

  const stats = useMemo(() => ({
    total: enseignants.length,
    professeurs: enseignants.filter((e) => /professeur/i.test(e.grade)).length,
    maitresConferences: enseignants.filter((e) => /maître|maitre.*conf/i.test(e.grade)).length,
    assistants: enseignants.filter((e) => /assistant/i.test(e.grade)).length,
  }), [enseignants]);

  const filtered = useMemo(() =>
    enseignants.filter((e) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return e.nom?.toLowerCase().includes(q)
        || e.prenom?.toLowerCase().includes(q)
        || e.email?.toLowerCase().includes(q)
        || e.specialite?.toLowerCase().includes(q)
        || e.departement?.toLowerCase().includes(q);
    }),
    [search, enseignants]
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
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Enseignants</h1>
          <p className="text-sm text-neutral-500">Profils et affectations des enseignants chercheurs</p>
        </div>
        <Button size="sm" icon={<Plus />}>Ajouter un enseignant</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total" value={String(stats.total)} icon={Users} color="primary" />
        <StatsCard title="Professeurs" value={String(stats.professeurs)} icon={GraduationCap} color="sky" />
        <StatsCard title="Maîtres de Conf." value={String(stats.maitresConferences)} icon={BookOpen} color="emerald" />
        <StatsCard title="Assistants" value={String(stats.assistants)} icon={Users} color="amber" />
      </div>

      <Card>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Rechercher un enseignant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <Card>
              <div className="text-center py-8 text-neutral-500">
                <Users className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">Aucun enseignant trouvé</p>
              </div>
            </Card>
          </div>
        )}
        {filtered.map((e) => {
          const gradeConf = GRADE_BADGE[e.grade?.toLowerCase()] || { variant: 'neutral', label: e.grade };
          return (
            <Card key={e.id} hover>
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--primary-subtle)] flex items-center justify-center">
                  <Users className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <Badge variant={gradeConf.variant} size="sm">{gradeConf.label}</Badge>
              </div>

              <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                {e.prenom ? `${e.prenom} ${e.nom}` : e.nom}
              </h3>
              <p className="text-xs text-neutral-500 mb-1">{e.specialite}</p>
              <p className="text-xs text-neutral-400 mb-3 flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {e.departement}
              </p>

              <div className="flex items-center gap-3 text-xs mb-3">
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2 text-center flex-1">
                  <span className="block font-bold text-neutral-900 dark:text-white">{e.cours}</span>
                  <span className="text-neutral-500">Cours</span>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2 text-center flex-1">
                  <span className="block font-bold text-neutral-900 dark:text-white">{e.etudiants}</span>
                  <span className="text-neutral-500">Étud.</span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-neutral-500">
                {e.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {e.email}</span>}
                {e.telephone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {e.telephone}</span>}
              </div>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}
