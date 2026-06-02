'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const workflowSteps = [
  ['01', 'Connect Your Repository', 'Continuum indexes your entire codebase.'],
  ['02', 'Builds Engineering Memory', 'Creates understanding of files, dependencies, architecture, and patterns.'],
  ['03', 'AI Agents Start Working', 'Specialized agents collaborate.'],
  ['04', 'Generate Production Changes', 'Creates code, tests, documentation, and pull requests.'],
  ['05', 'Human Approval', 'Developers stay in control.'],
];

const realWorkflows = [
  {
    tab: 'Fix a Bug',
    input: 'Payment checkout failing',
    events: ['Detect issue', 'Trace logs', 'Find faulty commit', 'Generate patch', 'Open PR'],
  },
  {
    tab: 'Build Feature',
    input: 'Add subscription system',
    events: ['Understand architecture', 'Design database', 'Create APIs', 'Generate frontend', 'Add tests'],
  },
  {
    tab: 'Improve Architecture',
    input: 'Make system scalable',
    events: ['Analyze', 'Find bottlenecks', 'Suggest changes'],
  },
];

export default function Workflow() {
  const [activeWorkflow, setActiveWorkflow] = useState(0);
  const current = realWorkflows[activeWorkflow];

  return (
    <>
      <section className="product-section workflow-section" aria-labelledby="workflow-title">
        <motion.div
          className="section-kicker"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
        >
          How Continuum Works
        </motion.div>
        <motion.h2
          id="workflow-title"
          className="product-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ delay: 0.08 }}
        >
          From idea to production without friction
        </motion.h2>
        <div className="workflow-track">
          {workflowSteps.map(([number, title, body], index) => (
            <motion.article
              className="workflow-step"
              key={number}
              initial={{ opacity: 0, x: index % 2 === 0 ? -36 : 36 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-12%' }}
              transition={{ duration: 0.7, delay: index * 0.06 }}
            >
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="product-section real-workflows-section" aria-labelledby="real-workflows-title">
        <motion.div
          className="section-kicker"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
        >
          Real Workflows
        </motion.div>
        <motion.h2
          id="real-workflows-title"
          className="product-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ delay: 0.08 }}
        >
          Production tasks become controlled agent runs.
        </motion.h2>
        <div className="workflow-console">
          <div className="workflow-tabs" role="tablist" aria-label="Continuum workflows">
            {realWorkflows.map((workflow, index) => (
              <button
                type="button"
                key={workflow.tab}
                role="tab"
                aria-selected={activeWorkflow === index}
                className={activeWorkflow === index ? 'active' : ''}
                onClick={() => setActiveWorkflow(index)}
              >
                {workflow.tab}
              </button>
            ))}
          </div>
          <motion.div
            className="workflow-run"
            key={current.tab}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="workflow-input">
              <span>Input</span>
              <strong>{current.input}</strong>
            </div>
            <ol className="timeline">
              {current.events.map((event, index) => (
                <li key={event} style={{ '--delay': `${index * 0.16}s` } as React.CSSProperties}>
                  <i>{String(index + 1).padStart(2, '0')}</i>
                  <span>{event}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        </div>
      </section>
    </>
  );
}
