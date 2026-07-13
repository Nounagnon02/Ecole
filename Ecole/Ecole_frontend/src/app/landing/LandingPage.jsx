/**
 * LandingPage Premium
 *
 * Page d'accueil publique de l'application École.
 * Design : fond clair, animations framer-motion, sections marketing.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  GraduationCap,
  Users,
  BookOpen,
  DollarSign,
  Shield,
  MessageSquare,
  Calendar,
  BarChart3,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Star,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
/* ─── Animation variants ─────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' },
  }),
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

/* ─── Features data ─────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Users,
    title: 'Gestion des élèves',
    desc: 'Suivi complet des inscriptions, dossiers, absences et performances individuelles.',
    color: 'primary',
  },
  {
    icon: BookOpen,
    title: 'Notes & Bulletins',
    desc: 'Saisie intuitive, calcul automatique des moyennes, bulletins PDF personnalisables.',
    color: 'emerald',
  },
  {
    icon: Calendar,
    title: 'Emplois du temps',
    desc: 'Planification visuelle des cours, salles et enseignants avec détection des conflits.',
    color: 'sky',
  },
  {
    icon: DollarSign,
    title: 'Paiements',
    desc: 'Gestion des frais de scolarité, facturation, relances et suivi des impayés.',
    color: 'amber',
  },
  {
    icon: MessageSquare,
    title: 'Communications',
    desc: 'Messagerie intégrée parents-enseignants, notifications et bulletins d\'information.',
    color: 'purple',
  },
  {
    icon: BarChart3,
    title: 'Statistiques',
    desc: 'Tableaux de bord dynamiques, indicateurs de performance et rapports exportables.',
    color: 'rose',
  },
];

/* ─── Stats data ────────────────────────────────────────────────────── */
const STATS = [
  { value: '15+', label: 'Écoles partenaires' },
  { value: '3 200+', label: 'Élèves gérés' },
  { value: '450+', label: 'Enseignants' },
  { value: '98%', label: 'Taux de satisfaction' },
];

/* ─── Testimonials data ─────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'M. Koné',
    role: 'Directeur, Groupe Scolaire A',
    content: 'Un outil qui a révolutionné notre gestion quotidienne. Le suivi des paiements est devenu simple et transparent.',
    rating: 5,
  },
  {
    name: 'Mme Diallo',
    role: 'Enseignante, Lycée B',
    content: 'La saisie des notes et la génération des bulletins me fait gagner des heures chaque fin de trimestre.',
    rating: 5,
  },
  {
    name: 'M. Traoré',
    role: 'Parent d\'élève',
    content: 'Je peux suivre les notes et la présence de mon enfant en temps réel. Une tranquillité d\'esprit incomparable.',
    rating: 5,
  },
];

/* ─── Navigation ────────────────────────────────────────────────────── */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 60], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.85)']);

  return (
    <motion.nav
      style={{ backgroundColor: bgOpacity }}
      className="fixed left-0 right-0 top-0 z-50 border-b border-transparent backdrop-blur-lg transition-colors"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">École</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex" role="navigation" aria-label="Navigation principale">
          <a href="#features" className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
            Fonctionnalités
          </a>
          <a href="#stats" className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
            Chiffres
          </a>
          <a href="#testimonials" className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
            Témoignages
          </a>
          <div className="flex items-center gap-3">
            <Link
              to="/connexion"
              className="rounded-xl border border-neutral-200 bg-white px-5 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Se connecter
            </Link>
            <a
              href="#features"
              className="rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white shadow-2 transition-colors hover:bg-[var(--accent-hover)] "
            >
              Commencer
            </a>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 md:hidden dark:text-neutral-400 dark:hover:bg-neutral-800"
          aria-label={mobileOpen ? 'Fermer le menu' : 'Menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          id="mobile-menu"
          role="region"
          aria-label="Navigation principale"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-neutral-200 bg-white px-6 pb-6 pt-4 md:hidden dark:border-neutral-800 dark:bg-neutral-950"
        >
          <div className="flex flex-col gap-3">
            <a href="#features" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">
              Fonctionnalités
            </a>
            <a href="#stats" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">
              Chiffres
            </a>
            <a href="#testimonials" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">
              Témoignages
            </a>
            <div className="mt-2 flex flex-col gap-2">
              <Link to="/connexion" className="flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                Se connecter
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}

/* ─── Hero Section ──────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] items-center overflow-hidden pt-16">
      {/* 3D Particles background */}


      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[var(--accent-subtle)]/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-sky-50/70 blur-3xl dark:bg-sky-950/20" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-subtle)]/20 blur-3xl" />

      <div className="mx-auto w-full max-w-7xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="relative z-10"
          >
            <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-subtle)] px-4 py-1.5 text-xs font-medium text-[var(--accent)] dark:border-[var(--accent)]/20">
              <span className="flex h-2 w-2 rounded-full bg-[var(--accent)]" />
              Nouvelle version disponible
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl dark:text-neutral-100">
              Gérez votre{' '}
              <span className="bg-[var(--accent)] bg-clip-text text-transparent">
                établissement scolaire
              </span>{' '}
              en toute simplicité
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 text-lg leading-relaxed text-neutral-500 dark:text-neutral-400">
              Une plateforme tout-en-un pour gérer les élèves, les notes, les paiements,
              les communications et bien plus. Conçue pour les écoles, les enseignants et les parents.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#features"
                className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-white shadow-3 transition-all hover:bg-[var(--accent-hover)] active:scale-[0.98] "
              >
                Découvrir la plateforme
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/connexion"
                className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-7 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Connexion
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 flex items-center gap-6 text-sm text-neutral-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Sécurisé</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Multi-rôles</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Cloud</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right — illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="rounded-2xl border border-neutral-200 bg-white p-2 shadow-2xl shadow-neutral-200/50 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-neutral-950/30">
              <div className="rounded-xl bg-[var(--accent-subtle)] p-8">
                {/* Mock dashboard preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    <div className="h-4 w-20 rounded-full bg-[var(--border-light)]" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[60, 40, 50].map((w, i) => (
                      <div key={i} className="h-20 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-800">
                        <div className="h-2 w-12 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                        <div className="mt-2 h-5 w-16 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                      </div>
                    ))}
                  </div>
                  <div className="h-32 rounded-xl bg-neutral-100 p-4 dark:bg-neutral-800">
                    <div className="flex gap-4">
                      <div className="h-6 flex-1 rounded-full bg-[var(--border-light)]" />
                      <div className="h-6 w-16 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                    </div>
                    <div className="mt-3 space-y-2">
                      {[80, 60, 45].map((w, i) => (
                        <div key={i} className="h-3 rounded-full bg-neutral-200 dark:bg-neutral-700" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating badges */}
            <div className="absolute -right-6 -top-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 shadow-lg dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">+32% efficacité</p>
            </div>
            <div className="absolute -bottom-4 -left-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 shadow-lg dark:border-sky-900/50 dark:bg-sky-950/30">
              <p className="text-xs font-medium text-sky-700 dark:text-sky-300">98% satisfaction</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features Section ──────────────────────────────────────────────── */
