/**
 * DocumentsPage — Gestion des documents administratifs
 *
 * La secrétaire gère les documents officiels de l'établissement.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, FolderOpen, Search, Filter, Plus, Download, Eye,
  Trash2, Clock, CheckCircle, FileSpreadsheet, FileImage, File, Copy,
} from 'lucide-react';
import { cn, formatDate, formatNumber } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const CATEGORIES = ['Administratif', 'Pédagogique', 'Financier', 'Ressources Humaines', 'Juridique'];

const DOCUMENTS = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  nom: [
    'Rapport trimestriel T1 2025',
    'Contrat enseignant Diallo',
    'Budget annuel 2025',
    'Convention stage partenariat',
    'Procès-verbal conseil classe',
    'Attestation scolarité A. Diallo',
    'Relevé notes T1 4e A',
    'Règlement intérieur v2025',
    'Feuille de paie mars 2025',
    'Convention parents-école',
    'Calendrier scolaire 2025-2026',
    'Rapport d\'inspection',
    'Certificat de scolarité T. Fatou',
    'Plan de formation continue',
  ][i],
  categorie: CATEGORIES[i % CATEGORIES.length],
  type: ['pdf', 'xlsx', 'xlsx', 'pdf', 'pdf', 'pdf', 'xlsx', 'pdf', 'pdf', 'pdf', 'pdf', 'pdf', 'pdf', 'docx'][i],
  taille: ['2.4 Mo', '1.1 Mo', '3.2 Mo', '850 Ko', '1.5 Mo', '520 Ko', '4.1 Mo', '1.8 Mo', '980 Ko', '720 Ko', '2.8 Ko', '3.5 Mo', '480 Ko', '2.1 Mo'][i],
  date: new Date(Date.now() - 86400000 * (i * 4 + 1)),
  statut: ['publie', 'brouillon', 'publie', 'publie', 'publie', 'publie', 'brouillon', 'publie', 'publie', 'publie', 'publie', 'brouillon', 'publie', 'brouillon'][i],
  auteur: ['Secrétariat', 'Direction', 'Comptabilité', 'Direction', 'Enseignants', 'Secrétariat', 'Enseignants', 'Direction', 'Comptabilité', 'Direction', 'Secrétariat', 'Direction', 'Secrétariat', 'Direction'][i],
}));

const TYPE_ICONS = {
  pdf: { icon: FileText, color: 'text-red-500 bg-red-100 dark:bg-red-900/20' },
  xlsx: { icon: FileSpreadsheet, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20' },
  docx: { icon: File, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20' },
  image: { icon: FileImage, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/20' },
};

export default function DocumentsPage() {
  const [search, setSearch] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const stats = useMemo(() => ({
    total: DOCUMENTS.length,
    publies: DOCUMENTS.filter((d) => d.statut === 'publie').length,
    brouillons: DOCUMENTS.filter((d) => d.statut === 'brouillon').length,
    categories: new Set(DOCUMENTS.map((d) => d.categorie)).size,
  }), []);

  const filtered = useMemo(() =>
    DOCUMENTS.filter((d) => {
      if (search && !d.nom.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategorie && d.categorie !== filterCategorie) return false;
      if (filterStatut && d.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterCategorie, filterStatut]
  );

  const FileIconComponent = ({ type, className }) => {
    const cfg = TYPE_ICONS[type] || TYPE_ICONS.pdf;
    const Icon = cfg.icon;
    return <Icon className={className || 'h-4 w-4'} />;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Documents</h1>
          <p className="text-sm text-neutral-500">Gestion des documents administratifs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<FolderOpen />}>Dossiers</Button>
          <Button size="sm" icon={<Plus />}>Nouveau document</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total Documents" value={String(stats.total)} icon={FileText} color="indigo" />
        <StatsCard title="Publiés" value={String(stats.publies)} icon={CheckCircle} color="emerald" />
        <StatsCard title="Brouillons" value={String(stats.brouillons)} icon={Clock} color="amber" />
        <StatsCard title="Catégories" value={String(stats.categories)} icon={FolderOpen} color="sky" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterCategorie}
              onChange={(e) => setFilterCategorie(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Toutes catégories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Tous les statuts</option>
              <option value="publie">Publié</option>
              <option value="brouillon">Brouillon</option>
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
                <th className="pb-3 pr-4">Nom</th>
                <th className="pb-3 pr-4">Catégorie</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Taille</th>
                <th className="pb-3 pr-4">Auteur</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Statut</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-neutral-500">
                    Aucun document trouvé
                  </td>
                </tr>
              )}
              {filtered.map((doc) => {
                const typeCfg = TYPE_ICONS[doc.type] || TYPE_ICONS.pdf;
                return (
                  <tr key={doc.id} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', typeCfg.color)}>
                          <FileIconComponent type={doc.type} />
                        </div>
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">{doc.nom}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" size="sm">{doc.categorie}</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs uppercase font-mono text-neutral-500">{doc.type}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">{doc.taille}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">{doc.auteur}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">{formatDate(doc.date)}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={doc.statut === 'publie' ? 'primary' : 'warning'} size="sm">
                        {doc.statut === 'publie' ? 'Publié' : 'Brouillon'}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" icon={<Eye />} title="Voir" />
                        <Button variant="ghost" size="sm" icon={<Download />} title="Télécharger" />
                        <Button variant="ghost" size="sm" icon={<Copy />} title="Dupliquer" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
