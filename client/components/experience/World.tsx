'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import CameraRig from './CameraRig';
import SceneObjects from './SceneObjects';
import PostProcessing from '@/components/effects/PostProcessing';

// Colors per scene milestone - sampled by scroll progress
const LIGHT_STOPS: [number, THREE.Color][] = [
  [0.00, new THREE.Color('#FF1A1A')],
  [0.20, new THREE.Color('#00d4ff')],
  [0.40, new THREE.Color('#10b981')],
  [0.60, new THREE.Color('#8866ff')],
  [0.80, new THREE.Color('#00f0ff')],
  [1.00, new THREE.Color('#ffffff')],
];

function lerpSceneColor(t: number): THREE.Color {
  for (let i = 0; i < LIGHT_STOPS.length - 1; i++) {
    const [t0, c0] = LIGHT_STOPS[i];
    const [t1, c1] = LIGHT_STOPS[i + 1];
    if (t >= t0 && t <= t1) {
      return c0.clone().lerp(c1, (t - t0) / (t1 - t0));
    }
  }
  return LIGHT_STOPS[LIGHT_STOPS.length - 1][1].clone();
}

// Dynamic key light that follows the scene palette and drifts with the camera
function SceneLight({ scroll }: { scroll: number }) {
  const ref   = useRef<THREE.PointLight>(null!);
  const color = useRef(new THREE.Color('#FF1A1A'));

  useFrame(({ clock, camera }) => {
    const t    = Math.max(0, Math.min(1, scroll));
    const time = clock.elapsedTime;

    const target = lerpSceneColor(t);
    color.current.lerp(target, 0.04);
    ref.current.color.copy(color.current);

    // Float the light slightly ahead of and above the camera
    ref.current.position.set(
      camera.position.x + Math.sin(time * 0.22) * 2.5,
      camera.position.y + 3.5,
      camera.position.z - 8,
    );
    ref.current.intensity = 4.0 + Math.sin(time * 0.8) * 0.6;
  });

  return <pointLight ref={ref} distance={35} decay={2} />;
}

// Subtle fill light from behind/below - stays near camera
function FillLight() {
  const ref = useRef<THREE.PointLight>(null!);

  useFrame(({ clock, camera }) => {
    const time = clock.elapsedTime;
    ref.current.position.set(
      camera.position.x - Math.sin(time * 0.18) * 3,
      camera.position.y - 2,
      camera.position.z + 4,
    );
  });

  return <pointLight ref={ref} color="#112244" intensity={2.5} distance={20} decay={2} />;
}

interface WorldProps {
  scroll: number;
}

export default function World({ scroll }: WorldProps) {
  return (
    <>
      <ambientLight intensity={0.06} />
      <SceneLight scroll={scroll} />
      <FillLight />
      <CameraRig scroll={scroll} />
      <SceneObjects scroll={scroll} />
      <PostProcessing scroll={scroll} />
    </>
  );
}
