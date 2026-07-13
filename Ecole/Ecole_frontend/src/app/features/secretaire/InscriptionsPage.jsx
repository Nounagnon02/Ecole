/**
 * InscriptionsPage — Gestion des inscriptions
 *
 * La secrétaire gère les inscriptions des nouveaux élèves.
 * Données dynamiques via API /secretaire/dossiers-eleves
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus, Search, Plus, FileText, Calendar, CheckCircle, XCircle,
  Clock, Eye, UserCheck, Loader2, AlertCircle,
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useApi } from '@/hooks/useApi';

export default function InscriptionsPage() {
  const { loading, error, get } = useApi();
  const [inscriptions, setInscriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/secretaire/dossiers-eleves');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setInscriptions(items);
      } catch (e) {
        console.error('Erreur chargement inscriptions:', e);
      }
    })();
  }, []);

  const stats = useMemo(() => ({
    total: inscriptions.length,
    complets: inscriptions.filter((i) => i.dossier_complet).length,
    incomplets: inscriptions.filter((i) => !i.dossier_complet).length,
  }), [inscriptions]);

  const filtered = useMemo(() =>
    inscriptions.filter((i) => {
      const q = search.toLowerCase();
      if (search) {
        const nom = `${i.eleve?.prenom || ''} ${i.eleve?.nom || ''}`;
        const nomPere = (i.nom_pere || '').toLowerCase();
        if (!nom.toLowerCase().includes(q) && !nomPere.includes(q)) return false;
      }
      if (filterStatut === 'complete' && !i.dossier_complet) return false;
      if (filterStatut === 'incomplete' && i.dossier_complet) return false;
      return true;
    }),
    [search, filterStatut, inscriptions]
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Inscriptions</h1>
          <p className="text-sm text-neutral-500">Gestion des inscriptions des nouveaux élèves</p>
        </div>
        <Button size="sm" icon={<Plus />}>Nouvelle inscription</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Total" value={String(stats.total)} icon={UserPlus} color="primary" />
        <StatsCard title="Complets" value={String(stats.complets)} icon={CheckCircle} color="emerald" />
        <StatsCard title="Incomplets" value={String(stats.incomplets)} icon={Clock} color="amber" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un élève..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">Tous les statuts</option>
            <option value="complete">Complet</option>
            <option value="incomplete">Incomplet</option>
          </select>
        </div>
      </Card>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-center py-8 text-neutral-500">
              <UserPlus className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucune inscription trouvée</p>
            </div>
          </Card>
        )}
        {filtered.map((ins) => (
          <Card key={ins.id || ins.eleve?.id} hover>
            <div className="flex items-start gap-4">
              <Avatar name={`${ins.eleve?.prenom || ''} ${ins.eleve?.nom || ''}`} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {ins.eleve?.prenom} {ins.eleve?.nom}
                  </span>
                  <Badge variant={ins.dossier_complet ? 'primary' : 'warning'} size="sm">
                    {ins.dossier_complet ? 'Complet' : 'Incomplet'}
                  </Badge>
                  {ins.eleve?.classe?.nom_classe && (
                    <Badge variant="outline" size="sm">{ins.eleve.classe.nom_classe}</Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  {ins.nom_pere && (
                    <span className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      {ins.nom_pere}
                    </span>
                  )}
                  {ins.eleve?.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(ins.eleve.created_at)}
                    </span>
                  )}
                  {ins.telephone_parent && (
                    <span>{ins.telephone_parent}</span>
                  )}
                </div>

                {/* Dossier status */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={cn(
                    'inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full',
                    ins.dossier_complet
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
                  )}>
                    {ins.dossier_complet ? <CheckCircle className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                    {ins.dossier_complet ? 'Dossier complet' : 'Dossier incomplet'}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" icon={<Eye />} title="Voir" />
                {!ins.dossier_complet && (
                  <Button variant="outline" size="sm">Compléter</Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
