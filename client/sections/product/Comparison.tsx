'use client';

import { motion } from 'framer-motion';

const traditional = ['autocomplete code', 'single file context', 'developer manages everything'];
const continuum = ['understands entire systems', 'coordinates agents', 'manages workflows', 'improves continuously'];

export default function Comparison() {
  return (
    <section className="product-section comparison-section" aria-labelledby="comparison-title">
      <motion.div
        className="section-kicker"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
      >
        Why Continuum Is Different
      </motion.div>
      <motion.h2
        id="comparison-title"
        className="product-title"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ delay: 0.08 }}
      >
        It is not a coding assistant. It is an engineering operating layer.
      </motion.h2>
      <div className="comparison-grid">
        <motion.article
          className="comparison-panel muted"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-12%' }}
        >
          <h3>Traditional AI Coding Tools</h3>
          <ul>
            {traditional.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </motion.article>
        <motion.article
          className="comparison-panel continuum"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-12%' }}
          transition={{ delay: 0.12 }}
        >
          <h3>Continuum</h3>
          <ul>
            {continuum.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </motion.article>
      </div>
    </section>
  );
}
