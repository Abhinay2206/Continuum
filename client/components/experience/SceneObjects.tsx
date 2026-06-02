'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { smoothstep } from '@/components/lib/math';

// Smooth visibility 0→1→0 over a scroll range
function useVis(scroll: number, start: number, end: number, fade = 0.035) {
  const fadeIn  = smoothstep(Math.min((scroll - start) / fade, 1));
  const fadeOut = smoothstep(Math.min((end   - scroll) / fade, 1));
  return Math.min(fadeIn, fadeOut);
}

// ── Scene 1: Chaos shards — scattered tumbling icosahedra (red) ────────
function ChaosShards({ scroll }: { scroll: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const vis = useVis(scroll, 0.08, 0.20);

  const shards = useMemo(() => Array.from({ length: 12 }, () => ({
    pos: [
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 5,
      -1 + (Math.random() - 0.5) * 4,
    ] as [number, number, number],
    rot: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2] as [number, number, number],
    rx: (Math.random() - 0.5) * 0.018,
    ry: (Math.random() - 0.5) * 0.024,
    scale: 0.12 + Math.random() * 0.22,
  })), []);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.visible = vis > 0.01;
    groupRef.current.scale.setScalar(vis);
    groupRef.current.children.forEach((child, i) => {
      child.rotation.x += shards[i].rx;
      child.rotation.y += shards[i].ry;
    });
  });

  return (
    <group ref={groupRef}>
      {shards.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={s.rot} scale={s.scale}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#FF3A3A" emissive="#FF1A1A" emissiveIntensity={1.0} wireframe />
        </mesh>
      ))}
    </group>
  );
}

// ── Scene 2: Crystal octahedron — awakening form (cyan) ────────────────
function CrystalOctahedron({ scroll }: { scroll: number }) {
  const outerRef = useRef<THREE.Mesh>(null!);
  const innerRef = useRef<THREE.Mesh>(null!);
  const vis = useVis(scroll, 0.20, 0.32);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    outerRef.current.visible = innerRef.current.visible = vis > 0.01;
    outerRef.current.rotation.y = t * 0.4;
    outerRef.current.rotation.x = Math.sin(t * 0.25) * 0.25;
    outerRef.current.scale.setScalar(vis * 1.8);
    innerRef.current.rotation.y = -t * 0.65;
    innerRef.current.rotation.z = t * 0.18;
    innerRef.current.scale.setScalar(vis * 1.0);
  });

  return (
    <>
      <mesh ref={outerRef} position={[1.5, 0.4, -10]}>
        <octahedronGeometry args={[1.4, 0]} />
        <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={0.6} wireframe />
      </mesh>
      <mesh ref={innerRef} position={[1.5, 0.4, -10]}>
        <octahedronGeometry args={[0.85, 1]} />
        <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={0.25} transparent opacity={0.35} />
      </mesh>
    </>
  );
}

// ── Scene 3: Torus knot — dependency graph (emerald) ───────────────────
function DependencyKnot({ scroll }: { scroll: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  const vis = useVis(scroll, 0.32, 0.44);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ref.current.visible = vis > 0.01;
    ref.current.rotation.y = t * 0.22;
    ref.current.rotation.z = t * 0.14;
    ref.current.scale.setScalar(vis * 1.3);
  });

  return (
    <Float floatIntensity={0.4} rotationIntensity={0.1} speed={1.5}>
      <mesh ref={ref} position={[-2.5, 0.5, -20]}>
        <torusKnotGeometry args={[1.0, 0.22, 120, 16, 2, 3]} />
        <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.45} wireframe />
      </mesh>
    </Float>
  );
}

