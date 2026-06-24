/**
 * LoginForm — Premium authentication form v3
 *
 * R6 improvements:
 * - Per-field validation errors with specific messages
 * - Searchable school selector via Combobox
 * - "Mot de passe oublié" link
 * - Reusable Combobox component (searchable select)
 * - Button component for submit action
 * - Redirect via ROLE_REDIRECT_MAP from route-config (SSOT)
 *
 * Design: gradient bg + centered card + framer-motion animations.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock,
  AlertCircle,
  GraduationCap,
  ArrowRight,
  Sparkles,
  Mail,
  HelpCircle,
} from 'lucide-react';
import useAuthStore from '@/shared/stores/auth-store';
import { ROLE_REDIRECT_MAP, FALLBACK_REDIRECT } from '@/features/roles/route-config';
import { Button, Input, Combobox } from '@/shared/components/ui';
import { FloatingShapes, ParticlesField } from '@/shared/components/three';
import { cn } from '@/shared/lib/utils';

/* ─── Animation variants ─────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/* ─── Mock schools (TODO: remplacer par appel API) ──────────────────── */
const DEFAULT_SCHOOLS = [
  { value: '1', label: "École Primaire des Lutins" },
  { value: '2', label: "École Secondaire de la République" },
  { value: '3', label: "Groupe Scolaire Lumière" },
  { value: '4', label: "Complexe Scolaire Espoir" },
  { value: '5', label: "École Maternelle les Petits Pas" },
  { value: '6', label: "Lycée d'Excellence de Cotonou" },
  { value: '7', label: "Collège Notre-Dame des Victoires" },
  { value: '8', label: "Université d'Abomey-Calavi" },
];

/* ─── Composant principal ────────────────────────────────────────────── */
export default function LoginForm() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [form, setForm] = useState({ email: '', password: '', ecole_id: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState(DEFAULT_SCHOOLS);

  // TODO: Charger la liste des écoles depuis l'API au montage
  useEffect(() => {
    // apiClient.get('/ecoles').then(({ data }) => setSchools(data)).catch(() => {});
  }, []);

  const setField = useCallback(
    (field) => (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
      if (errors._general) setErrors((prev) => ({ ...prev, _general: '' }));
    },
    [errors]
  );

  const validate = useCallback(() => {
    const newErrors = {};
    if (!form.ecole_id) newErrors.ecole_id = 'Veuillez sélectionner une école';
    if (!form.email) {
      newErrors.email = 'Veuillez entrer votre adresse email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Format d'email invalide";
    }
    if (!form.password) {
      newErrors.password = 'Veuillez entrer votre mot de passe';
    }
    return newErrors;
  }, [form]);

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
      const user = await login({
        email: form.email,
        password: form.password,
        ecole_id: form.ecole_id,
      });
      const path = ROLE_REDIRECT_MAP[user.role] || FALLBACK_REDIRECT;
      navigate(path, { replace: true });
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
            err.message ||
            'Erreur de connexion. Veuillez réessayer.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-white dark:bg-neutral-950">
      {/* ─── 3D Background ──────────────────────────────────────────────── */}
      <FloatingShapes count={4} variant="login" />
      <ParticlesField count={60} color="#6366f1" speed={0.2} />

      {/* ─── Overlay gradient ───────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-white/60 to-sky-50/40 dark:from-indigo-950/30 dark:via-neutral-950/50 dark:to-sky-950/20" />

      {/* ─── Section gauche — branding ──────────────────────────────────── */}
      <div className="relative z-10 hidden flex-1 flex-col justify-center px-16 lg:flex">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-200/50 ring-1 ring-white/10 dark:shadow-indigo-900/40">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            École
          </h1>
          <p className="mt-3 text-lg text-neutral-500 dark:text-neutral-400">
            Système de gestion scolaire intelligent
          </p>

          <div className="mt-12 space-y-5">
            {[
              { icon: Sparkles, text: 'Gestion des élèves et des notes' },
              { icon: Sparkles, text: 'Paiements et suivi financier' },
              { icon: Sparkles, text: 'Communication parents-école' },
              { icon: Sparkles, text: 'Emplois du temps et présence' },
            ].map(({ icon: Icon, text }) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                  <Icon className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                </div>
                {text}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── Section droite — formulaire ────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Logo mobile */}
          <motion.div variants={itemVariants} className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-200/50">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">École</h1>
            <p className="mt-1 text-sm text-neutral-500">Connectez-vous à votre espace</p>
          </motion.div>

          {/* Titre */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Connexion
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Accédez à votre tableau de bord
            </p>
          </motion.div>

          {/* General error banner (non-field errors only) */}
          {errors._general && (
            <motion.div
              role="alert"
              aria-live="polite"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errors._general}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {/* School selector (searchable) */}
            <motion.div variants={itemVariants}>
              <Combobox
                label="École"
                placeholder="Sélectionnez une école"
                searchPlaceholder="Rechercher une école..."
                emptyText="Aucune école trouvée"
                options={schools}
                value={form.ecole_id}
                onChange={setField('ecole_id')}
                error={errors.ecole_id}
                required
                name="ecole_id"
              />
            </motion.div>

            {/* Email */}
            <motion.div variants={itemVariants}>
              <Input
                id="login-email"
                type="email"
                label="Email"
                placeholder="vous@exemple.com"
                value={form.email}
                onChange={setField('email')}
                error={errors.email}
                required
                icon={<Mail className="h-4 w-4" />}
                autoComplete="email"
                variant="glass"
                className="h-11"
              />
            </motion.div>

            {/* Password with forgot link */}
            <motion.div variants={itemVariants}>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Mot de passe
                  <span className="ml-0.5 text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/mot-de-passe-oublie')}
                  className="text-xs font-medium text-indigo-500 transition-colors hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <div
                  className={cn(
                    'pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2',
                    errors.password ? 'text-red-400' : 'text-neutral-400'
                  )}
                >
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={setField('password')}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(
                    'h-11 w-full rounded-xl border bg-white/70 px-3.5 pl-10 pr-11 text-sm text-neutral-900 outline-none backdrop-blur-xl transition-all duration-150 placeholder:text-neutral-400',
                    'focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20',
                    'dark:border-white/10 dark:bg-neutral-900/70 dark:text-white dark:placeholder:text-neutral-500',
                    errors.password
                      ? 'border-red-300/70 dark:border-red-700/70'
                      : 'border-neutral-200/70 dark:border-neutral-700/50'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{errors.password}</p>
              )}
            </motion.div>

            {/* Submit button */}
            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                size="lg"
                className="w-full"
              >
                {!loading && (
                  <span className="flex items-center gap-2">
                    Se connecter
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </Button>
            </motion.div>

            {/* Aide text */}
            <motion.p
              variants={itemVariants}
              className="text-center text-xs text-neutral-400 dark:text-neutral-500"
            >
              <HelpCircle className="mr-1 inline h-3 w-3" />
              Besoin d&apos;aide ? Contactez votre administrateur scolaire
            </motion.p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
