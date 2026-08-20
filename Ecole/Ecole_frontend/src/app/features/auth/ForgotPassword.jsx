/**
 * ForgotPassword — Page de demande de réinitialisation de mot de passe
 *
 * Design premium cohérent avec LoginForm.
 * Étape 1 : l'utilisateur saisit son email → reçoit un lien.
 */

import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { Button, Input } from '@/shared/components/ui';
import { api } from '@/shared/services/api';
import {
  TopDecorativeBand,
  AcademicSeal,
  DividerOrnament,
  fadeUp,
  container,
} from '@/shared/components/auth/AuthDecorations';

/* ═══════════════════════════════════════════════════════════════════
 *  COMPOSANT PRINCIPAL
 * ═══════════════════════════════════════════════════════════════════ */
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = useCallback((e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
    if (errors._general) setErrors((prev) => ({ ...prev, _general: '' }));
  }, [errors]);

  const validate = useCallback(() => {
    if (!email) return { email: 'Veuillez entrer votre adresse email' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { email: 'Adresse email invalide' };
    }
    return {};
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || sent) return;

    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
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
            'Erreur lors de l\'envoi. Veuillez réessayer.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /* ─── ÉCRAN : Email envoyé avec succès ──────────────────────────── */
  if (sent) {
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
            <div className="border border-[var(--border)] border-t-4 border-t-[var(--accent)] bg-white dark:bg-[var(--surface-raised)] shadow-3 p-10 text-center">
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--green-subtle)] text-[var(--green)]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              </div>

              <h1 className="font-fraunces text-2xl font-semibold text-[var(--text-primary)]">
                Email envoyé
              </h1>
              <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                Si un compte existe avec l'adresse <strong className="text-[var(--text-primary)]">{email}</strong>,
                vous recevrez un email contenant un lien pour réinitialiser votre mot de passe.
              </p>
              <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                Vérifiez votre boîte de réception et vos spams. Le lien expire dans 60 minutes.
              </p>

              <div className="mt-8 flex items-center justify-center gap-2">
                <Link
                  to="/connexion"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la connexion
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ─── ÉCRAN : Formulaire de demande ─────────────────────────────── */
  return (
    <div className="relative min-h-screen bg-[var(--surface)] overflow-hidden">
      <TopDecorativeBand />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(184,86,46,0.03),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(26,58,60,0.04),transparent_50%)] pointer-events-none" />

      <div className="relative z-10 flex min-h-screen">
        {/* ===== COTE GAUCHE — Message ===== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative flex-1 flex-col justify-center items-center px-12 py-10 hidden lg:flex"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <AcademicSeal className="h-32 w-32 text-[var(--primary)] opacity-30 mb-8" />
          </motion.div>

          <motion.blockquote
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-fraunces text-2xl italic leading-relaxed text-center text-[var(--text-secondary)] max-w-md"
          >
            &laquo;&nbsp;Le seul véritable apprentissage<br />vient de l'éducation.&nbsp;&raquo;
          </motion.blockquote>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-4 text-sm text-[var(--text-tertiary)]"
          >
            &mdash; John Dewey
          </motion.p>
        </motion.div>

        {/* ===== COTE DROIT — Formulaire ===== */}
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
                  <Link
                    to="/connexion"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] mb-4 transition-colors hover:text-[var(--accent-hover)]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Retour à la connexion
                  </Link>
                  <h1 className="font-fraunces text-2xl font-semibold text-[var(--text-primary)]">
                    Mot de passe oublié
                  </h1>
                  <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                    Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
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
                      id="forgot-email"
                      type="email"
                      label="Adresse email"
                      placeholder="vous@exemple.com"
                      value={email}
                      onChange={handleChange}
                      error={errors.email}
                      required
                      icon={<Mail className="h-4 w-4" />}
                      autoComplete="email"
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
                          Envoyer le lien
                          <Send className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </div>

              <div className="border-t border-[var(--border-light)] px-10 py-5">
                <p className="text-center text-xs text-[var(--text-tertiary)]">
                  Vous avez déjà un compte ?{' '}
                  <Link
                    to="/connexion"
                    className="font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
                  >
                    Connectez-vous
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