// ── Scene 4: Orbiting agent orbs — 8 agents in formation (green) ───────
function AgentOrbs({ scroll }: { scroll: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const coreRef  = useRef<THREE.Mesh>(null!);
  const vis = useVis(scroll, 0.44, 0.56);
  const COUNT = 8;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    groupRef.current.visible = coreRef.current.visible = vis > 0.01;
    groupRef.current.scale.setScalar(vis);
    coreRef.current.scale.setScalar(vis * 0.35);

    groupRef.current.children.forEach((child, i) => {
      const angle  = (i / COUNT) * Math.PI * 2 + t * (0.28 + i * 0.03);
      const radius = 2.0 + Math.sin(t * 0.4 + i * 0.7) * 0.25;
      child.position.x = Math.cos(angle) * radius;
      child.position.y = Math.sin(t * 0.18 + i) * 0.55;
      child.position.z = Math.sin(angle) * radius;
    });
    coreRef.current.rotation.y = t * 0.5;
  });

  return (
    <>
      <group ref={groupRef} position={[0.5, 0, -32]}>
        {Array.from({ length: COUNT }, (_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.16, 16, 12]} />
            <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={1.4} />
          </mesh>
        ))}
      </group>
      {/* pulsing core */}
      <mesh ref={coreRef} position={[0.5, 0, -32]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.3} transparent opacity={0.25} wireframe />
      </mesh>
    </>
  );
}

// ── Scene 5: Knowledge graph — point cloud lattice (violet) ────────────
function KnowledgeGraph({ scroll }: { scroll: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const vis = useVis(scroll, 0.56, 0.68);

  const { positions, colors } = useMemo(() => {
    const count = 32;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c1 = new THREE.Color('#8866FF');
    const c2 = new THREE.Color('#aa88ff');
    for (let i = 0; i < count; i++) {
      // distribute on a sphere
      const phi   = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 1.6 + Math.random() * 0.8;
      pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const mix = Math.random();
      col[i * 3 + 0] = c1.r + (c2.r - c1.r) * mix;
      col[i * 3 + 1] = c1.g + (c2.g - c1.g) * mix;
      col[i * 3 + 2] = c1.b + (c2.b - c1.b) * mix;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    groupRef.current.visible = vis > 0.01;
    groupRef.current.rotation.y = t * 0.14;
    groupRef.current.rotation.x = t * 0.07;
    groupRef.current.scale.setScalar(vis);
  });

  return (
    <group ref={groupRef} position={[-1, 0.5, -44]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[colors,    3]} />
        </bufferGeometry>
        <pointsMaterial size={0.1} vertexColors sizeAttenuation transparent opacity={0.9} />
      </points>
      {/* central icosahedron */}
      <mesh>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial color="#8866FF" emissive="#8866FF" emissiveIntensity={0.5} wireframe />
      </mesh>
    </group>
  );
}

// ── Scene 6: Automation rings — concentric toruses (purple) ───────────
function AutomationRings({ scroll }: { scroll: number }) {
  const r1 = useRef<THREE.Mesh>(null!);
  const r2 = useRef<THREE.Mesh>(null!);
  const r3 = useRef<THREE.Mesh>(null!);
  const vis = useVis(scroll, 0.68, 0.80);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const v = vis > 0.01;
    r1.current.visible = r2.current.visible = r3.current.visible = v;
    r1.current.rotation.x = t * 0.28;
    r1.current.rotation.z = t * 0.17;
    r2.current.rotation.x = -t * 0.35;
    r2.current.rotation.y = t * 0.45;
    r3.current.rotation.z = t * 0.22;
    r3.current.rotation.x = t * 0.12;
    r1.current.scale.setScalar(vis * 1.9);
    r2.current.scale.setScalar(vis * 1.4);
    r3.current.scale.setScalar(vis * 1.1);
  });

  return (
    <>
      <mesh ref={r1} position={[2.5, -0.5, -55]}>
        <torusGeometry args={[1.2, 0.07, 16, 90]} />
        <meshStandardMaterial color="#8866FF" emissive="#8866FF" emissiveIntensity={0.8} />
      </mesh>
      <mesh ref={r2} position={[2.5, -0.5, -55]}>
        <torusGeometry args={[0.82, 0.05, 16, 70]} />
        <meshStandardMaterial color="#bb99ff" emissive="#bb99ff" emissiveIntensity={0.55} />
      </mesh>
      <mesh ref={r3} position={[2.5, -0.5, -55]}>
        <torusGeometry args={[1.55, 0.03, 16, 100]} />
        <meshStandardMaterial color="#6644cc" emissive="#6644cc" emissiveIntensity={0.4} />
      </mesh>
    </>
  );
}

