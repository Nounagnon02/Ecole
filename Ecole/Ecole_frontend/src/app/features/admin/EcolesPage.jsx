/**
 * EcolesPage — Gestion des écoles (Super Admin)
 *
 * Données réelles depuis l'API + modale de création/provision.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Plus, Search, MapPin, Phone, Mail, Users,
  BookOpen, GraduationCap, CheckCircle, XCircle, Eye,
  Loader2, AlertCircle, RefreshCw, ChevronDown, KeyRound,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Modal from '@/shared/components/ui/Modal';
import StatsCard from '@/shared/components/ui/StatsCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { api } from '@/shared/services/api';

const STATUT_CONFIG = {
  active: { variant: 'primary', label: 'Actif' },
  inactive: { variant: 'outline', label: 'Inactif' },
};

function EcoleSkeleton() {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-3 w-40" />
          <div className="flex gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function EcoleForm({ form, onChange, errors }) {
  return (
    <div className="space-y-4">
      <Input
        label="Nom de l'établissement"
        placeholder="Ex: Complexe Scolaire Lumière"
        value={form.nom}
        onChange={(e) => onChange('nom', e.target.value)}
        error={errors.nom}
        required
        icon={<Building2 className="h-4 w-4" />}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="contact@ecole.bj"
          value={form.email}
          onChange={(e) => onChange('email', e.target.value)}
          error={errors.email}
          required
          icon={<Mail className="h-4 w-4" />}
        />
        <Input
          label="Téléphone"
          placeholder="+229 01 02 03 04"
          value={form.telephone}
          onChange={(e) => onChange('telephone', e.target.value)}
          icon={<Phone className="h-4 w-4" />}
        />
      </div>
      <Input
        label="Adresse"
        placeholder="Cotonou, Bénin"
        value={form.adresse}
        onChange={(e) => onChange('adresse', e.target.value)}
        error={errors.adresse}
        required
        icon={<MapPin className="h-4 w-4" />}
      />
      <Input
        label="Ville"
        placeholder="Cotonou"
        value={form.ville}
        onChange={(e) => onChange('ville', e.target.value)}
        icon={<MapPin className="h-4 w-4" />}
      />
    </div>
  );
}

export default function EcolesPage() {
  const [ecoles, setEcoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  // Modale création simple
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ nom: '', email: '', telephone: '', adresse: '', ville: '' });
  const [createErrors, setCreateErrors] = useState({});
  const [creating, setCreating] = useState(false);

  // Modale provision (création complète)
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provForm, setProvForm] = useState({ nom: '', email: '', adresse: '', telephone: '', ville: '', password: '' });
  const [provErrors, setProvErrors] = useState({});
  const [provisioning, setProvisioning] = useState(false);
  const [provResult, setProvResult] = useState(null);

  // Chargement des écoles
  const fetchEcoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/ecoles');
      setEcoles(res.data?.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEcoles(); }, []);

  const stats = useMemo(() => {
    const actifs = ecoles.filter((e) => e.status === 'active').length;
    return {
      total: ecoles.length,
      actifs,
      inactifs: ecoles.length - actifs,
      totalEffectifs: ecoles.reduce((s, e) => s + (e.total_eleves ?? 0), 0),
    };
  }, [ecoles]);

  // Filtrage
  const filtered = useMemo(() =>
    ecoles.filter((e) => {
      if (search && !e.nom?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatut && e.status !== filterStatut) return false;
      return true;
    }),
    [ecoles, search, filterStatut]
  );

  // ─── Création simple ────────────────────────────────────────
  const handleCreateField = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    if (createErrors[field]) setCreateErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateErrors({});
    try {
      await api.post('/ecoles', createForm);
      setShowCreateModal(false);
      setCreateForm({ nom: '', email: '', telephone: '', adresse: '', ville: '' });
      fetchEcoles();
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const mapped = {};
        Object.entries(serverErrors).forEach(([field, msgs]) => {
          mapped[field] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setCreateErrors(mapped);
      } else {
        setCreateErrors({ _general: err.response?.data?.message || 'Erreur de création' });
      }
    } finally {
      setCreating(false);
    }
  };

  // ─── Provision ──────────────────────────────────────────────
  const handleProvField = (field, value) => {
    setProvForm((prev) => ({ ...prev, [field]: value }));
    if (provErrors[field]) setProvErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleProvision = async (e) => {
    e.preventDefault();
    setProvisioning(true);
    setProvErrors({});
    setProvResult(null);
    try {
      const res = await api.post('/ecoles/provision', provForm);
      setProvResult(res.data?.data);
      setProvForm({ nom: '', email: '', adresse: '', telephone: '', ville: '', password: '' });
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const mapped = {};
        Object.entries(serverErrors).forEach(([field, msgs]) => {
          mapped[field] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setProvErrors(mapped);
      } else {
        setProvErrors({ _general: err.response?.data?.message || 'Erreur de provisionnement' });
      }
    } finally {
      setProvisioning(false);
    }
  };

  const resetProvision = () => {
    setProvResult(null);
    setShowProvisionModal(false);
    fetchEcoles();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Écoles</h1>
          <p className="text-sm text-[var(--text-secondary)]">Gestion des établissements scolaires</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowProvisionModal(true)} icon={<KeyRound className="h-4 w-4" />}>
            Provisionner
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)} icon={<Plus className="h-4 w-4" />}>
            Ajouter une école
          </Button>
        </div>
      </div>

      {/* ─── Stats ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total" value={loading ? '...' : String(stats.total)} icon={Building2} color="primary" />
        <StatsCard title="Actives" value={loading ? '...' : String(stats.actifs)} icon={CheckCircle} color="emerald" />
        <StatsCard title="Inactives" value={loading ? '...' : String(stats.inactifs)} icon={XCircle} color="red" />
        <StatsCard title="Établissements" value={loading ? '...' : String(stats.total)} icon={Users} color="sky" />
      </div>

      {/* ─── Barre de recherche + filtre ────────────────────────── */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <Input
              placeholder="Rechercher une école..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchEcoles} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
              Actualiser
            </Button>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 text-[var(--text-primary)]"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ─── Contenu : Loading / Error / Grid ──────────────────── */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <EcoleSkeleton key={i} />)}
        </div>
      )}

      {error && (
        <Card>
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-[var(--red)]">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">{error}</p>
            <Button size="sm" variant="secondary" onClick={fetchEcoles}>
              <RefreshCw className="h-4 w-4 mr-1" />Réessayer
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.length === 0 && (
            <div className="sm:col-span-2">
              <Card>
                <div className="text-center py-8 text-[var(--text-tertiary)]">
                  <Building2 className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">Aucune école trouvée</p>
                </div>
              </Card>
            </div>
          )}
          {filtered.map((e) => (
            <Card key={e.id} hover>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-[var(--primary-subtle)] flex items-center justify-center shrink-0">
                  <Building2 className="h-6 w-6 text-[var(--primary)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{e.nom}</span>
                    {e.slug && <Badge variant="outline" size="sm">{e.slug}</Badge>}
                    <Badge variant={STATUT_CONFIG[e.status]?.variant || 'outline'} size="sm">
                      {STATUT_CONFIG[e.status]?.label || e.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-col gap-1 text-xs text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.adresse}{e.ville ? `, ${e.ville}` : ''}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {e.phone || '—'}</span>
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {e.email}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-light)]">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {e.eleves_count ?? '?'} élèves</span>
                    <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {e.enseignants_count ?? '?'} ens.</span>
                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {e.classes_count ?? '?'} classes</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" icon={<Eye className="h-4 w-4" />} title="Voir" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODALE : Création simple
          ════════════════════════════════════════════════════════════ */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Ajouter une école"
        description="Créez un nouvel établissement scolaire"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Annuler</Button>
            <Button onClick={handleCreate} loading={creating}>
              Créer l'école
            </Button>
          </>
        }
      >
        {createErrors._general && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-[var(--red-subtle)] bg-[var(--red-subtle)]/20 px-4 py-3 text-sm text-[var(--red)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{createErrors._general}</span>
          </div>
        )}
        <EcoleForm
          form={createForm}
          onChange={handleCreateField}
          errors={createErrors}
        />
      </Modal>

      {/* ════════════════════════════════════════════════════════════
          MODALE : Provision (école + comptes)
          ════════════════════════════════════════════════════════════ */}
      <Modal
        open={showProvisionModal}
        onClose={() => { if (!provResult) setShowProvisionModal(false); }}
        title={provResult ? 'École créée avec succès !' : 'Provisionner une école'}
        description={provResult ? 'Tous les comptes ont été générés automatiquement.' : 'Crée une école avec tous ses comptes utilisateurs en une fois'}
        size={provResult ? 'lg' : 'md'}
        closeOnOverlay={!provResult}
        footer={
          provResult ? (
            <Button onClick={resetProvision}>
              <CheckCircle className="h-4 w-4 mr-1" />Terminer
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setShowProvisionModal(false)}>Annuler</Button>
              <Button onClick={handleProvision} loading={provisioning} icon={<KeyRound className="h-4 w-4" />}>
                Provisionner
              </Button>
            </>
          )
        }
      >
        {provResult ? (
          /* ─── Résultat du provision ─── */
          <div className="space-y-4">
            <div className="rounded-lg bg-[var(--green-subtle)]/20 border border-[var(--green-light)] p-4 text-sm text-[var(--green)]">
              <p className="font-semibold">🏫 {provResult.ecole.nom}</p>
              <p className="text-xs mt-1">Email : {provResult.ecole.email}</p>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Comptes créés</p>
              {provResult.users?.map((u, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-[var(--surface)] border border-[var(--border-light)] px-4 py-2.5 text-sm">
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">{u.role}</span>
                    <span className="ml-2 text-xs text-[var(--text-tertiary)]">{u.email}</span>
                  </div>
                  <Badge variant="outline" size="sm">{u.identifiant}</Badge>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-[var(--accent-subtle)]/20 border border-[var(--accent)]/30 p-3 text-sm">
              <span className="flex items-center gap-2 text-[var(--accent)] font-medium">
                <KeyRound className="h-4 w-4" />
                Mot de passe commun : <code className="bg-[var(--surface)] px-2 py-0.5 rounded text-xs">{provResult.password}</code>
              </span>
            </div>
          </div>
        ) : (
          /* ─── Formulaire de provision ─── */
          <>
            {provErrors._general && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-[var(--red-subtle)] bg-[var(--red-subtle)]/20 px-4 py-3 text-sm text-[var(--red)]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{provErrors._general}</span>
              </div>
            )}
            <div className="space-y-4">
              <Input
                label="Nom de l'établissement"
                placeholder="Ex: Complexe Scolaire Lumière"
                value={provForm.nom}
                onChange={(e) => handleProvField('nom', e.target.value)}
                error={provErrors.nom}
                required
                icon={<Building2 className="h-4 w-4" />}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="contact@ecole.bj"
                  value={provForm.email}
                  onChange={(e) => handleProvField('email', e.target.value)}
                  error={provErrors.email}
                  required
                  icon={<Mail className="h-4 w-4" />}
                />
                <Input
                  label="Téléphone"
                  placeholder="+229 01 02 03 04"
                  value={provForm.telephone}
                  onChange={(e) => handleProvField('telephone', e.target.value)}
                  icon={<Phone className="h-4 w-4" />}
                />
              </div>
              <Input
                label="Adresse"
                placeholder="Cotonou, Bénin"
                value={provForm.adresse}
                onChange={(e) => handleProvField('adresse', e.target.value)}
                error={provErrors.adresse}
                required
                icon={<MapPin className="h-4 w-4" />}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Ville"
                  placeholder="Cotonou"
                  value={provForm.ville}
                  onChange={(e) => handleProvField('ville', e.target.value)}
                  icon={<MapPin className="h-4 w-4" />}
                />
                <Input
                  label="Mot de passe (optionnel)"
                  type="password"
                  placeholder="Défaut: password1234"
                  value={provForm.password}
                  onChange={(e) => handleProvField('password', e.target.value)}
                  icon={<KeyRound className="h-4 w-4" />}
                />
              </div>
              <div className="rounded-lg bg-[var(--primary-subtle)]/20 border border-[var(--primary)]/20 p-3 text-xs text-[var(--text-tertiary)]">
                <p className="font-medium text-[var(--text-secondary)] mb-1">🔑 Comptes qui seront créés automatiquement :</p>
                <p>Directeur, Directeur Maternelle/Primaire/Secondaire, Censeur, Secrétaire, Comptable, Surveillant, Infirmier, Bibliothécaire</p>
              </div>
            </div>
          </>
        )}
      </Modal>
    </motion.div>
  );
}
