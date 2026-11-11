/**
 * ElevesPage — données réelles depuis l'API
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Search, Download, Plus, Upload, GraduationCap,
  MoreHorizontal, UserCheck, UserX, RefreshCw, Trash2,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useApiQuery } from '@/shared/lib/api-client';
import apiClient from '@/shared/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import StatsCard from '@/shared/components/ui/StatsCard';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Table from '@/shared/components/ui/Table';
import Input from '@/shared/components/ui/Input';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { toast } from 'sonner';
import { useTranslation } from '@/shared/i18n';
import useAuthStore from '@/shared/stores/auth-store';
import { ROLES, ROLE_GROUPS } from '@/shared/types/roles';
import InscriptionDialog from './InscriptionDialog';
import ImportDialog from './ImportDialog';

const STATUT_COLORS = {
  actif: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  inactif: 'bg-[var(--surface-subtle)] text-[var(--text-primary)]  ',
  suspendu: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

/**
 * Un élève est-il dans les effectifs ?
 *
 * Le retrait écrit `eleves.statut = 'inactive'`. La page lisait
 * `user.is_active`, que la liste ne renvoie pas : un élève retiré restait
 * affiché « actif », sans message, et le directeur ne savait pas si son
 * action avait eu lieu.
 */
const estActif = (eleve) => (eleve.statut ? eleve.statut !== 'inactive' : eleve.user?.is_active !== false);

