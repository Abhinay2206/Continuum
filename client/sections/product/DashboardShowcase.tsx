'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const repositories = [
  { name: 'continuum-api', label: 'Health', value: '98%', meta: 'TypeScript' },
  { name: 'backend-services', label: 'Status', value: 'AI indexed', meta: '12 services' },
];

const agentEvents = [
  'Analyzing repository...',
  'Found auth flow',
  'Improved database queries',
  'Added tests',
  'Generated PR',
];

const engineNodes = ['Repository', 'AST Parser', 'Knowledge Graph', 'Vector Memory', 'AI Reasoning'];

const intelligenceFeatures = [
  { title: 'Deep Code Understanding', body: 'Understands millions of lines across services.' },
  { title: 'Architecture Awareness', body: 'Knows how your system connects.' },
  { title: 'Context Memory', body: 'Never loses project knowledge.' },
];

const TICKER_WORDS = [
  'AUTONOMOUS', '·', 'AI ENGINEERING', '·', 'ZERO CONTEXT SWITCH', '·',
  'LIVE INTELLIGENCE', '·', 'MULTI-AGENT', '·', 'ENTERPRISE GRADE', '·',
];

/* ── Shared animation variants (defined once, no re-creation) ───── */

const charContainer = (delay = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: 0.032, delayChildren: delay } },
});

const wordContainer = (delay = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: delay } },
});

const charVariant = {
  hidden: { y: '110%', opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.72, ease: [0.16, 1, 0.3, 1] as const } },
};

const wordVariant = {
  hidden: { y: '100%', opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const } },
};

const VIEWPORT = { once: true, margin: '-8%' } as const;
const VIEWPORT_LATE = { once: true, margin: '-10%' } as const;

/* ── Per-character reveal - one whileInView observer on the container */

