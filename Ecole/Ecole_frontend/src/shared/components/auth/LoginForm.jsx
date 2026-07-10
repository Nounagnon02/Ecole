/**
 * LoginForm — Connexion Erudit
 *
 * Page de connexion pensee comme un frontispice d'antique traite.
 * Etapes : email + mot de passe → si plusieurs ecoles, selection.
 */

import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  AlertCircle,
  ArrowRight,
  Mail,
  HelpCircle,
  School,
} from 'lucide-react';
import useAuthStore from '@/shared/stores/auth-store';
import { ROLE_REDIRECT_MAP, FALLBACK_REDIRECT } from '@/features/roles/route-config';
import { Button, Input } from '@/shared/components/ui';

/* ─── Animation variants ────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

/* ====================================================================
 *  ILLUSTRATION AU TRAIT — Le cabinet du lettre
 *  ==================================================================== */
function ReadingCabinet({ className }) {
  return (
    <svg className={className} viewBox="0 0 520 380" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" opacity="0.35">
        <rect x="20" y="28" width="60" height="100" rx="1" />
        <rect x="88" y="16" width="60" height="112" rx="1" />
        <rect x="156" y="24" width="60" height="104" rx="1" />
        <rect x="224" y="20" width="60" height="108" rx="1" />
        <rect x="292" y="30" width="60" height="98" rx="1" />
        <rect x="360" y="18" width="60" height="110" rx="1" />
        <rect x="428" y="26" width="60" height="102" rx="1" />
        <line x1="22" y1="58" x2="78" y2="58" />  <line x1="22" y1="88" x2="78" y2="88" />
        <line x1="90" y1="48" x2="146" y2="48" />  <line x1="90" y1="80" x2="146" y2="80" />
        <line x1="90" y1="108" x2="146" y2="108" />
        <line x1="158" y1="56" x2="214" y2="56" />  <line x1="158" y1="86" x2="214" y2="86" />
        <line x1="226" y1="52" x2="284" y2="52" />  <line x1="226" y1="84" x2="284" y2="84" />
        <line x1="294" y1="58" x2="350" y2="58" />
        <line x1="362" y1="48" x2="418" y2="48" />  <line x1="362" y1="78" x2="418" y2="78" />
        <line x1="430" y1="56" x2="486" y2="56" />
        <rect x="26" y="36" width="6" height="20" rx="1" /> <rect x="36" y="32" width="5" height="24" rx="1" />
        <rect x="44" y="34" width="7" height="22" rx="1" /> <rect x="56" y="30" width="5" height="26" rx="1" />
        <rect x="26" y="62" width="8" height="24" rx="1" /> <rect x="38" y="66" width="5" height="20" rx="1" />
        <rect x="48" y="60" width="7" height="26" rx="1" />
        <rect x="94" y="26" width="6" height="20" rx="1" /> <rect x="104" y="22" width="5" height="24" rx="1" />
        <rect x="114" y="28" width="7" height="18" rx="1" /> <rect x="126" y="24" width="6" height="22" rx="1" />
        <rect x="296" y="40" width="6" height="16" rx="1" /> <rect x="306" y="36" width="5" height="20" rx="1" />
        <rect x="316" y="38" width="7" height="18" rx="1" /> <rect x="330" y="34" width="6" height="22" rx="1" />
      </g>
      <path d="M60 280c30-4 140-6 200-6s150 2 200 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M70 280c-4 24-8 48-12 68" stroke="currentColor" strokeWidth="0.7" />
      <path d="M460 280c4 24 8 48 12 68" stroke="currentColor" strokeWidth="0.7" />
      <path d="M58 348c4 0 8-2 12-4l400-4c4 0 6 2 8 4" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M210 260V196l50-24 50 24v64" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M210 196l50 24 50-24" stroke="currentColor" strokeWidth="0.7" />
      <path d="M310 260V196l50-24 50 24v64" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M310 196l50 24 50-24" stroke="currentColor" strokeWidth="0.7" />
      <path d="M224 208v48M242 202v54M260 196v64M324 208v48M342 202v54M360 196v64" stroke="currentColor" strokeWidth="0.4" />
      <path d="M260 196v64" stroke="currentColor" strokeWidth="0.5" />
      <path d="M360 196v64" stroke="currentColor" strokeWidth="0.5" />
      <path d="M214 216h30M214 226h26M214 236h24M214 246h28" stroke="currentColor" strokeWidth="0.35" opacity="0.5" />
      <path d="M314 216h30M314 226h26M314 236h24M314 246h28" stroke="currentColor" strokeWidth="0.35" opacity="0.5" />
      <path d="M440 210c-2 4-3 12-1 20 2 8 4 14 5 18" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M436 216c-4 6-8 16-8 24 0 4 1 6 2 5 2-2 4-8 6-16" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M444 218c3 5 6 14 6 22 0 4-1 6-2 6-1-1-3-8-4-14" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M432 248l-3 16c-1 4 1 6 3 6h16c2 0 4-2 3-6l-3-16" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M428 270c-2 4-3 8-2 10 1 4 4 5 4 5h20s3-1 4-5c1-2 0-6-2-10" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M438 208c-2 2-3 6-1 8 1 1 1 1 0 2-1 1 0 2 1 2 2 0 3-2 2-5 0-2 0-4 1-4 0 0-1-3-3-3z" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
      <ellipse cx="160" cy="268" rx="10" ry="5" stroke="currentColor" strokeWidth="0.7" />
      <path d="M154 266c0-4 3-6 6-6s6 2 6 6" stroke="currentColor" strokeWidth="0.6" />
      <path d="M157 260l-1 4M163 260l1 4" stroke="currentColor" strokeWidth="0.4" />
      <path d="M148 272l-6 12M172 272l6 12" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M148 276c8-6 18-14 22-22" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M168 254c3-4 6-10 8-16" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M148 276c-2 2-6 4-8 6" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M158 260c4-2 8-4 12-4M156 266c4-3 9-4 13-2M154 272c5-3 10-3 14 0" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
      <g opacity="0.25">
        <ellipse cx="444" cy="170" rx="26" ry="28" stroke="currentColor" strokeWidth="0.6" />
        <path d="M420 170c6-4 14-6 22-6s16 2 22 6M420 170c6 4 14 6 22 6s16-2 22-6" stroke="currentColor" strokeWidth="0.5" />
        <path d="M432 148c-2 6-3 14-3 22 0 8 1 16 3 22M456 148c2 6 3 14 3 22 0 8-1 16-3 22" stroke="currentColor" strokeWidth="0.4" />
        <path d="M444 142v56" stroke="currentColor" strokeWidth="0.4" />
        <path d="M444 198c-4 2-8 6-10 12M444 198c4 2 8 6 10 12" stroke="currentColor" strokeWidth="0.5" />
        <path d="M432 212c0 2 4 4 12 4s12-2 12-4" stroke="currentColor" strokeWidth="0.4" />
      </g>
      <g stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.2">
        <path d="M0 10c30 8 60 12 100 8s70-12 100-8 40 16 80 12 60-14 100-10 60 10 90 8l50-4" strokeLinecap="round" />
        <path d="M20 18c20 6 50 10 80 6s60-10 90-6 50 14 80 10 60-12 90-8 50 8 80 6" strokeLinecap="round" />
      </g>
      <g stroke="currentColor" strokeWidth="0.3" opacity="0.15">
        <line x1="100" y1="286" x2="116" y2="296" />  <line x1="120" y1="286" x2="136" y2="296" />
        <line x1="140" y1="284" x2="156" y2="294" />  <line x1="160" y1="284" x2="176" y2="294" />
        <line x1="380" y1="284" x2="396" y2="294" />  <line x1="400" y1="284" x2="416" y2="294" />
        <line x1="420" y1="286" x2="436" y2="296" />  <line x1="440" y1="286" x2="456" y2="296" />
      </g>
      <rect x="6" y="6" width="508" height="368" rx="4" stroke="currentColor" strokeWidth="0.5" strokeDasharray="6 4" />
      <rect x="12" y="12" width="496" height="356" rx="3" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 6" />
    </svg>
  );
}

