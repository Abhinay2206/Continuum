'use client';

import { motion } from 'framer-motion';

const agents = [
  ['Code Agent', 'Builds production features', 'working'],
  ['Debug Agent', 'Finds root causes', 'monitoring'],
  ['Test Agent', 'Creates validation', 'writing tests'],
  ['Security Agent', 'Protects your system', 'reviewing risk'],
  ['DevOps Agent', 'Handles infrastructure', 'planning deploy'],
];

export default function Agents() {
  return (
    <section className="product-section agents-section" aria-labelledby="agents-title">
      <motion.div
        className="section-kicker"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
      >
        Autonomous Engineering Agents
      </motion.div>
      <motion.h2
        id="agents-title"
        className="product-title"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ delay: 0.08 }}
      >
        Specialized agents collaborate inside your system.
      </motion.h2>
      <div className="agent-card-grid">
        {agents.map(([name, body, status], index) => (
          <motion.article
            className="floating-agent-card"
            key={name}
            initial={{ opacity: 0, y: 44, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: '-12%' }}
            transition={{ duration: 0.75, delay: index * 0.08 }}
          >
            <div className="agent-avatar" aria-hidden="true">
              <span />
            </div>
            <div>
              <h3>{name}</h3>
              <p>{body}</p>
            </div>
            <div className="agent-status">
              <i />
              <span>{status}</span>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
