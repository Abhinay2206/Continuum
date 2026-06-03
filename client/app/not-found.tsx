'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Terminal, ArrowLeft, Activity } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-[var(--bg-main)] selection:bg-cyan-500/30 font-sans">
      
      {/* Background ambient effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#4F7BF7]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#06B6D4]/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8B5CF6]/5 rounded-full blur-[150px]" />
        
        {/* Grid pattern matching product-experience */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:92px_92px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] opacity-80" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl px-6 w-full">
        
        {/* Icon & Graphic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#4F7BF7]/20 to-[#06B6D4]/20 blur-2xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
          <div className="relative flex items-center justify-center w-28 h-28 rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel-element)] backdrop-blur-2xl shadow-[var(--shadow-panel)] overflow-hidden">
            <Activity className="w-10 h-10 text-[#06B6D4] opacity-90 relative z-10" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-50%] rounded-full border border-dashed border-[#8B5CF6]/20"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel-element)] backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[var(--text-panel-muted)]">Error 404</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-5 text-[var(--text-main)]">
            Signal <span className="text-glow font-medium">Lost</span>
          </h1>
          <p className="text-[var(--text-muted)] text-base md:text-lg mb-12 max-w-[420px] mx-auto leading-relaxed font-light">
            The neural pathway you are trying to access has been archived or does not exist in the Continuum.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto"
        >
          <Link href="/" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-3 px-8 py-[14px] bg-[var(--bg-panel-element)] hover:bg-[var(--nav-link-hover-bg)] border border-[var(--border-panel)] rounded-xl transition-all duration-300 overflow-hidden backdrop-blur-md">
              <ArrowLeft className="w-4 h-4 text-[var(--nav-link-color)] group-hover:text-[var(--nav-link-hover)] transition-colors" />
              <span className="text-[14px] font-medium text-[var(--nav-link-color)] group-hover:text-[var(--nav-link-hover)] transition-colors">Return to Surface</span>
            </button>
          </Link>

          <Link href="/console" className="w-full sm:w-auto">
             <button className="btn-glow w-full sm:w-auto flex items-center justify-center gap-3">
              <Terminal className="w-4 h-4" />
              <span>Boot Console</span>
            </button>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