export default function ElevesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [inscription, setInscription] = useState(false);
  const [importation, setImportation] = useState(false);
  // Mêmes rôles que `ElevePolicy::create` côté API.
  const peutInscrire = useAuthStore((etat) => etat.hasAnyRole([...ROLE_GROUPS.DIRECTION, ROLES.SECRETAIRE]));

  const { data: elevesData, isLoading, error, refetch } = useApiQuery(
    ['eleves'],
    '/eleves',
  );

  const queryClient = useQueryClient();

  const handleRetirer = async (eleve) => {
    const nom = `${eleve.user?.name ?? ''} ${eleve.user?.prenom ?? ''}`.trim() || `élève n°${eleve.id}`;
    if (!window.confirm(`Retirer ${nom} des effectifs ? Son dossier (notes, paiements…) reste consultable.`)) {
      return;
    }
    try {
      await apiClient.post(`/eleves/${eleve.id}/deactivate`);
      await queryClient.invalidateQueries({ queryKey: ['eleves'] });
      toast.success(t('pages.eleves.eleves.eleve_retire', { nom }));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('pages.eleves.eleves.impossible_de_retirer_l_eleve'));
    }
  };

  const handleReintegrer = async (eleve) => {
    const nom = `${eleve.user?.name ?? ''} ${eleve.user?.prenom ?? ''}`.trim() || `élève n°${eleve.id}`;
    try {
      await apiClient.post(`/eleves/${eleve.id}/activate`);
      await queryClient.invalidateQueries({ queryKey: ['eleves'] });
      toast.success(t('pages.eleves.eleves.eleve_reintegre', { nom }));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? t('pages.eleves.eleves.impossible_de_reintegrer_l_eleve'));
    }
  };

  const eleves = Array.isArray(elevesData?.data) ? elevesData.data
    : Array.isArray(elevesData) ? elevesData : [];

  const classes = useMemo(() => [...new Set(eleves.map((e) => e.classe?.nom_classe).filter(Boolean))], [eleves]);

  const filtered = useMemo(() =>
    eleves.filter((e) => {
      const nom = `${e.user?.name ?? ''} ${e.user?.prenom ?? ''}`.toLowerCase();
      if (search && !nom.includes(search.toLowerCase())) return false;
      if (filterClasse && e.classe?.nom_classe !== filterClasse) return false;
      return true;
    }),
    [eleves, search, filterClasse]
  );

  const actifs = eleves.filter(estActif).length;
  const inactifs = eleves.length - actifs;
  const moyenneGenerale = eleves.length > 0
    ? (eleves.reduce((acc, e) => acc + (e.moyenne ?? 0), 0) / eleves.length).toFixed(1)
    : '—';

  const STATS = [
    { title: t('pages.eleves.eleves.total_eleves'), value: String(eleves.length), icon: Users, color: 'primary' },
    { title: t('pages.eleves.eleves.actifs'), value: String(actifs), icon: UserCheck, color: 'emerald' },
    { title: t('pages.eleves.eleves.inactifs'), value: String(inactifs), icon: UserX, color: 'amber' },
    { title: t('pages.eleves.eleves.moyenne_generale'), value: `${moyenneGenerale}/20`, icon: GraduationCap, color: 'sky' },
  ];

  // Export de la liste affichée (filtres compris). Séparateur « ; » et BOM :
  // c'est ce qu'ouvre correctement un tableur réglé en français.
  const exporter = () => {
    const cellule = (v) => { const texte = String(v ?? ''); return /[;"\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte; };
    const lignes = [
      ['Matricule', 'Nom', 'Prénom', 'Classe', 'Statut'],
      ...filtered.map((e) => [e.numero_matricule, e.user?.name, e.user?.prenom, e.classe?.nom_classe, estActif(e) ? t('pages.eleves.eleves.actifs') : t('pages.eleves.eleves.inactifs')]),
    ];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + lignes.map((l) => l.map(cellule).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = `eleves-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <ImportDialog open={importation} onClose={() => setImportation(false)} onDone={() => refetch()} />
      <InscriptionDialog open={inscription} onClose={() => setInscription(false)} onDone={() => refetch()} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] ">{t('pages.eleves.eleves.title')}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{t('pages.eleves.eleves.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-1', isLoading && 'animate-spin')} />
          </Button>
          <Button variant="outline" size="sm" icon={<Download />} onClick={exporter} disabled={filtered.length === 0}>{t('common.export')}</Button>
          {peutInscrire && (
            <Button variant="outline" size="sm" icon={<Upload />} onClick={() => setImportation(true)}>{t('pages.eleves.import.bouton')}</Button>
          )}
          {peutInscrire && (
            <Button size="sm" icon={<Plus />} onClick={() => setInscription(true)}>{t('pages.eleves.eleves.nouvel_eleve')}</Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <Input
              placeholder={t('common.search_student')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterClasse}
            onChange={(e) => setFilterClasse(e.target.value)}
            aria-label={t('common.filter_by_class')}
            className="h-10 rounded-xl border border-[var(--border-heavy)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40   "
          >
            <option value="">{t('common.all_classes')}</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </Card>

      <Card padding={false}>
        {error && (
          <div className="p-6 text-center text-sm text-red-500">
            Erreur de chargement : {error.message ?? t('pages.eleves.eleves.impossible_de_recuperer_les_eleves')}
          </div>
        )}
        <Table>
          <Table.Header>
            <Table.Head>{t('common.student')}</Table.Head>
            <Table.Head>{t('common.class')}</Table.Head>
            <Table.Head>{t('common.matricule')}</Table.Head>
            <Table.Head>{t('common.status_label')}</Table.Head>
            <Table.Head className="text-right">{t('common.actions')}</Table.Head>
          </Table.Header>
          <Table.Body>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <Table.Row key={i}>
                {Array.from({ length: 5 }).map((__, j) => (
                  <Table.Cell key={j}><Skeleton className="h-4 w-full" /></Table.Cell>
                ))}
              </Table.Row>
            ))}
            {!isLoading && filtered.length === 0 && (
              <Table.Row>
                <td colSpan={5} className="p-8 text-center text-sm text-[var(--text-secondary)]">
                  {t('common.no_student_found')}
                </td>
              </Table.Row>
            )}
            {!isLoading && filtered.map((eleve) => (
              <Table.Row key={eleve.id}>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    <Avatar name={`${eleve.user?.name ?? ''} ${eleve.user?.prenom ?? ''}`} size="sm" />
                    <div>
                      <p className="font-medium text-[var(--text-primary)] ">
                        {eleve.user?.name} {eleve.user?.prenom}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">{eleve.user?.email}</p>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="outline">{eleve.classe?.nom_classe ?? '—'}</Badge>
                </Table.Cell>
                <Table.Cell className="text-xs font-mono text-[var(--text-secondary)]">
                  {eleve.numero_matricule ?? '—'}
                </Table.Cell>
                <Table.Cell>
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    estActif(eleve) ? STATUT_COLORS.actif : STATUT_COLORS.inactif
                  )}>
                    {estActif(eleve) ? 'actif' : 'inactif'}
                  </span>
                </Table.Cell>
                <Table.Cell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" icon={<MoreHorizontal />} title={t('pages.eleves.eleves.plus_d_actions')} />
                    {estActif(eleve) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 />}
                        title={t('pages.eleves.eleves.retirer_des_effectifs')}
                        aria-label={t('pages.eleves.eleves.retirer_des_effectifs')}
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleRetirer(eleve)}
                      />
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleReintegrer(eleve)}>
                        {t('pages.eleves.eleves.reintegrer')}
                      </Button>
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>
    </motion.div>
  );
}
