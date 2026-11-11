import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import Brand from '@/shared/components/ui/Brand';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import LanguageSwitcher from '@/shared/components/layout/LanguageSwitcher';
import apiClient from '@/shared/lib/api-client';
import useAuthStore from '@/shared/stores/auth-store';
import { ROLE_REDIRECT_MAP } from '@/features/roles/route-config';
import { useTranslation } from '@/shared/i18n';

/**
 * Remplacement imposé d'un mot de passe provisoire.
 *
 * Le mot de passe remis à l'inscription est connu de l'agent qui l'a remis.
 * Tant qu'il n'est pas remplacé, l'API ne laisse passer que ce changement :
 * cette page vit donc hors de la coque, comme l'activation de la 2FA, et ne
 * propose que deux issues — choisir son mot de passe, ou se déconnecter.
 */
export default function PasswordChangePage() {
  const { t } = useTranslation();
  const p = (cle) => t(`auth.password_change.${cle}`);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const completePasswordChange = useAuthStore((s) => s.completePasswordChange);
  const logout = useAuthStore((s) => s.logout);
  const [actuel, setActuel] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const [depart, setDepart] = useState(false);
  const home = ROLE_REDIRECT_MAP[user?.role] || '/';

  if (!user?.password_change_required) return <Navigate to={home} replace />;

  const changer = async (evenement) => {
    evenement.preventDefault();
    const e = {};
    if (!actuel) e.actuel = p('actuel_requis');
    if (nouveau.length < 8) e.nouveau = p('trop_court');
    else if (nouveau === actuel) e.nouveau = p('identique');
    if (confirmation !== nouveau) e.confirmation = p('confirmation_differente');
    setErreurs(e);
    if (Object.keys(e).length > 0) return;

    setEnvoi(true);
    try {
      await apiClient.post('/auth/change-password', {
        current_password: actuel, password: nouveau, password_confirmation: confirmation,
      });
      completePasswordChange();
      navigate(home, { replace: true });
    } catch (err) {
      const details = err?.errors ?? err?.response?.data?.errors ?? {};
      setErreurs({
        actuel: details.current_password?.[0],
        nouveau: details.password?.[0],
        general: details.current_password || details.password ? undefined : (err?.message ?? p('echec')),
      });
      setEnvoi(false);
    }
  };

  const signOut = async () => {
    setDepart(true);
    try { await logout(); } finally { navigate('/connexion', { replace: true }); }
  };

  return (
    <div className="ecole-auth">
      <aside className="ecole-auth-intro">
        <Brand />
        <div>
          <h1>{p('intro_title')}</h1>
          <p className="mt-6 text-lg">{p('intro_text')}</p>
        </div>
      </aside>
      <main className="ecole-auth-form">
        <div className="ecole-auth-language"><LanguageSwitcher /></div>
        <section className="ecole-auth-card" aria-labelledby="auth-title">
          <KeyRound className="mb-4 text-[var(--accent)]" size={32} aria-hidden="true" />
          <h2 id="auth-title">{p('title')}</h2>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">{p('subtitle')}</p>
          <form onSubmit={changer} className="space-y-4" noValidate>
            <Input type="password" autoComplete="current-password" label={p('actuel')} value={actuel}
              onChange={(e) => setActuel(e.target.value)} error={erreurs.actuel} required />
            <Input type="password" autoComplete="new-password" label={p('nouveau')} helperText={p('regle')} value={nouveau}
              onChange={(e) => setNouveau(e.target.value)} error={erreurs.nouveau} required />
            <Input type="password" autoComplete="new-password" label={p('confirmation')} value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)} error={erreurs.confirmation} required />
            {erreurs.general && <p role="alert" className="text-sm text-[var(--error)]">{erreurs.general}</p>}
            <Button type="submit" className="w-full" loading={envoi}>{p('submit')}</Button>
          </form>
          <Button variant="ghost" className="mt-4 w-full" onClick={signOut} loading={depart}>{p('logout')}</Button>
        </section>
        <p className="ecole-auth-note">{t('auth.login_form.besoin_d_aide_contactez_votre_administrateur')}</p>
      </main>
    </div>
  );
}
