/**
 * FloatingShapes — Formes 3D flottantes décoratives premium v3
 *
 * Utilise React Three Fiber + Drei pour des formes animées en arrière-plan.
 * Léger : ne charge pas de textures, uniquement des géométries basiques.
 *
 * Props : count (défaut 3), variant (default | login | landing)
 */

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import { cn } from '@/shared/lib/utils';

/* ─── Pièce flottante individuelle ──────────────────────────────────── */
function FloatingShape({ geometry, color, position, rotation, scale, speed, distort }) {
  const meshRef = useRef(null);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.x = rotation[0] + Math.sin(t * speed * 0.3 + offset) * 0.1;
    meshRef.current.rotation.y = rotation[1] + Math.cos(t * speed * 0.5 + offset) * 0.1;
    meshRef.current.rotation.z = rotation[2] + Math.sin(t * speed * 0.4 + offset) * 0.1;
  });

  return (
    <Float speed={speed} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale} rotation={rotation}>
        {geometry}
        <MeshDistortMaterial
          color={color}
          opacity={0.15}
          transparent
          distort={distort || 0.1}
          speed={speed * 0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

/* ─── Groupe de formes ───────────────────────────────────────────────── */
function ShapesGroup({ colors, count = 3 }) {
  const shapes = useMemo(() => {
    const primitives = [
      <icosahedronGeometry args={[1, 0]} />,
      <octahedronGeometry args={[0.8, 0]} />,
      <dodecahedronGeometry args={[0.9, 0]} />,
      <torusKnotGeometry args={[0.6, 0.2, 64, 8]} />,
      <torusGeometry args={[0.7, 0.25, 16, 32]} />,
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      geometry: primitives[i % primitives.length],
      color: colors[i % colors.length],
      position: [
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4 - 2,
      ],
      rotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      ],
      scale: 0.4 + Math.random() * 0.6,
      speed: 0.2 + Math.random() * 0.4,
      distort: 0.1 + Math.random() * 0.2,
    }));
  }, [count, colors]);

  return shapes.map((s) => (
    <FloatingShape
      key={s.id}
      geometry={s.geometry}
      color={s.color}
      position={s.position}
      rotation={s.rotation}
      scale={s.scale}
      speed={s.speed}
      distort={s.distort}
    />
  ));
}

/* ─── Conteneur Canvas ───────────────────────────────────────────────── */
function FloatingShapes({ count = 3, variant = 'default', className }) {
  const palettes = {
    default: ['#6366f1', '#8b5cf6', '#06b6d4'],
    login: ['#6366f1', '#a855f7', '#3b82f6'],
    landing: ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b'],
  };

  const colors = palettes[variant] || palettes.default;

  return (
    <div className={cn('pointer-events-none fixed inset-0 -z-10', className)}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} />
        <ShapesGroup colors={colors} count={count} />
      </Canvas>
    </div>
  );
}

export { FloatingShapes };
export default FloatingShapes;
