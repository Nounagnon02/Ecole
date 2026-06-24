/**
 * InscriptionsPage — Gestion des inscriptions
 *
 * La secrétaire gère les inscriptions des nouveaux élèves.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus, Search, Filter, Plus, FileText, Calendar, CheckCircle, XCircle,
  Clock, Download, Eye, UserCheck,
} from 'lucide-react';
import { cn, formatDate, formatNumber } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const INSCRIPTIONS = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  nom: ['Diallo Amadou', 'Touré Fatou', 'Koné Moussa', 'Cissé Inza', 'Traoré Kadiatou', 'Sow Mariam', 'Diop Souleymane', 'Ndiaye Fatma', 'Ba Ousmane', 'Sylla Aïcha'][i],
  classe: ['4e A', '4e A', '4e A', '4e A', '4e A', '4e A', '4e B', '4e B', '3e A', '3e A'][i],
  dateInscription: new Date(Date.now() - 86400000 * (i * 3 + 2)),
  statut: ['complete', 'complete', 'complete', 'en_attente', 'complete', 'complete', 'complete', 'en_attente', 'complete', 'en_attente'][i],
  documents: {
    acteNaissance: true,
    bulletin: true,
    photo: i % 2 === 0,
    certificatMedical: i % 3 !== 0,
    frais: i % 4 !== 0,
  },
  parent: 'M. et Mme Diallo',
  contact: '+225 01 02 03 04 05',
}));

const STATUT_CONFIG = {
  complete: { variant: 'primary', icon: CheckCircle, label: 'Complete' },
  en_attente: { variant: 'warning', icon: Clock, label: 'En attente' },
};

export default function InscriptionsPage() {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const stats = useMemo(() => ({
    total: INSCRIPTIONS.length,
    completes: INSCRIPTIONS.filter((i) => i.statut === 'complete').length,
    enAttente: INSCRIPTIONS.filter((i) => i.statut === 'en_attente').length,
  }), []);

  const filtered = useMemo(() =>
    INSCRIPTIONS.filter((i) => {
      if (search && !i.nom.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatut && i.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterStatut]
  );

  const DOC_LABELS = {
    acteNaissance: 'Acte de naissance',
    bulletin: 'Bulletin',
    photo: 'Photo d\'identité',
    certificatMedical: 'Certificat médical',
    frais: 'Frais d\'inscription',
  };

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
        <StatsCard title="Total" value={String(stats.total)} icon={UserPlus} color="indigo" />
        <StatsCard title="Complètes" value={String(stats.completes)} icon={CheckCircle} color="emerald" />
        <StatsCard title="En attente" value={String(stats.enAttente)} icon={Clock} color="amber" />
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
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">Tous les statuts</option>
            <option value="complete">Complete</option>
            <option value="en_attente">En attente</option>
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
          <Card key={ins.id} hover>
            <div className="flex items-start gap-4">
              <Avatar name={ins.nom} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">{ins.nom}</span>
                  <Badge variant={ins.statut === 'complete' ? 'primary' : 'warning'} size="sm">
                    {ins.statut === 'complete' ? 'Complete' : 'En attente'}
                  </Badge>
                  <Badge variant="outline" size="sm">{ins.classe}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    {ins.parent}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(ins.dateInscription)}
                  </span>
                  <span>{ins.contact}</span>
                </div>

                {/* Documents */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(ins.documents).map(([key, value]) => (
                    <span
                      key={key}
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full',
                        value
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
                      )}
                    >
                      {value ? <CheckCircle className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                      {DOC_LABELS[key]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" icon={<Eye />} title="Voir" />
                <Button variant="outline" size="sm">Compléter</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
