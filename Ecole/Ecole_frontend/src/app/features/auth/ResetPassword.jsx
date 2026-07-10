/**
 * ResetPassword — Page de réinitialisation de mot de passe
 *
 * Étape 2 : l'utilisateur clique sur le lien reçu par email
 * et définit un nouveau mot de passe.
 *
 * Query params : ?token=xxx&email=xxx
 */

import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { Button, Input } from '@/shared/components/ui';
import { api } from '@/shared/services/api';

/* ─── Composants décoratifs ──────────────────────────────────────── */
function TopDecorativeBand() {
  return (
    <div className="absolute top-0 left-0 right-0 h-1 flex pointer-events-none">
      <div className="flex-1 bg-[var(--primary)]" />
      <div className="w-24 bg-[var(--accent)]" />
      <div className="flex-1 bg-[var(--primary)]" />
    </div>
  );
}

function DividerOrnament({ className }) {
  return (
    <svg className={className} viewBox="0 0 120 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 8h40" stroke="currentColor" strokeWidth="0.5" />
      <path d="M80 8h40" stroke="currentColor" strokeWidth="0.5" />
      <path d="M48 8c0-4 4-8 12-8s12 4 12 8-4 8-12 8-12-4-12-8z" stroke="currentColor" strokeWidth="0.5" />
      <path d="M54 8c0-3 2.5-5 6-5s6 2 6 5-2.5 5-6 5-6-2-6-5z" stroke="currentColor" strokeWidth="0.5" />
      <path d="M57 8c0-1.5 1.5-3 3-3s3 1.5 3 3-1.5 3-3 3-3-1.5-3-3z" stroke="currentColor" strokeWidth="0.5" fill="currentColor" />
    </svg>
  );
}

