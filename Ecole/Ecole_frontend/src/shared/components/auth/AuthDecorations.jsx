/**
 * AuthDecorations — Composants décoratifs partagés pour les pages d'authentication.
 *
 * Extrais de ForgotPassword.jsx / ResetPassword.jsx pour éliminer la
 * duplication (DRY). Utilise par toutes les pages auth qui ont besoin
 * du bandeau superior et de l'ornement de separation.
 */

/* ─── Bandeau decoratif superior ──────────────────────────────────── */
export function TopDecorativeBand() {
  return (
    <div className="absolute top-0 left-0 right-0 h-1 flex pointer-events-none">
      <div className="flex-1 bg-[var(--primary)]" />
      <div className="w-24 bg-[var(--accent)]" />
      <div className="flex-1 bg-[var(--primary)]" />
    </div>
  );
}

/* ─── Sceau academique ───────────────────────────────────────────── */
export function AcademicSeal({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
      <path d="M33 58V37l17-9 17 9v21" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M33 37l17 9 17-9" stroke="currentColor" strokeWidth="0.8" />
      <path d="M50 46v20" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

/* ─── Ornement de separation ──────────────────────────────────────── */
export function DividerOrnament({ className }) {
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

/* ─── Variants d'animation ────────────────────────────────────────── */
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
