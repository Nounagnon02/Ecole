/**
 * GestionÉlèves — Page de gestion des élèves
 *
 * Fonctions : Liste, recherche, filtre par classe, ajout, édition
 * Données dynamiques via GET /api/eleves (EleveController::index)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  UserPlus,
  Download,
  GraduationCap,
  Users,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Avatar from '@/shared/components/ui/Avatar';
import Table from '@/shared/components/ui/Table';
import { api } from '@/shared/services/api';

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function calcAge(dateNaissance) {
  if (!dateNaissance) return '—';
  const today = new Date();
  const birth = new Date(dateNaissance);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getStudentName(eleve) {
  const u = eleve.user;
  if (!u) return '—';
  return `${u.prenom || ''} ${u.name || ''}`.trim() || u.name || u.email || '—';
}

function getClasseName(eleve) {
  const c = eleve.classe;
  return c?.nom || c?.nom_classe || '—';
}

function getStatut(eleve) {
  return eleve.user?.is_active === false ? 'Inactif' : 'Actif';
}

/* ─── Composant principal ──────────────────────────────────────────────── */

export default function GestionÉlèves() {
  const [search, setSearch] = useState('');
  const [classeFilter, setClasseFilter] = useState('Toutes');

  const { data: eleves, isLoading, error, refetch } = useQuery({
    queryKey: ['eleves'],
    queryFn: async () => {
      const response = await api.get('/eleves');
      return response.data?.data || response.data;
    },
    staleTime: 60_000,
    retry: 2,
  });

  /* Classes dynamiques depuis l'API */
  const classes = eleves
    ? ['Toutes', ...new Set(eleves.map(e => getClasseName(e)).filter(Boolean))]
    : ['Toutes'];

  const dataList = Array.isArray(eleves) ? eleves : [];

  const filtered = dataList.filter(e =>
    (classeFilter === 'Toutes' || getClasseName(e) === classeFilter) &&
    (getStudentName(e).toLowerCase().includes(search.toLowerCase()) ||
     (e.numero_matricule || '').toLowerCase().includes(search.toLowerCase()))
  );

  /* Stats */
  const actifs = dataList.filter(e => getStatut(e) === 'Actif').length;
  const total = dataList.length;

  /* États */
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Erreur de chargement
          </h2>
          <p className="text-sm text-neutral-500 mb-4 max-w-md">
            Impossible de charger la liste des élèves. Vérifiez votre connexion et réessayez.
          </p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-neutral-900 dark:text-white"
          >
            Gestion des Élèves
          </motion.h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {isLoading ? 'Chargement…' : `${actifs} élèves actifs · ${total} total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-1', isLoading && 'animate-spin')} /> Actualiser
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-1" /> Exporter
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" /> Nouvel Élève
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Élèves', value: isLoading ? '…' : total.toLocaleString(), icon: Users, color: 'text-[var(--accent)] bg-[var(--accent-subtle)] dark:bg-[var(--accent-subtle)]0/10' },
          { label: 'Actifs', value: isLoading ? '…' : actifs.toLocaleString(), icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Moyenne Générale', value: '—', icon: GraduationCap, color: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10' },
          { label: 'Taux de Réussite', value: '—', icon: GraduationCap, color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900"
          >
            <div className="flex items-center gap-3">
              <div className={cn('p-2.5 rounded-xl', stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{stat.label}</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <Card.Body className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom ou matricule..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                icon={Search}
              />
            </div>
            <div className="relative">
              <select
                value={classeFilter}
                onChange={e => setClasseFilter(e.target.value)}
                className="h-10 px-4 pr-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm text-neutral-700 dark:text-neutral-300 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
              >
                {classes.map(c => (
                  <option key={c} value={c}>{c === 'Toutes' ? 'Toutes les classes' : c}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Table */}
      <Card>
        <Card.Body className="p-0">
          <Table>
            <Table.Header>
              <Table.Head>Élève</Table.Head>
              <Table.Head>Classe</Table.Head>
              <Table.Head>Matricule</Table.Head>
              <Table.Head>Parent / Contact</Table.Head>
              <Table.Head>Moyenne</Table.Head>
              <Table.Head>Statut</Table.Head>
              <Table.Head className="text-right">Actions</Table.Head>
            </Table.Header>
            <Table.Body>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <Table.Row key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <Table.Cell key={j}><div className="h-5 w-full bg-neutral-200 animate-pulse dark:bg-neutral-700 rounded" /></Table.Cell>
                  ))}
                </Table.Row>
              ))}
              {!isLoading && filtered.length === 0 && (
                <Table.Row>
                  <td colSpan={7} className="p-8 text-center text-sm text-neutral-500">
                    {search || classeFilter !== 'Toutes'
                      ? 'Aucun élève ne correspond à votre recherche.'
                      : 'Aucun élève inscrit.'}
                  </td>
                </Table.Row>
              )}
              {!isLoading && filtered.map((eleve) => (
                <Table.Row key={eleve.id}>
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      <Avatar name={getStudentName(eleve)} size="sm" />
                      <div>
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {getStudentName(eleve)}
                        </span>
                        <span className="text-xs text-neutral-400 ml-2">
                          {eleve.date_naissance ? `${calcAge(eleve.date_naissance)} ans` : '—'} · {eleve.sexe || '—'}
                        </span>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="info" size="sm">{getClasseName(eleve)}</Badge>
                  </Table.Cell>
                  <Table.Cell className="text-neutral-400 text-xs font-mono">{eleve.numero_matricule || '—'}</Table.Cell>
                  <Table.Cell>
                    <div className="text-sm">
                      <p className="text-neutral-700 dark:text-neutral-300">{eleve.parents?.length ? eleve.parents[0]?.user?.name || '—' : '—'}</p>
                      <p className="text-xs text-neutral-400">{eleve.user?.email || ''}</p>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-neutral-400 text-sm">—</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={getStatut(eleve) === 'Actif' ? 'success' : 'danger'} size="sm">
                      {getStatut(eleve)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-neutral-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
        <Card.Footer>
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span>{total > 0 ? `${filtered.length} élèves sur ${total}` : ''}</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50" disabled>Précédent</button>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">1</span>
              <button className="px-3 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">Suivant</button>
            </div>
          </div>
        </Card.Footer>
      </Card>
    </div>
  );
}