/* ─── Variants d'animation ───────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

/* ═══════════════════════════════════════════════════════════════════
 *  COMPOSANT PRINCIPAL
 * ═══════════════════════════════════════════════════════════════════ */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [form, setForm] = useState({
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    if (!form.password) {
      newErrors.password = 'Veuillez entrer un mot de passe';
    } else if (form.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (form.password !== form.password_confirmation) {
      newErrors.password_confirmation = 'Les mots de passe ne correspondent pas';
    }
    return newErrors;
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || success) return;

    // Vérifier que token et email sont présents
    if (!token || !email) {
      setErrors({ _general: 'Lien de réinitialisation invalide ou incomplet.' });
      return;
    }

    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        email,
        token,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });
      setSuccess(true);
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors && typeof serverErrors === 'object') {
        const mapped = {};
        Object.entries(serverErrors).forEach(([field, msgs]) => {
          mapped[field] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setErrors(mapped);
      } else {
        setErrors({
          _general:
            err.response?.data?.message ||
            'Erreur lors de la réinitialisation. Veuillez réessayer.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /* ─── Lien invalide (pas de token ou email dans l'URL) ─────────── */
  if (!token || !email) {
    return (
      <div className="relative min-h-screen bg-[var(--surface)] overflow-hidden">
        <TopDecorativeBand />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(184,86,46,0.03),transparent_60%)] pointer-events-none" />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="border border-[var(--border)] border-t-4 border-t-[var(--red)] bg-white dark:bg-[var(--surface-raised)] shadow-3 p-10 text-center">
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--red-subtle)] text-[var(--red)]">
                  <AlertCircle className="h-8 w-8" />
                </div>
              </div>
              <h1 className="font-fraunces text-2xl font-semibold text-[var(--text-primary)]">
                Lien invalide
              </h1>
              <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                Le lien de réinitialisation est invalide ou a expiré.
                Veuillez refaire une demande.
              </p>
              <div className="mt-8">
                <Link
                  to="/forgot-password"
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Nouvelle demande
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ─── Succès ───────────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="relative min-h-screen bg-[var(--surface)] overflow-hidden">
        <TopDecorativeBand />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(184,86,46,0.03),transparent_60%)] pointer-events-none" />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="border border-[var(--border)] border-t-4 border-t-[var(--green)] bg-white dark:bg-[var(--surface-raised)] shadow-3 p-10 text-center">
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--green-subtle)] text-[var(--green)]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              </div>
              <h1 className="font-fraunces text-2xl font-semibold text-[var(--text-primary)]">
                Mot de passe réinitialisé
              </h1>
              <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                Votre mot de passe a été modifié avec succès.
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
              <div className="mt-8">
                <button
                  onClick={() => navigate('/connexion', { replace: true })}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
                >
                  Se connecter
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ─── Formulaire de réinitialisation ───────────────────────────── */
  return (
    <div className="relative min-h-screen bg-[var(--surface)] overflow-hidden">
      <TopDecorativeBand />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(184,86,46,0.03),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(26,58,60,0.04),transparent_50%)] pointer-events-none" />

      <div className="relative z-10 flex min-h-screen">
        {/* ===== COTE GAUCHE ===== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative flex-1 flex-col justify-center items-center px-12 py-10 hidden lg:flex"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex h-24 w-24 items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--surface)]"
          >
            <KeyRound className="h-10 w-10 text-[var(--accent)] opacity-60" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="font-fraunces text-2xl font-semibold text-[var(--text-primary)] mt-6"
          >
            Nouveau mot de passe
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-sm text-[var(--text-secondary)] mt-2 text-center max-w-xs"
          >
            Choisissez un mot de passe sécurisé d'au moins 6 caractères.
          </motion.p>
        </motion.div>

        {/* ===== COTE DROIT ===== */}
        <div className="flex-1 flex items-center justify-center px-6 py-14 relative">
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="relative w-full max-w-sm"
          >
            <div className="relative border border-[var(--border)] border-t-4 border-t-[var(--primary)] bg-white dark:bg-[var(--surface-raised)] shadow-3">
              <div className="flex justify-center -mt-3 mb-6">
                <DividerOrnament className="h-2.5 w-20 text-[var(--primary)] opacity-25" />
              </div>

              <div className="px-10 pt-4 pb-6">
                <motion.div variants={fadeUp}>
                  <h1 className="font-fraunces text-2xl font-semibold text-[var(--text-primary)]">
                    Réinitialiser
                  </h1>
                  <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                    Pour <strong className="text-[var(--text-primary)]">{email}</strong>
                  </p>
                </motion.div>

                {errors._general && (
                  <motion.div
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 flex items-start gap-3 rounded-lg border border-[var(--red-subtle)] bg-red-50/50 px-4 py-3 text-sm text-[var(--red)]"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errors._general}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                  <motion.div variants={fadeUp}>
                    <Input
                      id="reset-password"
                      type="password"
                      label="Nouveau mot de passe"
                      placeholder="Au moins 6 caractères"
                      value={form.password}
                      onChange={setField('password')}
                      error={errors.password}
                      required
                      icon={<Lock className="h-4 w-4" />}
                      autoComplete="new-password"
                    />
                  </motion.div>

                  <motion.div variants={fadeUp}>
                    <Input
                      id="reset-password-confirm"
                      type="password"
                      label="Confirmer le mot de passe"
                      placeholder="Répétez le mot de passe"
                      value={form.password_confirmation}
                      onChange={setField('password_confirmation')}
                      error={errors.password_confirmation}
                      required
                      icon={<Lock className="h-4 w-4" />}
                      autoComplete="new-password"
                    />
                  </motion.div>

                  <motion.div variants={fadeUp} className="pt-1">
                    <Button
                      type="submit"
                      disabled={loading}
                      loading={loading}
                      size="lg"
                      className="w-full"
                    >
                      {!loading && (
                        <span className="flex items-center gap-2">
                          Réinitialiser
                          <ArrowLeft className="h-4 w-4 rotate-180" />
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </div>

              <div className="border-t border-[var(--border-light)] px-10 py-5">
                <p className="text-center text-xs text-[var(--text-tertiary)]">
                  <Link
                    to="/connexion"
                    className="font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
                  >
                    Retour à la connexion
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
