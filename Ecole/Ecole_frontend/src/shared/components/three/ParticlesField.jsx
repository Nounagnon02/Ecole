/**
 * ParticlesField — Champs de particules 3D interactif premium v3 (CSS-only)
 *
 * Version CSS : particules animées via keyframes + réactivité souris via JS.
 * Remplace l'ancienne version React Three Fiber pour réduire de ~800 KB le bundle.
 *
 * Props : count (défaut 60), color, speed
 */

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/utils';

/* ─── Génération des keyframes CSS ──────────────────────────────────── */
function particleKeyframes(index) {
  const x1 = (Math.sin(index * 1.3) * 100) % 100;
  const y1 = (Math.cos(index * 1.7) * 100) % 100;
  const x2 = (Math.sin(index * 2.1 + 2) * 100) % 100;
  const y2 = (Math.cos(index * 2.5 + 1) * 100) % 100;
  const x3 = (Math.sin(index * 3.7 + 4) * 100) % 100;
  const y3 = (Math.cos(index * 3.1 + 3) * 80) % 80;

  return `@keyframes particle-drift-${index} {
    0% {
      transform: translate(0, 0) scale(1);
      opacity: 0;
    }
    10% {
      opacity: ${0.3 + (index % 5) * 0.1};
    }
    25% {
      transform: translate(${x1}px, ${y1}px) scale(${0.8 + (index % 3) * 0.2});
      opacity: ${0.4 + (index % 4) * 0.1};
    }
    50% {
      transform: translate(${x2}px, ${y2}px) scale(${0.6 + (index % 5) * 0.15});
      opacity: ${0.3 + (index % 3) * 0.15};
    }
    75% {
      transform: translate(${x3}px, ${y3}px) scale(${0.9 + (index % 2) * 0.2});
      opacity: ${0.4 + (index % 4) * 0.1};
    }
    100% {
      transform: translate(0, 0) scale(1);
      opacity: 0;
    }
  }`;
}

/* ─── Composant principal ───────────────────────────────────────────── */
function ParticlesField({ count = 60, color = '#6366f1', speed = 0.3, className }) {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  // Génération des keyframes et des positions initiales
  const { keyframes, particles } = useMemo(() => {
    const kfs = Array.from({ length: count }, (_, i) => particleKeyframes(i)).join('\n');
    const pts = Array.from({ length: count }, (_, i) => {
      const size = 2 + (i % 3); // 2–4 px
      const duration = 12 + (i % 8) * 2; // 12–26 s
      const delay = -(i * 0.8);
      return {
        id: i,
        size,
        duration,
        delay,
        initialX: `${(i * 7.3) % 100}%`,
        initialY: `${(i * 13.7) % 100}%`,
      };
    });
    return { keyframes: kfs, particles: pts };
  }, [count]);

  // Mouse tracking
  const handlePointerMove = useCallback((e) => {
    mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [handlePointerMove]);

  // Apply mouse influence via CSS custom properties for subtle parallax
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    function tick() {
      const mx = mouseRef.current.x * 8;
      const my = mouseRef.current.y * 8;
      el.style.setProperty('--mouse-x', `${mx}px`);
      el.style.setProperty('--mouse-y', `${my}px`);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <style>{keyframes}</style>
      <div
        ref={containerRef}
        className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)}
      >
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: p.initialX,
              top: p.initialY,
              backgroundColor: color,
              animation: `particle-drift-${p.id} ${p.duration}s ease-in-out ${p.delay}s infinite`,
              transform: `translate(var(--mouse-x, 0), var(--mouse-y, 0))`,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </div>
    </>
  );
}

export { ParticlesField };
export default ParticlesField;
