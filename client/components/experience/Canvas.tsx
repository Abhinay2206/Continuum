'use client';

import { Canvas } from '@react-three/fiber';
import World from './World';

interface ExperienceCanvasProps {
  scroll: number;
}

export default function ExperienceCanvas({ scroll }: ExperienceCanvasProps) {
  return (
    <div className="webgl-canvas">
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          toneMapping: 0,             // NoToneMapping - HDR shaders output above 1.0 for bloom
          outputColorSpace: 'srgb',   // Correct sRGB output
        }}
        camera={{
          fov: 60,
          near: 0.1,
          far: 200,
          position: [0, 0, 18],
        }}
        dpr={[1, 2]}
        style={{ background: '#000' }}
      >
        <World scroll={scroll} />
      </Canvas>
    </div>
  );
}
