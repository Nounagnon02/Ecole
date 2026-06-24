/**
 * animation-variants.js — Variantes Framer Motion partagées premium
 *
 * Centralise tous les presets d'animation pour garantir la cohérence
 * des micro-interactions dans toute l'application.
 */

/* ─── Page transitions ──────────────────────────────────────────────────── */

export const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export const pageTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const fadeSlideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export const fadeSlideDown = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
};

export const fadeSlideLeft = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
};

export const fadeSlideRight = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
};

/* ─── Dropdown / Menu ───────────────────────────────────────────────────── */

export const dropdownVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.96,
    transition: { duration: 0.1, ease: 'easeIn' },
  },
};

/* ─── Modal / Dialog ────────────────────────────────────────────────────── */

export const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 35 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

/* ─── Sidebar / Mobile menu ─────────────────────────────────────────────── */

export const sidebarVariants = {
  open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  closed: { x: '-100%', transition: { duration: 0.2, ease: 'easeInOut' } },
};

export const mobileMenuBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/* ─── Stagger / List ────────────────────────────────────────────────────── */

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export const staggerItemLeft = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/* ─── Scale / Hover ─────────────────────────────────────────────────────── */

export const hoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { type: 'spring', stiffness: 400, damping: 20 },
};

export const hoverLift = {
  whileHover: { y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' },
  whileTap: { y: 0 },
  transition: { type: 'spring', stiffness: 400, damping: 20 },
};

/* ─── Notification / Toast ──────────────────────────────────────────────── */

export const toastVariants = {
  initial: { opacity: 0, y: -12, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -12, scale: 0.95, transition: { duration: 0.15 } },
};

/* ─── Icon rotation ─────────────────────────────────────────────────────── */

export const rotateVariants = {
  initial: { rotate: 0 },
  hover: { rotate: 15, transition: { type: 'spring', stiffness: 300 } },
};

/* ─── Pulse / Attention ─────────────────────────────────────────────────── */

export const pulseOnce = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.1, 1],
    transition: { duration: 0.4, times: [0, 0.5, 1] },
  },
};

/* ─── Skeleton shimmer ──────────────────────────────────────────────────── */

export const shimmerVariants = {
  initial: { backgroundPosition: '200% 0' },
  animate: {
    backgroundPosition: '-200% 0',
    transition: { repeat: Infinity, duration: 1.5, ease: 'linear' },
  },
};
