'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface SceneData {
  range: [number, number];
  position: 'center' | 'left' | 'right';
  headline: string;
  sub: string;
  ghost: string;
  accentColor: string;
  style: 'boot' | 'hero' | 'section';
  metrics: { label: string; value: string }[];
}

const SCENES: SceneData[] = [
  {
    range: [0.0, 0.08],
    position: 'center',
    headline: '',
    sub: '',
    ghost: '',
    accentColor: '#FF3A3A',
    style: 'boot',
    metrics: [],
  },
  {
    range: [0.08, 0.20],
    position: 'center',
    headline: 'Engineering\nis broken.',
    sub: 'Fragmented systems. Mounting technical debt. Alert storms with no end.',
    ghost: 'BROKEN',
    accentColor: '#FF3A3A',
    style: 'hero',
    metrics: [
      { label: 'INCIDENTS', value: '2,847' },
      { label: 'DEBT INDEX', value: 'CRITICAL' },
      { label: 'UPTIME', value: '61.2%' },
    ],
  },
  {
    range: [0.20, 0.32],
    position: 'left',
    headline: 'Intelligence\nemerges.',
    sub: 'A central AI mind awakens — connecting, understanding, organizing.',
    ghost: 'EMERGE',
    accentColor: '#00D4FF',
    style: 'section',
    metrics: [
      { label: 'NODES MAPPED', value: '14,203' },
      { label: 'CONNECTIONS', value: '89,441' },
      { label: 'AI CONFIDENCE', value: '97.4%' },
    ],
  },
  {
    range: [0.32, 0.44],
    position: 'right',
    headline: 'Systems begin to\nunderstand themselves.',
    sub: 'Code structure, dependencies, architecture, intent — all mapped.',
    ghost: 'AWARE',
    accentColor: '#10B981',
    style: 'section',
    metrics: [
      { label: 'FILES INDEXED', value: '2.1M' },
      { label: 'DEP GRAPH', value: 'LIVE' },
      { label: 'COVERAGE', value: '100%' },
    ],
  },
  {
    range: [0.44, 0.56],
    position: 'left',
    headline: 'Autonomous agents\nactivate.',
    sub: 'Code · Debug · Security · DevOps · Architecture — working in parallel.',
    ghost: 'AGENTS',
    accentColor: '#10B981',
    style: 'section',
    metrics: [
      { label: 'AGENTS LIVE', value: '8 / 8' },
      { label: 'TASKS/MIN', value: '340' },
      { label: 'PARALLELISM', value: '∞' },
    ],
  },
  {
    range: [0.56, 0.68],
    position: 'center',
    headline: 'Every repository becomes\na living intelligence graph.',
    sub: 'Nodes of knowledge. Edges of understanding. Constantly evolving.',
    ghost: 'GRAPH',
    accentColor: '#8866FF',
    style: 'section',
    metrics: [
      { label: 'GRAPH NODES', value: '1.8M' },
      { label: 'EDGE TYPES', value: '24' },
      { label: 'UPDATES/S', value: '12,400' },
    ],
  },
  {
    range: [0.68, 0.80],
    position: 'right',
    headline: 'Bugs fixed.\nPRs generated.\nArchitecture optimized.',
    sub: 'Autonomous engineering — without waiting for humans.',
    ghost: 'AUTOMATE',
    accentColor: '#8866FF',
    style: 'section',
    metrics: [
      { label: 'BUGS FIXED', value: '4,891' },
      { label: 'PRS MERGED', value: '1,203' },
      { label: 'HUMAN INPUT', value: '0%' },
    ],
  },
  {
    range: [0.80, 0.90],
    position: 'left',
    headline: 'Production systems\nstabilize.',
    sub: 'The AI orchestration layer coordinates everything. Order from chaos.',
    ghost: 'ORDER',
    accentColor: '#00F0FF',
    style: 'section',
    metrics: [
      { label: 'UPTIME', value: '99.98%' },
      { label: 'INCIDENTS', value: '0' },
      { label: 'LATENCY P99', value: '12ms' },
    ],
  },
  {
    range: [0.90, 1.0],
    position: 'center',
    headline: 'The Engineering\nCommand Center.',
    sub: 'Autonomous. Aware. Unstoppable. Welcome to Continuum.',
    ghost: 'COMMAND',
    accentColor: '#FFFFFF',
    style: 'hero',
    metrics: [
      { label: 'STATUS', value: 'ONLINE' },
      { label: 'REPOS', value: '34' },
      { label: 'AI AGENTS', value: '8' },
    ],
  },
];

