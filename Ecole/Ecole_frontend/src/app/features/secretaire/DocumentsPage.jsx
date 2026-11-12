/**
 * DocumentsPage — Gestion des documents administratifs
 *
 * La secrétaire gère les documents officiels de l'établissement.
 * Données dynamiques via API /secretaire/courriers
 */

import { useState, useMemo } from 'react';
import apiClient, { useApiQuery } from '@/shared/lib/api-client';
import { useNavigate } from 'react-router-dom';
import FormDialog from '@/shared/components/ui/FormDialog';
import CertificatsSection from './CertificatsSection';
import { unwrapList } from '@/shared/lib/unwrap';
import { motion } from 'framer-motion';
import {
  FileText, FolderOpen, Search, Plus,
  CheckCircle, FileSpreadsheet, File, Loader2, AlertCircle
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useTranslation } from '@/shared/i18n';

function getTypeIcon(type) {
  const cfg = {
    pdf: { icon: FileText, color: 'text-red-500 bg-red-100 dark:bg-red-900/20' },
    xlsx: { icon: FileSpreadsheet, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20' },
    docx: { icon: File, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20' }
  };
  return cfg[type] || cfg.pdf;
}

export default function DocumentsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');

  // Le chargement passait par un `useState` doublé d'un `useEffect` de
  // premier rendu, sans cache ni déduplication : deux composants montés
  // ensemble lançaient deux requêtes, et un retour sur la page rechargeait
  // tout (cf. audit P4.1). `unwrapList` traverse les trois formes
  // d'enveloppe que renvoient les contrôleurs.
  const requete = useApiQuery(['secretaire-courriers'], '/secretaire/courriers');
  const navigate = useNavigate();
  const [nouveau, setNouveau] = useState(false);
  const c = (cle) => t(`pages.secretaire.courrier.${cle}`);
  const enregistrerCourrier = async (v) => {
    await apiClient.post('/secretaire/courriers', v);
    requete.refetch();
  };

  const documents = useMemo(() => unwrapList(requete.data) ?? [], [requete.data]);
  const loading = requete.isPending;
  const error = requete.isError ? (requete.error?.message ?? t('common.load_error')) : null;

  const stats = useMemo(() => ({
    total: documents.length,
    entrants: documents.filter((d) => d.type === 'entrant').length,
    sortants: documents.filter((d) => d.type === 'sortant').length
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)] ">{t('pages.secretaire.documents.title')}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{t('pages.secretaire.documents.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<FolderOpen />} onClick={() => navigate('/secretaire/inscriptions')}>{t('pages.secretaire.documents.dossiers')}</Button>
          <Button size="sm" icon={<Plus />} onClick={() => setNouveau(true)}>{t('pages.secretaire.documents.nouveau_courrier')}</Button>
        </div>
      </div>
      <FormDialog
        open={nouveau}
        title={t('pages.secretaire.documents.nouveau_courrier')}
        initial={{ type: 'entrant', date_reception: new Date().toISOString().slice(0, 10) }}
        fields={[
          { name: 'type', label: c('sens'), type: 'select', options: [{ value: 'entrant', label: t('pages.secretaire.documents.entrant') }, { value: 'sortant', label: t('pages.secretaire.documents.sortant') }], required: true },
          { name: 'date_reception', label: c('date'), type: 'date', required: true },
          { name: 'expediteur', label: t('pages.secretaire.documents.expediteur'), required: true },
          { name: 'destinataire', label: t('pages.secretaire.documents.destinataire'), required: true },
          { name: 'objet', label: c('objet'), required: true },
          { name: 'observation', label: c('observation'), type: 'textarea' },
        ]}
        onSubmit={enregistrerCourrier}
        onClose={() => setNouveau(false)}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title={t('common.total')} value={String(stats.total)} icon={FileText} color="primary" />
        <StatsCard title={t('pages.secretaire.documents.entrants')} value={String(stats.entrants)} icon={CheckCircle} color="emerald" />
        <StatsCard title={t('pages.secretaire.documents.sortants')} value={String(stats.sortants)} icon={FolderOpen} color="sky" />
      </div>

      {/* Filtres */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <Input
              placeholder={t('pages.secretaire.documents.rechercher_un_courrier')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterCategorie}
              onChange={(e) => setFilterCategorie(e.target.value)}
              aria-label={t('pages.secretaire.documents.filtrer_par_categorie')}
              className="h-10 rounded-xl border border-[var(--border-heavy)] bg-[var(--surface-raised)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40   "
            >
              <option value="">{t('common.all_types')}</option>
              <option value="entrant">{t('pages.secretaire.documents.entrant')}</option>
              <option value="sortant">{t('pages.secretaire.documents.sortant')}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tableau */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]  text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                <th scope="col" className="pb-3 pr-4">{t('pages.secretaire.documents.objet')}</th>
                <th scope="col" className="pb-3 pr-4">{t('pages.secretaire.documents.expediteur')}</th>
                <th scope="col" className="pb-3 pr-4">{t('pages.secretaire.documents.destinataire')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.type')}</th>
                <th scope="col" className="pb-3 pr-4">{t('common.date')}</th>
                <th scope="col" className="pb-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-[var(--text-secondary)]">
                    {t('pages.secretaire.documents.aucun_courrier_trouve')}
                  </td>
                </tr>
              )}
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-[var(--border-light)] ">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', typeCfg('pdf').color)}>
                        <IconComponent type="pdf" />
                      </div>
                      <span className="text-sm font-medium text-[var(--text-primary)] ">{doc.objet || t('pages.secretaire.documents.sans_objet')}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-[var(--text-secondary)] ">{doc.expediteur || '—'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-[var(--text-secondary)] ">{doc.destinataire || '—'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={doc.type === 'entrant' ? 'primary' : 'warning'} size="sm">
                      {doc.type === 'entrant' ? t('pages.secretaire.documents.entrant') : t('pages.secretaire.documents.sortant')}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-[var(--text-secondary)] ">
                      {doc.date_reception ? formatDate(doc.date_reception) : '—'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="font-mono text-xs text-[var(--text-secondary)]">{doc.reference}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <CertificatsSection />
    </motion.div>
  );
}
