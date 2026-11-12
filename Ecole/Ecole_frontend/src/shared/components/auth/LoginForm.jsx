import { useState, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Lock, Mail, School, ShieldCheck, ArrowRight, BookOpen, Calendar, MessageSquare } from 'lucide-react';
import useAuthStore from '@/shared/stores/auth-store';
import { ROLE_REDIRECT_MAP, FALLBACK_REDIRECT } from '@/features/roles/route-config';
import { TWO_FACTOR_SETUP_PATH } from './ProtectedRoute';
import { Button, Input } from '@/shared/components/ui';
import Brand from '@/shared/components/ui/Brand';
import { useTranslation } from '@/shared/i18n';
import LanguageSwitcher from '@/shared/components/layout/LanguageSwitcher';

export default function LoginForm() {
  const { t } = useTranslation();
  const [parametres] = useSearchParams();
  const inactivite = parametres.get('raison') === 'inactivite';
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const selectSchool = useAuthStore((s) => s.selectSchool);
  const verifyTwoFactorLogin = useAuthStore((s) => s.verifyTwoFactorLogin);
  const pendingSchools = useAuthStore((s) => s.pendingSchools);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [showTwoFactorChallenge, setShowTwoFactorChallenge] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  const setField = useCallback(
    (field) => (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
      }
      if (errors._general) setErrors((prev) => ({ ...prev, _general: '' }));
    },
    [errors]
  );

  const validate = useCallback(() => {
    const newErrors = {};
    if (!form.email) {
      newErrors.email = t('auth.login_form.veuillez_entrer_votre_identifiant_ou_email');
    }
    if (!form.password) {
      newErrors.password = t('auth.login_form.veuillez_entrer_votre_mot_de_passe');
    }
    return newErrors;
  }, [form, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const result = await login({
        email: form.email,
        password: form.password
      });

      // 2FA activée → afficher l'écran de code AVANT le cas générique
      // ci-dessous : { requiresTwoFactor: true } n'a ni .requiresSchool ni
      // .role, donc la branche "connexion directe" le prendrait par erreur
      // pour un login réussi sans école et tenterait de rediriger dans le vide.
      if (result?.requiresTwoFactor) {
        setShowTwoFactorChallenge(true);
        return;
      }

      // 2FA obligatoire pour ce rôle mais pas encore activée → écran
      // d'activation. Le tableau de bord ne recevrait que des 403.
      if (result?.requiresTwoFactorSetup) {
        navigate(TWO_FACTOR_SETUP_PATH, { replace: true });
        return;
      }

      // Connexion directe (ecole unique) → redirection
      if (result && !result.requiresSchool) {
        const path = ROLE_REDIRECT_MAP[result.role] || FALLBACK_REDIRECT;
        navigate(path, { replace: true });
        return;
      }

      // Plusieurs ecoles → afficher le selecteur
      if (result?.requiresSchool) {
        setShowSchoolPicker(true);
      }
    } catch (err) {
      const serverErrors = err.errors;
      if (serverErrors && typeof serverErrors === 'object') {
        const mapped = {};
        Object.entries(serverErrors).forEach(([field, msgs]) => {
          mapped[field] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setErrors(mapped);
      } else {
        setErrors({
          _general:
            err.message ||
            t('auth.login_form.erreur_de_connexion_veuillez_reessayer')
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolSelect = async (ecoleId) => {
    if (schoolLoading) return;
    setSchoolLoading(true);
    setErrors({});
    try {
      const user = await selectSchool(ecoleId);
      const path = ROLE_REDIRECT_MAP[user.role] || FALLBACK_REDIRECT;
      navigate(path, { replace: true });
    } catch (err) {
      setErrors({
        _general: err.message || t('auth.login_form.erreur_lors_de_la_selection_de_l_ecole')
      });
      setSchoolLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    if (twoFactorLoading || twoFactorCode.length !== 6) return;

    setTwoFactorLoading(true);
    setErrors({});
    try {
      const user = await verifyTwoFactorLogin(twoFactorCode);
      const path = ROLE_REDIRECT_MAP[user.role] || FALLBACK_REDIRECT;
      navigate(path, { replace: true });
    } catch (err) {
      setErrors({
        _general: err.message || t('auth.login_form.code_invalide')
      });
      setTwoFactorCode('');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const changeAccount = () => {
    setShowSchoolPicker(false); setShowTwoFactorChallenge(false); setTwoFactorCode('');
    setErrors({}); useAuthStore.getState().clearSession();
  };
  return (
    <div className="ecole-auth">
      <aside className="ecole-auth-intro">
        <Brand />
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-widest">{t('c.auth_eyebrow')}</p>
          <h1>{t('c.auth_title')}</h1>
          <p className="mt-6 text-lg">{t('c.auth_description')}</p>
        </div>
        <div className="auth-features hidden md:grid grid-cols-3 gap-6 border-t border-white/20 pt-8">
          {[[BookOpen, 'nav.notes'], [Calendar, 'nav.emploi_du_temps'], [MessageSquare, 'nav.messagerie']].map(([Icon, key]) => <div key={key}><Icon size={22} aria-hidden="true" /><p className="mt-3 text-sm">{t(key)}</p></div>)}
        </div>
      </aside>
      <main className="ecole-auth-form">
        <div className="ecole-auth-language"><LanguageSwitcher /></div>
        <section className="ecole-auth-card" aria-labelledby="auth-title">
          {inactivite && <p role="status" className="mb-4 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm text-[var(--text-primary)]">{t('auth.login_form.deconnecte_inactivite')}</p>}
          {showTwoFactorChallenge ? <>
            <ShieldCheck className="mb-4 text-[var(--accent)]" size={32} aria-hidden="true" />
            <h2 id="auth-title">{t('auth.login_form.verification_en_deux_etapes')}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{t('auth.login_form.entrez_le_code_a_6_chiffres_de_votre_application')}</p>
            {errors._general && <p role="alert" className="auth-error">{errors._general}</p>}
            <form onSubmit={handleTwoFactorSubmit} aria-label={t('auth.login_form.verification_en_deux_etapes')}>
              <Input id="two-factor-code" placeholder="000000" label={t('auth.login_form.code_de_verification')} value={twoFactorCode} onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus required />
              <Button type="submit" size="lg" loading={twoFactorLoading} disabled={twoFactorCode.length !== 6}>{t('auth.login_form.verifier')}</Button>
              <Button variant="ghost" onClick={changeAccount}>{t('auth.login_form.changer_d_identifiant')}</Button>
            </form>
          </> : showSchoolPicker && pendingSchools?.length > 0 ? <>
            <School className="mb-4 text-[var(--accent)]" size={32} aria-hidden="true" />
            <h2 id="auth-title">{t('auth.login_form.votre_ecole')}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{t('auth.login_form.choisissez_celui_auquel_acceder')}</p>
            {errors._general && <p role="alert" className="auth-error">{errors._general}</p>}
            <div className="mt-6 space-y-3">{pendingSchools.map(school => <button type="button" key={school.id} onClick={() => handleSchoolSelect(school.id)} disabled={schoolLoading} className="flex min-h-14 w-full items-center gap-3 rounded-md border border-[var(--border-heavy)] p-4 text-start hover:bg-[var(--surface-hover)] disabled:opacity-50"><School size={20} aria-hidden="true" /><span className="flex-1">{school.name || school.label || school.nom}</span><ArrowRight size={18} aria-hidden="true" /></button>)}</div>
            <Button variant="ghost" className="mt-4 w-full" onClick={changeAccount}>{t('auth.login_form.changer_d_identifiant')}</Button>
          </> : <>
            <h2 id="auth-title">{t('auth.login')}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{t('auth.login_form.connectez_vous_a_votre_espace')}</p>
            {errors._general && <p role="alert" className="auth-error">{errors._general}</p>}
            <form onSubmit={handleSubmit} noValidate aria-label={t('auth.login')}>
              <Input id="login-email" type="text" label={t('auth.login_form.email_ou_identifiant')} placeholder={t('auth.login_form.vous_exemple_com_ou_eleve_2024_001')} value={form.email} onChange={setField('email')} error={errors.email} required icon={<Mail size={18} />} autoComplete="username" autoCapitalize="none" spellCheck={false} />
              <Input id="login-password" type="password" label={t('auth.password')} value={form.password} onChange={setField('password')} error={errors.password} required icon={<Lock size={18} />} autoComplete="current-password" />
              <Link to="/forgot-password" className="min-h-11 inline-flex items-center text-sm font-semibold text-[var(--accent)]">{t('auth.forgot_password')}</Link>
              <Button type="submit" loading={loading} size="lg" className="w-full" icon={<ArrowRight size={18} />}>{t('auth.login_form.se_connecter')}</Button>
            </form>
          </>}
        </section>
        <p className="ecole-auth-note">{t('auth.login_form.besoin_d_aide_contactez_votre_administrateur')}</p>
      </main>
    </div>
  );
}
