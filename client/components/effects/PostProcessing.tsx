'use client';

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Vignette, Noise, TiltShift2 } from '@react-three/postprocessing';
import { BlendFunction, BloomEffect, ChromaticAberrationEffect } from 'postprocessing';
import * as THREE from 'three';

interface Props {
  scroll: number;
}

export default function PostProcessing({ scroll }: Props) {
  // React 19 passes `ref` as a regular prop, which ends up in the rest-spread
  // that @react-three/postprocessing serialises via JSON.stringify for its useMemo
  // dependency - Three.js objects are circular and blow up. Bypass the wrapper
  // entirely: create the raw postprocessing Effect instances and hand them to R3F
  // as <primitive object={...}>, which EffectComposer also accepts.
  const bloom = useMemo(() => new BloomEffect({
    intensity: 1.2,
    luminanceThreshold: 0.15,
    luminanceSmoothing: 0.85,
    mipmapBlur: true,
    radius: 0.4,
  }), []);

  const ca = useMemo(() => new ChromaticAberrationEffect({
    offset: new THREE.Vector2(0.0012, 0.0012),
    blendFunction: BlendFunction.NORMAL,
    radialModulation: true,
    modulationOffset: 0.55,
  }), []);

  useFrame(() => {
    bloom.intensity = 1.2 + scroll * 0.4;
    const caOffset = scroll < 0.2
      ? THREE.MathUtils.lerp(0.0012, 0.0004, scroll / 0.2)
      : 0.0004 + scroll * 0.0002;
    ca.offset.set(caOffset, caOffset);
  });

  return (
    <EffectComposer multisampling={0}>
      <primitive object={bloom} />
      <TiltShift2 blur={0.12} />
      <Vignette offset={0.25} darkness={0.75} blendFunction={BlendFunction.NORMAL} />
      <primitive object={ca} />
      <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.012} />
    </EffectComposer>
  );
}