const TICKER_ITEMS = [
  'AUTONOMOUS AI DEVELOPER OS', '·', 'ZERO CONTEXT SWITCHING', '·',
  'PROACTIVE BUG DETECTION', '·', 'REAL-TIME ARCHITECTURE INSIGHTS', '·',
  'MULTI-AGENT PARALLELISM', '·', 'ENTERPRISE-GRADE SECURITY', '·',
  'LIVE REPO INTELLIGENCE', '·', 'AUTONOMOUS PR GENERATION', '·',
];

const NON_BOOT = SCENES.filter(s => s.style !== 'boot');

/* ─── helpers ─────────────────────────────────────────────────── */

function WordSplit({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, li) => (
        <div key={li} className="scene-line">
          {line.split(' ').map((word, wi, arr) => (
            <span key={wi} className="word-outer">
              <span className="w">{word}{wi < arr.length - 1 ? ' ' : ''}</span>
            </span>
          ))}
        </div>
      ))}
    </>
  );
}

/* ─── Scene entry effects: pulse line + scanline + flash ──────── */

function SceneEntryFX({ scroll }: { scroll: number }) {
  const lineRef  = useRef<HTMLDivElement>(null);
  const scanRef  = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const prevIdx  = useRef(-1);

  const activeIdx = NON_BOOT.findIndex(s => scroll >= s.range[0] && scroll <= s.range[1]);

  useEffect(() => {
    if (activeIdx === prevIdx.current || activeIdx < 0) return;
    prevIdx.current = activeIdx;

    const color = NON_BOOT[activeIdx].accentColor;
    const tl = gsap.timeline();

    // Horizontal pulse line draws across top
    if (lineRef.current) {
      tl.set(lineRef.current, { scaleX: 0, opacity: 1, background: color })
        .to(lineRef.current, {
          scaleX: 1, duration: 0.55, ease: 'power3.out',
        })
        .to(lineRef.current, {
          opacity: 0, duration: 0.4, ease: 'power2.in',
        }, '+=0.08');
    }

    // Scanline sweeps top → bottom
    if (scanRef.current) {
      gsap.set(scanRef.current, {
        y: 0,
        opacity: 0,
        background: `linear-gradient(90deg, transparent 0%, ${color}99 40%, ${color}cc 50%, ${color}99 60%, transparent 100%)`,
        boxShadow: `0 0 24px ${color}66, 0 0 70px ${color}33`,
      });
      gsap.to(scanRef.current, {
        y: '100vh', opacity: 0.7, duration: 0.08, ease: 'none', delay: 0.08,
        onComplete: () => {
          gsap.to(scanRef.current!, {
            y: '100vh', opacity: 0, duration: 0.35, ease: 'power2.out',
          });
        },
      });
      gsap.fromTo(scanRef.current,
        { y: 0, opacity: 0 },
        { y: '100vh', opacity: 0.65, duration: 0.55, ease: 'power2.in', delay: 0.06,
          onComplete: () => gsap.set(scanRef.current!, { opacity: 0 }),
        }
      );
    }

    // Brief color flash (very subtle)
    if (flashRef.current) {
      gsap.set(flashRef.current, { background: color });
      gsap.fromTo(flashRef.current,
        { opacity: 0.04 },
        { opacity: 0, duration: 0.5, ease: 'power2.out', delay: 0.04 }
      );
    }
  }, [activeIdx]);

  return (
    <>
      <div ref={lineRef} className="scene-pulse-line" style={{ top: '1px', background: 'white' }} />
      <div ref={scanRef} className="scanline-sweep" />
      <div ref={flashRef} className="scene-flash" />
    </>
  );
}