/* ====================================================================
 *  COIN ENLUMINE
 *  ==================================================================== */
function IlluminatedCorner({ className }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 76c2-6 6-14 12-20s12-10 18-12" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M12 74c3-4 7-10 11-14" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M20 64c4-2 8-4 12-4" stroke="currentColor" strokeWidth="0.4" strokeLinecap="round" />
      <path d="M28 58c-2 2-4 4-5 6M32 56c2 2 3 5 2 8M22 62c-1 3-3 5-6 6" stroke="currentColor" strokeWidth="0.4" strokeLinecap="round" />
      <circle cx="36" cy="52" r="4" stroke="currentColor" strokeWidth="0.4" />
      <path d="M36 48c0-2 1-3 2-3M36 56c0 2 1 3 2 3M32 52c-2 0-3 1-3 2M40 52c2 0 3 1 3 2" stroke="currentColor" strokeWidth="0.3" />
      <path d="M44 48c4-2 8 0 10 4" stroke="currentColor" strokeWidth="0.4" strokeLinecap="round" />
      <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="0.4" />
      <circle cx="14" cy="6" r="1" stroke="currentColor" strokeWidth="0.3" />
      <circle cx="6" cy="14" r="1" stroke="currentColor" strokeWidth="0.3" />
    </svg>
  );
}

