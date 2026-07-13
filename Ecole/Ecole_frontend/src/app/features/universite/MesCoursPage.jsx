/**
 * MesCoursPage — Mes cours (vue enseignant université)
 *
 * Module université : liste des cours assignés au professeur connecté.
 * Données dynamiques via API /api/universite/mes-cours
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Search, Filter, Clock, Users, Calendar, GraduationCap,
  FileText, Download, Eye, Video, MapPin, Loader2, AlertCircle,
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useApi } from '@/hooks/useApi';

export default function MesCoursPage() {
  const { loading, error, get } = useApi();
  const [cours, setCours] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/universite/mes-cours');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setCours(items.map(c => ({
          ...c,
          progression: c.progression || c.avancement || 0,
          prochainCours: c.prochain_cours || c.prochainCours || null,
          statut: c.statut || 'en_cours',
        })));
      } catch (e) {
        console.error('Erreur chargement mes cours:', e);
      }
    })();
  }, [get]);

  const stats = useMemo(() => ({
    total: cours.length,
    enCours: cours.filter((c) => c.statut === 'en_cours').length,
    termines: cours.filter((c) => c.statut === 'termine' || c.statut === 'terminé').length,
    totalEtudiants: cours.reduce((s, c) => s + Number(c.etudiants || 0), 0),
  }), [cours]);

  const filtered = useMemo(() =>
    cours.filter((c) => {
      if (search && !c.intitule?.toLowerCase().includes(search.toLowerCase()) && !c.code?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    [search, cours]
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Mes Cours</h1>
          <p className="text-sm text-neutral-500">Cours qui vous sont assignés</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total" value={String(stats.total)} icon={BookOpen} color="primary" />
        <StatsCard title="En cours" value={String(stats.enCours)} icon={Clock} color="emerald" />
        <StatsCard title="Terminés" value={String(stats.termines)} icon={GraduationCap} color="sky" />
        <StatsCard title="Étudiants" value={String(stats.totalEtudiants)} icon={Users} color="amber" />
      </div>

      <Card>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Rechercher un cours..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <BookOpen className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucun cours trouvé</p>
            </div>
          </Card>
        )}
        {filtered.map((c) => (
          <Card key={c.id} hover>
            <div className="flex items-start gap-4">
              <div className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center shrink-0',
                c.statut === 'termine' || c.statut === 'terminé' ? 'bg-neutral-100 dark:bg-neutral-800' : 'bg-[var(--primary-subtle)] bg-[var(--primary-subtle)]'
              )}>
                <BookOpen className={cn('h-6 w-6', c.statut === 'termine' || c.statut === 'terminé' ? 'text-neutral-400' : 'text-[var(--accent)]')} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">{c.intitule}</span>
                  <Badge variant="outline" size="sm">{c.code}</Badge>
                  <Badge variant={c.statut === 'termine' || c.statut === 'terminé' ? 'outline' : 'primary'} size="sm">
                    {c.statut === 'termine' || c.statut === 'terminé' ? 'Terminé' : 'En cours'}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {c.horaire}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.salle}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.etudiants} étudiants</span>
                  {c.prochainCours && (
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Prochain : {c.prochainCours}</span>
                  )}
                </div>

                {/* Barre de progression */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-500">Progression</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{c.progression}%</span>
                  </div>
                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        c.progression === 100 ? 'bg-emerald-500' : 'bg-[var(--accent-subtle)]0'
                      )}
                      style={{ width: `${c.progression}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" icon={<Eye />}>Détails</Button>
                <Button variant="ghost" size="sm" icon={<FileText />}>Notes</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}