/* ─── Ambient scene number ────────────────────────────────────── */

function AmbientNumber({ scroll }: { scroll: number }) {
  const ref    = useRef<HTMLDivElement>(null);
  const prevN  = useRef(-1);

  const activeIdx = NON_BOOT.findIndex(s => scroll >= s.range[0] && scroll <= s.range[1]);
  const n = activeIdx + 1;

  useEffect(() => {
    if (n === prevN.current || !ref.current) return;
    prevN.current = n;
    if (n > 0) {
      gsap.fromTo(ref.current,
        { opacity: 0, y: 40, scale: 1.08 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out' }
      );
    } else {
      gsap.to(ref.current, { opacity: 0, duration: 0.3 });
    }
  }, [n]);

  if (n <= 0) return null;

  return (
    <div ref={ref} className="ambient-scene-num" aria-hidden>
      {String(n).padStart(2, '0')}
    </div>
  );
}

/* ─── Boot terminal ───────────────────────────────────────────── */

function BootScene({ scroll }: { scroll: number }) {
  const isActive = scroll <= 0.08;
  const pct = Math.round((scroll / 0.08) * 100);

  const rows = [
    { t: 0.006, prefix: 'SYS',   label: 'SYSTEM DIAGNOSTIC',    value: 'CHAOS DETECTED',  type: 'warn' },
    { t: 0.016, prefix: 'ALERT', label: 'ACTIVE INCIDENTS',      value: '2,847',           type: 'warn' },
    { t: 0.028, prefix: 'DEBT',  label: 'TECHNICAL DEBT INDEX',  value: 'CRITICAL ↑',      type: 'warn' },
    { t: 0.040, prefix: 'REPO',  label: 'REPOS FAILING',         value: '34 / 34',         type: 'warn' },
    { t: 0.054, prefix: 'INIT',  label: 'CONTINUUM CORE',        value: 'INITIALIZING...',  type: '' },
    { t: 0.068, prefix: 'AI',    label: 'AUTONOMOUS OS',         value: 'ONLINE',           type: 'ok' },
  ];

  return (
    <div
      className="boot-scene"
      style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.45s ease', zIndex: 20 }}
    >
      <div className="boot-terminal">
        <div className="boot-topbar">
          <span className="boot-dot boot-dot--red" />
          <span className="boot-dot boot-dot--amber" />
          <span className="boot-dot boot-dot--green" />
          <code className="boot-path">continuum@core:~$ boot --autonomous --ai</code>
        </div>
        <div className="boot-body">
          {rows.map((row, i) => (
            <div
              key={i}
              className="boot-row"
              style={{ opacity: scroll >= row.t ? 1 : 0 }}
            >
              <code className="boot-prefix">[{row.prefix}]</code>
              <code className="boot-label">{row.label}</code>
              <code className="boot-val" data-type={row.type}>{row.value}</code>
            </div>
          ))}
          <div className="boot-cursor-row" style={{ opacity: scroll < 0.062 ? 1 : 0 }}>
            <code className="boot-caret">▋</code>
          </div>
          <div className="boot-progress-wrap" style={{ opacity: scroll >= 0.054 ? 1 : 0, transition: 'opacity 0.4s ease' }}>
            <div className="boot-progress-label">
              <code className="boot-progress-label">BOOT SEQUENCE</code>
              <code className="boot-pct">{Math.min(pct, 100)}%</code>
            </div>
            <div className="boot-progress-bar">
              <div className="boot-progress-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>
          <div
            className="boot-ready"
            style={{ opacity: scroll >= 0.072 ? 1 : 0, transition: 'opacity 0.6s ease' }}
          >
            <code>AUTONOMOUS AI DEVELOPER OPERATING SYSTEM — READY</code>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Scene slide ─────────────────────────────────────────────── */

function SceneSlide({
  scene,
  sceneIdx,
  scroll,
}: {
  scene: SceneData;
  sceneIdx: number;
  scroll: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef    = useRef(false);

  const [start, end] = scene.range;
  const isActive = scroll >= start && scroll <= end;

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const words  = c.querySelectorAll<HTMLElement>('.w');
    const sub    = c.querySelector<HTMLElement>('.scene-sub');
    const kicker = c.querySelector<HTMLElement>('.scene-kicker');

    if (isActive && !activeRef.current) {
      activeRef.current = true;
      gsap.set(c, { autoAlpha: 1 });
      gsap.killTweensOf([...words]);

      if (kicker) {
        gsap.fromTo(kicker,
          { opacity: 0, x: scene.position === 'right' ? 12 : -12 },
          { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }
        );
      }
      gsap.fromTo(words,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 0.88,
          stagger: { amount: 0.35, ease: 'power1.in' },
          ease: 'power4.out',
          overwrite: true,
        }
      );
      if (sub) {
        gsap.fromTo(sub,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.7, delay: 0.48, ease: 'power2.out', overwrite: true }
        );
      }
    } else if (!isActive && activeRef.current) {
      activeRef.current = false;
      gsap.killTweensOf([...words]);

      gsap.to(words, {
        yPercent: -38,
        duration: 0.36,
        stagger: { amount: 0.12, ease: 'power1.out' },
        ease: 'power2.in',
        overwrite: true,
        onComplete: () => {
          if (c) {
            gsap.set(c, { autoAlpha: 0 });
            gsap.set(words, { yPercent: 110 });
          }
        },
      });
      if (sub) gsap.to(sub, { opacity: 0, duration: 0.2, overwrite: true });
      if (kicker) gsap.to(kicker, { opacity: 0, x: scene.position === 'right' ? 12 : -12, duration: 0.2, overwrite: true });
    }
  }, [isActive, scene.position]);

  const posStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 20,
    pointerEvents: 'none',
    visibility: 'hidden',
    opacity: 0,
    maxWidth: 'min(660px, 44vw)',
  };

  if (scene.position === 'center') {
    posStyle.top = '50%';
    posStyle.left = '50%';
    posStyle.transform = 'translate(-50%, -50%)';
    posStyle.textAlign = 'center';
    posStyle.maxWidth = 'min(860px, 76vw)';
  } else if (scene.position === 'left') {
    posStyle.top = '50%';
    posStyle.left = '7%';
    posStyle.transform = 'translateY(-50%)';
  } else {
    posStyle.top = '50%';
    posStyle.right = '7%';
    posStyle.transform = 'translateY(-50%)';
    posStyle.textAlign = 'right';
  }

  return (
    <div ref={containerRef} style={posStyle}>
      <div className="scene-kicker" style={{ opacity: 0 }}>
        <span className="scene-kicker__num">{String(sceneIdx).padStart(2, '0')}</span>
        <span className="scene-kicker__rule" />
        <span className="scene-kicker__tag" style={{ color: scene.accentColor }}>
          CONTINUUM
        </span>
      </div>
      <div className={`scene-headline scene-headline--${scene.style}`}>
        <WordSplit text={scene.headline} />
      </div>
      {scene.sub && (
        <p className="scene-sub" style={{ opacity: 0 }}>
          {scene.sub}
        </p>
      )}
    </div>
  );
}

