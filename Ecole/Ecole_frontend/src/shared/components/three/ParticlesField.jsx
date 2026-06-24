/**
 * ParticlesField — Champs de particules 3D interactif premium v3
 *
 * Réagit au mouvement de la souris.
 * Utilisable comme fond de section hero ou page de connexion.
 *
 * Props : count (défaut 80), color, speed
 */

import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { cn } from '@/shared/lib/utils';

/* ─── Points individuels ────────────────────────────────────────────── */
function Particles({ count = 80, color = '#6366f1', speed = 0.3 }) {
  const pointsRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  const handlePointerMove = useCallback((e) => {
    mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, []);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      vel[i * 3] = (Math.random() - 0.5) * 0.005;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
    }
    return { positions: pos, velocities: vel };
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const positionsAttr = pointsRef.current.geometry.attributes.position;
    const array = positionsAttr.array;

    for (let i = 0; i < count; i++) {
      array[i * 3] += Math.sin(t * speed + i) * 0.0005 + velocities[i * 3];
      array[i * 3 + 1] += Math.cos(t * speed * 0.7 + i) * 0.0005 + velocities[i * 3 + 1];
      array[i * 3 + 2] += Math.sin(t * speed * 0.5 + i * 0.5) * 0.0003 + velocities[i * 3 + 2];

      // Mouse influence
      array[i * 3] += mouse.current.x * 0.0003;
      array[i * 3 + 1] += mouse.current.y * 0.0003;

      // Keep in bounds
      if (Math.abs(array[i * 3]) > 5) velocities[i * 3] *= -1;
      if (Math.abs(array[i * 3 + 1]) > 4) velocities[i * 3 + 1] *= -1;
      if (Math.abs(array[i * 3 + 2]) > 3) velocities[i * 3 + 2] *= -1;
    }

    positionsAttr.needsUpdate = true;
  });

  useThree(({ gl }) => {
    gl.domElement.addEventListener('pointermove', handlePointerMove);
    return () => gl.domElement.removeEventListener('pointermove', handlePointerMove);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={2}
        depthWrite={false}
      />
    </points>
  );
}

/* ─── Conteneur Canvas ───────────────────────────────────────────────── */
function ParticlesField({ count = 80, color, speed, className }) {
  return (
    <div className={cn('pointer-events-none fixed inset-0 -z-10', className)}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
      >
        <Particles count={count} color={color} speed={speed} />
      </Canvas>
    </div>
  );
}

export { ParticlesField };
export default ParticlesField;
