/**
 * UtilisateursPage — Gestion des utilisateurs (Admin)
 *
 * Module admin : vue d'ensemble des comptes utilisateurs.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, Search, Filter, Shield, UserCog, UserCheck,
  Clock, CheckCircle, XCircle, Eye, Ban, Trash2,
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';

const ROLES_DISPLAY = [
  'Directeur', 'Enseignant', 'Élève', 'Parent',
  'Comptable', 'Surveillant', 'Censeur', 'Infirmier',
  'Bibliothécaire', 'Secrétaire',
];

const UTILISATEURS = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  nom: [
    'Diallo Amadou', 'Touré Fatou', 'Koné Moussa', 'Cissé Inza', 'Traoré Kadiatou',
    'Sow Mariam', 'Diop Souleymane', 'Ndiaye Fatma', 'Ba Ousmane', 'Sylla Aïcha',
    'Faye Cheikh', 'Gueye Ndeye', 'Kébé Maimouna', 'Sangaré Adama', 'Bamba Youssouf',
  ][i],
  email: `user${i + 1}@ecole.ci`,
  role: ROLES_DISPLAY[i % ROLES_DISPLAY.length],
  ecole: ['Groupe Scolaire Les Palmiers', 'Collège Saint-Jean', 'Lycée Moderne d\'Abobo', 'Institut Supérieur'][i % 4],
  statut: ['actif', 'actif', 'actif', 'actif', 'inactif'][i % 5],
  derniereConnexion: new Date(Date.now() - 86400000 * (i * 3)),
  dateCreation: new Date(Date.now() - 86400000 * (90 + i * 10)),
}));

const ROLE_ICONS = {
  Directeur: Shield,
  Enseignant: UserCheck,
  Élève: Users,
  Parent: Users,
  Comptable: UserCog,
  Surveillant: UserCheck,
  Censeur: UserCheck,
  Infirmier: UserCheck,
  Bibliothécaire: UserCheck,
  Secrétaire: UserCog,
};

export default function UtilisateursPage() {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const stats = useMemo(() => ({
    total: UTILISATEURS.length,
    actifs: UTILISATEURS.filter((u) => u.statut === 'actif').length,
    inactifs: UTILISATEURS.filter((u) => u.statut === 'inactif').length,
    roles: new Set(UTILISATEURS.map((u) => u.role)).size,
  }), []);

  const filtered = useMemo(() =>
    UTILISATEURS.filter((u) => {
      if (search && !u.nom.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterRole && u.role !== filterRole) return false;
      if (filterStatut && u.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterRole, filterStatut]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Utilisateurs</h1>
          <p className="text-sm text-neutral-500">Gestion des comptes et accès</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Ban />}>Désactiver</Button>
          <Button size="sm" icon={<Plus />}>Ajouter</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total" value={String(stats.total)} icon={Users} color="indigo" />
        <StatsCard title="Actifs" value={String(stats.actifs)} icon={CheckCircle} color="emerald" />
        <StatsCard title="Inactifs" value={String(stats.inactifs)} icon={XCircle} color="red" />
        <StatsCard title="Rôles" value={String(stats.roles)} icon={Shield} color="amber" />
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Tous les rôles</option>
              {ROLES_DISPLAY.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Utilisateur</th>
                <th className="pb-3 pr-4">Rôle</th>
                <th className="pb-3 pr-4">École</th>
                <th className="pb-3 pr-4">Statut</th>
                <th className="pb-3 pr-4">Dernière connexion</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-neutral-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              )}
              {filtered.map((u) => {
                const RoleIcon = ROLE_ICONS[u.role] || Users;
                return (
                  <tr key={u.id} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.nom} size="sm" />
                        <div>
                          <span className="text-sm font-medium text-neutral-900 dark:text-white block">{u.nom}</span>
                          <span className="text-xs text-neutral-500">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" size="sm" className="capitalize flex items-center gap-1 w-fit">
                        <RoleIcon className="h-3 w-3" /> {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">{u.ecole}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={u.statut === 'actif' ? 'primary' : 'outline'} size="sm">
                        {u.statut === 'actif' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(u.derniereConnexion)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" icon={<Eye />} title="Voir" />
                        <Button variant="ghost" size="sm" icon={<Ban />} title="Désactiver" />
                        <Button variant="ghost" size="sm" icon={<Trash2 />} title="Supprimer" className="text-red-500 hover:text-red-600" />
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
