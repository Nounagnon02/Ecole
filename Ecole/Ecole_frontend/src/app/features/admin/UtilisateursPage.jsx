/**
 * UtilisateursPage — Gestion des utilisateurs (Admin)
 *
 * Module admin : vue d'ensemble des comptes utilisateurs / tenants.
 * Données dynamiques via API /api/v1/admin/tenants
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, Search, Filter, Shield, UserCog, UserCheck,
  Clock, CheckCircle, XCircle, Eye, Ban, Trash2, Loader2, AlertCircle,
} from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useApi } from '@/hooks/useApi';

const ROLES_DISPLAY = [
  'Directeur', 'Enseignant', 'Élève', 'Parent',
  'Comptable', 'Surveillant', 'Censeur', 'Infirmier',
  'Bibliothécaire', 'Secrétaire',
];

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
  const { loading, error, get } = useApi();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/api/v1/admin/tenants');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setUtilisateurs(items.map((t) => ({
          id: t.id,
          nom: t.name || t.nom || '—',
          email: t.email || '—',
          role: t.plan?.name || 'Directeur',
          ecole: t.name || t.nom || '—',
          statut: t.status === 'active' || t.is_active ? 'actif' : 'inactif',
          derniereConnexion: t.last_login_at || t.created_at,
          dateCreation: t.created_at,
        })));
      } catch (e) {
        console.error('Erreur chargement utilisateurs:', e);
      }
    })();
  }, []);

  const stats = useMemo(() => ({
    total: utilisateurs.length,
    actifs: utilisateurs.filter((u) => u.statut === 'actif').length,
    inactifs: utilisateurs.filter((u) => u.statut === 'inactif').length,
    roles: new Set(utilisateurs.map((u) => u.role)).size,
  }), [utilisateurs]);

  const filtered = useMemo(() =>
    utilisateurs.filter((u) => {
      if (search && !u.nom.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterRole && u.role !== filterRole) return false;
      if (filterStatut && u.statut !== filterStatut) return false;
      return true;
    }),
    [search, filterRole, filterStatut, utilisateurs]
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Utilisateurs</h1>
          <p className="text-sm text-neutral-500">Gestion des comptes et accès</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Ban />}>Désactiver</Button>
          <Button size="sm" icon={<Plus />}>Ajouter</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total" value={String(stats.total)} icon={Users} color="primary" />
        <StatsCard title="Actifs" value={String(stats.actifs)} icon={CheckCircle} color="emerald" />
        <StatsCard title="Inactifs" value={String(stats.inactifs)} icon={XCircle} color="red" />
        <StatsCard title="Établissements" value={String(stats.roles)} icon={Shield} color="amber" />
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
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <option value="">Tous les rôles</option>
              {ROLES_DISPLAY.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
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
                <th className="pb-3 pr-4">Établissement</th>
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
                      {u.derniereConnexion ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(u.derniereConnexion)}
                        </span>
                      ) : '—'}
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