function FeaturesSection() {
  return (
    <section id="features" className="border-t border-neutral-100 bg-neutral-50 py-24 dark:border-neutral-800 dark:bg-neutral-950/50">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="text-center"
        >
          <motion.div variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-subtle)] px-4 py-1.5 text-xs font-medium text-[var(--accent)] dark:border-[var(--accent)]/20">
            Fonctionnalités
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl font-bold text-neutral-900 sm:text-4xl dark:text-neutral-100">
            Tout ce qu'il vous faut
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-2xl text-neutral-500 dark:text-neutral-400">
            Une suite complète d'outils pour gérer votre établissement de la maternelle au lycée.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={stagger}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              custom={i}
              className="group rounded-2xl border border-[var(--border)] bg-white p-6 transition-all hover:border-[var(--accent)]/30 hover:shadow-3 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-${feature.color}-50 text-${feature.color}-600 dark:bg-${feature.color}-950/30 dark:text-${feature.color}-400`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Stats Section ──────────────────────────────────────────────────── */
function StatsSection() {
  return (
    <section id="stats" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="rounded-2xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900"
            >
              <p className="text-4xl font-bold text-[var(--accent)] dark:text-[var(--accent)]">{stat.value}</p>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Testimonials Section ──────────────────────────────────────────── */
function TestimonialsSection() {
  return (
    <section id="testimonials" className="border-t border-neutral-100 bg-neutral-50 py-24 dark:border-neutral-800 dark:bg-neutral-950/50">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="text-center"
        >
          <motion.div variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-medium text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300">
            Témoignages
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl font-bold text-neutral-900 sm:text-4xl dark:text-neutral-100">
            Ils nous font confiance
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={stagger}
          className="mt-12 grid gap-6 md:grid-cols-3"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="mb-4 flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                "{t.content}"
              </p>
              <div className="mt-6 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t.name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── CTA Section ───────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp} className="text-3xl font-bold text-neutral-900 sm:text-4xl dark:text-neutral-100">
            Prêt à moderniser votre école ?
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-lg text-neutral-500 dark:text-neutral-400">
            Rejoignez les établissements qui nous font confiance et simplifiez votre gestion au quotidien.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/connexion"
              className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-8 py-3 text-sm font-semibold text-white shadow-3 transition-all hover:bg-[var(--accent-hover)] active:scale-[0.98] "
            >
              Commencer maintenant
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Footer ────────────────────────────────────────────────────────── */
function FooterSection() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">École</span>
          </div>
          <p className="text-xs text-neutral-400">
            &copy; {new Date().getFullYear()} École. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Composant principal ────────────────────────────────────────────── */
export default function LandingPage() {
  useEffect(() => {
    document.title = 'École — Gestion scolaire simplifiée';
  }, []);

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Skip to content — visible on focus for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-3 focus:outline-none"
      >
        Aller au contenu principal
      </a>
      <Navbar />
      <main id="main-content">
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
      </main>
      <FooterSection />
    </div>
  );
}
