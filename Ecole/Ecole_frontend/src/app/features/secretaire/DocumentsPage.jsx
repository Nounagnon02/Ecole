/**
 * DocumentsPage — Gestion des documents administratifs
 *
 * La secrétaire gère les documents officiels de l'établissement.
 * Données dynamiques via API /secretaire/courriers
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, FolderOpen, Search, Plus, Download, Eye,
  Clock, CheckCircle, FileSpreadsheet, File, Loader2, AlertCircle,
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useApi } from '@/hooks/useApi';

function getTypeIcon(type) {
  const cfg = {
    pdf: { icon: FileText, color: 'text-red-500 bg-red-100 dark:bg-red-900/20' },
    xlsx: { icon: FileSpreadsheet, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20' },
    docx: { icon: File, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20' },
  };
  return cfg[type] || cfg.pdf;
}

export default function DocumentsPage() {
  const { loading, error, get } = useApi();
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/secretaire/courriers');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setDocuments(items);
      } catch (e) {
        console.error('Erreur chargement documents:', e);
      }
    })();
  }, []);

  const stats = useMemo(() => ({
    total: documents.length,
    entrants: documents.filter((d) => d.type === 'entrant').length,
    sortants: documents.filter((d) => d.type === 'sortant').length,
  }), [documents]);

  const filtered = useMemo(() =>
    documents.filter((d) => {
      const q = search.toLowerCase();
      if (search && !(d.objet || '').toLowerCase().includes(q) && !(d.expediteur || '').toLowerCase().includes(q)) return false;
      if (filterCategorie && d.type !== filterCategorie) return false;
      return true;
    }),
    [search, filterCategorie, documents]
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

  const typeCfg = (type) => getTypeIcon(type);
  const IconComponent = ({ type, className }) => {
    const cfg = typeCfg(type);
    const Icon = cfg.icon;
    return <Icon className={className || 'h-4 w-4'} />;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Courriers</h1>
          <p className="text-sm text-neutral-500">Gestion des courriers et documents administratifs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<FolderOpen />}>Dossiers</Button>
          <Button size="sm" icon={<Plus />}>Nouveau courrier</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Total" value={String(stats.total)} icon={FileText} color="primary" />
        <StatsCard title="Entrants" value={String(stats.entrants)} icon={CheckCircle} color="emerald" />
        <StatsCard title="Sortants" value={String(stats.sortants)} icon={FolderOpen} color="sky" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un courrier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterCategorie}
              onChange={(e) => setFilterCategorie(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Tous les types</option>
              <option value="entrant">Entrant</option>
              <option value="sortant">Sortant</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tableau */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Objet</th>
                <th className="pb-3 pr-4">Expéditeur</th>
                <th className="pb-3 pr-4">Destinataire</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-neutral-500">
                    Aucun courrier trouvé
                  </td>
                </tr>
              )}
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', typeCfg('pdf').color)}>
                        <IconComponent type="pdf" />
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{doc.objet || 'Sans objet'}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{doc.expediteur || '—'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{doc.destinataire || '—'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={doc.type === 'entrant' ? 'primary' : 'warning'} size="sm">
                      {doc.type === 'entrant' ? 'Entrant' : 'Sortant'}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {doc.date_reception ? formatDate(doc.date_reception) : '—'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" icon={<Eye />} title="Voir" />
                      <Button variant="ghost" size="sm" icon={<Download />} title="Télécharger" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