/* ====================================================================
 *  CALLIGRAPHIE — Lettre "E"
 *  ==================================================================== */
function CalligraphyE({ className }) {
  return (
    <svg className={className} viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M58 18c-2 4-6 10-12 14s-14 6-18 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M54 20c2 4 4 10 4 16 0 8-4 14-8 18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M44 34c8 0 16 2 22 6" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M46 30c6 4 10 10 12 16" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M48 38c-2 6-4 14-4 22 0 6 2 12 6 16" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M50 42c-2 6-3 12-3 18 0 8 2 14 6 18" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M48 46c-4 4-8 6-14 6M46 58c-4 2-8 4-12 4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M36 16c4-2 10-4 16-4 4 0 8 1 10 2" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M38 78c4-2 8-2 12-2 4 0 8 1 10 2" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M32 28c2 2 4 6 4 10 0 6-2 10-6 12" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" opacity="0.4" />
      <circle cx="54" cy="86" r="2.5" stroke="currentColor" strokeWidth="0.6" />
    </svg>
  );
}

/* ─── Sceau academique ────────────────────────────────────────────── */
function AcademicSeal({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
      <path d="M33 58V37l17-9 17 9v21" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M33 37l17 9 17-9" stroke="currentColor" strokeWidth="0.8" />
      <path d="M50 46v20" stroke="currentColor" strokeWidth="0.8" />
      <path d="M10 32c6-4 14-2 20 4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M12 30l-2 4M16 28l-1 5M20 27l1 5" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M90 32c-6-4-14-2-20 4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M88 30l2 4M84 28l1 5M80 27l-1 5" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M50 30l2 4 4-1-2 4 4 2-3 3 2 4-5-1-2 4-2-4-5 1 2-4-3-3 4-2-2-4 4 1 2-4z" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

/* ─── Ornement decoratif ───────────────────────────────────────────── */
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

/* ─── Bande decorative superieure ──────────────────────────────────── */
function TopDecorativeBand() {
  return (
    <div className="absolute top-0 left-0 right-0 h-1 flex pointer-events-none">
      <div className="flex-1 bg-[var(--primary)]" />
      <div className="w-24 bg-[var(--accent)]" />
      <div className="flex-1 bg-[var(--primary)]" />
    </div>
  );
}

/* ─── Doodles marginaux ────────────────────────────────────────────── */
function MarginDoodles({ className }) {
  return (
    <svg className={className} viewBox="0 0 60 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 110c2-10 4-24 6-40 1-8 2-18 2-26" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M14 80c4-4 8-6 12-6M14 62c-3-2-6-3-10-3" stroke="currentColor" strokeWidth="0.4" strokeLinecap="round" />
      <circle cx="18" cy="44" r="5" stroke="currentColor" strokeWidth="0.5" />
      <path d="M18 39c0-2 1-3 2-3M18 49c0 2 1 3 2 3M13 44c-2 0-3 1-3 2M23 44c2 0 3 1 3 2" stroke="currentColor" strokeWidth="0.3" />
      <ellipse cx="36" cy="38" rx="4" ry="2.5" stroke="currentColor" strokeWidth="0.4" />
      <line x1="36" y1="35.5" x2="36" y2="40.5" stroke="currentColor" strokeWidth="0.3" />
      <path d="M38 36c2-1 4-1 5 0" stroke="currentColor" strokeWidth="0.3" strokeLinecap="round" />
      <path d="M44 60c3-2 6-2 8 0M44 62c3-2 7-2 9 0" stroke="currentColor" strokeWidth="0.4" strokeLinecap="round" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 *  COMPOSANT PRINCIPAL
 * ═══════════════════════════════════════════════════════════════════════ */
export default function LoginForm() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const selectSchool = useAuthStore((s) => s.selectSchool);
  const pendingSchools = useAuthStore((s) => s.pendingSchools);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);

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
      newErrors.email = 'Veuillez entrer votre identifiant ou email';
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
      const result = await login({
        email: form.email,
        password: form.password,
      });

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
            'Erreur de connexion. Veuillez reessayer.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolSelect = async (ecoleId) => {
    setSchoolLoading(true);
    setErrors({});
    try {
      const user = await selectSchool(ecoleId);
      const path = ROLE_REDIRECT_MAP[user.role] || FALLBACK_REDIRECT;
      navigate(path, { replace: true });
    } catch (err) {
      setErrors({
        _general: err.response?.data?.message || 'Erreur lors de la selection de l\'ecole.',
      });
      setSchoolLoading(false);
    }
  };

  /* ─── ECRAN : Selection d'ecole ────────────────────────────────── */
  if (showSchoolPicker && pendingSchools?.length > 0) {
    return (
      <div className="relative min-h-screen bg-[var(--surface)] overflow-hidden">
        <TopDecorativeBand />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(184,86,46,0.03),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(26,58,60,0.04),transparent_50%)] pointer-events-none" />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg"
          >
            <div className="border border-[var(--border)] border-t-4 border-t-[var(--accent)] bg-white dark:bg-[var(--surface-raised)] shadow-3 p-10">
              <div className="flex justify-center -mt-6 mb-6">
                <DividerOrnament className="h-2.5 w-20 text-[var(--accent)] opacity-25" />
              </div>

              <motion.div variants={fadeUp} className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <AcademicSeal className="h-16 w-16 text-[var(--primary)] opacity-40" />
                </div>
                <h2 className="font-fraunces text-2xl font-semibold text-[var(--text-primary)]">
                  Votre ecole
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Vous etes associe a plusieurs etablissements.
                  <br />Choisissez celui auquel acceder.
                </p>
              </motion.div>

              {errors._general && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 flex items-start gap-3 rounded-lg border border-[var(--red-subtle)] bg-red-50/50 px-4 py-3 text-sm text-[var(--red)]"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errors._general}</span>
                </motion.div>
              )}

              <div className="space-y-3">
                {pendingSchools.map((school, idx) => (
                  <motion.button
                    key={school.id || idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx, duration: 0.3 }}
                    onClick={() => handleSchoolSelect(school.id)}
                    disabled={schoolLoading}
                    className="w-full flex items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-left transition-all duration-200 hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] hover:shadow-sm disabled:opacity-50 group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-light)] bg-white text-[var(--accent)] transition-colors group-hover:bg-[var(--accent)] group-hover:text-white">
                      <School className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-fraunces text-base font-medium text-[var(--text-primary)]">
                        {school.name || school.label || school.nom}
                      </p>
                      {school.city && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{school.city}</p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--accent)]" />
                  </motion.button>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-8 text-center text-[11px] text-[var(--text-tertiary)]/50"
              >
                <button
                  onClick={() => {
                    setShowSchoolPicker(false);
                    useAuthStore.getState().clearSession();
                  }}
                  className="underline hover:text-[var(--accent)] transition-colors"
                >
                  Changer d'identifiant
                </button>
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ─── ECRAN : Connexion (email + mot de passe) ──────────────────── */
  return (
    <div className="relative min-h-screen bg-[var(--surface)] overflow-hidden">
      <TopDecorativeBand />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(184,86,46,0.03),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(26,58,60,0.04),transparent_50%)] pointer-events-none" />

      <div className="relative z-10 flex min-h-screen">

        {/* ===== COTE GAUCHE — Frontispice ===== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative flex-1 flex-col justify-between px-12 py-10 hidden lg:flex"
        >
          <div className="absolute top-2 left-2">
            <IlluminatedCorner className="h-20 w-20 text-[var(--accent)] opacity-25" />
          </div>

          <div className="absolute left-1 top-1/3">
            <MarginDoodles className="h-28 w-auto text-[var(--primary)] opacity-15" />
          </div>

          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute right-12 top-16 select-none"
          >
            <svg width="100" height="26" viewBox="0 0 100 26">
              <text x="2" y="10" fontSize="7" fill="var(--text-tertiary)" fontFamily="'Georgia', serif" fontStyle="italic" opacity="0.5">
                <tspan x="2" dy="0">un esprit sain</tspan>
                <tspan x="2" dy="9">dans un corps sain</tspan>
              </text>
            </svg>
          </motion.div>

          <div className="flex items-start gap-8 relative z-10">
            <div className="relative shrink-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: -1.5 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <AcademicSeal className="h-24 w-24 text-[var(--primary)] opacity-50" />
                <div className="absolute inset-0 rounded-full blur-sm opacity-20 bg-[var(--accent)] -z-10 translate-x-1 translate-y-1" />
              </motion.div>
            </div>

            <div className="pt-2">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="text-[10px] font-medium tracking-[0.3em] uppercase text-[var(--text-tertiary)] mb-2"
              >
                Annee scolaire 2025 — 2026
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="relative flex items-center gap-2"
              >
                <CalligraphyE className="h-20 w-auto text-[var(--accent)] opacity-80" />
                <span className="font-fraunces text-5xl font-bold tracking-tight text-[var(--text-primary)] -ml-1">
                  cole
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="font-fraunces text-base italic leading-relaxed text-[var(--text-secondary)] mt-3 max-w-xs"
              >
                Systeme de gestion scolaire
                <br />pense pour l'excellence.
              </motion.p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.9 }}
            className="relative -mx-8 my-4"
          >
            <ReadingCabinet className="w-full h-auto text-[var(--primary)] opacity-35 max-w-xl mx-auto" />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="text-[8px] text-center text-[var(--text-tertiary)] font-fraunces italic -mt-1"
            >
              — Fig. 1 : Le cabinet du lettre —
            </motion.p>
          </motion.div>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--border-light)]" />
              <DividerOrnament className="h-2.5 w-24 text-[var(--accent)] opacity-30 shrink-0" />
              <div className="h-px flex-1 bg-[var(--border-light)]" />
            </div>

            <div className="grid grid-cols-4 gap-6">
              {[
                { num: 'I', label: 'Eleves', sub: 'Gestion des notes' },
                { num: 'II', label: 'Paiements', sub: 'Tresorerie' },
                { num: 'III', label: 'Communication', sub: 'Messagerie' },
                { num: 'IV', label: 'Planning', sub: 'Emploi du temps' },
              ].map(({ num, label, sub }) => (
                <div key={num} className="group cursor-default border-l border-[var(--border-light)] pl-3 transition-all duration-300 hover:border-[var(--accent)] hover:pl-4">
                  <span className="font-fraunces text-[11px] font-semibold tracking-[0.05em] text-[var(--accent)] block">{num}</span>
                  <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5">{label}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="text-[9px] text-[var(--text-tertiary)]/25 font-fraunces italic tracking-[0.03em] text-center mt-4"
          >
            ~ Instruire n'est pas remplir un vase, mais allumer un feu ~
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

              <motion.div variants={fadeUp} className="text-center lg:hidden px-10 pt-6">
                <h1 className="font-fraunces text-3xl font-bold text-[var(--text-primary)]">Ecole</h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Connectez-vous a votre espace</p>
              </motion.div>

              <div className="px-10 pt-8 pb-6">
                <motion.div variants={fadeUp}>
                  <h2 className="font-fraunces text-2xl font-semibold text-[var(--text-primary)]">
                    Connexion
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Accedez a votre tableau de bord
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

                <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate aria-label="Connexion">
                  <motion.div variants={fadeUp}>
                    <Input
                      id="login-email"
                      type="text"
                      label="Email ou identifiant"
                      placeholder="vous@exemple.com ou ELEVE-2024-001"
                      value={form.email}
                      onChange={setField('email')}
                      error={errors.email}
                      required
                      icon={<Mail className="h-4 w-4" />}
                      autoComplete="username"
                    />
                  </motion.div>

                  <motion.div variants={fadeUp}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="login-password" className="text-sm font-medium text-[var(--text-primary)]">
                        Mot de passe
                        <span className="ml-0.5 text-[var(--red)]">*</span>
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-xs font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
                      >
                        Mot de passe oublie ?
                      </Link>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="********"
                      value={form.password}
                      onChange={setField('password')}
                      error={errors.password}
                      required
                      icon={<Lock className="h-4 w-4" />}
                      autoComplete="current-password"
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
                          Se connecter
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </motion.div>

                  <motion.p
                    variants={fadeUp}
                    className="text-center text-xs text-[var(--text-tertiary)]"
                  >
                    <HelpCircle className="mr-1 inline h-3 w-3" />
                    Besoin d'aide ? Contactez votre administrateur
                  </motion.p>
                </form>
              </div>

              <div className="border-t border-[var(--border-light)] px-10 py-5">
                <motion.blockquote
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="font-fraunces text-xs italic leading-relaxed text-center text-[var(--text-tertiary)]"
                >
                  &laquo;&nbsp;Chaque enfant qu'on instruit<br />est un homme qu'on gagne.&nbsp;&raquo;
                </motion.blockquote>
                <p className="mt-1 text-[10px] text-center text-[var(--text-tertiary)]/50">&mdash; Victor Hugo</p>
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-6 text-center text-[11px] text-[var(--text-tertiary)]/40"
            >
              &copy; {new Date().getFullYear()} Ecole. Tous droits reserves.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
