/**
 * FacultesPage — Gestion des facultés
 *
 * Module université : gestion des facultés et départements associés.
 * Données dynamiques via API /api/universite/facultes
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Plus, Search, Users, BookOpen, Calendar,
  MapPin, Phone, Mail, Globe, Loader2, AlertCircle,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useApi } from '@/hooks/useApi';

export default function FacultesPage() {
  const { loading, error, get } = useApi();
  const [facultes, setFacultes] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/universite/facultes');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setFacultes(items.map((f) => ({
          ...f,
          doyen: f.doyen || f.chef || '—',
          code: f.sigle || f.code || '—',
          departements: f.departements_count ?? f.departements ?? 0,
          enseignants: f.enseignants_count ?? f.enseignants ?? 0,
          etudiants: f.etudiants_count ?? f.etudiants ?? 0,
        })));
      } catch (e) {
        console.error('Erreur chargement facultés:', e);
      }
    })();
  }, []);

  const stats = useMemo(() => ({
    total: facultes.length,
    departements: facultes.reduce((s, f) => s + Number(f.departements), 0),
    enseignants: facultes.reduce((s, f) => s + Number(f.enseignants), 0),
    etudiants: facultes.reduce((s, f) => s + Number(f.etudiants), 0),
  }), [facultes]);

  const filtered = useMemo(() =>
    facultes.filter((f) => {
      if (search && !f.nom?.toLowerCase().includes(search.toLowerCase()) && !f.code?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    [search, facultes]
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Facultés</h1>
          <p className="text-sm text-neutral-500">Gestion des facultés de l'université</p>
        </div>
        <Button size="sm" icon={<Plus />}>Ajouter une faculté</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Facultés" value={String(stats.total)} icon={Building2} color="primary" />
        <StatsCard title="Départements" value={String(stats.departements)} icon={BookOpen} color="sky" />
        <StatsCard title="Enseignants" value={String(stats.enseignants)} icon={Users} color="emerald" />
        <StatsCard title="Étudiants" value={String(stats.etudiants)} icon={Users} color="amber" />
      </div>

      <Card>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Rechercher une faculté..."
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
                <Building2 className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">Aucune faculté trouvée</p>
              </div>
            </Card>
          </div>
        )}
        {filtered.map((f) => (
          <Card key={f.id} hover>
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--primary-subtle)] flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <Badge variant="primary" size="sm">{f.code}</Badge>
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">{f.nom}</h3>
            <p className="text-xs text-neutral-500 mb-3">Doyen : {f.doyen}</p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2">
                <span className="block font-bold text-neutral-900 dark:text-white">{f.departements}</span>
                <span className="text-neutral-500">Dépt.</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2">
                <span className="block font-bold text-neutral-900 dark:text-white">{f.enseignants}</span>
                <span className="text-neutral-500">Ens.</span>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2">
                <span className="block font-bold text-neutral-900 dark:text-white">{f.etudiants}</span>
                <span className="text-neutral-500">Étud.</span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-neutral-500">
              {f.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {f.email}</span>}
              {f.telephone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {f.telephone}</span>}
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
