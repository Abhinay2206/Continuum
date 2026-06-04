'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 11 keyframes: [position, lookAt, dutchDeg, driftIntensity]
const KEYFRAMES = [
  { t: 0.00, pos: [ 2.5,  1.5,  12], look: [-1.0, -0.5,   0], dutch: -8,  drift: 0.08  },
  { t: 0.10, pos: [-1.5, -1.0,   5], look: [ 0.5,  0.5,  -5], dutch: -12, drift: 0.12  },
  { t: 0.20, pos: [ 0.0,  0.5,  -4], look: [ 0.0,  0.0, -20], dutch:  0,  drift: 0.04  },
  { t: 0.30, pos: [-3.0,  1.2, -12], look: [ 0.0,  0.0, -20], dutch:  3,  drift: 0.03  },
  { t: 0.40, pos: [ 3.5,  2.0, -24], look: [ 0.0,  0.0, -40], dutch: -2,  drift: 0.02  },
  { t: 0.50, pos: [ 0.0,  3.5, -32], look: [ 0.0,  0.0, -40], dutch:  0,  drift: 0.015 },
  { t: 0.60, pos: [-4.0,  3.0, -44], look: [ 0.0,  0.0, -60], dutch:  2,  drift: 0.01  },
  { t: 0.70, pos: [ 4.0, -2.0, -54], look: [ 0.0,  0.0, -60], dutch: -3,  drift: 0.01  },
  { t: 0.80, pos: [ 0.0, -2.0, -65], look: [ 0.0,  0.0, -82], dutch:  0,  drift: 0.008 },
  { t: 0.90, pos: [ 0.0,  5.0, -74], look: [ 0.0,  0.0, -82], dutch:  1,  drift: 0.005 },
  { t: 1.00, pos: [ 0.0,  2.0, -80], look: [ 0.0,  0.0, -82], dutch:  0,  drift: 0     },
] as const;

// Exponential decay factor → frame-rate independent smooth damping
// alpha = 1 - exp(-lambda * delta); higher lambda = tighter tracking
const posLambda   = 1.2;  // position: settles in ~1.5s
const lookLambda  = 1.6;  // lookAt slightly faster than position
const dutchLambda = 1.4;  // dutch roll

// Scroll thresholds where scene/text changes happen - triggers a camera impulse
const SCENE_BREAKS = [0.08, 0.20, 0.32, 0.44, 0.56, 0.68, 0.80, 0.90];
// Alternating roll impulse magnitudes per scene break (degrees)
const IMPULSE_MAGS = [6, -9, 7, -8, 10, -7, 8, -6];

interface CameraRigProps {
  scroll: number;
}

export default function CameraRig({ scroll }: CameraRigProps) {
  const targetPos    = useRef(new THREE.Vector3(2.5, 1.5, 12));
  const targetLook   = useRef(new THREE.Vector3(-1, -0.5, 0));
  const currentLook  = useRef(new THREE.Vector3(-1, -0.5, 0));
  const currentDutch = useRef(-8);
  // Dutch impulse for scene transitions - decays to 0 each frame
  const dutchImpulse = useRef(0);
  // Track which scene break was last crossed to avoid repeat firing
  const lastBreakIdx = useRef(-1);

  const { posCurve, lookCurve, dutchValues, driftValues } = useMemo(() => {
    const posPoints  = KEYFRAMES.map(k => new THREE.Vector3(...k.pos));
    const lookPoints = KEYFRAMES.map(k => new THREE.Vector3(...k.look));
    return {
      posCurve:    new THREE.CatmullRomCurve3(posPoints,  false, 'catmullrom', 0.5),
      lookCurve:   new THREE.CatmullRomCurve3(lookPoints, false, 'catmullrom', 0.5),
      dutchValues: KEYFRAMES.map(k => k.dutch),
      driftValues: KEYFRAMES.map(k => k.drift),
    };
  }, []);

  useFrame(({ camera, clock }, delta) => {
    const t    = Math.max(0, Math.min(1, scroll));
    const time = clock.elapsedTime;
    const dt   = Math.min(delta, 0.1); // clamp to avoid huge jumps on tab re-focus

    // Frame-rate independent exponential decay alphas
    const posAlpha    = 1 - Math.exp(-posLambda   * dt);
    const lookAlpha   = 1 - Math.exp(-lookLambda  * dt);
    const dutchAlpha  = 1 - Math.exp(-dutchLambda * dt);
    // Impulse decays faster than the base dutch - snappy kick, smooth settle
    const impulseDecay = 1 - Math.exp(-3.5 * dt);

    // Detect scene-break crossing and fire a dutch impulse
    const crossedIdx = SCENE_BREAKS.findIndex(thresh => t >= thresh) ;
    if (crossedIdx !== lastBreakIdx.current) {
      lastBreakIdx.current = crossedIdx;
      if (crossedIdx >= 0 && crossedIdx < IMPULSE_MAGS.length) {
        dutchImpulse.current += IMPULSE_MAGS[crossedIdx];
      }
    }

    // Decay the impulse toward zero
    dutchImpulse.current = THREE.MathUtils.lerp(dutchImpulse.current, 0, impulseDecay);

    posCurve.getPoint(t,  targetPos.current);
    lookCurve.getPoint(t, targetLook.current);

    // Interpolate dutch angle and drift intensity from keyframes
    const n = KEYFRAMES.length - 1;
    const idx = Math.min(Math.floor(t * n), n - 1);
    const frac = t * n - idx;
    const targetDutch = THREE.MathUtils.lerp(dutchValues[idx], dutchValues[idx + 1] ?? 0, frac);
    const drift       = THREE.MathUtils.lerp(driftValues[idx], driftValues[idx + 1] ?? 0, frac);

    // Apply parallax drift - more chaotic early, resolves to stillness at end
    targetPos.current.x += Math.sin(time * 0.19) * drift;
    targetPos.current.y += Math.cos(time * 0.13) * drift * 0.6;

    // Smooth dutch roll + scene-transition impulse baked in
    currentDutch.current = THREE.MathUtils.lerp(
      currentDutch.current,
      targetDutch + dutchImpulse.current,
      dutchAlpha,
    );
    const roll = THREE.MathUtils.degToRad(currentDutch.current);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);

    // Smooth position (frame-rate independent)
    camera.position.lerp(targetPos.current, posAlpha);

    // Smooth lookAt - dampened like position, prevents jarring orientation snaps
    currentLook.current.lerp(targetLook.current, lookAlpha);
    camera.lookAt(currentLook.current);
  });

  return null;
}