function CharReveal({
  text,
  delay = 0,
  className,
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.span
      className={className}
      aria-label={text}
      style={{ display: 'block' }}
      variants={charContainer(delay)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {text.split('').map((char, i) => (
        <span key={i} className="char-wrap">
          <motion.span className="char-inner" variants={charVariant}>
            {char === ' ' ? ' ' : char}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/* ── Word-by-word reveal ────────────────────────────────────────── */

function WordReveal({
  text,
  delay = 0,
  className,
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  const words = text.split(' ');
  return (
    <motion.span
      className={className}
      style={{ display: 'block' }}
      variants={wordContainer(delay)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {words.map((word, i) => (
        <span key={i} className="word-outer" style={{ display: 'inline-block', marginRight: i < words.length - 1 ? '0.25em' : '0' }}>
          <motion.span style={{ display: 'inline-block' }} variants={wordVariant}>
            {word}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/* ── Scroll Scrub Text Reveal ────────────────────────────────────── */

function ScrollScrubText({
  text,
  progress,
  range = [0, 1],
  className,
}: {
  text: string;
  progress: any;
  range?: [number, number];
  className?: string;
}) {
  const chars = text.split('');
  const step = (range[1] - range[0]) / chars.length;

  return (
    <span className={className}>
      {chars.map((char, i) => {
        const start = range[0] + i * step;
        const end = start + step * 2; // slightly smoother fade overlap
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const opacity = useTransform(progress, [start, end], [0.1, 1]);

        return (
          <motion.span key={i} style={{ opacity, display: 'inline-block', whiteSpace: 'pre' }}>
            {char}
          </motion.span>
        );
      })}
    </span>
  );
}

/* ── Draw-in horizontal accent line ────────────────────────────── */

function AccentLine({ delay = 0 }: { delay?: number }) {
  return (
    <div className="control-accent-wrap" aria-hidden>
      <motion.div
        className="control-accent-line"
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={VIEWPORT_LATE}
        transition={{ duration: 1.0, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

/* ── Status readout ─────────────────────────────────────────────── */

const STATUS_ITEMS = [
  { label: 'SYSTEM', value: 'ONLINE' },
  { label: 'AGENTS', value: '8 / 8' },
  { label: 'REPOS', value: '34' },
  { label: 'UPTIME', value: '99.98%' },
];

function StatusReadout({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="control-readout"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {STATUS_ITEMS.map((item, i) => (
        <span key={i} className="control-readout__item">
          <span className="control-readout__label">{item.label}</span>
          <span className="control-readout__sep"> / </span>
          <span className="control-readout__value">{item.value}</span>
        </span>
      ))}
    </motion.div>
  );
}

/* ── Horizontal marquee (CSS-only, zero JS cost) ────────────────── */

function ControlMarquee() {
  const doubled = [...TICKER_WORDS, ...TICKER_WORDS];
  return (
    <div className="control-marquee" aria-hidden>
      <div className="control-marquee__track">
        {doubled.map((word, i) => (
          <span key={i} className="control-marquee__item">{word}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────────── */

export default function ConsoleShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'center center'],
  });

  // Scroll animations for the cinematic handoff section
  const textY = useTransform(scrollYProgress, [0.3, 1], [120, 0]);
  const textOpacity = useTransform(scrollYProgress, [0.3, 0.8], [0, 1]);
  const lineScaleX = useTransform(scrollYProgress, [0.6, 1], [0, 1]);
  const readoutY = useTransform(scrollYProgress, [0.7, 1], [30, 0]);
  const readoutOpacity = useTransform(scrollYProgress, [0.7, 1], [0, 1]);

  return (
    <>
      {/* ── Cinematic handoff - "Now control it." ───────────────── */}
      <section ref={sectionRef} className="product-transition control-transition" aria-label="Product interface reveal">
        <div className="control-ghost" aria-hidden>CONTROL</div>

        <div className="interface-particle-field" aria-hidden="true">
          {Array.from({ length: 30 }).map((_, index) => (
            <span
              key={index}
              style={{
                '--x': `${(index % 10) * 10}%`,
                '--y': `${(index * 17) % 100}%`,
                '--delay': `${index * -0.13}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        <motion.div className="transition-copy" style={{ y: textY, opacity: textOpacity }}>
          <WordReveal
            text="You have seen the intelligence."
            className="transition-sub-reveal"
            delay={0}
          />

          <h1 className="control-headline" aria-label="Now control it.">
            <ScrollScrubText
              text="Now "
              progress={scrollYProgress}
              range={[0.4, 0.55]}
              className="control-word"
            />
            <ScrollScrubText
              text="control it."
              progress={scrollYProgress}
              range={[0.55, 0.75]}
              className="control-word control-word--accent"
            />
          </h1>

          <div className="control-accent-wrap" aria-hidden>
            <motion.div
              className="control-accent-line"
              style={{ scaleX: lineScaleX, transformOrigin: 'left' }}
            />
          </div>

          <motion.div
            className="control-readout"
            style={{ y: readoutY, opacity: readoutOpacity }}
          >
            {STATUS_ITEMS.map((item, i) => (
              <span key={i} className="control-readout__item">
                <span className="control-readout__label">{item.label}</span>
                <span className="control-readout__sep"> / </span>
                <span className="control-readout__value">{item.value}</span>
              </span>
            ))}
          </motion.div>
        </motion.div>

        <ControlMarquee />
      </section>

      {/* ── Console product section ─────────────────────────────── */}
      <section className="product-section console-section" aria-labelledby="console-title">
        <motion.div
          className="section-kicker"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
        >
          Product Interface
        </motion.div>
        <motion.h2
          id="console-title"
          className="product-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ delay: 0.08 }}
        >
          Continuum turns your codebase into an AI engineering workspace.
        </motion.h2>

        <motion.div
          className="console-mockup"
          initial={{ opacity: 0, y: 64, rotateX: 8 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: '-12%' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mockup-topbar">
            <span /><span /><span />
            <strong>Continuum Control Plane</strong>
          </div>

          <aside className="console-panel repository-panel">
            <div className="panel-label">Connected repositories</div>
            {repositories.map((repo) => (
              <div className="repo-row" key={repo.name}>
                <div>
                  <strong>{repo.name}</strong>
                  <small>{repo.meta}</small>
                </div>
                <div>
                  <span>{repo.label}</span>
                  <b>{repo.value}</b>
                </div>
              </div>
            ))}
            <div className="mini-graph" aria-hidden="true">
              {Array.from({ length: 16 }).map((_, index) => (
                <i
                  key={index}
                  style={{
                    '--h': `${28 + ((index * 17) % 54)}%`,
                    '--delay': `${index * -0.08}s`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </aside>

          <section className="console-panel workspace-panel">
            <div className="workspace-header">
              <div>
                <div className="panel-label">AI Engineering Workspace</div>
                <h3>Authentication service</h3>
              </div>
              <span className="live-pill">Live</span>
            </div>
            <div className="conversation">
              <div className="message developer-message">
                <span>Developer</span>
                <p>Optimize authentication service</p>
              </div>
              <div className="message continuum-message">
                <span>Continuum</span>
                <div className="typing-line">Analyzing repository...</div>
                <ul>
                  {agentEvents.slice(1).map((event, index) => (
                    <li key={event} style={{ '--delay': `${index * 0.55}s` } as React.CSSProperties}>
                      <span>+</span>
                      {event}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <aside className="console-panel agent-panel">
            <div className="panel-label">Active AI Agents</div>
            {[
              ['Code Agent', 'working'],
              ['Debug Agent', 'monitoring'],
              ['Architecture Agent', 'analyzing'],
            ].map(([name, status]) => (
              <div className="agent-row" key={name}>
                <span className="agent-orb" />
                <div>
                  <strong>{name}</strong>
                  <small>{status}</small>
                </div>
              </div>
            ))}
          </aside>
        </motion.div>
      </section>

      {/* ── Intelligence engine section ─────────────────────────── */}
      <section className="product-section intelligence-section" aria-labelledby="intelligence-title">
        <motion.div
          className="section-kicker"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
        >
          Repository Intelligence Engine
        </motion.div>
        <motion.h2
          id="intelligence-title"
          className="product-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ delay: 0.08 }}
        >
          Your codebase becomes a living memory.
        </motion.h2>
        <div className="memory-pipeline">
          {engineNodes.map((node, index) => (
            <motion.div
              className="memory-node"
              key={node}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-12%' }}
              transition={{ delay: index * 0.08 }}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{node}</strong>
            </motion.div>
          ))}
        </div>
        <div className="feature-grid">
          {intelligenceFeatures.map((feature) => (
            <motion.article
              className="feature-block"
              key={feature.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
            >
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </>
  );
}