// ── Scene 7: Order sphere — clean gridded orb (cyan) ───────────────────
function OrderSphere({ scroll }: { scroll: number }) {
  const outerRef = useRef<THREE.Mesh>(null!);
  const innerRef = useRef<THREE.Mesh>(null!);
  const ringRef  = useRef<THREE.Mesh>(null!);
  const vis = useVis(scroll, 0.80, 0.90);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const v = vis > 0.01;
    outerRef.current.visible = innerRef.current.visible = ringRef.current.visible = v;
    outerRef.current.rotation.y = t * 0.12;
    outerRef.current.rotation.x = t * 0.07;
    innerRef.current.rotation.y = -t * 0.19;
    ringRef.current.rotation.z = t * 0.25;
    outerRef.current.scale.setScalar(vis * 1.5);
    innerRef.current.scale.setScalar(vis * 0.9);
    ringRef.current.scale.setScalar(vis * 2.0);
  });

  return (
    <>
      <mesh ref={outerRef} position={[-2.5, 1, -67]}>
        <sphereGeometry args={[1.3, 20, 14]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.35} wireframe />
      </mesh>
      <mesh ref={innerRef} position={[-2.5, 1, -67]}>
        <icosahedronGeometry args={[0.65, 1]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.9} transparent opacity={0.65} />
      </mesh>
      <mesh ref={ringRef} position={[-2.5, 1, -67]}>
        <torusGeometry args={[1.8, 0.025, 8, 120]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.5} />
      </mesh>
    </>
  );
}

// ── Scene 8: Command center — pulsing monolith (white) ────────────────
function CommandMonolith({ scroll }: { scroll: number }) {
  const coreRef = useRef<THREE.Mesh>(null!);
  const ring1   = useRef<THREE.Mesh>(null!);
  const ring2   = useRef<THREE.Mesh>(null!);
  const vis = useVis(scroll, 0.90, 1.0, 0.025);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const v = vis > 0.01;
    coreRef.current.visible = ring1.current.visible = ring2.current.visible = v;
    coreRef.current.rotation.y = t * 0.08;
    coreRef.current.rotation.x = Math.sin(t * 0.4) * 0.1;
    ring1.current.rotation.x = t * 0.25;
    ring1.current.rotation.z = t * 0.15;
    ring2.current.rotation.y = t * 0.35;
    ring2.current.rotation.z = -t * 0.12;
    const pulse = 1 + Math.sin(t * 1.8) * 0.06;
    coreRef.current.scale.setScalar(vis * pulse);
    ring1.current.scale.setScalar(vis * 1.4);
    ring2.current.scale.setScalar(vis * 1.9);
  });

  return (
    <>
      <mesh ref={coreRef} position={[0, 0, -77]}>
        <octahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} />
      </mesh>
      <mesh ref={ring1} position={[0, 0, -77]}>
        <torusGeometry args={[1.7, 0.04, 16, 100]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
      </mesh>
      <mesh ref={ring2} position={[0, 0, -77]}>
        <torusGeometry args={[2.4, 0.025, 16, 100]} />
        <meshStandardMaterial color="#ccddff" emissive="#ccddff" emissiveIntensity={0.35} />
      </mesh>
    </>
  );
}

// ── Ambient particle tunnel — sparse dust scattered along the flight path ─
function AmbientTunnel() {
  const ref = useRef<THREE.Points>(null!);

  const { positions, colors } = useMemo(() => {
    const count = 220;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#FF3A3A'),
      new THREE.Color('#00D4FF'),
      new THREE.Color('#10B981'),
      new THREE.Color('#8866FF'),
      new THREE.Color('#00F0FF'),
      new THREE.Color('#ffffff'),
    ];
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 2] = -Math.random() * 92;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3 + 0] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame(({ clock }) => {
    ref.current.rotation.z = clock.elapsedTime * 0.006;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors,    3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} vertexColors sizeAttenuation transparent opacity={0.45} />
    </points>
  );
}

// ── Root ───────────────────────────────────────────────────────────────
interface SceneObjectsProps {
  scroll: number;
}

export default function SceneObjects({ scroll }: SceneObjectsProps) {
  return (
    <>
      <AmbientTunnel />
      <ChaosShards      scroll={scroll} />
      <CrystalOctahedron scroll={scroll} />
      <DependencyKnot   scroll={scroll} />
      <AgentOrbs        scroll={scroll} />
      <KnowledgeGraph   scroll={scroll} />
      <AutomationRings  scroll={scroll} />
      <OrderSphere      scroll={scroll} />
      <CommandMonolith  scroll={scroll} />
    </>
  );
}
