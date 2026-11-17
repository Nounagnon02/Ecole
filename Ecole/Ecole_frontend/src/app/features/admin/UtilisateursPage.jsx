/**
 * UtilisateursPage — les comptes, gérés par l'administrateur.
 *
 * La page listait des écoles (`/v1/admin/tenants`) sous le nom
 * d'utilisateurs, n'était ouverte qu'au super-administrateur, et ses boutons
 * « Ajouter », « Désactiver », « Supprimer » ne faisaient rien (BUG-023,
 * audit du 14/11). Elle lit maintenant `/admin/utilisateurs` : les comptes
 * de son école pour un administrateur d'école, toute la plateforme pour le
 * super-administrateur. L'administrateur d'école crée un compte du
 * personnel et désactive ou réactive un compte ; la désactivation ferme
 * aussi les sessions ouvertes de la personne.
 */

import { useMemo, useState } from 'react';
import { CheckCircle, Loader2, Plus, Search, Users, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import apiClient, { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
import { ROLE_LABELS } from '@/shared/types/roles';
import { useTranslation } from '@/shared/i18n';
import useAuthStore from '@/shared/stores/auth-store';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Card from '@/shared/components/ui/Card';
import Input from '@/shared/components/ui/Input';
import Modal from '@/shared/components/ui/Modal';
import StatsCard from '@/shared/components/ui/StatsCard';
import { AjoutDialog } from '@/app/features/personnel/PersonnelPage';

const nomComplet = (c) => [c.nom, c.prenom].filter(Boolean).join(' ') || `#${c.id}`;

function ConfirmationDesactivation({ compte, onClose, onConfirm, envoi }) {
  const { t } = useTranslation();
  const u = (cle, valeurs) => t(`pages.admin.utilisateurs.${cle}`, valeurs);
  return (
    <Modal open={!!compte} onClose={() => { if (!envoi) onClose(); }} title={u('confirmer_titre')} size="sm">
      {compte && (
        <div className="space-y-4 p-5">
          <p className="text-sm text-[var(--text-secondary)]">{u('confirmer_texte', { nom: nomComplet(compte) })}</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} disabled={envoi}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={onConfirm} loading={envoi}>{u('desactiver')}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function UtilisateursPage() {
  const { t } = useTranslation();
  const u = (cle, valeurs) => t(`pages.admin.utilisateurs.${cle}`, valeurs);
  const moi = useAuthStore((etat) => etat.user);
  const [recherche, setRecherche] = useState('');
  const [filtreRole, setFiltreRole] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [ajout, setAjout] = useState(false);
  const [aDesactiver, setADesactiver] = useState(null);
  const [enCours, setEnCours] = useState(null);

  const requete = useApiQuery(['admin-utilisateurs'], '/admin/utilisateurs', { config: { params: { per_page: 200 } } });
  const comptes = useMemo(() => unwrapList(requete.data) ?? [], [requete.data]);

  const roles = useMemo(() => [...new Set(comptes.map((c) => c.role))].sort(), [comptes]);
  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return comptes.filter((c) => {
      if (filtreRole && c.role !== filtreRole) return false;
      if (filtreStatut === 'actif' && !c.active) return false;
      if (filtreStatut === 'inactif' && c.active) return false;
      return !q || `${nomComplet(c)} ${c.email ?? ''} ${c.telephone ?? ''}`.toLowerCase().includes(q);
    });
  }, [comptes, recherche, filtreRole, filtreStatut]);

  const actifs = comptes.filter((c) => c.active).length;
  // Un compte se crée dans une école : le super-administrateur sans école
  // passe par la création d'école.
  const peutCreer = !!moi?.ecole_id;

  const basculer = async (compte) => {
    setEnCours(compte.id);
    try {
      await apiClient.post(`/admin/utilisateurs/${compte.id}/toggle-status`);
      toast.success(u(compte.active ? 'desactive_ok' : 'reactive_ok', { nom: nomComplet(compte) }));
      setADesactiver(null);
      requete.refetch();
    } catch (err) {
      toast.error(err?.message ?? u('echec_action'));
    } finally {
      setEnCours(null);
    }
  };

  return (
    <div className="space-y-6">
      <AjoutDialog open={ajout} onClose={() => setAjout(false)} onDone={() => requete.refetch()} endpoint="/admin/utilisateurs" />
      <ConfirmationDesactivation
        compte={aDesactiver}
        onClose={() => setADesactiver(null)}
        onConfirm={() => basculer(aDesactiver)}
        envoi={enCours !== null}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{u('title')}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{u('subtitle')}</p>
        </div>
        {peutCreer && <Button icon={<Plus size={18} />} onClick={() => setAjout(true)}>{u('ajouter')}</Button>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title={t('common.total')} value={String(comptes.length)} icon={Users} color="primary" />
        <StatsCard title={u('actifs')} value={String(actifs)} icon={CheckCircle} color="emerald" />
        <StatsCard title={u('inactifs')} value={String(comptes.length - actifs)} icon={XCircle} color="red" />
      </div>

      <Card padding>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
            <Input
              className="pl-9"
              aria-label={u('rechercher_un_utilisateur')}
              placeholder={u('rechercher_un_utilisateur')}
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={filtreRole}
              onChange={(e) => setFiltreRole(e.target.value)}
              aria-label={u('filtrer_par_role')}
              className="h-11 rounded-xl border border-[var(--border-heavy)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            >
              <option value="">{u('tous_les_roles')}</option>
              {roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
            </select>
            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
              aria-label={t('common.filter_by_status')}
              className="h-11 rounded-xl border border-[var(--border-heavy)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            >
              <option value="">{t('common.all_statuses')}</option>
              <option value="actif">{u('actif')}</option>
              <option value="inactif">{u('inactif')}</option>
            </select>
          </div>
        </div>
      </Card>

      <Card padding>
        {requete.isPending ? (
          <div className="flex h-32 items-center justify-center" role="status" aria-label={t('common.loading')}>
            <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
          </div>
        ) : requete.isError ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--text-secondary)]">{requete.error?.message ?? t('common.load_error')}</p>
            <Button className="mt-3" variant="outline" onClick={() => requete.refetch()}>{t('common.retry')}</Button>
          </div>
        ) : visibles.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-secondary)]">{u('aucun_utilisateur_trouve')}</p>
        ) : (
          <div className="overflow-x-auto" role="region" aria-label={t('common.tableau_defilant')} tabIndex={0}>
            <table className="w-full text-sm">
              <caption className="sr-only">{u('title')}</caption>
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
                  <th scope="col" className="px-3 py-2 font-medium">{u('utilisateur')}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{u('role')}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{t('common.school')}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{t('common.status_label')}</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((c) => {
                  const nom = nomComplet(c);
                  const soiMeme = c.id === moi?.id;
                  return (
                    <tr key={c.id} className="border-b border-[var(--border-light)]">
                      <td className="px-3 py-2">
                        <span className="block font-medium text-[var(--text-primary)]">{nom}</span>
                        <span className="text-xs text-[var(--text-secondary)]">{c.telephone || c.email || ''}</span>
                      </td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{ROLE_LABELS[c.role] ?? c.role}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{c.ecole?.nom ?? ''}</td>
                      <td className="px-3 py-2">
                        <Badge variant={c.active ? 'success' : 'default'} size="sm">{c.active ? u('actif') : u('inactif')}</Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {!soiMeme && (
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={`${u(c.active ? 'desactiver' : 'reactiver')} ${nom}`}
                            loading={enCours === c.id}
                            onClick={() => (c.active ? setADesactiver(c) : basculer(c))}
                          >
                            {u(c.active ? 'desactiver' : 'reactiver')}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
