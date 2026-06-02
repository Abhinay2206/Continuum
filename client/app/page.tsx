'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import Lenis from 'lenis';
import SceneText from '@/components/overlay/SceneText';
import ConsoleShowcase from '@/sections/product/DashboardShowcase';
import Workflow from '@/sections/product/Workflow';
import Agents from '@/sections/product/Agents';
import Architecture from '@/sections/product/Architecture';
import Comparison from '@/sections/product/Comparison';
import Waitlist from '@/sections/product/Waitlist';

const ExperienceCanvas = dynamic(
  () => import('@/components/experience/Canvas'),
  { ssr: false, loading: () => null }
);

/** Total scroll height (in vh units) — controls pacing */
const SCROLL_HEIGHT_VH = 700;

const FADE_DURATION = 700; // ms — cinematic fade-out before product reveal

export default function Home() {
  const [scroll, setScroll] = useState(0);
  const [isCinematicFinished, setIsCinematicFinished] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const lenisRef   = useRef<Lenis | null>(null);
  const fadeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
    }
    return () => { if (fadeTimer.current) clearTimeout(fadeTimer.current); };
  }, []);

  const handleScroll = useCallback(() => {
    if (isCinematicFinished || isFadingOut) return;

    const scrollTop = window.scrollY;
    const cinematicDistance = Math.max(
      window.innerHeight * (SCROLL_HEIGHT_VH / 100) - window.innerHeight,
      1,
    );

    if (scrollTop >= cinematicDistance) {
      // Trigger fade-out; switch to product after animation completes
      setIsFadingOut(true);
      fadeTimer.current = setTimeout(() => {
        setIsCinematicFinished(true);
      }, FADE_DURATION);
      return;
    }

    setScroll(Math.min(scrollTop / cinematicDistance, 1));
  }, [isCinematicFinished, isFadingOut]);

  useEffect(() => {
    if (isCinematicFinished) {
      if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [isCinematicFinished]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const magneticItems = gsap.utils.toArray<HTMLElement>('[data-magnetic]');
    const cleanups = magneticItems.map((item) => {
      const onMove = (event: MouseEvent) => {
        const rect = item.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.22;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.22;
        gsap.to(item, { x, y, duration: 0.35, ease: 'power3.out' });
      };
      const onLeave = () => {
        gsap.to(item, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.45)' });
      };

      item.addEventListener('mousemove', onMove);
      item.addEventListener('mouseleave', onLeave);

      return () => {
        item.removeEventListener('mousemove', onMove);
        item.removeEventListener('mouseleave', onLeave);
      };
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return (
    <>
      {!isCinematicFinished && (
        <div className={`cinematic-shell${isFadingOut ? ' cinematic-shell--fading' : ''}`}>
          {/* Full-screen fixed WebGL canvas */}
          <Suspense fallback={null}>
            <ExperienceCanvas scroll={scroll} />
          </Suspense>

          {/* HTML text overlay */}
          <SceneText scroll={scroll} />

          {/* Invisible scroll spacer — drives the experience */}
          <div className="scroll-spacer" style={{ height: `${SCROLL_HEIGHT_VH}vh` }} />
        </div>
      )}

      {/* Black overlay that dissolves after the cinematic hands off to product */}
      {isCinematicFinished && (
        <div className="cinematic-reveal-overlay" aria-hidden />
      )}

      <nav className="product-navbar" data-visible={isCinematicFinished} aria-label="Continuum product navigation">
        <a className="nav-brand" href="#console-title" aria-label="Continuum console">
          <Image src="/logo.png" alt="Continuum Logo" width={24} height={24} style={{ objectFit: 'contain' }} />
          Continuum
        </a>
        <div className="nav-links">
          <a href="#console-title">Product</a>
          <a href="#workflow-title">Workflow</a>
          <a href="#agents-title">Agents</a>
          <a href="#architecture-title">Architecture</a>
        </div>
        <a className="nav-cta" href="#waitlist-title" data-magnetic>
          Join Beta
        </a>
      </nav>

      <main className="product-experience">
        <ConsoleShowcase />
        <Workflow />
        <Agents />
        <Architecture />
        <Comparison />
        <Waitlist />
      </main>
    </>
  );
}