/* ─── Ghost background text ───────────────────────────────────── */

function GhostText({ scroll }: { scroll: number }) {
  const ref         = useRef<HTMLDivElement>(null);
  const prevGhostRef = useRef('');

  const active = NON_BOOT.find(s => scroll >= s.range[0] && scroll <= s.range[1]);
  const ghost  = active?.ghost ?? '';
  const color  = active?.accentColor ?? 'white';

  useEffect(() => {
    if (!ghost || !ref.current) return;
    if (ghost === prevGhostRef.current) return;
    prevGhostRef.current = ghost;
    gsap.fromTo(ref.current,
      { opacity: 0, scale: 1.07 },
      { opacity: 1, scale: 1, duration: 1.0, ease: 'power3.out' }
    );
  }, [ghost]);

  if (!ghost) return null;

  return (
    <div ref={ref} className="ghost-text" style={{ color }} aria-hidden>
      {ghost}
    </div>
  );
}

/* ─── Scene nav dots + counter ────────────────────────────────── */

function SceneNav({ scroll }: { scroll: number }) {
  const activeIdx   = NON_BOOT.findIndex(s => scroll >= s.range[0] && scroll <= s.range[1]);
  const current     = activeIdx >= 0 ? activeIdx + 1 : 0;
  const total       = NON_BOOT.length;
  const accentColor = activeIdx >= 0 ? NON_BOOT[activeIdx].accentColor : 'rgba(255,255,255,0.4)';

  return (
    <>
      <div className="scene-counter" aria-hidden>
        <span className="scene-counter__n" style={{ color: accentColor }}>
          {String(current).padStart(2, '0')}
        </span>
        <span className="scene-counter__sep"> / </span>
        <span className="scene-counter__total">{String(total).padStart(2, '0')}</span>
      </div>
      <nav className="scene-dots" aria-hidden>
        {NON_BOOT.map((s, i) => {
          const isOn = scroll >= s.range[0] && scroll <= s.range[1];
          return (
            <div
              key={i}
              className={`scene-dot${isOn ? ' scene-dot--on' : ''}`}
              style={isOn ? { background: s.accentColor, boxShadow: `0 0 10px ${s.accentColor}99` } : {}}
            />
          );
        })}
      </nav>
    </>
  );
}

