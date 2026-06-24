/**
 * GestionÉlèves — Page de gestion des élèves
 *
 * Fonctions : Liste, recherche, filtre par classe, ajout, édition
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  UserPlus,
  Download,
  MoreHorizontal,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  Users,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Avatar from '@/shared/components/ui/Avatar';
import Table from '@/shared/components/ui/Table';

const CLASSES = ['Toutes', '6ème A', '6ème B', '5ème A', '5ème B', '4ème A', '4ème B', '3ème A', '3ème B', '2nde A', '2nde B', '1ère A', '1ère B', 'Tle A', 'Tle B'];

const ELEVES = [
  { id: 1, nom: 'Jean Mensah', classe: '4ème A', matricule: 'EL-2024-001', sexe: 'M', age: 14, parent: 'M. Mensah', contact: '+226 70 12 34 56', status: 'Actif', moyenne: '15.2' },
  { id: 2, nom: 'Ama Koffi', classe: '4ème A', matricule: 'EL-2024-002', sexe: 'F', age: 13, parent: 'M. Koffi', contact: '+226 70 23 45 67', status: 'Actif', moyenne: '14.8' },
  { id: 3, nom: 'Koffi Dossa', classe: '4ème B', matricule: 'EL-2024-003', sexe: 'M', age: 14, parent: 'Mme. Dossa', contact: '+226 70 34 56 78', status: 'Actif', moyenne: '12.5' },
  { id: 4, nom: 'Mwana Akakpo', classe: '3ème A', matricule: 'EL-2023-015', sexe: 'F', age: 15, parent: 'Famille Akakpo', contact: '+226 70 45 67 89', status: 'Actif', moyenne: '16.1' },
  { id: 5, nom: 'David Amégnigban', classe: '3ème B', matricule: 'EL-2023-016', sexe: 'M', age: 15, parent: 'M. Amégnigban', contact: '+226 70 56 78 90', status: 'Inactif', moyenne: '9.8' },
  { id: 6, nom: 'Sarah Koné', classe: '5ème A', matricule: 'EL-2024-004', sexe: 'F', age: 12, parent: 'M. Koné', contact: '+226 70 67 89 01', status: 'Actif', moyenne: '17.3' },
  { id: 7, nom: 'Paul Bamba', classe: '2nde A', matricule: 'EL-2023-020', sexe: 'M', age: 16, parent: 'Mme. Bamba', contact: '+226 70 78 90 12', status: 'Actif', moyenne: '13.0' },
  { id: 8, nom: 'Grace Ouattara', classe: 'Tle A', matricule: 'EL-2022-008', sexe: 'F', age: 18, parent: 'M. Ouattara', contact: '+226 70 89 01 23', status: 'Actif', moyenne: '14.2' },
];

export default function GestionÉlèves() {
  const [search, setSearch] = useState('');
  const [classeFilter, setClasseFilter] = useState('Toutes');

  const filtered = ELEVES.filter(e =>
    (classeFilter === 'Toutes' || e.classe === classeFilter) &&
    (e.nom.toLowerCase().includes(search.toLowerCase()) ||
     e.matricule.toLowerCase().includes(search.toLowerCase()))
  );

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
            {ELEVES.filter(e => e.status === 'Actif').length} élèves actifs · {ELEVES.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          { label: 'Total Élèves', value: '1 284', icon: Users, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' },
          { label: 'Actifs', value: '1 247', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Moyenne Générale', value: '13.8/20', icon: GraduationCap, color: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10' },
          { label: 'Taux de Réussite', value: '87%', icon: GraduationCap, color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10' },
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
                className="h-10 px-4 pr-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm text-neutral-700 dark:text-neutral-300 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {CLASSES.map(c => (
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
              {filtered.map((eleve) => (
                <Table.Row key={eleve.id}>
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      <Avatar name={eleve.nom} size="sm" />
                      <div>
                        <span className="font-medium text-neutral-900 dark:text-white">{eleve.nom}</span>
                        <span className="text-xs text-neutral-400 ml-2">{eleve.age} ans · {eleve.sexe}</span>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="info" size="sm">{eleve.classe}</Badge>
                  </Table.Cell>
                  <Table.Cell className="text-neutral-400 text-xs font-mono">{eleve.matricule}</Table.Cell>
                  <Table.Cell>
                    <div className="text-sm">
                      <p className="text-neutral-700 dark:text-neutral-300">{eleve.parent}</p>
                      <p className="text-xs text-neutral-400">{eleve.contact}</p>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className={cn(
                      'font-semibold text-sm',
                      parseFloat(eleve.moyenne) >= 14 ? 'text-emerald-600 dark:text-emerald-400'
                        : parseFloat(eleve.moyenne) >= 10 ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                    )}>
                      {eleve.moyenne}/20
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={eleve.status === 'Actif' ? 'success' : 'danger'} size="sm">
                      {eleve.status}
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
            <span>{filtered.length} élèves sur {ELEVES.length}</span>
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
