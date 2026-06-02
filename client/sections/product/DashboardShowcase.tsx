'use client';

import { motion } from 'framer-motion';

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
  {
    title: 'Deep Code Understanding',
    body: 'Understands millions of lines across services.',
  },
  {
    title: 'Architecture Awareness',
    body: 'Knows how your system connects.',
  },
  {
    title: 'Context Memory',
    body: 'Never loses project knowledge.',
  },
];

export default function ConsoleShowcase() {
  return (
    <>
      <section className="product-transition" aria-label="Product interface reveal">
        <div className="interface-particle-field" aria-hidden="true">
          {Array.from({ length: 30 }).map((_, index) => {
            const particleStyle = {
              '--x': `${(index % 10) * 10}%`,
              '--y': `${(index * 17) % 100}%`,
              '--delay': `${index * -0.13}s`,
            } as React.CSSProperties;

            return <span key={index} style={particleStyle} />;
          })}
        </div>
        <motion.div
          className="transition-copy"
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p>You have seen the intelligence.</p>
          <h1>Now control it.</h1>
        </motion.div>
      </section>

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
            <span />
            <span />
            <span />
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
              {Array.from({ length: 16 }).map((_, index) => {
                const height = 28 + ((index * 17) % 54);
                return (
                  <i
                    key={index}
                    style={{
                      '--h': `${height}%`,
                      '--delay': `${index * -0.08}s`,
                    } as React.CSSProperties}
                  />
                );
              })}
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
