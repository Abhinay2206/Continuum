'use client';

import { motion } from 'framer-motion';

const architectureNodes = [
  'GitHub',
  'Repository Intelligence',
  'Context Engine',
  'Agent Orchestrator',
  'Execution Sandbox',
  'Pull Request Engine',
];

export default function Architecture() {
  return (
    <section className="product-section architecture-section" aria-labelledby="architecture-title">
      <motion.div
        className="section-kicker"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
      >
        Technical Architecture
      </motion.div>
      <motion.h2
        id="architecture-title"
        className="product-title"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ delay: 0.08 }}
      >
        Built for developers who need the system view.
      </motion.h2>
      <div className="architecture-diagram">
        {architectureNodes.map((node, index) => (
          <motion.div
            className="architecture-node"
            key={node}
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-12%' }}
            transition={{ delay: index * 0.08 }}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{node}</strong>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="enterprise-band"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-12%' }}
      >
        <div>
          <div className="section-kicker">Built For Teams & Enterprises</div>
          <h3>Secure. Scalable. Built for the real world.</h3>
        </div>
        <ul>
          <li>SOC 2 ready</li>
          <li>Private repositories</li>
          <li>Granular permissions</li>
          <li>Audit logs</li>
          <li>On-prem and cloud</li>
        </ul>
      </motion.div>
    </section>
  );
}
