'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Waitlist() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <section className="product-section waitlist-section" aria-labelledby="waitlist-title">
      <div className="returning-core" aria-hidden="true">
        <span />
        <i />
      </div>
      <motion.div
        className="waitlist-copy"
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-12%' }}
        transition={{ duration: 0.8 }}
      >
        <div className="section-kicker">Private Beta</div>
        <h2 id="waitlist-title" className="product-title">The future of engineering is autonomous.</h2>
        <p>Join the first developers building with Continuum.</p>
        {submitted ? (
          <div className="submitted-message">You are on the private beta list.</div>
        ) : (
          <form
            className="waitlist-form"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!email.trim() || loading) return;
              setLoading(true);
              try {
                const response = await fetch('/api/waitlist', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: email.trim() }),
                });
                
                if (response.ok) {
                  setSubmitted(true);
                } else {
                  // If email exists (409) or error, show submitted anyway to not leak info or for simplicity
                  setSubmitted(true);
                }
              } catch (error) {
                console.error('Error joining waitlist:', error);
              } finally {
                setLoading(false);
              }
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
              disabled={loading}
            />
            <button type="submit" data-magnetic disabled={loading}>
              {loading ? 'Joining...' : 'Join Private Beta'}
            </button>
          </form>
        )}
        <small>Early access spots available.</small>
        <div className="waitlist-stats" aria-label="Private beta interest">
          <div>
            <strong>0</strong>
            <span>Developers on the waitlist</span>
          </div>
          <div>
            <strong>0</strong>
            <span>Companies interested</span>
          </div>
          <div>
            <strong>0</strong>
            <span>Would recommend to a friend</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
