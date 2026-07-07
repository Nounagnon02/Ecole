/**
 * FloatingShapes — Formes flottantes décoratives (CSS-only, sans Three.js)
 *
 * Version CSS : gradients animés + blur + transformation 3D CSS.
 * Remplace l'ancienne version React Three Fiber pour réduire de ~800 KB le bundle.
 *
 * Props : count (défaut 3), variant (default | login | landing)
 */

import { useMemo } from 'react';
import { cn } from '@/shared/lib/utils';

/* ─── Palettes de couleurs ──────────────────────────────────────────── */
const PALETTES = {
  default: ['#6366f1', '#8b5cf6', '#06b6d4'],
  login: ['#6366f1', '#a855f7', '#3b82f6'],
  landing: ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b'],
};

/* ─── Génération des keyframes CSS ──────────────────────────────────── */
function blobKeyframes(index) {
  return `@keyframes blob-float-${index} {
    0%, 100% {
      transform: translate(0, 0) scale(1) rotate(0deg);
      border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
    }
    25% {
      transform: translate(${10 + index * 5}px, ${-(15 + index * 3)}px) scale(1.05) rotate(${5 + index * 3}deg);
      border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
    }
    50% {
      transform: translate(${-(5 + index * 4)}px, ${10 + index * 2}px) scale(0.95) rotate(${10 + index * 2}deg);
      border-radius: 30% 60% 70% 40% / 50% 60% 30% 70%;
    }
    75% {
      transform: translate(${-(10 + index * 3)}px, ${-(5 + index * 4)}px) scale(1.02) rotate(${3 + index * 4}deg);
      border-radius: 70% 30% 50% 50% / 30% 70% 50% 60%;
    }
  }`;

  return null;
}

/* ─── Blob individuel ───────────────────────────────────────────────── */
function Blob({ color, index, total }) {
  const size = 180 + (index * 40) % 160; // 180–340 px
  const xPos = ((index / total) * 100 + 10) % 100;
  const yPos = ((index * 37) / total * 100 + 5) % 100;
  const delay = -(index * 2.5);
  const duration = 18 + (index % 5) * 4; // 18–34 s

  return (
    <div
      className="pointer-events-none absolute opacity-20 dark:opacity-15"
      style={{
        width: size,
        height: size,
        left: `${xPos}%`,
        top: `${yPos}%`,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        background: `radial-gradient(circle at 30% 30%, ${color}, transparent)`,
        animation: `blob-float-${index} ${duration}s ease-in-out ${delay}s infinite`,
        filter: 'blur(40px)',
        willChange: 'transform',
      }}
    />
  );
}

/* ─── Composant principal ───────────────────────────────────────────── */
function FloatingShapes({ count = 3, variant = 'default', className }) {
  const colors = PALETTES[variant] || PALETTES.default;
  const blobCount = Math.min(count || 3, colors.length);

  // Génération d'une feuille de style avec les keyframes
  const styleSheet = useMemo(() => {
    const keyframes = Array.from({ length: blobCount }, (_, i) => blobKeyframes(i)).join('\n');
    return keyframes;
  }, [blobCount]);

  return (
    <>
      <style>{styleSheet}</style>
      <div className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)}>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-sky-50/30 dark:from-indigo-950/20 dark:via-transparent dark:to-sky-950/20" />
        {colors.slice(0, blobCount).map((color, i) => (
          <Blob key={i} color={color} index={i} total={blobCount} />
        ))}
      </div>
    </>
  );
}

export { FloatingShapes };
export default FloatingShapes;
