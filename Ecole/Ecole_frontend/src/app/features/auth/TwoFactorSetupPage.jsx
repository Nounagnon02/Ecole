import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldCheck, Smartphone, ScanLine, KeyRound } from 'lucide-react';
import Brand from '@/shared/components/ui/Brand';
import Button from '@/shared/components/ui/Button';
import TwoFactorSetupForm from '@/shared/components/auth/TwoFactorSetupForm';
import LanguageSwitcher from '@/shared/components/layout/LanguageSwitcher';
import useAuthStore from '@/shared/stores/auth-store';
import { ROLE_LABELS } from '@/shared/types/roles';
import { ROLE_REDIRECT_MAP } from '@/features/roles/route-config';
import { useTranslation } from '@/shared/i18n';

/**
 * Activation imposée de la 2FA (directeur, comptable, admin…).
 *
 * Tant qu'elle n'est pas faite, l'API refuse tout sauf l'enrôlement : cette
 * page vit donc hors de la coque (pas d'en-tête, pas de notifications) et ne
 * propose que deux issues — activer, ou se déconnecter.
 */
export default function TwoFactorSetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const required = useAuthStore((s) => s.twoFactorSetupRequired);
  const logout = useAuthStore((s) => s.logout);
  const [leaving, setLeaving] = useState(false);
  const home = ROLE_REDIRECT_MAP[user?.role] || '/';

  // Déjà activée (lien suivi après coup) : rien à faire ici.
  if (!required && user?.two_factor_enabled) return <Navigate to={home} replace />;

  const signOut = async () => {
    setLeaving(true);
    try { await logout(); } finally { navigate('/connexion', { replace: true }); }
  };

  const steps = [
    [Smartphone, 'auth.two_factor_setup.step_install'],
    [ScanLine, 'auth.two_factor_setup.step_scan'],
    [KeyRound, 'auth.two_factor_setup.step_code'],
  ];

  return (
    <div className="ecole-auth">
      <aside className="ecole-auth-intro">
        <Brand />
        <div>
          <h1>{t('auth.two_factor_setup.intro_title')}</h1>
          <p className="mt-6 text-lg">
            {t('auth.two_factor_setup.intro_text', { role: ROLE_LABELS[user?.role] || user?.role || '' })}
          </p>
        </div>
        <ol className="auth-features grid gap-4 border-t border-white/20 pt-8">
          {steps.map(([Icon, key], i) => (
            <li key={key} className="flex items-start gap-3">
              <Icon size={22} aria-hidden="true" className="mt-0.5 shrink-0" />
              <p className="text-sm"><span className="font-semibold">{i + 1}. </span>{t(key)}</p>
            </li>
          ))}
        </ol>
      </aside>
      <main className="ecole-auth-form">
        <div className="ecole-auth-language"><LanguageSwitcher /></div>
        <section className="ecole-auth-card" aria-labelledby="auth-title">
          <ShieldCheck className="mb-4 text-[var(--accent)]" size={32} aria-hidden="true" />
          <h2 id="auth-title">{t('auth.two_factor_setup.title')}</h2>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">{t('auth.two_factor_setup.subtitle')}</p>
          <TwoFactorSetupForm onActivated={() => navigate(home, { replace: true })} />
          <Button variant="ghost" className="mt-4 w-full" onClick={signOut} loading={leaving}>
            {t('auth.two_factor_setup.logout')}
          </Button>
        </section>
        <p className="ecole-auth-note">{t('auth.login_form.besoin_d_aide_contactez_votre_administrateur')}</p>
      </main>
    </div>
  );
}