/* ─── Data HUD ────────────────────────────────────────────────── */

function DataHUD({ scroll }: { scroll: number }) {
  const activeIdx = NON_BOOT.findIndex(s => scroll >= s.range[0] && scroll <= s.range[1]);
  const scene     = activeIdx >= 0 ? NON_BOOT[activeIdx] : null;
  const isActive  = scene !== null;

  return (
    <div className="scene-hud" aria-hidden>
      {(scene?.metrics ?? []).map((m, i) => (
        <div key={i} className={`hud-metric${isActive ? ' hud-metric--show' : ''}`}
          style={{ transitionDelay: `${i * 0.08}s` }}
        >
          <span className="hud-label">{m.label}</span>
          <span
            className="hud-value"
            style={{ color: scene?.accentColor ?? 'rgba(255,255,255,0.7)' }}
          >
            {m.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Bottom ticker ───────────────────────────────────────────── */

function Ticker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="scene-ticker" aria-hidden>
      <div className="scene-ticker__track">
        {doubled.map((item, i) => (
          <span key={i} className="scene-ticker__item">{item}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Root ────────────────────────────────────────────────────── */

interface SceneTextProps {
  scroll: number;
}

export default function SceneText({ scroll }: SceneTextProps) {
  return (
    <>
      {/* Film grain */}
      <div className="grain-overlay" aria-hidden />

      {/* Thin progress bar */}
      <div className="progress-bar" style={{ width: `${scroll * 100}%` }} />

      {/* Scene entry effects */}
      <SceneEntryFX scroll={scroll} />

      {/* Massive ghost letterform behind everything */}
      <GhostText scroll={scroll} />

      {/* Huge ambient scene number (bottom-right) */}
      <AmbientNumber scroll={scroll} />

      {/* Boot terminal */}
      <BootScene scroll={scroll} />

      {/* Text slides */}
      {NON_BOOT.map((scene, i) => (
        <SceneSlide key={i} scene={scene} sceneIdx={i + 1} scroll={scroll} />
      ))}

      {/* Counter + nav dots */}
      <SceneNav scroll={scroll} />

      {/* Data HUD */}
      <DataHUD scroll={scroll} />

      {/* Bottom ticker */}
      <Ticker />

      {/* Scroll hint early on */}
      <div className={`scroll-hint${scroll < 0.04 ? ' scroll-hint--show' : ''}`} aria-hidden>
        <div className="scroll-hint__line" />
        <span className="scroll-hint__label">SCROLL</span>
      </div>
    </>
  );
}
